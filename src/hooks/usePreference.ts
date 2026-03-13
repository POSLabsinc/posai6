import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const SHARED_DEVICE_ID = "shared";

export function usePreference(key: string, defaultValue: string) {
  const [value, setValue] = useState(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await (supabase as any)
        .from("user_preferences")
        .select("preference_value")
        .eq("device_id", SHARED_DEVICE_ID)
        .eq("preference_key", key)
        .maybeSingle();

      if (data) setValue(data.preference_value);
      setLoading(false);
    };
    fetch();
  }, [key]);

  const update = useCallback(
    async (newValue: string) => {
      setValue(newValue);
      await (supabase as any)
        .from("user_preferences")
        .upsert(
          { device_id: SHARED_DEVICE_ID, preference_key: key, preference_value: newValue },
          { onConflict: "device_id,preference_key" }
        );
    },
    [key]
  );

  return { value, update, loading };
}
