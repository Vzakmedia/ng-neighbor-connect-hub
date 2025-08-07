import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertRequest {
  panic_alert_id: string;
  situation_type: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  user_name: string;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { panic_alert_id, situation_type, location, user_name }: AlertRequest = await req.json();

    console.log(`Processing emergency alert for panic_alert_id: ${panic_alert_id}`);

    // Get the authenticated user from the request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    // Create an authenticated supabase client
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: { authorization: authHeader }
      }
    });

    const { data: userData, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !userData.user) {
      console.error('Authentication error:', userError);
      throw new Error('User not authenticated');
    }

    const userId = userData.user.id;
    console.log(`Processing alert for user: ${userId}`);

    // Get the user's emergency contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', userId);

    if (contactsError) {
      console.error('Error fetching emergency contacts:', contactsError);
      throw contactsError;
    }

     // Get user's emergency preferences
     const { data: preferences, error: preferencesError } = await supabase
       .from('emergency_preferences')
       .select('*')
       .eq('user_id', userId)
       .single();
 
     if (preferencesError) {
       console.error('Error fetching emergency preferences:', preferencesError);
       // Use defaults if no preferences found
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
      'other': 'Emergency'
    };

    const situationLabel = situationLabels[situation_type] || 'Emergency';
    
    // Create alert message
    const alertMessage = `🚨 EMERGENCY ALERT 🚨\n\n${user_name} needs help!\n\nSituation: ${situationLabel}\nLocation: ${location.address}\nTime: ${new Date().toLocaleString()}\n\nThis is an automated emergency alert. Please check on ${user_name} immediately or contact emergency services if needed.`;

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
            recipient_id: contact.user_id, // This would need to be mapped to a user if contacts have user accounts
            sent_at: new Date().toISOString()
          });
      }

      // Send SMS alerts
      if (methods.includes('sms')) {
        await sendSMSAlert(contact.phone_number, alertMessage);
      }

      // Send WhatsApp alerts (would require WhatsApp Business API)
      if (methods.includes('whatsapp')) {
        await sendWhatsAppAlert(contact.phone_number, alertMessage);
      }

      // Initiate phone call (would require voice API like Twilio)
      if (methods.includes('phone_call')) {
        await initiateEmergencyCall(contact.phone_number, user_name, situationLabel);
      }
    }) || [];

    await Promise.all(alertPromises);

    // Create public alert if enabled
    if (preferences?.auto_alert_public) {
      await supabase
        .from('public_emergency_alerts')
        .insert({
          panic_alert_id,
          user_id: userId,
          situation_type,
          latitude: location.latitude,
          longitude: location.longitude,
          address: preferences?.share_location_with_public ? location.address : null,
          radius_km: 5,
          is_active: true
        });

      // Send community notifications to nearby users
      await sendCommunityAlerts(location, situationLabel, userId);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Emergency alerts sent successfully',
      contacts_notified: contacts?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in emergency-alert function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to send emergency alerts',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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
  // This would integrate with WhatsApp Business API
  console.log(`WhatsApp Alert to ${phoneNumber}: ${message}`);
  
  // Example WhatsApp Business API integration (requires setup)
  /*
  const whatsappToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
  const whatsappPhoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
  
  if (whatsappToken && whatsappPhoneId) {
    const response = await fetch(`https://graph.facebook.com/v17.0/${whatsappPhoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: { body: message },
      }),
    });
    
    if (!response.ok) {
      console.error('Failed to send WhatsApp message:', await response.text());
    }
  }
  */
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