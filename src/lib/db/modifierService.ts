// Database service for Modifier Groups, Modifiers, Add-Ons, and junctions
import { supabase } from "@/integrations/supabase/client";

// ── Types ────────────────────────────────────────────────────────────────
export interface DbModifierGroup {
  id: string;
  name: string;
  required: boolean;
  multi_select: boolean;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbModifier {
  id: string;
  modifier_group_id: string;
  name: string;
  price: number;
  is_default: boolean;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbAddOn {
  id: string;
  name: string;
  price: number;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbProductModifierGroup {
  id: string;
  product_id: string;
  modifier_group_id: string;
  sort_order: number;
}

export interface DbProductAddOn {
  id: string;
  product_id: string;
  add_on_id: string;
}

// ── Modifier Group CRUD ─────────────────────────────────────────────────
export const fetchModifierGroups = async (): Promise<DbModifierGroup[]> => {
  const { data, error } = await supabase
    .from("modifier_groups")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DbModifierGroup[];
};

export const insertModifierGroup = async (
  group: Omit<DbModifierGroup, "id" | "created_at" | "updated_at">
): Promise<DbModifierGroup> => {
  const { data, error } = await supabase
    .from("modifier_groups")
    .insert(group)
    .select()
    .single();
  if (error) throw error;
  return data as DbModifierGroup;
};

export const updateModifierGroup = async (
  id: string,
  updates: Partial<Omit<DbModifierGroup, "id" | "created_at" | "updated_at">>
): Promise<DbModifierGroup> => {
  const { data, error } = await supabase
    .from("modifier_groups")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as DbModifierGroup;
};

export const deleteModifierGroupDb = async (id: string): Promise<void> => {
  const { error } = await supabase.from("modifier_groups").delete().eq("id", id);
  if (error) throw error;
};

// ── Modifier CRUD ────────────────────────────────────────────────────────
export const fetchModifiers = async (): Promise<DbModifier[]> => {
  const { data, error } = await supabase
    .from("modifiers")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((m: any) => ({ ...m, price: Number(m.price) })) as DbModifier[];
};

export const fetchModifiersByGroup = async (groupId: string): Promise<DbModifier[]> => {
  const { data, error } = await supabase
    .from("modifiers")
    .select("*")
    .eq("modifier_group_id", groupId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((m: any) => ({ ...m, price: Number(m.price) })) as DbModifier[];
};

export const insertModifier = async (
  modifier: Omit<DbModifier, "id" | "created_at" | "updated_at">
): Promise<DbModifier> => {
  const { data, error } = await supabase
    .from("modifiers")
    .insert(modifier)
    .select()
    .single();
  if (error) throw error;
  return { ...data, price: Number(data.price) } as DbModifier;
};

export const updateModifierDb = async (
  id: string,
  updates: Partial<Omit<DbModifier, "id" | "created_at" | "updated_at">>
): Promise<DbModifier> => {
  const { data, error } = await supabase
    .from("modifiers")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return { ...data, price: Number(data.price) } as DbModifier;
};

export const deleteModifierDb = async (id: string): Promise<void> => {
  const { error } = await supabase.from("modifiers").delete().eq("id", id);
  if (error) throw error;
};

// ── Add-On CRUD ──────────────────────────────────────────────────────────
export const fetchAddOns = async (): Promise<DbAddOn[]> => {
  const { data, error } = await supabase
    .from("add_ons")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((a: any) => ({ ...a, price: Number(a.price) })) as DbAddOn[];
};

export const insertAddOn = async (
  addOn: Omit<DbAddOn, "id" | "created_at" | "updated_at">
): Promise<DbAddOn> => {
  const { data, error } = await supabase
    .from("add_ons")
    .insert(addOn)
    .select()
    .single();
  if (error) throw error;
  return { ...data, price: Number(data.price) } as DbAddOn;
};

export const updateAddOnDb = async (
  id: string,
  updates: Partial<Omit<DbAddOn, "id" | "created_at" | "updated_at">>
): Promise<DbAddOn> => {
  const { data, error } = await supabase
    .from("add_ons")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return { ...data, price: Number(data.price) } as DbAddOn;
};

export const deleteAddOnDb = async (id: string): Promise<void> => {
  const { error } = await supabase.from("add_ons").delete().eq("id", id);
  if (error) throw error;
};

// ── Product ↔ Modifier Group junction ────────────────────────────────────
export const fetchProductModifierGroups = async (): Promise<DbProductModifierGroup[]> => {
  const { data, error } = await supabase
    .from("product_modifier_groups")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DbProductModifierGroup[];
};

export const setProductModifierGroups = async (
  productId: string,
  modifierGroupIds: string[]
): Promise<void> => {
  const { error: delErr } = await supabase
    .from("product_modifier_groups")
    .delete()
    .eq("product_id", productId);
  if (delErr) throw delErr;

  if (modifierGroupIds.length === 0) return;

  const rows = modifierGroupIds.map((mgId, i) => ({
    product_id: productId,
    modifier_group_id: mgId,
    sort_order: i,
  }));
  const { error: insErr } = await supabase.from("product_modifier_groups").insert(rows);
  if (insErr) throw insErr;
};

// ── Product ↔ Add-On junction ────────────────────────────────────────────
export const fetchProductAddOns = async (): Promise<DbProductAddOn[]> => {
  const { data, error } = await supabase
    .from("product_add_ons")
    .select("*");
  if (error) throw error;
  return (data ?? []) as DbProductAddOn[];
};

export const setProductAddOns = async (
  productId: string,
  addOnIds: string[]
): Promise<void> => {
  const { error: delErr } = await supabase
    .from("product_add_ons")
    .delete()
    .eq("product_id", productId);
  if (delErr) throw delErr;

  if (addOnIds.length === 0) return;

  const rows = addOnIds.map((aid) => ({
    product_id: productId,
    add_on_id: aid,
  }));
  const { error: insErr } = await supabase.from("product_add_ons").insert(rows);
  if (insErr) throw insErr;
};
