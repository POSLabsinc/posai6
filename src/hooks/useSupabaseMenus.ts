import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MenuRow {
  id: string;
  name: string;
  enabled: boolean;
  archived: boolean;
  sort_order: number;
}

interface MenuCategoryRow {
  menu_id: string;
  category_id: string;
  sort_order: number;
  categories: { name: string } | null;
}

/**
 * Fetches enabled, non-archived menus from the database along with their
 * linked category names. Returns the same shape as the old hardcoded data:
 *   menuList: string[]
 *   menuCategories: Record<string, string[]>
 *
 * Subscribes to realtime changes on the `menus` table so toggling
 * enabled/disabled in Settings is reflected instantly on the Orders screen.
 */
export function useSupabaseMenus() {
  const [menus, setMenus] = useState<MenuRow[]>([]);
  const [menuCatRows, setMenuCatRows] = useState<MenuCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMenus = async () => {
    const { data } = await supabase
      .from("menus")
      .select("id, name, enabled, archived, sort_order")
      .order("sort_order");
    if (data) setMenus(data);
  };

  const fetchMenuCategories = async () => {
    const { data } = await supabase
      .from("menu_categories")
      .select("menu_id, category_id, sort_order, categories(name)")
      .order("sort_order");
    if (data) setMenuCatRows(data as unknown as MenuCategoryRow[]);
  };

  useEffect(() => {
    Promise.all([fetchMenus(), fetchMenuCategories()]).then(() => setLoading(false));

    // Realtime: refresh when menus table changes
    const channel = supabase
      .channel("menus-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "menus" }, () => {
        fetchMenus();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_categories" }, () => {
        fetchMenuCategories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const menuList = useMemo(
    () =>
      menus
        .filter((m) => m.enabled && !m.archived)
        .map((m) => m.name),
    [menus]
  );

  const menuCategories = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const m of menus.filter((m) => m.enabled && !m.archived)) {
      map[m.name] = menuCatRows
        .filter((mc) => mc.menu_id === m.id)
        .map((mc) => mc.categories?.name ?? "")
        .filter(Boolean);
    }
    return map;
  }, [menus, menuCatRows]);

  return { menuList, menuCategories, loading };
}
