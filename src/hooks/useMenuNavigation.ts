import { useState, useEffect, useCallback } from "react";

interface UseMenuNavigationProps {
  menuList: string[];
  augmentedMenuCategories: Record<string, string[]>;
  mergedCategorySubcategories: Record<string, string[]>;
}

export function useMenuNavigation({
  menuList,
  augmentedMenuCategories,
  mergedCategorySubcategories,
}: UseMenuNavigationProps) {
  const getFirstCategoryAndSubcategory = useCallback(
    (menu: string) => {
      const categories = augmentedMenuCategories[menu] || [];
      const firstCategory = categories[0] || "";
      const subcategories = mergedCategorySubcategories[firstCategory] || [];
      const firstSubcategory = subcategories[0] || "";
      return { firstCategory, firstSubcategory };
    },
    [augmentedMenuCategories, mergedCategorySubcategories]
  );

  const defaultMenu = menuList[0] || "";
  const { firstCategory: defaultCategory, firstSubcategory: defaultSubcategory } =
    getFirstCategoryAndSubcategory(defaultMenu);

  const [activeCategory, setActiveCategory] = useState(defaultCategory);
  const [activeSubcategory, setActiveSubcategory] = useState(defaultSubcategory);
  const [selectedMenu, setSelectedMenu] = useState(defaultMenu);
  const [isMenuSelectOpen, setIsMenuSelectOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<"minimized" | "center" | "full">("center");

  // Sync selected menu when menu list changes
  useEffect(() => {
    if (menuList.length === 0) {
      if (selectedMenu) setSelectedMenu("");
      if (activeCategory) setActiveCategory("");
      if (activeSubcategory) setActiveSubcategory("");
      return;
    }

    if (!selectedMenu || !menuList.includes(selectedMenu)) {
      const nextMenu = menuList[0];
      const { firstCategory, firstSubcategory } = getFirstCategoryAndSubcategory(nextMenu);
      setSelectedMenu(nextMenu);
      setActiveCategory(firstCategory);
      setActiveSubcategory(firstSubcategory);
    }
  }, [menuList, selectedMenu, activeCategory, activeSubcategory, getFirstCategoryAndSubcategory]);

  // Sync active category/subcategory when menu data loads from DB
  useEffect(() => {
    if (!selectedMenu || menuList.length === 0) return;

    const cats = augmentedMenuCategories[selectedMenu] || [];
    if (cats.length === 0) {
      if (activeCategory) setActiveCategory("");
      if (activeSubcategory) setActiveSubcategory("");
      return;
    }

    const nextCategory = activeCategory && cats.includes(activeCategory) ? activeCategory : cats[0];
    if (nextCategory !== activeCategory) {
      setActiveCategory(nextCategory);
    }

    const subs = mergedCategorySubcategories[nextCategory] || [];
    const nextSubcategory = activeSubcategory && subs.includes(activeSubcategory) ? activeSubcategory : subs[0] || "";
    if (nextSubcategory !== activeSubcategory) {
      setActiveSubcategory(nextSubcategory);
    }
  }, [menuList, augmentedMenuCategories, mergedCategorySubcategories, selectedMenu, activeCategory, activeSubcategory]);

  const handleMenuSelect = useCallback(
    (value: string) => {
      setSelectedMenu(value);
      setIsMenuSelectOpen(false);
      const { firstCategory, firstSubcategory } = getFirstCategoryAndSubcategory(value);
      setActiveCategory(firstCategory);
      setActiveSubcategory(firstSubcategory);
    },
    [getFirstCategoryAndSubcategory]
  );

  const handleCategoryChange = useCallback(
    (category: string) => {
      setActiveCategory(category);
      const subcategories = mergedCategorySubcategories[category] || [];
      setActiveSubcategory(subcategories[0] || "");
    },
    [mergedCategorySubcategories]
  );

  return {
    activeCategory,
    setActiveCategory,
    activeSubcategory,
    setActiveSubcategory,
    selectedMenu,
    setSelectedMenu,
    isMenuSelectOpen,
    setIsMenuSelectOpen,
    menuPosition,
    setMenuPosition,
    handleMenuSelect,
    handleCategoryChange,
    getFirstCategoryAndSubcategory,
  };
}
