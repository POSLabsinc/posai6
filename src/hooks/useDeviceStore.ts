import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const DEVICE_ID_KEY = "pos_device_id";

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export interface Store {
  id: string;
  name: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  active: boolean;
}

export function useDeviceStore() {
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const deviceId = getDeviceId();

  const fetchCurrentStore = useCallback(async () => {
    setLoading(true);
    try {
      // Get device-store binding
      const { data: binding } = await (supabase as any)
        .from("device_stores")
        .select("store_id")
        .eq("device_id", deviceId)
        .maybeSingle();

      if (binding?.store_id) {
        const { data: store } = await (supabase as any)
          .from("stores")
          .select("*")
          .eq("id", binding.store_id)
          .maybeSingle();

        if (store) {
          setCurrentStore(store);
        }
      } else {
        // Auto-bind to first store if none set
        const { data: stores } = await (supabase as any)
          .from("stores")
          .select("*")
          .eq("active", true)
          .order("created_at", { ascending: true })
          .limit(1);

        if (stores && stores.length > 0) {
          await (supabase as any)
            .from("device_stores")
            .upsert(
              { device_id: deviceId, store_id: stores[0].id },
              { onConflict: "device_id" }
            );
          setCurrentStore(stores[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching device store:", err);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  const fetchAllStores = useCallback(async () => {
    const { data } = await (supabase as any)
      .from("stores")
      .select("*")
      .eq("active", true)
      .order("name", { ascending: true });
    if (data) setAllStores(data);
  }, []);

  useEffect(() => {
    fetchCurrentStore();
    fetchAllStores();
  }, [fetchCurrentStore, fetchAllStores]);

  const switchStore = useCallback(async (newStoreId: string) => {
    // Update device-store binding
    await (supabase as any)
      .from("device_stores")
      .upsert(
        { device_id: deviceId, store_id: newStoreId },
        { onConflict: "device_id" }
      );

    // Clear all store-dependent local storage
    const keysToPreserve = [DEVICE_ID_KEY];
    const allKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) allKeys.push(key);
    }
    allKeys.forEach((key) => {
      if (!keysToPreserve.includes(key)) {
        localStorage.removeItem(key);
      }
    });

    // Clear all device preferences for old store
    await (supabase as any)
      .from("user_preferences")
      .delete()
      .eq("device_id", deviceId);

    // Force reload to re-sync with new store
    window.location.href = "/";
  }, [deviceId]);

  return { currentStore, allStores, loading, switchStore, fetchAllStores };
}
