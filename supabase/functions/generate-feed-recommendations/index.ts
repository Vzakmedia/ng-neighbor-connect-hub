import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, cache-control",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user's engagement statistics
    const { data: engagementData, error: engagementError } = await supabaseClient
      .rpc('get_user_engagement_stats', { p_user_id: userId });

    if (engagementError) {
      console.error('Error fetching engagement stats:', engagementError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch user engagement data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stats = engagementData?.[0] || {
      liked_tags: [],
      saved_tags: [],
      viewed_tags: [],
      preferred_locations: [],
      engagement_score: 0
    };

    // Get user profile for location context
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('state, city, neighborhood')
      .eq('id', userId)
      .single();

    // Use Lovable AI to analyze user preferences and generate smart feed ordering
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a feed recommendation algorithm for a community social network. 
    Analyze user engagement patterns and provide scoring weights for different post attributes.
    Return a JSON object with scoring weights (0-1) for: tag_match, location_match, recency_boost, and engagement_quality.`;

    const userContext = `
User Profile:
- Location: ${profile?.neighborhood || 'Unknown'}, ${profile?.city || 'Unknown'}, ${profile?.state || 'Unknown'}
- Engagement Score: ${stats.engagement_score}
- Frequently Liked Tags: ${stats.liked_tags.join(', ') || 'None yet'}
- Frequently Saved Tags: ${stats.saved_tags.join(', ') || 'None yet'}
- Frequently Viewed Tags: ${stats.viewed_tags.join(', ') || 'None yet'}
- Preferred Locations: ${stats.preferred_locations.join(', ') || 'Local area'}

Based on this user's behavior, provide scoring weights to personalize their feed.
If the user has low engagement, prioritize location_match and recency_boost.
If the user has high engagement, prioritize tag_match and engagement_quality.
`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContext }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_feed_weights",
            description: "Generate scoring weights for feed personalization",
            parameters: {
              type: "object",
              properties: {
                tag_match: {
                  type: "number",
                  description: "Weight for matching user's preferred tags (0-1)"
                },
                location_match: {
                  type: "number",
                  description: "Weight for matching user's location preferences (0-1)"
                },
                recency_boost: {
                  type: "number",
                  description: "Weight for recent posts (0-1)"
                },
                engagement_quality: {
                  type: "number",
                  description: "Weight for posts with high engagement (0-1)"
                }
              },
              required: ["tag_match", "location_match", "recency_boost", "engagement_quality"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_feed_weights" } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const weights = JSON.parse(toolCall.function.arguments);

    // Return personalized recommendation config
    return new Response(
      JSON.stringify({
        weights,
        userPreferences: {
          preferredTags: [...new Set([...stats.liked_tags, ...stats.saved_tags, ...stats.viewed_tags])],
          preferredLocations: stats.preferred_locations,
          engagementScore: stats.engagement_score
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-feed-recommendations:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
