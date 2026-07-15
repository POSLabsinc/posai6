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

export interface MenuCategoryMeta {
  id: string;
  name: string;
  sortOrder: number;
  productCount: number;
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
  const [categoryProductCounts, setCategoryProductCounts] = useState<Record<string, number>>({});
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

  const fetchCategoryProductCounts = async () => {
    const { data } = await (supabase as any)
      .from("products")
      .select("category_id")
      .eq("active", true)
      .eq("archived", false);

    if (!data) return;

    const counts: Record<string, number> = {};
    for (const product of data as Array<{ category_id: string | null }>) {
      if (!product.category_id) continue;
      counts[product.category_id] = (counts[product.category_id] || 0) + 1;
    }
    setCategoryProductCounts(counts);
  };

  useEffect(() => {
    Promise.all([fetchMenus(), fetchMenuCategories(), fetchCategoryProductCounts()]).then(() => setLoading(false));

    // Realtime: refresh when menus table changes
    const channel = supabase
      .channel("menus-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "menus" }, () => {
        fetchMenus();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_categories" }, () => {
        fetchMenuCategories();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        fetchCategoryProductCounts();
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

  const menuCategoryMeta = useMemo(() => {
    const map: Record<string, MenuCategoryMeta[]> = {};
    for (const menu of menus.filter((m) => m.enabled && !m.archived)) {
      map[menu.name] = menuCatRows
        .filter((row) => row.menu_id === menu.id && row.categories?.name)
        .map((row) => ({
          id: row.category_id,
          name: row.categories?.name ?? "",
          sortOrder: row.sort_order,
          productCount: categoryProductCounts[row.category_id] || 0,
        }))
        .filter((category) => category.name.length > 0);
    }
    return map;
  }, [menus, menuCatRows, categoryProductCounts]);

  return { menuList, menuCategories, menuCategoryMeta, loading };
}
