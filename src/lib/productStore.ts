// Product store - DB-backed version
// Replaces localStorage-based product management with database queries.
// Maintains the same exported API for backward compatibility.
import { useState, useEffect, useMemo } from "react";
import {
  fetchProducts as fetchProductsDb,
  insertProduct as insertProductDb,
  updateProductDb,
  deleteProductDb as deleteProductRemote,
  toggleProductArchived,
  type DbProduct,
  type DbProductInsert,
} from "@/lib/db/productDbService";
import {
  useDbProducts,
  useDbCategories,
  useLiveMenuCategoriesDb,
  useAllCategoryNames as useAllCategoryNamesHook,
  useAllProductNames as useAllProductNamesHook,
} from "@/hooks/useMenuDbHooks";
import type { DbCategory } from "@/lib/db/menuService";

// ── Legacy interfaces (kept for backward compat) ────────────────────────
export interface CustomProduct {
  id: string;
  name: string;
  description: string;
  category: string; // category name (resolved from category_id)
  categoryId: string; // actual DB category UUID
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
  isCustom: true;
  createdAt: string;
  updatedAt: string;
  variants?: any[];
  archived?: boolean;
}

export interface UnifiedProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  categoryId: string;
  sku: string;
  variant: number;
  archived: boolean;
  isCustom: boolean;
  active?: boolean;
  description?: string;
  imageUrl?: string;
}

// Keep MenuItem/MenuCategory types for New Order screen compatibility
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  icon?: string;
  items: MenuItem[];
}

// ── DB→Legacy converters ────────────────────────────────────────────────
const dbToCustomProduct = (p: DbProduct, categoryName: string): CustomProduct => ({
  id: p.id,
  name: p.name,
  description: p.description,
  category: categoryName,
  categoryId: p.category_id,
  price: p.price,
  priceType: p.price_type,
  minPrice: p.min_price ?? undefined,
  maxPrice: p.max_price ?? undefined,
  sku: p.sku,
  imageUrl: p.image_url || undefined,
  active: p.active,
  dineIn: p.dine_in,
  takeaway: p.takeaway,
  delivery: p.delivery,
  addToMenu: true,
  inventoryTracking: p.inventory_tracking,
  negativeInventory: p.negative_inventory,
  outOfStock: p.out_of_stock,
  modifiers: [],
  addOns: [],
  taxes: [],
  discounts: [],
  isCustom: true,
  createdAt: p.created_at,
  updatedAt: p.updated_at,
  archived: p.archived,
});

const dbToUnified = (p: DbProduct, categoryName: string): UnifiedProduct => ({
  id: p.id,
  name: p.name,
  price: p.price,
  category: categoryName,
  categoryId: p.category_id,
  sku: p.sku || p.id.substring(0, 8).toUpperCase(),
  variant: 1,
  archived: p.archived,
  isCustom: true,
  active: p.active,
  description: p.description,
  imageUrl: p.image_url || undefined,
});

// ── Async CRUD ──────────────────────────────────────────────────────────
export const saveCustomProduct = async (product: CustomProduct): Promise<void> => {
  try {
    const dbProduct: DbProductInsert = {
      category_id: product.categoryId,
      name: product.name,
      description: product.description || "",
      price: product.price,
      price_type: product.priceType,
      min_price: product.minPrice ?? null,
      max_price: product.maxPrice ?? null,
      sku: product.sku || "",
      image_url: product.imageUrl || "",
      active: product.active,
      archived: product.archived || false,
      dine_in: product.dineIn,
      takeaway: product.takeaway,
      delivery: product.delivery,
      out_of_stock: product.outOfStock,
      inventory_tracking: product.inventoryTracking,
      negative_inventory: product.negativeInventory,
      popular: false,
      sort_order: 0,
    };

    // Check if exists
    const products = await fetchProductsDb();
    const existing = products.find((p) => p.id === product.id);
    if (existing) {
      await updateProductDb(product.id, dbProduct);
    } else {
      await insertProductDb(dbProduct);
    }
  } catch (err) {
    console.error("saveCustomProduct error:", err);
  }
};

export const deleteCustomProduct = async (id: string): Promise<void> => {
  try {
    await deleteProductRemote(id);
  } catch (err) {
    console.error("deleteCustomProduct error:", err);
  }
};

export const setArchivedId = async (id: string, archived: boolean): Promise<void> => {
  try {
    await toggleProductArchived(id, archived);
  } catch (err) {
    console.error("setArchivedId error:", err);
  }
};

// ── Sync getters (for non-hook contexts — these are now async) ──────────
export const getCustomProducts = async (): Promise<CustomProduct[]> => {
  try {
    const [products, cats] = await Promise.all([
      fetchProductsDb(),
      (await import("@/lib/db/menuService")).fetchCategories(),
    ]);
    const catMap = new Map(cats.map((c) => [c.id, c.name]));
    return products.map((p) => dbToCustomProduct(p, catMap.get(p.category_id) || "Uncategorized"));
  } catch {
    return [];
  }
};

export const getAllUnifiedProducts = async (): Promise<UnifiedProduct[]> => {
  try {
    const [products, cats] = await Promise.all([
      fetchProductsDb(),
      (await import("@/lib/db/menuService")).fetchCategories(),
    ]);
    const catMap = new Map(cats.map((c) => [c.id, c.name]));
    return products.map((p) => dbToUnified(p, catMap.get(p.category_id) || "Uncategorized"));
  } catch {
    return [];
  }
};

export const getAllCategories = async (): Promise<string[]> => {
  try {
    const cats = await (await import("@/lib/db/menuService")).fetchCategories();
    return cats.map((c) => c.name);
  } catch {
    return [];
  }
};

export const getAllProductNames = async (): Promise<string[]> => {
  try {
    const products = await fetchProductsDb();
    return [...new Set(products.filter((p) => !p.archived && p.active).map((p) => p.name))];
  } catch {
    return [];
  }
};

// ── React hooks ─────────────────────────────────────────────────────────
export const useAllUnifiedProducts = (): UnifiedProduct[] => {
  const { data: products } = useDbProducts();
  const { data: categories } = useDbCategories();

  return useMemo(() => {
    const catMap = new Map(categories.map((c: DbCategory) => [c.id, c.name]));
    return products.map((p) => dbToUnified(p, catMap.get(p.category_id) || "Uncategorized"));
  }, [products, categories]);
};

export const useCustomProducts = (): CustomProduct[] => {
  const { data: products } = useDbProducts();
  const { data: categories } = useDbCategories();

  return useMemo(() => {
    const catMap = new Map(categories.map((c: DbCategory) => [c.id, c.name]));
    return products.map((p) => dbToCustomProduct(p, catMap.get(p.category_id) || "Uncategorized"));
  }, [products, categories]);
};

export const useLiveMenuCategories = useLiveMenuCategoriesDb;
export { useAllCategoryNamesHook as useAllCategoryNames };
export { useAllProductNamesHook as useAllProductNames };
