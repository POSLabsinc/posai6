import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;
const DEVICE_ID_KEY = "pos_device_id";

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function usePreference(key: string, defaultValue: string) {
  const [value, setValue] = useState(defaultValue);
  const [loading, setLoading] = useState(true);
  const deviceId = getDeviceId();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await db
        .from("user_preferences")
        .select("preference_value")
        .eq("device_id", deviceId)
        .eq("preference_key", key)
        .maybeSingle();

      if (data) setValue(data.preference_value);
      setLoading(false);
    };
    fetch();
  }, [deviceId, key]);

  const update = useCallback(
    async (newValue: string) => {
      setValue(newValue);
      await db
        .from("user_preferences")
        .upsert(
          { device_id: deviceId, preference_key: key, preference_value: newValue },
          { onConflict: "device_id,preference_key" }
        );
    },
    [deviceId, key]
  );

  return { value, update, loading };
}
