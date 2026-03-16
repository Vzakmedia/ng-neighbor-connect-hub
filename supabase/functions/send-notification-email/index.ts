import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getRequestContext, isPrivilegedUser } from "../_shared/auth.ts";
import { escapeHtml, getClientIp, handleCors, jsonResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

interface EmailRequest {
  to: string;
  subject: string;
  automation_name: string;
  user_name?: string;
  event_data: Record<string, unknown>;
  custom_settings?: Record<string, unknown>;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function safeString(value: unknown, maxLength = 500): string {
  return escapeHtml(String(value ?? "").slice(0, maxLength));
}

function getStatusCode(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message === "Forbidden") return 403;
  if (message === "Rate limit exceeded") return 429;
  if (message.startsWith("Missing") || message.startsWith("Invalid")) return 400;
  return 500;
}

function generateEmailContent(
  automationName: string,
  userName: string | undefined,
  eventData: Record<string, unknown>,
): string {
  const greeting = userName ? `Hi ${safeString(userName, 120)},` : "Hello,";
  const safeAutomationName = safeString(automationName, 150);
  const eventType = String(eventData?.type ?? "");

  let content = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">${safeAutomationName}</h2>
          <p>${greeting}</p>
          <p>This is an automated notification triggered by your CommunityConnect automation settings.</p>
  `;

  switch (eventType) {
    case "community_post":
      content += `
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>New Community Post</h3>
          <p><strong>Title:</strong> ${safeString(eventData.title, 200)}</p>
          <p><strong>Author:</strong> ${safeString(eventData.author, 120)}</p>
          <p><strong>Content:</strong> ${safeString(eventData.content, 200)}</p>
        </div>
      `;
      break;
    case "safety_alert":
      content += `
        <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <h3>Safety Alert</h3>
          <p><strong>Type:</strong> ${safeString(eventData.alert_type, 120)}</p>
          <p><strong>Severity:</strong> ${safeString(eventData.severity, 60)}</p>
          <p><strong>Location:</strong> ${safeString(eventData.location, 200)}</p>
        </div>
      `;
      break;
    case "event":
      content += `
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>Event Reminder</h3>
          <p><strong>Event:</strong> ${safeString(eventData.title, 200)}</p>
          <p><strong>Date:</strong> ${safeString(eventData.date, 80)}</p>
          <p><strong>Location:</strong> ${safeString(eventData.location, 200)}</p>
        </div>
      `;
      break;
    case "marketplace":
      content += `
        <div style="background: #fefce8; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>Marketplace Activity</h3>
          <p><strong>Item:</strong> ${safeString(eventData.title, 200)}</p>
          <p><strong>Price:</strong> ${safeString(eventData.price, 80)}</p>
          <p><strong>Seller:</strong> ${safeString(eventData.seller, 120)}</p>
        </div>
      `;
      break;
    default:
      content += `
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>Notification Details</h3>
          <pre style="background: #e2e8f0; padding: 10px; border-radius: 4px; overflow-x: auto;">${safeString(JSON.stringify(eventData ?? {}, null, 2), 2000)}</pre>
        </div>
      `;
  }

  content += `
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 14px; color: #64748b;">
            This email was sent by CommunityConnect automation "${safeAutomationName}".
            You can manage your automation settings in your dashboard.
          </p>
        </div>
      </body>
    </html>
  `;

  return content;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const context = await getRequestContext(req, { allowInternal: true, requireUser: false });

    if (!context.isInternal) {
      if (!context.user || !isPrivilegedUser(context.roles)) {
        throw new Error("Forbidden");
      }

      await enforceRateLimit({
        admin: context.admin,
        action: "send-notification-email",
        scope: `user:${context.user.id}`,
        limit: 30,
        windowMinutes: 15,
      });
    } else {
      await enforceRateLimit({
        admin: context.admin,
        action: "send-notification-email-internal",
        scope: `ip:${getClientIp(req)}`,
        limit: 200,
        windowMinutes: 5,
      });
    }

    const { to, subject, automation_name, user_name, event_data }: EmailRequest = await req.json();

    if (!to || !subject || !automation_name || !event_data) {
      throw new Error("Missing required fields");
    }

    if (!isValidEmail(to)) {
      throw new Error("Invalid recipient email");
    }

    if (subject.length > 200 || automation_name.length > 150) {
      throw new Error("Invalid field length");
    }

    const emailContent = generateEmailContent(automation_name, user_name, event_data);

    const { error: logError } = await context.admin.from("automation_logs").insert({
      automation_id: null,
      execution_status: "success",
      execution_details: {
        email_sent: true,
        to,
        subject,
        automation_name,
        event_type: String(event_data.type ?? ""),
        preview_html_length: emailContent.length,
      },
    });

    if (logError) {
      console.error("send-notification-email log error:", logError);
    }

    return jsonResponse(req, {
      success: true,
      message: "Email processed successfully",
    });
  } catch (error) {
    console.error("send-notification-email error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = getStatusCode(message);

    return jsonResponse(
      req,
      { error: status >= 500 ? "Request failed" : message },
      status,
    );
  }
});
