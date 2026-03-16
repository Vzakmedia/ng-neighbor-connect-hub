import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getRequestContext } from "../_shared/auth.ts";
import { handleCors, jsonResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

function getStatusCode(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message === "Rate limits exceeded, please try again later.") return 429;
  if (message === "Payment required, please add funds to your Lovable AI workspace.") return 402;
  if (message === "Rate limit exceeded") return 429;
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
      action: "generate-feed-recommendations",
      scope: `user:${context.user.id}`,
      limit: 10,
      windowMinutes: 30,
    });

    const userId = context.user.id;

    const { data: engagementData, error: engagementError } = await context.admin
      .rpc("get_user_engagement_stats", { p_user_id: userId });

    if (engagementError) {
      console.warn("generate-feed-recommendations stats fallback:", engagementError);
    }

    const stats = engagementData?.[0] || {
      liked_tags: [],
      saved_tags: [],
      viewed_tags: [],
      preferred_locations: [],
      engagement_score: 0,
    };

    const { data: profile } = await context.admin
      .from("profiles")
      .select("state, city, neighborhood")
      .eq("id", userId)
      .single();

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("Recommendation service unavailable");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a feed recommendation algorithm for a community social network. Return JSON scoring weights for tag_match, location_match, recency_boost, and engagement_quality.",
          },
          {
            role: "user",
            content: `
User Profile:
- Location: ${profile?.neighborhood || "Unknown"}, ${profile?.city || "Unknown"}, ${profile?.state || "Unknown"}
- Engagement Score: ${stats.engagement_score}
- Frequently Liked Tags: ${stats.liked_tags.join(", ") || "None yet"}
- Frequently Saved Tags: ${stats.saved_tags.join(", ") || "None yet"}
- Frequently Viewed Tags: ${stats.viewed_tags.join(", ") || "None yet"}
- Preferred Locations: ${stats.preferred_locations.join(", ") || "Local area"}

Based on this user's behavior, provide scoring weights to personalize their feed.
If the user has low engagement, prioritize location_match and recency_boost.
If the user has high engagement, prioritize tag_match and engagement_quality.
`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_feed_weights",
            description: "Generate scoring weights for feed personalization",
            parameters: {
              type: "object",
              properties: {
                tag_match: { type: "number" },
                location_match: { type: "number" },
                recency_boost: { type: "number" },
                engagement_quality: { type: "number" },
              },
              required: ["tag_match", "location_match", "recency_boost", "engagement_quality"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_feed_weights" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        throw new Error("Rate limits exceeded, please try again later.");
      }

      if (aiResponse.status === 402) {
        throw new Error("Payment required, please add funds to your Lovable AI workspace.");
      }

      throw new Error("Failed to generate feed recommendations");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("Failed to generate feed recommendations");
    }

    const weights = JSON.parse(toolCall.function.arguments);

    return jsonResponse(req, {
      weights,
      userPreferences: {
        preferredTags: [...new Set([...stats.liked_tags, ...stats.saved_tags, ...stats.viewed_tags])],
        preferredLocations: stats.preferred_locations,
        engagementScore: stats.engagement_score,
      },
    });
  } catch (error) {
    console.error("generate-feed-recommendations error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = getStatusCode(message);

    return jsonResponse(
      req,
      { error: status >= 500 ? "Failed to generate feed recommendations" : message },
      status,
    );
  }
});
