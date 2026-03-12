import { supabase } from "@/integrations/supabase/client";

export interface DbModifierOption {
  name: string;
  price: number;
  is_default: boolean;
}

export interface DbModifierGroup {
  id: string;
  name: string;
  required: boolean;
  multi_select: boolean;
  options: DbModifierOption[];
}

export interface DbAddOn {
  id: string;
  name: string;
  price: number;
}

export interface DbProductInfo {
  description: string;
  allergens: string[];
  ingredients: string[];
  calories: number | null;
  protein: string | null;
  carbs: string | null;
  fat: string | null;
  image_url: string | null;
}

export interface ProductCustomization {
  modifierGroups: DbModifierGroup[];
  addOns: DbAddOn[];
  productInfo: DbProductInfo;
}

/**
 * Fetch modifiers, add-ons, and product details for a given product ID.
 * Falls back to all active modifier groups / add-ons if none are assigned.
 */
export const fetchProductCustomization = async (
  productId: string
): Promise<ProductCustomization | null> => {
  try {
    // Parallel fetches
    const [productRes, pmgRes, paoRes] = await Promise.all([
      // Product info including new columns
      (supabase as any)
        .from("products")
        .select("description, allergens, ingredients, calories, protein, carbs, fat, image_url")
        .eq("id", productId)
        .single(),
      // Product's assigned modifier groups
      (supabase as any)
        .from("product_modifier_groups")
        .select("modifier_group_id, sort_order")
        .eq("product_id", productId)
        .order("sort_order"),
      // Product's assigned add-ons
      (supabase as any)
        .from("product_add_ons")
        .select("add_on_id")
        .eq("product_id", productId),
    ]);

    // Product info
    const productInfo: DbProductInfo = productRes.data
      ? {
          description: productRes.data.description ?? "",
          allergens: productRes.data.allergens ?? [],
          ingredients: productRes.data.ingredients ?? [],
          calories: productRes.data.calories,
          protein: productRes.data.protein,
          carbs: productRes.data.carbs,
          fat: productRes.data.fat,
          image_url: productRes.data.image_url,
        }
      : {
          description: "",
          allergens: [],
          ingredients: [],
          calories: null,
          protein: null,
          carbs: null,
          fat: null,
          image_url: null,
        };

    // ── Modifier groups ──────────────────────────────────
    let modifierGroupIds: string[] = (pmgRes.data ?? []).map(
      (r: any) => r.modifier_group_id
    );

    // Fallback: if no groups assigned, use all active groups
    if (modifierGroupIds.length === 0) {
      const { data: allGroups } = await (supabase as any)
        .from("modifier_groups")
        .select("id")
        .eq("active", true)
        .order("sort_order");
      modifierGroupIds = (allGroups ?? []).map((g: any) => g.id);
    }

    // Fetch groups with their modifiers
    let modifierGroups: DbModifierGroup[] = [];
    if (modifierGroupIds.length > 0) {
      const { data: groups } = await (supabase as any)
        .from("modifier_groups")
        .select("id, name, required, multi_select")
        .in("id", modifierGroupIds)
        .eq("active", true)
        .order("sort_order");

      if (groups && groups.length > 0) {
        const { data: modifiers } = await (supabase as any)
          .from("modifiers")
          .select("modifier_group_id, name, price, is_default")
          .in(
            "modifier_group_id",
            groups.map((g: any) => g.id)
          )
          .eq("active", true)
          .order("sort_order");

        modifierGroups = groups.map((g: any) => ({
          id: g.id,
          name: g.name,
          required: g.required,
          multi_select: g.multi_select,
          options: (modifiers ?? [])
            .filter((m: any) => m.modifier_group_id === g.id)
            .map((m: any) => ({
              name: m.name,
              price: Number(m.price),
              is_default: m.is_default,
            })),
        }));
      }
    }

    // ── Add-ons ──────────────────────────────────────────
    let addOnIds: string[] = (paoRes.data ?? []).map(
      (r: any) => r.add_on_id
    );

    // Fallback: if none assigned, use all active add-ons
    if (addOnIds.length === 0) {
      const { data: allAddOns } = await (supabase as any)
        .from("add_ons")
        .select("id")
        .eq("active", true)
        .order("sort_order");
      addOnIds = (allAddOns ?? []).map((a: any) => a.id);
    }

    let addOns: DbAddOn[] = [];
    if (addOnIds.length > 0) {
      const { data: addOnData } = await (supabase as any)
        .from("add_ons")
        .select("id, name, price")
        .in("id", addOnIds)
        .eq("active", true)
        .order("sort_order");
      addOns = (addOnData ?? []).map((a: any) => ({
        id: a.id,
        name: a.name,
        price: Number(a.price),
      }));
    }

    return { modifierGroups, addOns, productInfo };
  } catch (err) {
    console.error("Failed to fetch product customization:", err);
    return null;
  }
};
