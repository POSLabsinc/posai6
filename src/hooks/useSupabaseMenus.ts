import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DbMenu {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  archived: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  categories: string[]; // derived from menu_categories join
}

/**
 * Fetches menus + their linked category names from Supabase.
 * Subscribes to realtime changes on menus & menu_categories tables.
 */
export function useSupabaseMenus() {
  const [menus, setMenus] = useState<DbMenu[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMenus = useCallback(async () => {
    const { data: menusData, error: menusErr } = await supabase
      .from("menus")
      .select("*")
      .order("sort_order");

    if (menusErr || !menusData) {
      console.error("Error fetching menus:", menusErr);
      setMenus([]);
      setLoading(false);
      return;
    }

    const { data: mcData, error: mcErr } = await supabase
      .from("menu_categories")
      .select("menu_id, categories(name)")
      .order("sort_order");

    if (mcErr) {
      console.error("Error fetching menu_categories:", mcErr);
    }

    // Build category map: menu_id -> category names[]
    const catMap: Record<string, string[]> = {};
    if (mcData) {
      for (const row of mcData as any[]) {
        const menuId = row.menu_id;
        const catName = row.categories?.name;
        if (!catName) continue;
        if (!catMap[menuId]) catMap[menuId] = [];
        catMap[menuId].push(catName);
      }
    }

    const result: DbMenu[] = menusData.map((m: any) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      enabled: m.enabled,
      archived: m.archived,
      sort_order: m.sort_order,
      created_at: m.created_at,
      updated_at: m.updated_at,
      categories: catMap[m.id] || [],
    }));

    setMenus(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMenus();

    const channel = supabase
      .channel("menus-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "menus" }, () => fetchMenus())
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_categories" }, () => fetchMenus())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMenus]);

  return { menus, loading, refetch: fetchMenus };
}

/**
 * Toggle enabled status of a menu in the database.
 */
export async function toggleMenuEnabledDb(id: string, currentEnabled: boolean) {
  const { error } = await supabase
    .from("menus")
    .update({ enabled: !currentEnabled })
    .eq("id", id);
  if (error) console.error("Error toggling menu:", error);
}

/**
 * Archive a menu in the database.
 */
export async function archiveMenuDb(id: string) {
  const { error } = await supabase
    .from("menus")
    .update({ archived: true, enabled: false })
    .eq("id", id);
  if (error) console.error("Error archiving menu:", error);
}

/**
 * Unarchive a menu in the database.
 */
export async function unarchiveMenuDb(id: string) {
  const { error } = await supabase
    .from("menus")
    .update({ archived: false })
    .eq("id", id);
  if (error) console.error("Error unarchiving menu:", error);
}

/**
 * Delete a menu from the database.
 */
export async function deleteMenuDb(id: string) {
  // Delete junction rows first
  await supabase.from("menu_categories").delete().eq("menu_id", id);
  const { error } = await supabase.from("menus").delete().eq("id", id);
  if (error) console.error("Error deleting menu:", error);
}

/**
 * Derived data for New Order screen: only enabled, non-archived menus.
 */
export function useActiveMenuData() {
  const { menus, loading } = useSupabaseMenus();

  const menuList = useMemo(
    () => menus.filter((m) => m.enabled && !m.archived).map((m) => m.name),
    [menus]
  );

  const menuCategories = useMemo(
    () =>
      Object.fromEntries(
        menus.filter((m) => m.enabled && !m.archived).map((m) => [m.name, m.categories])
      ) as Record<string, string[]>,
    [menus]
  );

  return { menuList, menuCategories, loading };
}
