// Menu store - DB-backed version
// Maintains the same exported API as before, but reads/writes to the database
// via the service layer and Realtime hooks.
import { useState, useEffect, useMemo } from "react";
import {
  fetchMenus as fetchMenusDb,
  insertMenu as insertMenuDb,
  updateMenu as updateMenuDb,
  deleteMenuDb as deleteMenuRemote,
  toggleMenuEnabledDb,
  archiveMenuDb as archiveMenuRemote,
  unarchiveMenuDb as unarchiveMenuRemote,
  setMenuCategories,
  fetchCategories,
  fetchMenuCategories as fetchMenuCatsDb,
  type DbMenu,
} from "@/lib/db/menuService";
import {
  useDbMenus,
  useDbCategories,
  useDbMenuCategories,
  useActiveMenuId as useActiveMenuIdHook,
  useMenuData as useMenuDataHook,
} from "@/hooks/useMenuDbHooks";

// Re-export the Menu interface (same shape for backward compat)
export interface Menu {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  archived?: boolean;
  /** Category IDs (UUID) associated with this menu */
  categories: string[];
  createdAt: string;
  updatedAt: string;
}

// ── Converters ──────────────────────────────────────────────────────────
const dbToMenu = (db: DbMenu, categoryIds: string[]): Menu => ({
  id: db.id,
  name: db.name,
  description: db.description,
  enabled: db.enabled,
  archived: db.archived,
  categories: categoryIds,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

// ── Async CRUD (fire-and-forget for UI, errors logged) ──────────────────
export const saveMenu = async (menu: Menu): Promise<void> => {
  try {
    // Check if it exists
    const menus = await fetchMenusDb();
    const existing = menus.find((m) => m.id === menu.id);
    if (existing) {
      await updateMenuDb(menu.id, {
        name: menu.name,
        description: menu.description || "",
        enabled: menu.enabled,
        archived: menu.archived || false,
      });
    } else {
      const created = await insertMenuDb({
        name: menu.name,
        description: menu.description || "",
        enabled: menu.enabled,
        archived: menu.archived || false,
        sort_order: 0,
      });
      menu.id = created.id; // update the ID for junction insert
    }
    // Update category junction
    await setMenuCategories(menu.id, menu.categories);
  } catch (err) {
    console.error("saveMenu error:", err);
  }
};

export const deleteMenu = async (id: string): Promise<void> => {
  try {
    if (getActiveMenuId() === id) setActiveMenuId(null);
    await deleteMenuRemote(id);
  } catch (err) {
    console.error("deleteMenu error:", err);
  }
};

export const toggleMenuEnabled = async (id: string): Promise<void> => {
  try {
    const menus = await fetchMenusDb();
    const menu = menus.find((m) => m.id === id);
    if (menu) await toggleMenuEnabledDb(id, menu.enabled);
  } catch (err) {
    console.error("toggleMenuEnabled error:", err);
  }
};

export const archiveMenu = async (id: string): Promise<void> => {
  try {
    if (getActiveMenuId() === id) setActiveMenuId(null);
    await archiveMenuRemote(id);
  } catch (err) {
    console.error("archiveMenu error:", err);
  }
};

export const unarchiveMenu = async (id: string): Promise<void> => {
  try {
    await unarchiveMenuRemote(id);
  } catch (err) {
    console.error("unarchiveMenu error:", err);
  }
};

// ── Active menu (per-device, localStorage) ───────────────────────────────
const ACTIVE_MENU_KEY = "pos-active-menu-id";

export const getActiveMenuId = (): string | null =>
  localStorage.getItem(ACTIVE_MENU_KEY);

export const setActiveMenuId = (id: string | null): void => {
  if (id === null) localStorage.removeItem(ACTIVE_MENU_KEY);
  else localStorage.setItem(ACTIVE_MENU_KEY, id);
  window.dispatchEvent(new CustomEvent("menus-updated"));
};

export const generateMenuId = (): string =>
  `menu-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ── Sync wrapper (reads from latest hook data) ──────────────────────────
// getMenus is now async. Components should use the hook instead.
export const getMenus = async (): Promise<Menu[]> => {
  try {
    const [dbMenus, menuCats] = await Promise.all([fetchMenusDb(), fetchMenuCatsDb()]);
    return dbMenus.map((m) => {
      const catIds = menuCats
        .filter((mc) => mc.menu_id === m.id)
        .map((mc) => mc.category_id);
      return dbToMenu(m, catIds);
    });
  } catch {
    return [];
  }
};

// ── React hooks (delegate to DB hooks) ──────────────────────────────────
export const useMenus = (): Menu[] => {
  const { data: dbMenus } = useDbMenus();
  const { data: menuCats } = useDbMenuCategories();

  return useMemo(
    () =>
      dbMenus.map((m) => {
        const catIds = menuCats
          .filter((mc) => mc.menu_id === m.id)
          .map((mc) => mc.category_id);
        return dbToMenu(m, catIds);
      }),
    [dbMenus, menuCats]
  );
};

export const useActiveMenuId = useActiveMenuIdHook;

export const useMenuData = () => {
  const result = useMenuDataHook();
  return {
    menuList: result.menuList,
    menuCategories: result.menuCategories,
  };
};
