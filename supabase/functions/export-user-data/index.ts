import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getRequestContext } from "../_shared/auth.ts";
import { handleCors, jsonResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

function getStatusCode(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message === "Rate limit exceeded") return 429;
  if (message.startsWith("Missing")) return 400;
  return 500;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const context = await getRequestContext(req, { allowInternal: false, requireUser: true });

    if (!context.user) {
      throw new Error("Unauthorized");
    }

    await enforceRateLimit({
      admin: context.admin,
      action: "export-user-data",
      scope: `user:${context.user.id}`,
      limit: 3,
      windowMinutes: 60,
    });

    const userData: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      userId: context.user.id,
      email: context.user.email,
    };

    const [
      profileResult,
      settingsResult,
      messagingResult,
      postsResult,
      itemsResult,
      servicesResult,
      contactsResult,
      activityResult,
      sentCountResult,
      receivedCountResult,
    ] = await Promise.all([
      context.admin.from("profiles").select("*").eq("user_id", context.user.id).single(),
      context.admin.from("user_settings").select("*").eq("user_id", context.user.id).single(),
      context.admin.from("messaging_preferences").select("*").eq("user_id", context.user.id).single(),
      context.admin.from("community_posts").select("id, content, post_type, created_at, location").eq("user_id", context.user.id).order("created_at", { ascending: false }),
      context.admin.from("marketplace_items").select("id, title, description, price, status, created_at").eq("user_id", context.user.id).order("created_at", { ascending: false }),
      context.admin.from("services").select("id, title, description, price, category, created_at").eq("user_id", context.user.id).order("created_at", { ascending: false }),
      context.admin.from("emergency_contacts").select("id, contact_name, contact_phone, relationship, created_at").eq("user_id", context.user.id),
      context.admin.from("activity_logs").select("action_type, resource_type, created_at").eq("user_id", context.user.id).order("created_at", { ascending: false }).limit(100),
      context.admin.from("direct_messages").select("id", { count: "exact", head: true }).eq("sender_id", context.user.id),
      context.admin.from("direct_messages").select("id", { count: "exact", head: true }).eq("recipient_id", context.user.id),
    ]);

    userData.profile = profileResult.data ?? null;
    userData.settings = settingsResult.data ?? null;
    userData.messagingPreferences = messagingResult.data ?? null;
    userData.communityPosts = postsResult.data ?? [];
    userData.marketplaceItems = itemsResult.data ?? [];
    userData.services = servicesResult.data ?? [];
    userData.emergencyContacts = contactsResult.data ?? [];
    userData.activityLogs = activityResult.data ?? [];
    userData.messagesSentCount = sentCountResult.count ?? 0;
    userData.messagesReceivedCount = receivedCountResult.count ?? 0;

    await context.admin.from("activity_logs").insert({
      user_id: context.user.id,
      action_type: "data_export",
      resource_type: "user_data",
      resource_id: context.user.id,
      details: { timestamp: new Date().toISOString() },
    });

    return jsonResponse(req, {
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error("export-user-data error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = getStatusCode(message);

    return jsonResponse(
      req,
      { error: status >= 500 ? "Request failed" : message },
      status,
    );
  }
});
