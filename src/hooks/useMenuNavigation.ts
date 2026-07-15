import { useState, useEffect, useCallback, useMemo } from "react";

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

  const defaultMenu = "BAR MENU";
  const { firstCategory: defaultCategory, firstSubcategory: defaultSubcategory } =
    getFirstCategoryAndSubcategory(defaultMenu);

  const [activeCategory, setActiveCategory] = useState(defaultCategory);
  const [activeSubcategory, setActiveSubcategory] = useState(defaultSubcategory);
  const [selectedMenu, setSelectedMenu] = useState(defaultMenu);
  const [isMenuSelectOpen, setIsMenuSelectOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<"minimized" | "center" | "full">("center");

  // Sync selected menu when menu list changes
  useEffect(() => {
    if (menuList.length > 0 && !menuList.includes(selectedMenu)) {
      setSelectedMenu(menuList[0]);
    }
  }, [menuList]);

  // Sync active category/subcategory when menu data loads from DB
  useEffect(() => {
    if (menuList.length > 0 && augmentedMenuCategories[selectedMenu]?.length) {
      const cats = augmentedMenuCategories[selectedMenu];
      if (!activeCategory || !cats.includes(activeCategory)) {
        const firstCat = cats[0] || "";
        setActiveCategory(firstCat);
        const subs = mergedCategorySubcategories[firstCat] || [];
        setActiveSubcategory(subs[0] || "");
      }
    }
  }, [menuList, augmentedMenuCategories, selectedMenu]);

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
