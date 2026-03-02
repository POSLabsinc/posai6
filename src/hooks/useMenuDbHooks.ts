// React hooks with Supabase Realtime for all menu entities
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchMenus, fetchCategories, fetchMenuCategories,
  type DbMenu, type DbCategory, type DbMenuCategory,
} from "@/lib/db/menuService";
import {
  fetchProducts, type DbProduct,
} from "@/lib/db/productDbService";
import {
  fetchModifierGroups, fetchModifiers, fetchAddOns,
  fetchProductModifierGroups, fetchProductAddOns,
  type DbModifierGroup, type DbModifier, type DbAddOn,
  type DbProductModifierGroup, type DbProductAddOn,
} from "@/lib/db/modifierService";

// ── Generic realtime subscription helper ─────────────────────────────────
function useRealtimeTable<T>(
  tableName: string,
  fetcher: () => Promise<T[]>,
  deps: any[] = []
): { data: T[]; loading: boolean; refetch: () => void } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    try {
      const result = await fetcher();
      if (mountedRef.current) {
        setData(result);
        setLoading(false);
      }
    } catch (err) {
      console.error(`Failed to fetch ${tableName}:`, err);
      if (mountedRef.current) setLoading(false);
    }
  }, [tableName, ...deps]);

  useEffect(() => {
    mountedRef.current = true;
    load();

    const channel = supabase
      .channel(`realtime-${tableName}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: tableName },
        () => { load(); }
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [load]);

  return { data, loading, refetch: load };
}

// ── Menus ────────────────────────────────────────────────────────────────
export function useDbMenus() {
  return useRealtimeTable<DbMenu>("menus", fetchMenus);
}

// ── Categories ───────────────────────────────────────────────────────────
export function useDbCategories() {
  return useRealtimeTable<DbCategory>("categories", fetchCategories);
}

// ── Menu ↔ Category junction ─────────────────────────────────────────────
export function useDbMenuCategories() {
  return useRealtimeTable<DbMenuCategory>("menu_categories", fetchMenuCategories);
}

// ── Products ─────────────────────────────────────────────────────────────
export function useDbProducts() {
  return useRealtimeTable<DbProduct>("products", fetchProducts);
}

// ── Modifier Groups ──────────────────────────────────────────────────────
export function useDbModifierGroups() {
  return useRealtimeTable<DbModifierGroup>("modifier_groups", fetchModifierGroups);
}

// ── Modifiers ────────────────────────────────────────────────────────────
export function useDbModifiers() {
  return useRealtimeTable<DbModifier>("modifiers", fetchModifiers);
}

// ── Add-Ons ──────────────────────────────────────────────────────────────
export function useDbAddOns() {
  return useRealtimeTable<DbAddOn>("add_ons", fetchAddOns);
}

// ── Product ↔ Modifier Group junction ────────────────────────────────────
export function useDbProductModifierGroups() {
  return useRealtimeTable<DbProductModifierGroup>("product_modifier_groups", fetchProductModifierGroups);
}

// ── Product ↔ Add-On junction ────────────────────────────────────────────
export function useDbProductAddOns() {
  return useRealtimeTable<DbProductAddOn>("product_add_ons", fetchProductAddOns);
}

// ── Active Menu ID (stored in localStorage for per-device selection) ─────
const ACTIVE_MENU_KEY = "pos-active-menu-id";

export function useActiveMenuId(): [string | null, (id: string | null) => void] {
  const [activeId, setActiveId] = useState<string | null>(
    () => localStorage.getItem(ACTIVE_MENU_KEY)
  );

  const setId = useCallback((id: string | null) => {
    if (id === null) {
      localStorage.removeItem(ACTIVE_MENU_KEY);
    } else {
      localStorage.setItem(ACTIVE_MENU_KEY, id);
    }
    setActiveId(id);
    window.dispatchEvent(new CustomEvent("menus-updated"));
  }, []);

  useEffect(() => {
    const refresh = () => setActiveId(localStorage.getItem(ACTIVE_MENU_KEY));
    window.addEventListener("menus-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("menus-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return [activeId, setId];
}

// ── Derived: menuList + menuCategories (same shape as old useMenuData) ────
export function useMenuData() {
  const { data: menus } = useDbMenus();
  const { data: menuCats } = useDbMenuCategories();
  const { data: categories } = useDbCategories();

  const menuList = useMemo(
    () => menus.filter((m) => m.enabled && !m.archived).map((m) => m.name),
    [menus]
  );

  const menuCategories = useMemo(() => {
    const catMap = new Map(categories.map((c) => [c.id, c.name]));
    return Object.fromEntries(
      menus
        .filter((m) => m.enabled && !m.archived)
        .map((m) => {
          const catIds = menuCats
            .filter((mc) => mc.menu_id === m.id)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((mc) => catMap.get(mc.category_id))
            .filter(Boolean) as string[];
          return [m.name, catIds];
        })
    ) as Record<string, string[]>;
  }, [menus, menuCats, categories]);

  return { menuList, menuCategories, menus };
}

// ── Derived: live menu categories for New Order screen ───────────────────
export function useLiveMenuCategoriesDb(sortPreference?: string) {
  const { data: products, loading: productsLoading } = useDbProducts();
  const { data: categories, loading: categoriesLoading } = useDbCategories();
  const { data: menuCats } = useDbMenuCategories();
  const [activeMenuId] = useActiveMenuId();
  const { data: menus } = useDbMenus();

  return useMemo(() => {
    if (productsLoading || categoriesLoading) return [];

    // Build categories with their products
    let result = categories
      .filter((cat) => cat.active)
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon || undefined,
        items: products
          .filter((p) => p.category_id === cat.id && p.active && !p.archived && !p.out_of_stock)
          .map((p) => ({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            image: p.image_url || "",
            description: p.description || "",
          })),
      }))
      .filter((cat) => cat.items.length > 0);

    // Filter by active menu
    if (activeMenuId) {
      const activeMenu = menus.find((m) => m.id === activeMenuId && m.enabled && !m.archived);
      if (activeMenu) {
        const allowedCatIds = new Set(
          menuCats.filter((mc) => mc.menu_id === activeMenu.id).map((mc) => mc.category_id)
        );
        if (allowedCatIds.size > 0) {
          result = result.filter((cat) => allowedCatIds.has(cat.id));
        }
      }
    }

    // Sort
    if (sortPreference === "Alphabetical") {
      result.sort((a, b) => a.name.localeCompare(b.name));
      result.forEach((cat) => cat.items.sort((a, b) => a.name.localeCompare(b.name)));
    } else if (sortPreference === "Popular") {
      result.forEach((cat) => cat.items.sort((a, b) => b.price - a.price));
    }

    return result;
  }, [products, categories, menuCats, activeMenuId, menus, sortPreference, productsLoading, categoriesLoading]);
}

// ── Derived: all category names ──────────────────────────────────────────
export function useAllCategoryNames(): string[] {
  const { data: categories } = useDbCategories();
  return useMemo(() => categories.map((c) => c.name), [categories]);
}

// ── Derived: all product names ───────────────────────────────────────────
export function useAllProductNames(): string[] {
  const { data: products } = useDbProducts();
  return useMemo(
    () => [...new Set(products.filter((p) => !p.archived && p.active).map((p) => p.name))],
    [products]
  );
}
