// Database service for Products
import { supabase } from "@/integrations/supabase/client";

// ── Types ────────────────────────────────────────────────────────────────
export interface DbProduct {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  price_type: "fixed" | "open";
  min_price: number | null;
  max_price: number | null;
  sku: string;
  image_url: string;
  active: boolean;
  archived: boolean;
  dine_in: boolean;
  takeaway: boolean;
  delivery: boolean;
  out_of_stock: boolean;
  inventory_tracking: boolean;
  negative_inventory: boolean;
  popular: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type DbProductInsert = Omit<DbProduct, "id" | "created_at" | "updated_at">;
export type DbProductUpdate = Partial<DbProductInsert>;

// ── CRUD ─────────────────────────────────────────────────────────────────
export const fetchProducts = async (): Promise<DbProduct[]> => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(normalizeProduct);
};

export const fetchProductsByCategory = async (categoryId: string): Promise<DbProduct[]> => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(normalizeProduct);
};

export const insertProduct = async (product: DbProductInsert): Promise<DbProduct> => {
  const { data, error } = await supabase
    .from("products")
    .insert(product)
    .select()
    .single();
  if (error) throw error;
  return normalizeProduct(data);
};

export const updateProductDb = async (id: string, updates: DbProductUpdate): Promise<DbProduct> => {
  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return normalizeProduct(data);
};

export const deleteProductDb = async (id: string): Promise<void> => {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
};

export const toggleProductArchived = async (id: string, archived: boolean): Promise<void> => {
  const { error } = await supabase
    .from("products")
    .update({ archived })
    .eq("id", id);
  if (error) throw error;
};

// ── Helpers ──────────────────────────────────────────────────────────────
const normalizeProduct = (row: any): DbProduct => ({
  id: row.id,
  category_id: row.category_id,
  name: row.name,
  description: row.description ?? "",
  price: Number(row.price),
  price_type: row.price_type as "fixed" | "open",
  min_price: row.min_price ? Number(row.min_price) : null,
  max_price: row.max_price ? Number(row.max_price) : null,
  sku: row.sku ?? "",
  image_url: row.image_url ?? "",
  active: row.active ?? true,
  archived: row.archived ?? false,
  dine_in: row.dine_in ?? true,
  takeaway: row.takeaway ?? true,
  delivery: row.delivery ?? true,
  out_of_stock: row.out_of_stock ?? false,
  inventory_tracking: row.inventory_tracking ?? false,
  negative_inventory: row.negative_inventory ?? false,
  popular: row.popular ?? false,
  sort_order: row.sort_order ?? 0,
  created_at: row.created_at,
  updated_at: row.updated_at,
});
