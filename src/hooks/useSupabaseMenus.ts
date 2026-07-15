import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { menuItemsData } from "@/data/orderMenuData";

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
 * Builds a menu/category map from the bundled static menu data. Used as a
 * fallback so the Orders screen always renders even when the backend is
 * unreachable, empty, or the user is not authenticated.
 */
function buildLocalMenuData() {
  const localMenuList = Object.keys(menuItemsData);
  const localMenuCategories: Record<string, string[]> = {};
  const localMenuCategoryMeta: Record<string, MenuCategoryMeta[]> = {};

  localMenuList.forEach((menuName, menuIndex) => {
    const categories = Object.keys(menuItemsData[menuName] || {});
    localMenuCategories[menuName] = categories;
    localMenuCategoryMeta[menuName] = categories.map((catName, idx) => {
      const subcats = menuItemsData[menuName]?.[catName] || {};
      const productCount = Object.values(subcats).reduce(
        (sum, items) => sum + (Array.isArray(items) ? items.length : 0),
        0
      );
      return {
        id: `local-${menuIndex}-${idx}-${catName}`,
        name: catName,
        sortOrder: idx,
        productCount,
      };
    });
  });

  return { localMenuList, localMenuCategories, localMenuCategoryMeta };
}

/**
 * Fetches enabled, non-archived menus from the database along with their
 * linked category names. Falls back to the bundled static menu data whenever
 * the backend returns nothing so the Orders screen is always populated.
 */
export function useSupabaseMenus() {
  const [menus, setMenus] = useState<MenuRow[]>([]);
  const [menuCatRows, setMenuCatRows] = useState<MenuCategoryRow[]>([]);
  const [categoryProductCounts, setCategoryProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchMenus = async () => {
    try {
      const { data } = await supabase
        .from("menus")
        .select("id, name, enabled, archived, sort_order")
        .order("sort_order");
      if (data) setMenus(data);
    } catch {
      // ignore, fallback handles it
    }
  };

  const fetchMenuCategories = async () => {
    try {
      const { data } = await supabase
        .from("menu_categories")
        .select("menu_id, category_id, sort_order, categories(name)")
        .order("sort_order");
      if (data) setMenuCatRows(data as unknown as MenuCategoryRow[]);
    } catch {
      // ignore
    }
  };

  const fetchCategoryProductCounts = async () => {
    try {
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
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    Promise.all([fetchMenus(), fetchMenuCategories(), fetchCategoryProductCounts()]).then(() =>
      setLoading(false)
    );

    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
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
    } catch {
      // realtime not available; static fallback still works
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const localData = useMemo(() => buildLocalMenuData(), []);

  const backendMenuList = useMemo(
    () => menus.filter((m) => m.enabled && !m.archived).map((m) => m.name),
    [menus]
  );

  const menuList = useMemo(
    () => (backendMenuList.length > 0 ? backendMenuList : localData.localMenuList),
    [backendMenuList, localData.localMenuList]
  );

  const menuCategories = useMemo(() => {
    if (backendMenuList.length === 0) return localData.localMenuCategories;
    const map: Record<string, string[]> = {};
    for (const m of menus.filter((m) => m.enabled && !m.archived)) {
      const backendCats = menuCatRows
        .filter((mc) => mc.menu_id === m.id)
        .map((mc) => mc.categories?.name ?? "")
        .filter(Boolean);
      map[m.name] =
        backendCats.length > 0
          ? backendCats
          : localData.localMenuCategories[m.name] ?? [];
    }
    return map;
  }, [menus, menuCatRows, backendMenuList, localData]);

  const menuCategoryMeta = useMemo(() => {
    if (backendMenuList.length === 0) return localData.localMenuCategoryMeta;
    const map: Record<string, MenuCategoryMeta[]> = {};
    for (const menu of menus.filter((m) => m.enabled && !m.archived)) {
      const backendMeta = menuCatRows
        .filter((row) => row.menu_id === menu.id && row.categories?.name)
        .map((row) => ({
          id: row.category_id,
          name: row.categories?.name ?? "",
          sortOrder: row.sort_order,
          productCount: categoryProductCounts[row.category_id] || 0,
        }))
        .filter((category) => category.name.length > 0);
      map[menu.name] =
        backendMeta.length > 0
          ? backendMeta
          : localData.localMenuCategoryMeta[menu.name] ?? [];
    }
    return map;
  }, [menus, menuCatRows, categoryProductCounts, backendMenuList, localData]);

  return { menuList, menuCategories, menuCategoryMeta, loading };
}
