// Menu store - manages multi-menu support (e.g. BAR MENU, DINNER MENU)
// Each menu can contain a subset of categories. When a menu is active, the
// New Order screen only shows categories that belong to that menu.
import { useState, useEffect, useMemo } from "react";
import { getAllCategories } from "./productStore";

export interface Menu {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  archived?: boolean;
  /** List of category names included in this menu. Empty = all categories. */
  categories: string[];
  createdAt: string;
  updatedAt: string;
}

const MENUS_KEY = "pos-menus";
const ACTIVE_MENU_KEY = "pos-active-menu-id";
const SEED_DONE_KEY = "pos-menus-seeded";

// ── Default seed data ────────────────────────────────────────────────────
const DEFAULT_MENUS: Omit<Menu, "id" | "createdAt" | "updatedAt">[] = [
  {
    name: "BAKERY MENU",
    enabled: true,
    categories: ["Breads", "Pastries", "Cakes", "Cookies", "Croissants", "Muffins", "Donuts", "Pies", "Tarts", "Scones", "Bagels", "Danish", "Baguettes", "Rolls"],
  },
  {
    name: "BAR MENU",
    enabled: true,
    categories: ["Food", "Desserts", "Drinks", "Beer", "Wine", "Cocktails", "Spirits", "Mocktails", "Whiskey", "Vodka", "Rum", "Tequila", "Gin", "Brandy"],
  },
  {
    name: "HAPPY HOUR M/W",
    enabled: true,
    categories: ["Appetizers", "Wings", "Sliders", "Nachos", "Beer", "Wine", "Cocktails", "Shots", "Tacos", "Quesadillas", "Dips", "Fries", "Pretzels", "Poppers"],
  },
  {
    name: "Holiday Menu",
    enabled: true,
    categories: ["Starters", "Mains", "Sides", "Desserts", "Drinks", "Specials", "Platters", "Combos", "Turkey", "Ham", "Roasts", "Pies", "Stuffing", "Gravies"],
  },
  {
    name: "LE BRUNCH MENU",
    enabled: true,
    categories: ["Eggs", "Pancakes", "Waffles", "Omelettes", "Juice", "Coffee", "Mimosas", "Pastries", "Bacon", "Sausage", "Toast", "Fruits", "Yogurt", "Granola"],
  },
  {
    name: "LE DINER MENU",
    enabled: true,
    categories: ["Appetizers", "Soups", "Salads", "Entrees", "Steaks", "Seafood", "Pasta", "Desserts", "Risotto", "Duck", "Lamb", "Veal", "Lobster", "Caviar"],
  },
];

const seedMenusIfNeeded = (): Menu[] => {
  const stored = localStorage.getItem(MENUS_KEY);
  const existing: Menu[] = stored ? JSON.parse(stored) : [];

  // Only seed if store is empty AND we haven't seeded before
  if (existing.length === 0) {
    const now = new Date().toISOString();
    const seedMenus = DEFAULT_MENUS;
    const seeded: Menu[] = seedMenus.map((m, i) => ({
      ...m,
      id: `menu-seed-${i}-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    }));
    localStorage.setItem(MENUS_KEY, JSON.stringify(seeded));
    localStorage.setItem(SEED_DONE_KEY, "1");
    return seeded;
  }

  return existing;
};

// ── CRUD ─────────────────────────────────────────────────────────────────
export const getMenus = (): Menu[] => {
  try {
    return seedMenusIfNeeded();
  } catch {
    return [];
  }
};

export const saveMenu = (menu: Menu): void => {
  const menus = getMenus();
  const idx = menus.findIndex((m) => m.id === menu.id);
  const updated = { ...menu, updatedAt: new Date().toISOString() };
  if (idx >= 0) {
    menus[idx] = updated;
  } else {
    menus.push(updated);
  }
  localStorage.setItem(MENUS_KEY, JSON.stringify(menus));
  window.dispatchEvent(new CustomEvent("menus-updated"));
};

export const deleteMenu = (id: string): void => {
  const menus = getMenus().filter((m) => m.id !== id);
  localStorage.setItem(MENUS_KEY, JSON.stringify(menus));
  // If the deleted menu was active, clear selection
  if (getActiveMenuId() === id) setActiveMenuId(null);
  window.dispatchEvent(new CustomEvent("menus-updated"));
};

export const archiveMenu = (id: string): void => {
  const menus = getMenus();
  const idx = menus.findIndex((m) => m.id === id);
  if (idx < 0) return;
  menus[idx] = { ...menus[idx], archived: true, enabled: false, updatedAt: new Date().toISOString() };
  localStorage.setItem(MENUS_KEY, JSON.stringify(menus));
  if (getActiveMenuId() === id) setActiveMenuId(null);
  window.dispatchEvent(new CustomEvent("menus-updated"));
};

export const unarchiveMenu = (id: string): void => {
  const menus = getMenus();
  const idx = menus.findIndex((m) => m.id === id);
  if (idx < 0) return;
  menus[idx] = { ...menus[idx], archived: false, updatedAt: new Date().toISOString() };
  localStorage.setItem(MENUS_KEY, JSON.stringify(menus));
  window.dispatchEvent(new CustomEvent("menus-updated"));
};

export const toggleMenuEnabled = (id: string): void => {
  const menus = getMenus();
  const idx = menus.findIndex((m) => m.id === id);
  if (idx < 0) return;
  menus[idx] = { ...menus[idx], enabled: !menus[idx].enabled, updatedAt: new Date().toISOString() };
  localStorage.setItem(MENUS_KEY, JSON.stringify(menus));
  window.dispatchEvent(new CustomEvent("menus-updated"));
};

// ── Active menu (selected on New Order screen) ───────────────────────────
export const getActiveMenuId = (): string | null => {
  return localStorage.getItem(ACTIVE_MENU_KEY);
};

export const setActiveMenuId = (id: string | null): void => {
  if (id === null) {
    localStorage.removeItem(ACTIVE_MENU_KEY);
  } else {
    localStorage.setItem(ACTIVE_MENU_KEY, id);
  }
  window.dispatchEvent(new CustomEvent("menus-updated"));
};

// ── React hooks ──────────────────────────────────────────────────────────
export const useMenus = (): Menu[] => {
  const [menus, setMenus] = useState<Menu[]>(() => getMenus());
  useEffect(() => {
    const refresh = () => setMenus(getMenus());
    window.addEventListener("menus-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("menus-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return menus;
};

export const useActiveMenuId = (): [string | null, (id: string | null) => void] => {
  const [activeId, setActiveId] = useState<string | null>(() => getActiveMenuId());
  useEffect(() => {
    const refresh = () => setActiveId(getActiveMenuId());
    window.addEventListener("menus-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("menus-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return [activeId, setActiveMenuId];
};

/**
 * Derived hook for order screens: returns menuList (enabled menu names)
 * and menuCategories (map of menu name → category array) from the store.
 */
export const useMenuData = () => {
  const menus = useMenus();
  const menuList = useMemo(
    () => menus.filter((m) => m.enabled && !m.archived).map((m) => m.name),
    [menus]
  );
  const menuCategories = useMemo(
    () =>
      Object.fromEntries(
        menus.filter((m) => m.enabled && !m.archived).map((m) => [m.name, m.categories])
      ) as Record<string, string[]>,
    [menus]
  );
  return { menuList, menuCategories };
};

// Helper: generate a new menu ID
export const generateMenuId = (): string =>
  `menu-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
