import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutomationTrigger {
  triggerType: string;
  eventData: any;
  sourceUserId?: string;
  targetUsers?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { triggerType, eventData, sourceUserId, targetUsers }: AutomationTrigger = await req.json();

    console.log('Processing automation trigger:', { triggerType, eventData });

    // Get all active automations that match this trigger type
    const { data: automations, error: automationsError } = await supabase
      .from('platform_automations')
      .select('*')
      .eq('is_active', true)
      .contains('trigger_conditions', { triggerType });

    if (automationsError) {
      throw automationsError;
    }

    if (!automations || automations.length === 0) {
      console.log('No matching automations found for trigger:', triggerType);
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    let processedCount = 0;

    // Process each automation
    for (const automation of automations) {
      try {
        // Get users who have this automation enabled
        const { data: userPrefs, error: prefsError } = await supabase
          .from('user_automation_preferences')
          .select('user_id, webhook_url, custom_settings')
          .eq('automation_id', automation.id)
          .eq('is_enabled', true);

        if (prefsError) {
          console.error('Error fetching user preferences:', prefsError);
          continue;
        }

        // Filter users if targetUsers is specified
        const relevantUsers = targetUsers 
          ? userPrefs?.filter(pref => targetUsers.includes(pref.user_id)) || []
          : userPrefs || [];

        // Execute automation for each user
        for (const userPref of relevantUsers) {
          try {
            await executeAutomation(automation, userPref, eventData, supabase);
            processedCount++;
          } catch (error) {
            console.error(`Error executing automation ${automation.id} for user ${userPref.user_id}:`, error);
            
            // Log the failure
            await supabase.from('automation_logs').insert({
              automation_id: automation.id,
              execution_status: 'failed',
              execution_details: {
                error: error.message,
                user_id: userPref.user_id,
                trigger_type: triggerType,
                event_data: eventData
              }
            });
          }
        }
      } catch (error) {
        console.error(`Error processing automation ${automation.id}:`, error);
      }
    }

    return new Response(JSON.stringify({ 
      processed: processedCount,
      triggerType,
      automationsFound: automations.length 
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('Error in automation processor:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
};

async function executeAutomation(automation: any, userPref: any, eventData: any, supabase: any) {
  const startTime = Date.now();
  
  try {
    console.log(`Executing automation ${automation.name} for user ${userPref.user_id}`);
    
    // Execute based on automation type
    switch (automation.automation_type) {
      case 'webhook':
        await executeWebhookAutomation(automation, userPref, eventData);
        break;
      case 'email':
        await executeEmailAutomation(automation, userPref, eventData, supabase);
        break;
      case 'push_notification':
        await executePushNotificationAutomation(automation, userPref, eventData, supabase);
        break;
      case 'zapier':
        await executeZapierAutomation(automation, userPref, eventData);
        break;
      default:
        console.warn(`Unknown automation type: ${automation.automation_type}`);
        return;
    }

    const processingTime = Date.now() - startTime;

    // Log successful execution
    await supabase.from('automation_logs').insert({
      automation_id: automation.id,
      execution_status: 'success',
      processing_time_ms: processingTime,
      execution_details: {
        user_id: userPref.user_id,
        automation_type: automation.automation_type,
        trigger_data: eventData,
        webhook_url: userPref.webhook_url,
        custom_settings: userPref.custom_settings
      }
    });

    console.log(`Successfully executed automation ${automation.name} in ${processingTime}ms`);
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    // Log failed execution
    await supabase.from('automation_logs').insert({
      automation_id: automation.id,
      execution_status: 'failed',
      processing_time_ms: processingTime,
      execution_details: {
        error: error.message,
        user_id: userPref.user_id,
        automation_type: automation.automation_type,
        trigger_data: eventData
      }
    });
    
    throw error;
  }
}

async function executeWebhookAutomation(automation: any, userPref: any, eventData: any) {
  if (!userPref.webhook_url) {
    throw new Error('No webhook URL configured');
  }

  const payload = {
    automation: {
      id: automation.id,
      name: automation.name,
      type: automation.automation_type
    },
    trigger: eventData,
    user_id: userPref.user_id,
    timestamp: new Date().toISOString(),
    settings: userPref.custom_settings
  };

  const response = await fetch(userPref.webhook_url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'CommunityConnect-Automation/1.0'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
  }
}

async function executeEmailAutomation(automation: any, userPref: any, eventData: any, supabase: any) {
  // Get user's email
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('user_id', userPref.user_id)
    .single();

  if (error || !profile?.email) {
    throw new Error('User email not found');
  }

  // Call email sending edge function
  const { error: emailError } = await supabase.functions.invoke('send-notification-email', {
    body: {
      to: profile.email,
      subject: `${automation.name} - Notification`,
      automation_name: automation.name,
      user_name: profile.full_name,
      event_data: eventData,
      custom_settings: userPref.custom_settings
    }
  });

  if (emailError) {
    throw new Error(`Email sending failed: ${emailError.message}`);
  }
}

async function executePushNotificationAutomation(automation: any, userPref: any, eventData: any, supabase: any) {
  // Call push notification edge function
  const { error: pushError } = await supabase.functions.invoke('send-push-notification', {
    body: {
      user_id: userPref.user_id,
      title: automation.name,
      message: `New ${eventData.type || 'event'} requires your attention`,
      data: {
        automation_id: automation.id,
        event_data: eventData
      }
    }
  });

  if (pushError) {
    throw new Error(`Push notification failed: ${pushError.message}`);
  }
}

async function executeZapierAutomation(automation: any, userPref: any, eventData: any) {
  if (!userPref.webhook_url) {
    throw new Error('No Zapier webhook URL configured');
  }

  const zapierPayload = {
    automation_name: automation.name,
    trigger_type: eventData.type,
    data: eventData,
    user_id: userPref.user_id,
    timestamp: new Date().toISOString(),
    ...userPref.custom_settings
  };

  const response = await fetch(userPref.webhook_url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'CommunityConnect-Zapier/1.0'
    },
    body: JSON.stringify(zapierPayload)
  });

  if (!response.ok) {
    throw new Error(`Zapier webhook failed: ${response.status} ${response.statusText}`);
  }
}

serve(handler);