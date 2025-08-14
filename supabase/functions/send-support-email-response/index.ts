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
    const { ticketId, responseText, recipientEmail, subject, isInternalNote = false } = await req.json();

    console.log('Support email response request:', { ticketId, subject, recipientEmail });

    // Validate required fields
    if (!ticketId || !responseText || !recipientEmail || !subject) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: ticketId, responseText, recipientEmail, subject',
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

    // Get staff user info
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
    const from = Deno.env.get('RESEND_FROM') ?? 'Support <support@resend.dev>';

    // Create HTML email template
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0;">Support Response - Ticket #${ticketId.slice(-8)}</h2>
        </div>
        
        <div style="background-color: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
          <div style="white-space: pre-wrap; line-height: 1.6; color: #333;">${responseText}</div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; font-size: 12px; color: #666;">
          <p style="margin: 0;">
            This email was sent in response to your support ticket. 
            If you need further assistance, please reply to this email or contact our support team.
          </p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from,
      to: [recipientEmail],
      subject,
      html: htmlBody,
    });

    console.log('Support email sent successfully:', emailResponse);

    // Log the response in the database
    const { error: responseError } = await supabase
      .from('support_ticket_responses')
      .insert({
        ticket_id: ticketId,
        user_id: user.id,
        response_text: responseText,
        is_staff_response: true,
        is_internal_note: isInternalNote,
        response_type: 'email',
        email_message_id: (emailResponse as any)?.data?.id
      });

    if (responseError) {
      console.error('Error logging response:', responseError);
    }

    // Update ticket status and last response time
    const { error: ticketUpdateError } = await supabase
      .from('support_tickets')
      .update({
        status: isInternalNote ? undefined : 'waiting_response',
        last_response_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    if (ticketUpdateError) {
      console.error('Error updating ticket:', ticketUpdateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Support email response sent successfully',
        recipient: recipientEmail,
        subject: subject,
        ticketId: ticketId,
        provider: 'resend',
        provider_id: (emailResponse as any)?.data?.id ?? null,
        sentAt: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error sending support email response:', error);
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