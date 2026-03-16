import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { getRequestContext, isPrivilegedUser } from "../_shared/auth.ts";
import { escapeHtml, handleCors, jsonResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

interface SupportEmailRequest {
  ticketId: string;
  responseText: string;
  recipientEmail: string;
  subject: string;
  isInternalNote?: boolean;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getStatusCode(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message === "Forbidden") return 403;
  if (message === "Rate limit exceeded") return 429;
  if (message.startsWith("Missing") || message.startsWith("Invalid")) return 400;
  return 500;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const context = await getRequestContext(req, { allowInternal: false, requireUser: true });

    if (!context.user || !isPrivilegedUser(context.roles)) {
      throw new Error("Forbidden");
    }

    await enforceRateLimit({
      admin: context.admin,
      action: "send-support-email-response",
      scope: `user:${context.user.id}`,
      limit: 20,
      windowMinutes: 15,
    });

    const { ticketId, responseText, recipientEmail, subject, isInternalNote = false }: SupportEmailRequest = await req.json();

    if (!ticketId || !responseText || !recipientEmail || !subject) {
      throw new Error("Missing required fields");
    }

    if (!isValidEmail(recipientEmail)) {
      throw new Error("Invalid recipient email");
    }

    if (subject.length > 200 || responseText.length > 10000) {
      throw new Error("Invalid field length");
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("Email service unavailable");
    }

    const resend = new Resend(resendApiKey);
    const from = Deno.env.get("RESEND_FROM") ?? "Support <support@resend.dev>";
    const safeBody = escapeHtml(responseText).replace(/\n/g, "<br>");

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0;">Support Response - Ticket #${escapeHtml(ticketId.slice(-8))}</h2>
        </div>
        <div style="background-color: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
          <div style="white-space: pre-wrap; line-height: 1.6; color: #333;">${safeBody}</div>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from,
      to: [recipientEmail],
      subject,
      html: htmlBody,
    });

    const { error: responseError } = await context.admin
      .from("support_ticket_responses")
      .insert({
        ticket_id: ticketId,
        user_id: context.user.id,
        response_text: responseText,
        is_staff_response: true,
        is_internal_note: isInternalNote,
        response_type: "email",
        email_message_id: (emailResponse as { data?: { id?: string } })?.data?.id,
      });

    if (responseError) {
      console.error("send-support-email-response log error:", responseError);
    }

    const updatePayload: Record<string, unknown> = {
      last_response_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!isInternalNote) {
      updatePayload.status = "waiting_response";
    }

    const { error: ticketUpdateError } = await context.admin
      .from("support_tickets")
      .update(updatePayload)
      .eq("id", ticketId);

    if (ticketUpdateError) {
      console.error("send-support-email-response ticket update error:", ticketUpdateError);
    }

    return jsonResponse(req, {
      success: true,
      message: "Support email response sent successfully",
      ticketId,
      provider: "resend",
    });
  } catch (error) {
    console.error("send-support-email-response error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = getStatusCode(message);

    return jsonResponse(
      req,
      { error: status >= 500 ? "Request failed" : message },
      status,
    );
  }
});
