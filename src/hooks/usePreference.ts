import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const SHARED_DEVICE_ID = "shared";

export function usePreference(key: string, defaultValue: string) {
  const [value, setValue] = useState(defaultValue);
  const [loading, setLoading] = useState(true);

  const fetchPref = useCallback(async () => {
    const { data } = await (supabase as any)
      .from("user_preferences")
      .select("preference_value")
      .eq("device_id", SHARED_DEVICE_ID)
      .eq("preference_key", key)
      .maybeSingle();

    if (data) setValue(data.preference_value);
    setLoading(false);
  }, [key]);

  useEffect(() => {
    fetchPref();
  }, [fetchPref]);

  // Listen for external changes (e.g. AI updates the same preference key directly)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      if (
        !detail.preferenceKey ||
        detail.preferenceKey === key ||
        detail.settingType === "endOfDay" ||
        detail.type === "endOfDay"
      ) {
        fetchPref();
      }
    };
    window.addEventListener("pos-data-changed", handler);
    window.addEventListener("settings-updated", handler);
    window.addEventListener("preference-updated", handler);
    return () => {
      window.removeEventListener("pos-data-changed", handler);
      window.removeEventListener("settings-updated", handler);
      window.removeEventListener("preference-updated", handler);
    };
  }, [key, fetchPref]);

  const update = useCallback(
    async (newValue: string) => {
      setValue(newValue);
      await (supabase as any)
        .from("user_preferences")
        .upsert(
          { device_id: SHARED_DEVICE_ID, preference_key: key, preference_value: newValue },
          { onConflict: "device_id,preference_key" }
        );
      window.dispatchEvent(new CustomEvent("preference-updated", { detail: { preferenceKey: key } }));
    },
    [key]
  );

  return { value, update, loading };
}
