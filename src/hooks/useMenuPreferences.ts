import { usePreference } from "@/hooks/usePreference";

export type MenuSortOption = "Default" | "Alphabetical" | "Drag & Drop" | "Popular";
export type ModifierStyleOption = "Standard" | "Classic";

export function useMenuSort() {
  return usePreference("menu_sort", "Default");
}

export function useModifierStyle() {
  return usePreference("modifier_style", "Standard");
}

/**
 * Combined hook for settings screen
 */
export function useWriteOff() {
  return usePreference("menu_write_off", "false");
}

/**
 * Combined hook for settings screen
 */
export function useMenuPreferences() {
  const menuSort = useMenuSort();
  const modifierStyle = useModifierStyle();
  const writeOff = useWriteOff();
  return { menuSort, modifierStyle, writeOff };
}
