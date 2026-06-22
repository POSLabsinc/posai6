import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Require Supabase apikey/Authorization header to block unauthenticated direct calls.
  const auth = req.headers.get("Authorization") || req.headers.get("apikey");
  if (!auth) return json({ error: "Unauthorized" }, 401);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const lat = Number(body?.lat);
  const lon = Number(body?.lon);
  if (
    !Number.isFinite(lat) || !Number.isFinite(lon) ||
    lat < -90 || lat > 90 || lon < -180 || lon > 180
  ) {
    return json({ error: "Invalid coordinates" }, 400);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const upstream = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat.toFixed(6)}&lon=${lon.toFixed(6)}&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          "User-Agent": "POS-App/1.0 (geocode-reverse proxy)",
          Accept: "application/json",
        },
      }
    );
    clearTimeout(timeout);

    if (!upstream.ok) return json({ error: "Upstream error" }, 502);

    const data = await upstream.json().catch(() => null);
    if (!data || typeof data !== "object") {
      return json({ error: "Invalid upstream response" }, 502);
    }
    const address = (data as any).address ?? {};

    // Return only the whitelisted fields the client uses, length-clamped.
    const clamp = (v: unknown, n: number) =>
      typeof v === "string" ? v.replace(/[\u0000-\u001F<>]/g, "").trim().slice(0, n) : "";

    return json({
      display_name: clamp((data as any).display_name, 500),
      address: {
        house_number: clamp(address.house_number, 20),
        road: clamp(address.road, 200),
        city: clamp(address.city, 100),
        town: clamp(address.town, 100),
        village: clamp(address.village, 100),
        municipality: clamp(address.municipality, 100),
        state: clamp(address.state, 100),
        postcode: clamp(address.postcode, 20),
      },
    });
  } catch (e) {
    console.error("geocode-reverse error:", e);
    return json({ error: "Lookup failed" }, 500);
  }
});
