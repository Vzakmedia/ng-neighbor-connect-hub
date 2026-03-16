import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getRequestContext, isPrivilegedUser } from "../_shared/auth.ts";
import { getClientIp, handleCors, jsonResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

interface AutomationTrigger {
  triggerType: string;
  eventData: Record<string, unknown>;
  sourceUserId?: string;
  targetUsers?: string[];
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
    const context = await getRequestContext(req, { allowInternal: true, requireUser: false });

    if (!context.isInternal) {
      if (!context.user || !isPrivilegedUser(context.roles)) {
        throw new Error("Forbidden");
      }

      await enforceRateLimit({
        admin: context.admin,
        action: "automation-processor",
        scope: `user:${context.user.id}`,
        limit: 40,
        windowMinutes: 15,
      });
    } else {
      await enforceRateLimit({
        admin: context.admin,
        action: "automation-processor-internal",
        scope: `ip:${getClientIp(req)}`,
        limit: 300,
        windowMinutes: 5,
      });
    }

    const { triggerType, eventData, sourceUserId, targetUsers }: AutomationTrigger = await req.json();

    if (!triggerType || typeof triggerType !== "string" || triggerType.length > 100 || !eventData || typeof eventData !== "object") {
      throw new Error("Missing required fields");
    }

    if (targetUsers && (!Array.isArray(targetUsers) || targetUsers.some((id) => typeof id !== "string" || id.length === 0))) {
      throw new Error("Invalid targetUsers");
    }

    const { data: automations, error: automationsError } = await context.admin
      .from("platform_automations")
      .select("*")
      .eq("is_active", true)
      .contains("trigger_conditions", { triggerType });

    if (automationsError) {
      throw new Error("Failed to load automations");
    }

    if (!automations || automations.length === 0) {
      return jsonResponse(req, { processed: 0, automationsFound: 0, triggerType });
    }

    let processedCount = 0;

    for (const automation of automations) {
      try {
        const { data: userPrefs, error: prefsError } = await context.admin
          .from("user_automation_preferences")
          .select("user_id, webhook_url, custom_settings")
          .eq("automation_id", automation.id)
          .eq("is_enabled", true);

        if (prefsError) {
          console.error("automation-processor preferences error:", prefsError);
          continue;
        }

        const relevantUsers = targetUsers
          ? (userPrefs ?? []).filter((pref) => targetUsers.includes(pref.user_id))
          : (userPrefs ?? []);

        for (const userPref of relevantUsers) {
          try {
            await executeAutomation(automation, userPref, eventData, context.admin);
            processedCount += 1;
          } catch (error) {
            console.error(`automation-processor execution error for ${automation.id}/${userPref.user_id}:`, error);

            await context.admin.from("automation_logs").insert({
              automation_id: automation.id,
              execution_status: "failed",
              execution_details: {
                error: error instanceof Error ? error.message : "Unexpected error",
                user_id: userPref.user_id,
                trigger_type: triggerType,
                event_data: eventData,
                source_user_id: sourceUserId ?? null,
              },
            });
          }
        }
      } catch (error) {
        console.error(`automation-processor loop error for ${automation.id}:`, error);
      }
    }

    return jsonResponse(req, {
      processed: processedCount,
      triggerType,
      automationsFound: automations.length,
    });
  } catch (error) {
    console.error("automation-processor error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = getStatusCode(message);

    return jsonResponse(
      req,
      { error: status >= 500 ? "Request failed" : message },
      status,
    );
  }
});

async function executeAutomation(
  automation: Record<string, unknown>,
  userPref: { user_id: string; webhook_url?: string | null; custom_settings?: Record<string, unknown> | null },
  eventData: Record<string, unknown>,
  admin: Awaited<ReturnType<typeof getRequestContext>>["admin"],
) {
  const startTime = Date.now();

  try {
    switch (automation.automation_type) {
      case "webhook":
        await executeWebhookAutomation(automation, userPref, eventData);
        break;
      case "email":
        await executeEmailAutomation(automation, userPref, eventData, admin);
        break;
      case "push_notification":
        await executePushNotificationAutomation(automation, userPref, eventData, admin);
        break;
      case "zapier":
        await executeZapierAutomation(automation, userPref, eventData);
        break;
      default:
        return;
    }

    await admin.from("automation_logs").insert({
      automation_id: automation.id,
      execution_status: "success",
      processing_time_ms: Date.now() - startTime,
      execution_details: {
        user_id: userPref.user_id,
        automation_type: automation.automation_type,
        trigger_data: eventData,
        webhook_url: userPref.webhook_url,
        custom_settings: userPref.custom_settings,
      },
    });
  } catch (error) {
    await admin.from("automation_logs").insert({
      automation_id: automation.id,
      execution_status: "failed",
      processing_time_ms: Date.now() - startTime,
      execution_details: {
        error: error instanceof Error ? error.message : "Unexpected error",
        user_id: userPref.user_id,
        automation_type: automation.automation_type,
        trigger_data: eventData,
      },
    });

    throw error;
  }
}

async function executeWebhookAutomation(
  automation: Record<string, unknown>,
  userPref: { user_id: string; webhook_url?: string | null; custom_settings?: Record<string, unknown> | null },
  eventData: Record<string, unknown>,
) {
  if (!userPref.webhook_url) {
    throw new Error("No webhook URL configured");
  }

  const response = await fetch(userPref.webhook_url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "CommunityConnect-Automation/1.0",
    },
    body: JSON.stringify({
      automation: {
        id: automation.id,
        name: automation.name,
        type: automation.automation_type,
      },
      trigger: eventData,
      user_id: userPref.user_id,
      timestamp: new Date().toISOString(),
      settings: userPref.custom_settings,
    }),
  });

  if (!response.ok) {
    throw new Error(`Webhook request failed: ${response.status}`);
  }
}

async function executeEmailAutomation(
  automation: Record<string, unknown>,
  userPref: { user_id: string; custom_settings?: Record<string, unknown> | null },
  eventData: Record<string, unknown>,
  admin: Awaited<ReturnType<typeof getRequestContext>>["admin"],
) {
  const { data: profile, error } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("user_id", userPref.user_id)
    .single();

  if (error || !profile?.email) {
    throw new Error("User email not found");
  }

  const { error: emailError } = await admin.functions.invoke("send-notification-email", {
    body: {
      to: profile.email,
      subject: `${String(automation.name ?? "Automation")} - Notification`,
      automation_name: String(automation.name ?? "Automation"),
      user_name: profile.full_name,
      event_data: eventData,
      custom_settings: userPref.custom_settings,
    },
  });

  if (emailError) {
    throw new Error("Email sending failed");
  }
}

async function executePushNotificationAutomation(
  automation: Record<string, unknown>,
  userPref: { user_id: string },
  eventData: Record<string, unknown>,
  admin: Awaited<ReturnType<typeof getRequestContext>>["admin"],
) {
  const { error: pushError } = await admin.functions.invoke("send-push-notification", {
    body: {
      user_id: userPref.user_id,
      title: String(automation.name ?? "Automation"),
      message: `New ${String(eventData.type ?? "event")} requires your attention`,
      data: {
        automation_id: automation.id,
        event_data: eventData,
      },
    },
  });

  if (pushError) {
    throw new Error("Push notification failed");
  }
}

async function executeZapierAutomation(
  automation: Record<string, unknown>,
  userPref: { user_id: string; webhook_url?: string | null; custom_settings?: Record<string, unknown> | null },
  eventData: Record<string, unknown>,
) {
  if (!userPref.webhook_url) {
    throw new Error("No Zapier webhook URL configured");
  }

  const response = await fetch(userPref.webhook_url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "CommunityConnect-Zapier/1.0",
    },
    body: JSON.stringify({
      automation_name: automation.name,
      trigger_type: eventData.type,
      data: eventData,
      user_id: userPref.user_id,
      timestamp: new Date().toISOString(),
      ...(userPref.custom_settings ?? {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`Zapier webhook failed: ${response.status}`);
  }
}
