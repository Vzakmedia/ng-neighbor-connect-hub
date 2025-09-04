import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  subject: string;
  automation_name: string;
  user_name?: string;
  event_data: any;
  custom_settings?: any;
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

    const { to, subject, automation_name, user_name, event_data, custom_settings }: EmailRequest = await req.json();

    // For now, we'll log the email content (in a real implementation, you'd use Resend or similar)
    const emailContent = generateEmailContent(automation_name, user_name, event_data, custom_settings);
    
    console.log('Automation Email:', {
      to,
      subject,
      content: emailContent
    });

    // In a real implementation, you would send the email here using Resend
    // const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    // await resend.emails.send({ from, to, subject, html: emailContent });

    // For now, we'll simulate sending and store the email log
    await supabase.from('automation_logs').insert({
      automation_id: null, // Would be passed in real implementation
      execution_status: 'success',
      execution_details: {
        email_sent: true,
        to,
        subject,
        automation_name,
        event_type: event_data.type
      }
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Email processed successfully' 
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('Error sending automation email:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
};

function generateEmailContent(automationName: string, userName: string = '', eventData: any, customSettings: any): string {
  const greeting = userName ? `Hi ${userName},` : 'Hello,';
  
  let content = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">${automationName}</h2>
          <p>${greeting}</p>
          <p>This is an automated notification triggered by your CommunityConnect automation settings.</p>
  `;

  // Add event-specific content
  switch (eventData.type) {
    case 'community_post':
      content += `
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>New Community Post</h3>
          <p><strong>Title:</strong> ${eventData.title || 'Untitled'}</p>
          <p><strong>Author:</strong> ${eventData.author || 'Unknown'}</p>
          <p><strong>Content:</strong> ${eventData.content?.substring(0, 200) || ''}${eventData.content?.length > 200 ? '...' : ''}</p>
        </div>
      `;
      break;
    case 'safety_alert':
      content += `
        <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <h3>Safety Alert</h3>
          <p><strong>Type:</strong> ${eventData.alert_type || 'General'}</p>
          <p><strong>Severity:</strong> ${eventData.severity || 'Medium'}</p>
          <p><strong>Location:</strong> ${eventData.location || 'Not specified'}</p>
        </div>
      `;
      break;
    case 'event':
      content += `
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>Event Reminder</h3>
          <p><strong>Event:</strong> ${eventData.title || 'Untitled Event'}</p>
          <p><strong>Date:</strong> ${eventData.date || 'TBD'}</p>
          <p><strong>Location:</strong> ${eventData.location || 'TBD'}</p>
        </div>
      `;
      break;
    case 'marketplace':
      content += `
        <div style="background: #fefce8; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>Marketplace Activity</h3>
          <p><strong>Item:</strong> ${eventData.title || 'Unknown Item'}</p>
          <p><strong>Price:</strong> ${eventData.price || 'Not specified'}</p>
          <p><strong>Seller:</strong> ${eventData.seller || 'Unknown'}</p>
        </div>
      `;
      break;
    default:
      content += `
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>Notification Details</h3>
          <pre style="background: #e2e8f0; padding: 10px; border-radius: 4px; overflow-x: auto;">
${JSON.stringify(eventData, null, 2)}
          </pre>
        </div>
      `;
  }

  content += `
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 14px; color: #64748b;">
            This email was sent by CommunityConnect automation "${automationName}". 
            You can manage your automation settings in your dashboard.
          </p>
          <p style="font-size: 12px; color: #94a3b8;">
            Generated at ${new Date().toLocaleString()}
          </p>
        </div>
      </body>
    </html>
  `;

  return content;
}

serve(handler);