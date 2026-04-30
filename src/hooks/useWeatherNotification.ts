import { useEffect, useRef } from "react";

const HOUR_MS = 60 * 60 * 1000;
const STORAGE_KEY = "pos.weatherNotification.lastFetch";

export function useWeatherNotification() {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        let latitude: number | undefined;
        let longitude: number | undefined;
        let city: string | undefined;

        if ("geolocation" in navigator) {
          try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
            );
            latitude = pos.coords.latitude;
            longitude = pos.coords.longitude;
          } catch {
            city = "New York";
          }
        } else {
          city = "New York";
        }

        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        await fetch(`https://${projectId}.supabase.co/functions/v1/weather-notification`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
          body: JSON.stringify({ latitude, longitude, city }),
        });

        localStorage.setItem(STORAGE_KEY, String(Date.now()));
      } catch (err) {
        console.error("Weather notification error:", err);
      }
    };

    // Fire if we haven't fetched in the last hour
    const last = Number(localStorage.getItem(STORAGE_KEY) || 0);
    if (Date.now() - last >= HOUR_MS) {
      fetchWeather();
    }

    // Hourly interval
    timerRef.current = window.setInterval(fetchWeather, HOUR_MS);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);
}
