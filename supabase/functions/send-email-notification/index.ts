import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, body, type = 'notification', userId } = await req.json();
    
    console.log('Email notification request:', { to, subject, type, userId });

    // Validate required fields
    if (!to || !subject || !body) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: to, subject, body',
          status: 'error'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if email notifications are enabled globally
    const { data: emailConfig } = await supabase
      .from('app_configuration')
      .select('config_value')
      .eq('config_key', 'email_enabled')
      .single();

    if (emailConfig?.config_value === false) {
      console.log('Email notifications are disabled globally');
      return new Response(
        JSON.stringify({ 
          status: 'skipped',
          reason: 'global_disabled'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check user's email preferences if userId is provided
    if (userId) {
      const { data: userPrefs } = await supabase
        .from('user_email_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      // If user has preferences and email is disabled
      if (userPrefs && !userPrefs.email_enabled) {
        console.log('Email notifications disabled for user:', userId);
        return new Response(
          JSON.stringify({ 
            status: 'skipped',
            reason: 'user_disabled'
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Check notification type preference
      if (userPrefs) {
        const typeKey = type.replace('_alert', '_alerts').replace('_request', '_requests');
        if (userPrefs[typeKey] === false) {
          console.log(`Email notification type '${type}' disabled for user:`, userId);
          return new Response(
            JSON.stringify({ 
              status: 'skipped',
              reason: 'type_disabled'
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }
    }

    // Initialize Resend and send the email
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'RESEND_API_KEY is not configured',
          status: 'error'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const resend = new Resend(resendApiKey);
    const from = Deno.env.get('RESEND_FROM') ?? 'Notifications <onboarding@resend.dev>';

    const emailResponse = await resend.emails.send({
      from,
      to: [to],
      subject,
      html: typeof body === 'string' ? body : JSON.stringify(body),
    });

    // Log the email for audit purposes
    const { error: logError } = await supabase
      .from('email_logs')
      .insert({
        recipient_email: to,
        subject: subject,
        body: body,
        email_type: type,
        user_id: userId,
        status: 'sent',
        sent_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Error logging email:', logError);
    }

    console.log('Email notification sent successfully via Resend');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Email notification sent successfully',
        recipient: to,
        subject: subject,
        type: type,
        provider: 'resend',
        provider_id: (emailResponse as any)?.data?.id ?? null,
        sentAt: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error sending email notification:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        status: 'error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});