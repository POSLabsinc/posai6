// Convenience hook that combines live menu categories with the DB-backed sort preference
import { useLiveMenuCategoriesDb } from "@/hooks/useMenuDbHooks";
import { useMenuSort, useModifierStyle } from "@/hooks/useMenuPreferences";
import type { MenuCategory } from "@/lib/productStore";

/**
 * Returns live menu categories sorted according to the stored sort preference.
 */
export function useSortedMenuCategories(): MenuCategory[] {
  const { value: sortPref } = useMenuSort();
  return useLiveMenuCategoriesDb(sortPref);
}
