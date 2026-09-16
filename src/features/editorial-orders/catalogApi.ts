import { supabase } from "@/integrations/supabase/client";
import type { EditorialCatalogResponse, EditorialProduct } from "./types";

interface ProductApiRow {
  id: string;
  name: string;
  price: number | string;
  categories: { name: string } | null;
  active: boolean | null;
  archived: boolean | null;
  is_available: boolean | null;
  price_type: string | null;
}

export async function getEditorialCatalog(): Promise<EditorialCatalogResponse> {
  const request = (supabase as any)
    .from("products")
    .select("id, name, price, active, archived, is_available, price_type, categories(name)")
    .eq("active", true)
    .eq("archived", false)
    .order("name");

  const timeout = new Promise<never>((_, reject) => {
    window.setTimeout(() => reject(new Error("The product catalog took too long to respond.")), 12000);
  });
  let data: ProductApiRow[] | null = null;
  let error: { message?: string } | null = null;
  try {
    const response = await Promise.race([request, timeout]);
    data = response.data as ProductApiRow[] | null;
    error = response.error;
  } catch (requestError) {
    throw requestError instanceof Error
      ? requestError
      : new Error("The product catalog could not be loaded.");
  }

  if (error) throw new Error(error.message || "The product catalog could not be loaded.");

  const products: EditorialProduct[] = ((data ?? []) as ProductApiRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    price: { amount: Number(row.price) || 0, currency: "USD" },
    category: row.categories?.name?.trim() || "Uncategorized",
    description: "",
    imageUrl: null,
    isAvailable: row.is_available !== false,
    isOpenPrice: row.price_type === "open",
  }));

  return {
    products,
    categories: Array.from(new Set(products.map((product) => product.category))),
    fetchedAt: new Date().toISOString(),
  };
}