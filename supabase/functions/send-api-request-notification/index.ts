import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createAdminClient } from "../_shared/auth.ts";
import { escapeHtml, getClientIp, handleCors, jsonResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

interface ApiRequestData {
  name: string;
  email: string;
  company: string;
  requestType: string;
  message: string;
  requestId: string;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const body = await req.json() as ApiRequestData;
    const admin = createAdminClient();
    const clientIp = getClientIp(req);

    if (!body.name || !body.email || !body.company || !body.requestType || !body.message) {
      return jsonResponse(req, { error: "Missing required fields" }, 400);
    }

    if (!isValidEmail(body.email)) {
      return jsonResponse(req, { error: "Invalid email address" }, 400);
    }

    if (
      body.name.length > 120 ||
      body.company.length > 160 ||
      body.requestType.length > 80 ||
      body.message.length > 4000
    ) {
      return jsonResponse(req, { error: "Invalid request length" }, 400);
    }

    await enforceRateLimit({
      admin,
      action: "send-api-request-notification",
      scope: `ip:${clientIp}`,
      limit: 10,
      windowMinutes: 60,
    });

    await enforceRateLimit({
      admin,
      action: "send-api-request-notification-email",
      scope: `email:${body.email.trim().toLowerCase()}`,
      limit: 5,
      windowMinutes: 60,
    });

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("Email service not configured");
    }

    const resend = new Resend(resendApiKey);
    const requestTypeLabels: Record<string, string> = {
      enterprise: "Enterprise API Access",
      technical: "Technical Support",
      partnership: "Partnership Inquiry",
      other: "General Inquiry",
    };

    const requestTypeLabel = requestTypeLabels[body.requestType] || body.requestType;
    const safeName = escapeHtml(body.name);
    const safeEmail = escapeHtml(body.email);
    const safeCompany = escapeHtml(body.company);
    const safeMessage = escapeHtml(body.message);
    const safeRequestId = escapeHtml(body.requestId || "N/A");

    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0f766e 0%, #155e75 100%); color: white; padding: 24px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px; }
            .field { margin-bottom: 18px; }
            .label { font-weight: 700; color: #475569; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
            .value { color: #0f172a; }
            .message-box { background: white; border: 1px solid #e2e8f0; padding: 16px; border-radius: 6px; white-space: pre-wrap; word-wrap: break-word; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>New API Access Request</h1>
          </div>
          <div class="content">
            <div class="field"><div class="label">Request Type</div><div class="value">${escapeHtml(requestTypeLabel)}</div></div>
            <div class="field"><div class="label">Company</div><div class="value">${safeCompany}</div></div>
            <div class="field"><div class="label">Contact Name</div><div class="value">${safeName}</div></div>
            <div class="field"><div class="label">Email Address</div><div class="value"><a href="mailto:${safeEmail}">${safeEmail}</a></div></div>
            <div class="field"><div class="label">Message</div><div class="message-box">${safeMessage}</div></div>
            <div class="field"><div class="label">Request ID</div><div class="value">${safeRequestId}</div></div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "NeighborLink API <onboarding@resend.dev>",
      to: ["api-team@neighborlink.com"],
      subject: `New API Request - ${escapeHtml(requestTypeLabel)} from ${safeCompany}`,
      html: htmlBody,
      replyTo: body.email,
    });

    return jsonResponse(req, {
      success: true,
      emailId: emailResponse.data?.id,
    });
  } catch (error) {
    console.error("Error in send-api-request-notification:", error);
    return jsonResponse(req, { error: "Request failed" }, 500);
  }
});
