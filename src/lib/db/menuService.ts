// Database service for Menus and Categories
import { supabase } from "@/integrations/supabase/client";

// ── Types ────────────────────────────────────────────────────────────────
export interface DbMenu {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  archived: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbCategory {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbMenuCategory {
  id: string;
  menu_id: string;
  category_id: string;
  sort_order: number;
}

// ── Menu CRUD ────────────────────────────────────────────────────────────
export const fetchMenus = async (): Promise<DbMenu[]> => {
  const { data, error } = await supabase
    .from("menus")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DbMenu[];
};

export const insertMenu = async (
  menu: Omit<DbMenu, "id" | "created_at" | "updated_at">
): Promise<DbMenu> => {
  const { data, error } = await supabase
    .from("menus")
    .insert(menu)
    .select()
    .single();
  if (error) throw error;
  return data as DbMenu;
};

export const updateMenu = async (
  id: string,
  updates: Partial<Omit<DbMenu, "id" | "created_at" | "updated_at">>
): Promise<DbMenu> => {
  const { data, error } = await supabase
    .from("menus")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as DbMenu;
};

export const deleteMenuDb = async (id: string): Promise<void> => {
  const { error } = await supabase.from("menus").delete().eq("id", id);
  if (error) throw error;
};

export const toggleMenuEnabledDb = async (id: string, currentEnabled: boolean): Promise<void> => {
  const { error } = await supabase
    .from("menus")
    .update({ enabled: !currentEnabled })
    .eq("id", id);
  if (error) throw error;
};

export const archiveMenuDb = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("menus")
    .update({ archived: true, enabled: false })
    .eq("id", id);
  if (error) throw error;
};

export const unarchiveMenuDb = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("menus")
    .update({ archived: false })
    .eq("id", id);
  if (error) throw error;
};

// ── Category CRUD ────────────────────────────────────────────────────────
export const fetchCategories = async (): Promise<DbCategory[]> => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DbCategory[];
};

export const insertCategory = async (
  category: Omit<DbCategory, "id" | "created_at" | "updated_at">
): Promise<DbCategory> => {
  const { data, error } = await supabase
    .from("categories")
    .insert(category)
    .select()
    .single();
  if (error) throw error;
  return data as DbCategory;
};

export const updateCategory = async (
  id: string,
  updates: Partial<Omit<DbCategory, "id" | "created_at" | "updated_at">>
): Promise<DbCategory> => {
  const { data, error } = await supabase
    .from("categories")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as DbCategory;
};

export const deleteCategoryDb = async (id: string): Promise<void> => {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
};

// ── Menu ↔ Category junction ─────────────────────────────────────────────
export const fetchMenuCategories = async (): Promise<DbMenuCategory[]> => {
  const { data, error } = await supabase
    .from("menu_categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DbMenuCategory[];
};

export const setMenuCategories = async (
  menuId: string,
  categoryIds: string[]
): Promise<void> => {
  // Delete existing
  const { error: delErr } = await supabase
    .from("menu_categories")
    .delete()
    .eq("menu_id", menuId);
  if (delErr) throw delErr;

  if (categoryIds.length === 0) return;

  // Insert new
  const rows = categoryIds.map((cid, i) => ({
    menu_id: menuId,
    category_id: cid,
    sort_order: i,
  }));
  const { error: insErr } = await supabase.from("menu_categories").insert(rows);
  if (insErr) throw insErr;
};
