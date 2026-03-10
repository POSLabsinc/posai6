
import { supabase } from "@/integrations/supabase/client";
import { saveCustomProduct, CustomProduct } from "@/lib/productStore";


export type ProductVariant = {
  id: string;
  product_id: string;
  variant_name: string;
  sku: string;
  price: number;
  adjusted_price: number;
  timed_price_enabled: boolean;
  timed_price: number;
  timed_price_start: string | null;
  timed_price_end: string | null;
  sort_order: number;
};

export type ProductWithVariants = CustomProduct & {
  variants: ProductVariant[];
};

// Helper: resolve category name to category_id, creating the category if needed
const resolveCategoryId = async (categoryName: string): Promise<string> => {
  // Try to find existing category
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('name', categoryName)
    .limit(1)
    .single();

  if (existing) return existing.id;

  // Create new category
  const { data: created, error } = await supabase
    .from('categories')
    .insert({ name: categoryName })
    .select('id')
    .single();

  if (error || !created) throw error || new Error('Failed to create category');
  return created.id;
};

export const createProduct = async (product: Omit<CustomProduct, 'id' | 'createdAt' | 'updatedAt'>, variants: Omit<ProductVariant, 'id' | 'product_id' | 'created_at' | 'updated_at'>[]) => {
  const categoryId = await resolveCategoryId(product.category);

  const { data: productData, error: productError } = await (supabase as any)
    .from('products')
    .insert({
      name: product.name,
      description: product.description,
      category_id: categoryId,
      price: product.price,
      price_type: product.priceType,
      sku: product.sku,
      image_url: product.imageUrl,
      active: product.active,
      dine_in: product.dineIn,
      takeaway: product.takeaway,
      delivery: product.delivery,
      out_of_stock: product.outOfStock,
      inventory_tracking: product.inventoryTracking,
      negative_inventory: product.negativeInventory,
    })
    .select()
    .single();

  if (productError) throw productError;

  if (variants.length > 0) {
    const { error: variantsError } = await (supabase as any)
      .from('product_variants')
      .insert(
        variants.map((v, index) => ({
          product_id: productData.id,
          variant_name: v.variant_name,
          sku: v.sku,
          price: v.price,
          adjusted_price: v.adjusted_price,
          timed_price_enabled: v.timed_price_enabled,
          timed_price: v.timed_price,
          timed_price_start: v.timed_price_start,
          timed_price_end: v.timed_price_end,
          sort_order: index,
        }))
      );

    if (variantsError) throw variantsError;
  }

  // Sync to localStorage so product list & orders screen update immediately
  const now = new Date().toISOString();
  saveCustomProduct({
    id: productData.id,
    name: product.name,
    description: product.description ?? '',
    category: product.category,
    price: product.price,
    priceType: product.priceType,
    sku: product.sku ?? '',
    imageUrl: product.imageUrl,
    active: product.active,
    dineIn: product.dineIn,
    takeaway: product.takeaway,
    delivery: product.delivery,
    addToMenu: product.addToMenu ?? true,
    outOfStock: product.outOfStock,
    inventoryTracking: product.inventoryTracking,
    negativeInventory: product.negativeInventory,
    modifiers: product.modifiers ?? [],
    addOns: product.addOns ?? [],
    taxes: product.taxes ?? [],
    discounts: product.discounts ?? [],
    isCustom: true,
    createdAt: now,
    updatedAt: now,
  });

  return productData;
};

// ── Fetch all products with their variants ──────────────────────────────
export const fetchProducts = async (): Promise<ProductWithVariants[]> => {
  const { data: products, error } = await supabase
    .from('products')
    .select('*, categories(name), product_variants(*)');

  if (error) throw error;
  if (!products) return [];

  return products.map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? '',
    category: p.categories?.name ?? '',
    price: Number(p.price),
    priceType: p.price_type as 'fixed' | 'open',
    minPrice: p.min_price ? Number(p.min_price) : undefined,
    maxPrice: p.max_price ? Number(p.max_price) : undefined,
    sku: p.sku ?? '',
    imageUrl: p.image_url ?? undefined,
    active: p.active,
    dineIn: p.dine_in,
    takeaway: p.takeaway,
    delivery: p.delivery,
    addToMenu: p.add_to_menu,
    inventoryTracking: p.inventory_tracking,
    negativeInventory: p.negative_inventory,
    outOfStock: p.out_of_stock,
    modifiers: p.modifiers ?? [],
    addOns: p.add_ons ?? [],
    taxes: p.taxes ?? [],
    discounts: p.discounts ?? [],
    isCustom: true as const,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    archived: p.archived ?? false,
    variants: (p.product_variants ?? []).map((v: any) => ({
      id: v.id,
      product_id: v.product_id,
      variant_name: v.variant_name,
      sku: v.sku ?? '',
      price: Number(v.price),
      adjusted_price: Number(v.adjusted_price),
      timed_price_enabled: v.timed_price_enabled,
      timed_price: Number(v.timed_price),
      timed_price_start: v.timed_price_start,
      timed_price_end: v.timed_price_end,
      sort_order: v.sort_order,
    })),
  }));
};

// ── Calculate effective price considering timed pricing ──────────────────
export const calculateEffectivePrice = (
  basePrice: number,
  variants: ProductVariant[]
): number => {
  if (!variants || variants.length === 0) return basePrice;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const v of variants) {
    if (!v.timed_price_enabled || !v.timed_price_start || !v.timed_price_end) continue;

    const [sh, sm] = v.timed_price_start.split(':').map(Number);
    const [eh, em] = v.timed_price_end.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;

    let isActive = false;
    if (startMin <= endMin) {
      // Same-day range (e.g. 09:00–17:00)
      isActive = currentMinutes >= startMin && currentMinutes < endMin;
    } else {
      // Overnight range (e.g. 22:00–02:00)
      isActive = currentMinutes >= startMin || currentMinutes < endMin;
    }

    if (isActive) return v.timed_price;
  }

  // No timed price active → use first variant's adjusted price if set, else base price
  const first = variants[0];
  if (first && first.adjusted_price > 0) return first.adjusted_price;
  return basePrice;
};

export const updateProduct = async (id: string, product: Partial<CustomProduct>, variants: ProductVariant[]) => {
  let categoryId: string | undefined;
  if (product.category) {
    categoryId = await resolveCategoryId(product.category);
  }

  const updatePayload: Record<string, any> = {
    name: product.name,
    description: product.description,
    price: product.price,
    price_type: product.priceType,
    sku: product.sku,
    image_url: product.imageUrl,
    active: product.active,
    dine_in: product.dineIn,
    takeaway: product.takeaway,
    delivery: product.delivery,
    out_of_stock: product.outOfStock,
    inventory_tracking: product.inventoryTracking,
    negative_inventory: product.negativeInventory,
  };
  if (categoryId) updatePayload.category_id = categoryId;

  const { error: productError } = await (supabase as any)
    .from('products')
    .update(updatePayload)
    .eq('id', id);

  if (productError) throw productError;

  const { error: deleteError } = await (supabase as any)
    .from('product_variants')
    .delete()
    .eq('product_id', id);

  if (deleteError) throw deleteError;

  if (variants.length > 0) {
    const { error: variantsError } = await (supabase as any)
      .from('product_variants')
      .insert(
        variants.map((v, index) => ({
          product_id: id,
          variant_name: v.variant_name,
          sku: v.sku,
          price: v.price,
          adjusted_price: v.adjusted_price,
          timed_price_enabled: v.timed_price_enabled,
          timed_price: v.timed_price,
          timed_price_start: v.timed_price_start,
          timed_price_end: v.timed_price_end,
          sort_order: index,
        }))
      );

    if (variantsError) throw variantsError;
  }

  // Sync to localStorage
  if (product.name) {
    const now = new Date().toISOString();
    saveCustomProduct({
      id,
      name: product.name ?? '',
      description: product.description ?? '',
      category: product.category ?? '',
      price: product.price ?? 0,
      priceType: product.priceType ?? 'fixed',
      sku: product.sku ?? '',
      imageUrl: product.imageUrl,
      active: product.active ?? true,
      dineIn: product.dineIn ?? true,
      takeaway: product.takeaway ?? true,
      delivery: product.delivery ?? false,
      addToMenu: product.addToMenu ?? true,
      outOfStock: product.outOfStock ?? false,
      inventoryTracking: product.inventoryTracking ?? false,
      negativeInventory: product.negativeInventory ?? false,
      modifiers: product.modifiers ?? [],
      addOns: product.addOns ?? [],
      taxes: product.taxes ?? [],
      discounts: product.discounts ?? [],
      isCustom: true,
      createdAt: now,
      updatedAt: now,
    });
  }
};
