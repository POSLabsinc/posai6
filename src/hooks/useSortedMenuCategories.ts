// Convenience hook that combines live menu categories with the DB-backed sort preference
import { useLiveMenuCategories } from "@/lib/productStore";
import { useMenuSort, useModifierStyle } from "@/hooks/useMenuPreferences";
import type { MenuCategory } from "@/data/menuData";

/**
 * Drop-in replacement for useLiveMenuCategories that automatically
 * applies the user's persisted menu sort preference from the database.
 */
export function useSortedMenuCategories(): MenuCategory[] {
  const { value: sortPref } = useMenuSort();
  return useLiveMenuCategories(sortPref);
}

/**
 * Returns the current modifier style preference from the database.
 */
export function useModifierStylePref(): string {
  const { value } = useModifierStyle();
  return value;
}
