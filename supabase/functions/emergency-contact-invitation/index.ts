import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getRequestContext } from "../_shared/auth.ts";
import { handleCors, jsonResponse } from "../_shared/http.ts";

interface RequestPayload {
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
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const context = await getRequestContext(req, { allowInternal: true, requireUser: false });
    if (!context.isInternal) {
      return jsonResponse(req, { error: "Forbidden" }, 403);
    }

    const body: RequestPayload = await req.json();

    if (body.type !== "INSERT" || body.table !== "emergency_contact_requests") {
      return jsonResponse(req, { message: "Not a relevant event" });
    }

    const { record } = body;

    if (record.notification_sent) {
      return jsonResponse(req, { message: "Notification already sent" });
    }

    if (!record.recipient_id) {
      return jsonResponse(req, { message: "No recipient found" });
    }

    const { data: sender, error: senderError } = await context.admin
      .from("profiles")
      .select("full_name, phone")
      .eq("user_id", record.sender_id)
      .single();

    if (senderError) {
      throw new Error("Failed to fetch sender information");
    }

    const { data: notification, error: notifError } = await context.admin
      .from("alert_notifications")
      .insert({
        recipient_id: record.recipient_id,
        notification_type: "contact_request",
        sender_name: sender.full_name,
        sender_phone: sender.phone,
        content: `${sender.full_name} wants to add you as an emergency contact`,
        request_id: record.id,
      })
      .select()
      .single();

    if (notifError) {
      throw new Error("Failed to create notification");
    }

    await context.admin
      .from("emergency_contact_requests")
      .update({ notification_sent: true })
      .eq("id", record.id);

    return jsonResponse(req, {
      success: true,
      message: "Emergency contact invitation notification created",
      notification_id: notification.id,
    });
  } catch (error) {
    console.error("Error processing emergency contact invitation:", error);
    return jsonResponse(req, { error: "Request failed" }, 500);
  }
});
