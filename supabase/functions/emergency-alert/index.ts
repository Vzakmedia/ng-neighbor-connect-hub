import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getRequestContext } from "../_shared/auth.ts";
import { handleCors, jsonResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

interface AlertRequest {
  panic_alert_id: string;
  situation_type: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  } | null;
  user_name: string;
  user_id: string;
  preferences?: {
    auto_alert_contacts?: boolean;
    share_location_with_contacts?: boolean;
    auto_alert_public?: boolean;
    share_location_with_public?: boolean;
  };
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function getStatusCode(message: string): number {
  if (message === 'Unauthorized') return 401;
  if (message === 'Forbidden') return 403;
  if (message === 'Rate limit exceeded') return 429;
  return 500;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const context = await getRequestContext(req, { allowInternal: false, requireUser: true });
    const caller = context.user;

    if (!caller) {
      throw new Error('Unauthorized');
    }

    await enforceRateLimit({
      admin: context.admin,
      action: 'emergency-alert',
      scope: `user:${caller.id}`,
      limit: 10,
      windowMinutes: 15,
    });

    const { panic_alert_id, situation_type, location, user_name, user_id, preferences: passedPreferences }: AlertRequest = await req.json();

    if (!panic_alert_id || !user_id || caller.id !== user_id) {
      throw new Error('Forbidden');
    }

    const { data: panicAlert, error: panicAlertError } = await supabase
      .from('panic_alerts')
      .select('id, user_id')
      .eq('id', panic_alert_id)
      .eq('user_id', caller.id)
      .maybeSingle();

    if (panicAlertError || !panicAlert) {
      throw new Error('Forbidden');
    }

    // Use passed preferences or fetch from database
    let preferences = passedPreferences;
    if (!preferences) {
      const { data: dbPreferences, error: preferencesError } = await supabase
        .from('emergency_preferences')
        .select('*')
        .eq('user_id', user_id)
        .maybeSingle();

      if (preferencesError) {
        console.error('Error fetching emergency preferences:', preferencesError);
      }
      preferences = dbPreferences || {};
    }

    // Check if we should alert contacts (default to true if not specified)
    const shouldAlertContacts = preferences?.auto_alert_contacts !== false;
    const shareLocationWithContacts = preferences?.share_location_with_contacts !== false;

    console.log(`Should alert contacts: ${shouldAlertContacts}, Share location: ${shareLocationWithContacts}`);

    let contactsNotified = 0;

    if (shouldAlertContacts) {
      // Get the user's emergency contacts
      const { data: contacts, error: contactsError } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user_id);

      if (contactsError) {
        console.error('Error fetching emergency contacts:', contactsError);
        throw contactsError;
      }

      const situationLabels: { [key: string]: string } = {
        'medical_emergency': 'Medical Emergency',
        'fire': 'Fire Emergency',
        'break_in': 'Break In',
        'assault': 'Assault',
        'accident': 'Accident',
        'natural_disaster': 'Natural Disaster',
        'suspicious_activity': 'Suspicious Activity',
        'domestic_violence': 'Domestic Violence',
        'kidnapping': 'Kidnapping',
        'violence': 'Violence',
        'other': 'Emergency'
      };

      const situationLabel = situationLabels[situation_type] || 'Emergency';

      // Create alert message - conditionally include location
      const locationInfo = (shareLocationWithContacts && location)
        ? `\nLocation: ${location.address}`
        : '\nLocation: Not shared';

      const alertMessage = `🚨 EMERGENCY ALERT 🚨\n\n${user_name} needs help!\n\nSituation: ${situationLabel}${locationInfo}\nTime: ${new Date().toLocaleString()}\n\nThis is an automated emergency alert. Please check on ${user_name} immediately or contact emergency services if needed.`;

      // Send alerts to each emergency contact based on their preferred methods
      const alertPromises = contacts?.map(async (contact) => {
        const methods = contact.preferred_methods || ['in_app'];

        // Create in-app notification for all contacts
        if (methods.includes('in_app')) {
          await supabase
            .from('alert_notifications')
            .insert({
              notification_type: 'emergency_alert',
              panic_alert_id,
              recipient_id: contact.user_id,
              sent_at: new Date().toISOString()
            });

          // Also trigger real push notification
          await supabase.functions.invoke('send-push-notification', {
            body: {
              userId: contact.user_id,
              title: '🚨 EMERGENCY ALERT',
              message: `${user_name} needs help!`,
              type: 'emergency',
              priority: 'high',
              data: { panic_alert_id }
            }
          });
        }

        // Send SMS alerts
        if (methods.includes('sms')) {
          await sendSMSAlert(contact.phone_number, alertMessage);
        }

        // Send WhatsApp alerts
        if (methods.includes('whatsapp')) {
          await sendWhatsAppAlert(contact.phone_number, alertMessage);
        }

        // Initiate phone call
        if (methods.includes('phone_call')) {
          await initiateEmergencyCall(contact.phone_number, user_name, situationLabel);
        }
      }) || [];

      await Promise.all(alertPromises);
      contactsNotified = contacts?.length || 0;
    } else {
      console.log('Skipping contact alerts - auto_alert_contacts is disabled');
    }

    // Note: Public alerts are now handled by PanicButton.tsx directly
    // The edge function no longer creates duplicate public alerts

    return jsonResponse(req, {
      success: true,
      message: 'Emergency alerts sent successfully',
      contacts_notified: contactsNotified,
      preferences_applied: {
        auto_alert_contacts: shouldAlertContacts,
        share_location_with_contacts: shareLocationWithContacts
      }
    });

  } catch (error) {
    console.error('Error in emergency-alert function:', error);
    const message = error instanceof Error ? error.message : 'Unexpected error';
    const status = getStatusCode(message);

    return jsonResponse(
      req,
      { error: status >= 500 ? 'Failed to send emergency alerts' : message },
      status,
    );
  }
});

async function sendSMSAlert(phoneNumber: string, message: string) {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('Twilio SMS not configured. Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER');
    return;
  }

  try {
    const body = new URLSearchParams({
      From: fromNumber,
      To: phoneNumber,
      Body: message,
    });

    const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('Twilio SMS error:', text);
    } else {
      const json = await resp.json();
      console.log('Twilio SMS sent:', json.sid);
    }
  } catch (e) {
    console.error('Error sending SMS via Twilio:', e);
  }
}

async function sendWhatsAppAlert(phoneNumber: string, message: string) {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('Twilio WhatsApp not configured. Missing credentials.');
    return;
  }

  // Ensure numbers are E.164 formatted for Twilio
  const formattedTo = phoneNumber.startsWith('whatsapp:') ? phoneNumber : `whatsapp:${phoneNumber}`;
  const formattedFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;

  console.log(`Sending WhatsApp from ${formattedFrom} to ${formattedTo}`);

  try {
    const body = new URLSearchParams({
      From: formattedFrom,
      To: formattedTo,
      Body: message,
    });

    const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('Twilio WhatsApp error:', text);
    } else {
      const json = await resp.json();
      console.log('Twilio WhatsApp sent:', json.sid);
    }
  } catch (e) {
    console.error('Error sending WhatsApp via Twilio:', e);
  }
}

async function initiateEmergencyCall(phoneNumber: string, userName: string, situationType: string) {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('Twilio Voice not configured. Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER');
    return;
  }

  const voiceMessage = `Emergency alert for ${userName}. Situation: ${situationType}. Please check immediately or call local emergency services.`;
  const twimletUrl = `https://twimlets.com/message?Message%5B0%5D=${encodeURIComponent(voiceMessage)}`;

  try {
    const body = new URLSearchParams({
      From: fromNumber,
      To: phoneNumber,
      Url: twimletUrl,
    });

    const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('Twilio Voice error:', text);
    } else {
      const json = await resp.json();
      console.log('Twilio call initiated:', json.sid);
    }
  } catch (e) {
    console.error('Error initiating Twilio call:', e);
  }
}

async function sendCommunityAlerts(location: { latitude: number; longitude: number; address: string }, situationType: string, userId: string) {
  // Find users within 5km radius and send community alert
  console.log(`Sending community alerts for ${situationType} near ${location.address}`);

  // This would query users within radius and send notifications
  // For now, we'll create a general community alert record
  await supabase
    .from('safety_alerts')
    .insert({
      user_id: userId,
      title: `Active Emergency in Area`,
      description: `There is an active ${situationType.toLowerCase()} situation in your neighborhood. Please stay alert and avoid the area if possible.`,
      alert_type: 'other',
      severity: 'critical',
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address
    });
}
