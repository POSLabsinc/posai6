// Product store - single source of truth for all products (menu data + user-created)
import { useState, useEffect } from "react";
import { menuCategories, MenuItem, MenuCategory } from "@/data/menuData";
import { getMenus, getActiveMenuId } from "@/lib/menuStore";
import { calculateEffectivePrice, type ProductVariant } from "@/services/productService";

export interface CustomProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  priceType: "fixed" | "open";
  minPrice?: number;
  maxPrice?: number;
  sku: string;
  imageUrl?: string;
  active: boolean;
  dineIn: boolean;
  takeaway: boolean;
  delivery: boolean;
  addToMenu: boolean;
  inventoryTracking: boolean;
  negativeInventory: boolean;
  outOfStock: boolean;
  modifiers: string[];
  addOns: string[];
  taxes: string[];
  discounts: string[];
  isCustom: true; // flag to distinguish from menu items
  createdAt: string;
  updatedAt: string;
  variants?: ProductVariant[]; // DB variants for timed pricing
  archived?: boolean;
}

const CUSTOM_PRODUCTS_KEY = "custom-products";
const ARCHIVE_KEY = "products-archived-ids";

// ── Custom products CRUD ────────────────────────────────────────────────
export const getCustomProducts = (): CustomProduct[] => {
  try {
    const stored = localStorage.getItem(CUSTOM_PRODUCTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveCustomProduct = (product: CustomProduct): void => {
  const products = getCustomProducts();
  const idx = products.findIndex((p) => p.id === product.id);
  if (idx >= 0) {
    products[idx] = product;
  } else {
    products.push(product);
  }
  localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(products));
  // Notify listeners
  window.dispatchEvent(new CustomEvent("products-updated"));
};

export const deleteCustomProduct = (id: string): void => {
  const products = getCustomProducts().filter((p) => p.id !== id);
  localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(products));
  window.dispatchEvent(new CustomEvent("products-updated"));
};

// ── Unified product list (menu items + custom products) ─────────────────
export interface UnifiedProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  sku: string;
  variant: number;
  archived: boolean;
  isCustom: boolean;
  active?: boolean;
  description?: string;
  imageUrl?: string;
}

const getArchivedIds = (): Set<string> => {
  try {
    const stored = localStorage.getItem(ARCHIVE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

export const setArchivedId = (id: string, archived: boolean): void => {
  const ids = getArchivedIds();
  if (archived) ids.add(id);
  else ids.delete(id);
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify([...ids]));
  window.dispatchEvent(new CustomEvent("products-updated"));
};

export const getAllUnifiedProducts = (): UnifiedProduct[] => {
  const archivedIds = getArchivedIds();
  const seen = new Set<string>();
  const products: UnifiedProduct[] = [];

  // From menu data (the ordering screen source)
  menuCategories.forEach((category) => {
    category.items.forEach((item) => {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        products.push({
          id: item.id,
          name: item.name,
          price: item.price,
          category: category.name,
          sku: item.id.toUpperCase(),
          variant: 1,
          archived: archivedIds.has(item.id),
          isCustom: false,
          description: item.description,
          imageUrl: item.image,
        });
      }
    });
  });

  // From custom products
  getCustomProducts().forEach((cp) => {
    if (!seen.has(cp.id)) {
      seen.add(cp.id);
      products.push({
        id: cp.id,
        name: cp.name,
        price: cp.price,
        category: cp.category,
        sku: cp.sku || cp.id.toUpperCase(),
        variant: 1,
        archived: archivedIds.has(cp.id),
        isCustom: true,
        active: cp.active,
        description: cp.description,
        imageUrl: cp.imageUrl,
      });
    }
  });

  return products;
};

// ── Category list (menu categories + custom product categories) ──────────
export const getAllCategories = (): string[] => {
  const cats = new Set<string>(menuCategories.map((c) => c.name));
  getCustomProducts().forEach((p) => {
    if (p.category) cats.add(p.category);
  });
  return [...cats];
};

// ── Parent categories only (from categories-settings localStorage) ──────
export const getParentCategories = (): string[] => {
  try {
    const stored = localStorage.getItem("categories-settings");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((c: any) => !c.archived && (c.parent === "Parent Category" || c.parent === "-"))
          .map((c: any) => c.name);
      }
    }
  } catch (e) {
    console.error("Failed to parse categories from localStorage", e);
  }
  return [];
};

// ── Dynamic category hierarchy from categories-settings localStorage ────

interface CategorySetting {
  id: string;
  name: string;
  parent: string;
  products?: string[];
  archived?: boolean;
}

const getCategorySettings = (): CategorySetting[] => {
  try {
    const stored = localStorage.getItem("categories-settings");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed.filter((c: any) => !c.archived);
    }
  } catch (e) {
    console.error("Failed to parse categories from localStorage", e);
  }
  return [];
};

/**
 * Returns a mapping of parent category name → child category names[].
 * Built dynamically from categories-settings localStorage.
 */
export const getDynamicCategorySubcategories = (): Record<string, string[]> => {
  const cats = getCategorySettings();
  const result: Record<string, string[]> = {};
  // Find all parent categories
  const parents = cats.filter(c => c.parent === "Parent Category" || c.parent === "-");
  for (const parent of parents) {
    // Find children whose parent matches this category's name
    const children = cats
      .filter(c => c.parent === parent.name)
      .map(c => c.name);
    result[parent.name] = children;
  }
  return result;
};

/**
 * Returns products assigned to a specific category (by name).
 */
export const getCategoryProducts = (categoryName: string): string[] => {
  const cats = getCategorySettings();
  const cat = cats.find(c => c.name === categoryName);
  return cat?.products || [];
};

// ── Product names list for tax/discount applicable-products selectors ────
export const getAllProductNames = (): string[] => {
  const products = getAllUnifiedProducts().filter((p) => !p.archived);
  const names = [...new Set(products.map((p) => p.name))];
  return names;
};

// ── Live menu categories: static menu + active custom products merged ────
// All active, non-archived custom products appear on the New Order screen.
// Optionally filtered by the active menu's category list.
// Optionally sorted by the menu sort preference.
export const getLiveMenuCategories = (activeMenuId?: string | null, sortPreference?: string): MenuCategory[] => {
  const archivedIds = getArchivedIds();
  const customProducts = getCustomProducts().filter(
    (cp) => cp.active !== false && !archivedIds.has(cp.id)
  );

  // Deep-clone static categories so we never mutate the original
  let merged: MenuCategory[] = menuCategories.map((cat) => ({
    ...cat,
    items: [...cat.items],
  }));

  // Group custom products by category
  customProducts.forEach((cp) => {
    // Calculate effective price using timed pricing logic
    const basePrice = cp.priceType === "open" ? (cp.minPrice ?? 0) : cp.price;
    const effectivePrice = cp.variants && cp.variants.length > 0
      ? calculateEffectivePrice(basePrice, cp.variants)
      : basePrice;

    const menuItem: MenuItem = {
      id: cp.id,
      name: cp.name,
      price: effectivePrice,
      image: cp.imageUrl ?? "",
      description: cp.description,
    };

    const existing = merged.find(
      (cat) => cat.name.toLowerCase() === cp.category.toLowerCase()
    );
    if (existing) {
      if (!existing.items.find((i) => i.id === cp.id)) {
        existing.items.push(menuItem);
      }
    } else {
      merged.push({
        id: `custom-cat-${cp.category.toLowerCase().replace(/\s+/g, "-")}`,
        name: cp.category,
        items: [menuItem],
      });
    }
  });

  // ── Filter by active menu ──────────────────────────────────────────────
  const resolvedActiveId = activeMenuId !== undefined ? activeMenuId : getActiveMenuId();
  if (resolvedActiveId) {
    const menus = getMenus();
    const activeMenu = menus.find((m) => m.id === resolvedActiveId && m.enabled && !m.archived);
    if (activeMenu && activeMenu.categories.length > 0) {
      const allowedSet = new Set(activeMenu.categories.map((c) => c.toLowerCase()));
      merged = merged.filter((cat) => allowedSet.has(cat.name.toLowerCase()));
    }
  }

  // ── Apply sort preference ──────────────────────────────────────────────
  if (sortPreference === "Alphabetical") {
    // Sort categories alphabetically
    merged.sort((a, b) => a.name.localeCompare(b.name));
    // Sort items within each category alphabetically
    merged.forEach((cat) => {
      cat.items.sort((a, b) => a.name.localeCompare(b.name));
    });
  } else if (sortPreference === "Popular") {
    // Sort items by price descending as a proxy for popularity
    // (in a real system this would use order count data)
    merged.forEach((cat) => {
      cat.items.sort((a, b) => b.price - a.price);
    });
  }
  // "Default" and "Drag & Drop" keep original order

  return merged;
};

// ── React hook: subscribes to products-updated + menus-updated and returns live categories ──
export const useLiveMenuCategories = (sortPreference?: string): MenuCategory[] => {
  const [categories, setCategories] = useState<MenuCategory[]>(() =>
    getLiveMenuCategories(undefined, sortPreference)
  );

  useEffect(() => {
    // Re-read active menu id fresh on every event so filtering is always current
    const refresh = () => setCategories(getLiveMenuCategories(getActiveMenuId(), sortPreference));
    window.addEventListener("products-updated", refresh);
    window.addEventListener("menus-updated", refresh);
    window.addEventListener("storage", refresh);
    // Also refresh when called with new sortPreference
    refresh();
    return () => {
      window.removeEventListener("products-updated", refresh);
      window.removeEventListener("menus-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [sortPreference]);

  return categories;
};

