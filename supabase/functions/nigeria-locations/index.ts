import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCors, jsonResponse } from "../_shared/http.ts";
import { NIGERIAN_STATES, STATE_CITIES, CITY_NEIGHBORHOODS } from "./nigeria-data.ts";

interface LocationRequest {
  type: "states" | "cities" | "neighborhoods";
  state?: string;
  city?: string;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const { type, state, city }: LocationRequest = await req.json();
    let locations: Array<Record<string, unknown>> = [];

    if (type === "states") {
      locations = NIGERIAN_STATES.map((stateName) => ({
        name: stateName,
        formatted_address: `${stateName}, Nigeria`,
        place_id: `state_${stateName.toLowerCase().replace(/\s+/g, "_")}`,
        types: ["administrative_area_level_1"],
      }));
    } else if (type === "cities" && state) {
      locations = (STATE_CITIES[state] || []).map((cityName) => ({
        name: cityName,
        formatted_address: `${cityName}, ${state}, Nigeria`,
        place_id: `city_${cityName.toLowerCase().replace(/\s+/g, "_")}`,
        types: ["locality"],
      }));
    } else if (type === "neighborhoods" && state && city) {
      locations = (CITY_NEIGHBORHOODS[city] || []).map((neighborhood) => ({
        name: neighborhood,
        formatted_address: `${neighborhood}, ${city}, ${state}, Nigeria`,
        place_id: `neighborhood_${city.toLowerCase()}_${neighborhood.toLowerCase().replace(/\s+/g, "_")}`,
        types: ["neighborhood", "ward"],
      }));
    }

    return jsonResponse(req, { locations, status: "success" });
  } catch (error) {
    console.error("nigeria-locations error:", error);
    return jsonResponse(req, {
      error: "Failed to load locations",
      locations: [],
      status: "error",
    }, 500);
  }
});
