import { useEffect, useRef } from "react";

export function useWeatherNotification() {
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchWeather = async () => {
      try {
        let latitude: number | undefined;
        let longitude: number | undefined;
        let city: string | undefined;

        if ("geolocation" in navigator) {
          try {
            const pos = await new Promise<GeolocationPosition>(
              (resolve, reject) =>
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                  timeout: 5000,
                })
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

        await fetch(
          `https://${projectId}.supabase.co/functions/v1/weather-notification`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${anonKey}`,
            },
            body: JSON.stringify({ latitude, longitude, city }),
          }
        );
      } catch (err) {
        console.error("Weather notification error:", err);
      }
    };

    fetchWeather();
  }, []);
}
