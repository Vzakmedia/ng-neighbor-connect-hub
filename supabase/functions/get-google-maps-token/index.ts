import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { handleCors, jsonResponse } from "../_shared/http.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const token = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!token) {
      throw new Error("Configuration unavailable");
    }

    return jsonResponse(req, { token, success: true });
  } catch (error) {
    console.error("get-google-maps-token error:", error);
    return jsonResponse(req, { error: "Service temporarily unavailable" }, 500);
  }
});
