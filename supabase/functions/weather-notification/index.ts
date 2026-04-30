// Hourly weather notification for POS
// Fetches weather from Open-Meteo (no API key) and inserts a notification.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function timeLabel() {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}
function dateLabel() {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const WEATHER_CODE: Record<number, { label: string; emoji: string }> = {
  0: { label: "clear sky", emoji: "☀️" },
  1: { label: "mainly clear", emoji: "🌤️" },
  2: { label: "partly cloudy", emoji: "⛅" },
  3: { label: "overcast", emoji: "☁️" },
  45: { label: "fog", emoji: "🌫️" }, 48: { label: "freezing fog", emoji: "🌫️" },
  51: { label: "light drizzle", emoji: "🌦️" }, 53: { label: "drizzle", emoji: "🌦️" }, 55: { label: "heavy drizzle", emoji: "🌧️" },
  61: { label: "light rain", emoji: "🌦️" }, 63: { label: "rain", emoji: "🌧️" }, 65: { label: "heavy rain", emoji: "🌧️" },
  71: { label: "light snow", emoji: "🌨️" }, 73: { label: "snow", emoji: "❄️" }, 75: { label: "heavy snow", emoji: "❄️" },
  80: { label: "rain showers", emoji: "🌦️" }, 81: { label: "heavy showers", emoji: "🌧️" }, 82: { label: "violent showers", emoji: "⛈️" },
  95: { label: "thunderstorm", emoji: "⛈️" }, 96: { label: "thunderstorm w/ hail", emoji: "⛈️" }, 99: { label: "severe thunderstorm", emoji: "⛈️" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { latitude, longitude, city } = await req.json().catch(() => ({}));
    let lat = latitude, lon = longitude, locationName = city || "your area";

    if ((lat == null || lon == null) && city) {
      const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`).then(r => r.json());
      if (geo?.results?.[0]) { lat = geo.results[0].latitude; lon = geo.results[0].longitude; locationName = geo.results[0].name; }
    }
    if (lat == null || lon == null) { lat = 40.7128; lon = -74.006; locationName = "New York"; }

    const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,precipitation&temperature_unit=fahrenheit&wind_speed_unit=mph`).then(r => r.json());
    const cur = w.current || {};
    const code = WEATHER_CODE[cur.weather_code] || { label: "current conditions", emoji: "🌡️" };
    const temp = Math.round(cur.temperature_2m);
    const wind = Math.round(cur.wind_speed_10m);
    const precip = cur.precipitation || 0;

    // Business impact
    let impact = "Steady foot traffic expected.";
    if (precip > 0.1 || [61,63,65,80,81,82,95,96,99].includes(cur.weather_code)) impact = "Rain may slow walk-ins. Push delivery / curbside.";
    else if ([71,73,75].includes(cur.weather_code)) impact = "Snow expected. Prep for fewer dine-ins, more delivery.";
    else if (temp >= 85) impact = "Hot day. Promote cold drinks and lighter items.";
    else if (temp <= 35) impact = "Cold day. Promote soups, hot drinks, and comfort food.";
    else if ([0,1].includes(cur.weather_code) && temp >= 65 && temp <= 80) impact = "Great weather. Patio seating and walk-ins likely up.";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const title = `${code.emoji} Weather, ${locationName}`;
    const preview = `${temp}°F, ${code.label}. ${impact}`;

    await supabase.from("notifications").insert({
      title,
      preview,
      headline: title,
      body: `Current: ${temp}°F, ${code.label}. Wind ${wind} mph. Precipitation ${precip} in.\n\nBusiness impact: ${impact}`,
      category: "weather",
      bullets: [
        { label: "Temp", text: `${temp}°F` },
        { label: "Conditions", text: code.label },
        { label: "Wind", text: `${wind} mph` },
        { label: "Impact", text: impact },
      ],
      footer: null,
      has_update: false,
      time: timeLabel(),
      version: "POS",
      version_date: dateLabel(),
      is_read: false,
    });

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("weather-notification error:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
