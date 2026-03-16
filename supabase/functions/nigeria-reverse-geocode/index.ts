import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCors, jsonResponse } from "../_shared/http.ts";

const NIGERIA_BOUNDS = {
  north: 13.9,
  south: 4.3,
  east: 14.7,
  west: 2.7,
};

interface ReverseGeocodeRequest {
  latitude: number;
  longitude: number;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const { latitude, longitude }: ReverseGeocodeRequest = await req.json();

    if (
      latitude < NIGERIA_BOUNDS.south ||
      latitude > NIGERIA_BOUNDS.north ||
      longitude < NIGERIA_BOUNDS.west ||
      longitude > NIGERIA_BOUNDS.east
    ) {
      return jsonResponse(req, {
        address: "Location outside Nigeria",
        status: "out_of_bounds",
      }, 400);
    }

    const googleMapsApiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!googleMapsApiKey) {
      throw new Error("Geocoding service unavailable");
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleMapsApiKey}&region=ng&language=en`,
    );

    if (response.ok) {
      const data = await response.json();
      if (data.status === "OK" && data.results?.length > 0) {
        const result = data.results[0];
        const components = result.address_components ?? [];
        const neighborhood = components.find((component: { types: string[] }) =>
          component.types.includes("neighborhood") || component.types.includes("sublocality")
        )?.long_name;
        const city = components.find((component: { types: string[] }) =>
          component.types.includes("locality") || component.types.includes("administrative_area_level_2")
        )?.long_name;
        const state = components.find((component: { types: string[] }) =>
          component.types.includes("administrative_area_level_1")
        )?.long_name;

        const parts: string[] = [];
        if (neighborhood) parts.push(neighborhood);
        if (city && city !== neighborhood) parts.push(city);
        if (state) parts.push(state);
        parts.push("Nigeria");

        return jsonResponse(req, {
          address: state ? parts.join(", ") : result.formatted_address,
          formatted_address: result.formatted_address,
          neighborhood,
          city,
          state,
          status: "success",
        });
      }
    }

    const fallbackResponse = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
    );

    if (!fallbackResponse.ok) {
      throw new Error("Geocoding lookup failed");
    }

    const fallbackData = await fallbackResponse.json();
    const fallbackAddress = fallbackData.locality ||
      fallbackData.city ||
      fallbackData.principalSubdivision ||
      `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

    return jsonResponse(req, {
      address: `${fallbackAddress}, Nigeria`,
      status: "fallback",
    });
  } catch (error) {
    console.error("nigeria-reverse-geocode error:", error);
    return jsonResponse(req, {
      error: "Unable to determine address",
      address: "Unable to determine address",
      status: "error",
    }, 500);
  }
});
