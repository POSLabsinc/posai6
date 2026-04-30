import { useEffect, useRef } from "react";

const HOUR_MS = 60 * 60 * 1000;
const STORAGE_KEY = "pos.aiInsights.lastFetch";

/**
 * Hourly POS AI insights: triggers an edge function that uses Lovable AI
 * to generate concise, actionable alerts (sales, staff, market trends, smart tips).
 * Throttled both client-side (localStorage) and server-side (recent-row check).
 */
export function usePosAIInsights() {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        await fetch(`https://${projectId}.supabase.co/functions/v1/pos-ai-insights`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
          body: "{}",
        });
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
      } catch (err) {
        console.error("POS AI insights error:", err);
      }
    };

    const last = Number(localStorage.getItem(STORAGE_KEY) || 0);
    if (Date.now() - last >= HOUR_MS) {
      // Slight delay so it doesn't compete with first paint
      window.setTimeout(fetchInsights, 8000);
    }
    timerRef.current = window.setInterval(fetchInsights, HOUR_MS);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);
}
