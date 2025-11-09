import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApiRequestData {
  name: string;
  email: string;
  company: string;
  requestType: string;
  message: string;
  requestId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received API request notification");
    
    const { name, email, company, requestType, message, requestId }: ApiRequestData = await req.json();

    // Validate required fields
    if (!name || !email || !company || !requestType || !message) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Initialize Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const resend = new Resend(resendApiKey);

    // Map request type to display label
    const requestTypeLabels: Record<string, string> = {
      enterprise: "Enterprise API Access",
      technical: "Technical Support",
      partnership: "Partnership Inquiry",
      other: "General Inquiry"
    };

    const requestTypeLabel = requestTypeLabels[requestType] || requestType;

    // Create HTML email body
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 8px 8px 0 0;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-top: none;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .badge {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 6px 12px;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 600;
              margin-bottom: 20px;
            }
            .field {
              margin-bottom: 20px;
            }
            .label {
              font-weight: 600;
              color: #4b5563;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
            }
            .value {
              color: #1f2937;
              font-size: 16px;
            }
            .message-box {
              background: white;
              border: 1px solid #e5e7eb;
              padding: 16px;
              border-radius: 6px;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 14px;
            }
            .button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔔 New API Access Request</h1>
          </div>
          <div class="content">
            <div class="badge">${requestTypeLabel}</div>
            
            <div class="field">
              <div class="label">Company</div>
              <div class="value">${company}</div>
            </div>
            
            <div class="field">
              <div class="label">Contact Name</div>
              <div class="value">${name}</div>
            </div>
            
            <div class="field">
              <div class="label">Email Address</div>
              <div class="value"><a href="mailto:${email}">${email}</a></div>
            </div>
            
            <div class="field">
              <div class="label">Message</div>
              <div class="message-box">${message}</div>
            </div>
            
            <div class="footer">
              <p><strong>Request ID:</strong> ${requestId}</p>
              <p><strong>Submitted:</strong> ${new Date().toLocaleString('en-US', { 
                dateStyle: 'full', 
                timeStyle: 'short' 
              })}</p>
              <p>Please respond to this request within 24-48 hours.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email notification
    console.log("Sending email notification to API team");
    const emailResponse = await resend.emails.send({
      from: "NeighborLink API <onboarding@resend.dev>",
      to: ["api-team@neighborlink.com"], // Change to your actual team email
      subject: `New API Request - ${requestTypeLabel} from ${company}`,
      html: htmlBody,
      replyTo: email,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-api-request-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
