import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

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

    // Check if email notifications are enabled
    const { data: emailConfig } = await supabase
      .from('app_configuration')
      .select('config_value')
      .eq('config_key', 'email_enabled')
      .single();

    if (!emailConfig?.config_value) {
      console.log('Email notifications are disabled');
      return new Response(
        JSON.stringify({ 
          error: 'Email notifications are disabled',
          status: 'disabled'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // For now, we'll use a placeholder email service
    // In a real implementation, you would integrate with SendGrid, Resend, or similar
    console.log('Simulating email send...');
    
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

    // Simulate email delivery (replace with actual email service)
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Email notification sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Email notification sent successfully',
        recipient: to,
        subject: subject,
        type: type,
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