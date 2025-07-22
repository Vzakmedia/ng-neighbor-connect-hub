// Follow users or service:
// https://supabase.com/dashboard/project/cowiviqhrnmhttugozbz/functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookPayload {
  type: string;
  table: string;
  record: {
    id: string;
    sender_id: string;
    recipient_id?: string;
    recipient_phone: string;
    status: string;
    created_at: string;
    updated_at: string;
    notification_sent: boolean;
  };
  schema: string;
  old_record: null | any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the request body
    const body: WebhookPayload = await req.json();
    console.log("Webhook payload:", JSON.stringify(body));

    // Only process inserts to emergency_contact_requests
    if (body.type !== 'INSERT' || body.table !== 'emergency_contact_requests') {
      return new Response(JSON.stringify({ message: 'Not a relevant event' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const { record } = body;
    
    // Skip if notification already sent
    if (record.notification_sent) {
      return new Response(JSON.stringify({ message: 'Notification already sent' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Check if we have a recipient_id
    if (!record.recipient_id) {
      // Try once more to see if the recipient has been identified by now
      const { data: updatedRequest, error } = await supabase
        .from('emergency_contact_requests')
        .select('recipient_id')
        .eq('id', record.id)
        .single();

      if (error || !updatedRequest.recipient_id) {
        console.log('No recipient found for contact request:', record.id);
        return new Response(JSON.stringify({ message: 'No recipient found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      record.recipient_id = updatedRequest.recipient_id;
    }

    // Get sender info
    const { data: sender, error: senderError } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('user_id', record.sender_id)
      .single();

    if (senderError) {
      console.error('Error fetching sender info:', senderError);
      throw new Error('Failed to fetch sender information');
    }

    // Create notification for recipient
    const { data: notification, error: notifError } = await supabase
      .from('alert_notifications')
      .insert({
        recipient_id: record.recipient_id,
        notification_type: 'contact_request',
        sender_name: sender.full_name,
        sender_phone: sender.phone,
        content: `${sender.full_name} wants to add you as an emergency contact`,
        request_id: record.id
      })
      .select()
      .single();

    if (notifError) {
      console.error('Error creating notification:', notifError);
      throw new Error('Failed to create notification');
    }

    // Mark the request as notified
    await supabase
      .from('emergency_contact_requests')
      .update({ notification_sent: true })
      .eq('id', record.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Emergency contact invitation notification created',
        notification_id: notification.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error processing emergency contact invitation:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
})