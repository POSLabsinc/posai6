import { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, Mic, Archive } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
import { useAppearance } from "@/contexts/AppearanceContext";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AddCategoryContent from "./AddCategoryContent";
import EditCategoryContent from "./EditCategoryContent";
import SwipeableSettingsItem from "./SwipeableSettingsItem";

interface Category {
  id: string;
  name: string;
  parent: string;
  position: number;
  course: number | null;
  archived: boolean;
  products?: string[];
}

interface CategoriesContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const STORAGE_KEY = "categories-settings";

const defaultCategories: Category[] = [
  { id: "1", name: "A very very long category name for my taste", parent: "-", position: 1, course: 1, archived: false },
  { id: "2", name: "Avocado Toast", parent: "Food", position: 2, course: 1, archived: false },
  { id: "3", name: "Azucanela cake", parent: "Food", position: 1, course: 1, archived: false },
  { id: "4", name: "Azuque Frio", parent: "Drinks", position: 6, course: 1, archived: false },
  { id: "5", name: "Beverages", parent: "-", position: 4, course: null, archived: false },
  { id: "6", name: "Café", parent: "Drinks", position: 1, course: 1, archived: false },
  { id: "7", name: "Churro Trays Catering", parent: "Food", position: 3, course: 1, archived: false },
  { id: "8", name: "Churros", parent: "Food", position: 4, course: 1, archived: false },
  { id: "9", name: "Coffee Carriers 96 Oz", parent: "-", position: 1, course: 1, archived: false },
];

const CategoriesContent = ({ showHeader = true, onBack, onAIClick }: CategoriesContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { getIconBgColor } = useAppearance();
  const [showAddScreen, setShowAddScreen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse categories from localStorage", e);
      }
    }
    return defaultCategories;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [itemToArchive, setItemToArchive] = useState<Category | null>(null);
  const [dbProductNames, setDbProductNames] = useState<string[]>([]);

  // Fetch product names from Supabase for the product selector
  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("name")
        .eq("active", true)
        .eq("archived", false)
        .order("name");
      if (data) {
        setDbProductNames(data.map((p) => p.name));
      }
    };
    fetchProducts();
  }, []);

  const saveCategories = (newItems: Category[]) => {
    setCategories(newItems);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
  };

  const handleAddCategory = (categoryData: {
    name: string;
    position: number | null;
    courseName: string;
    coursePosition: number | null;
    menuDisplayName: string;
    assignedPrinters: string[];
    parentCategory: string;
    products: string[];
  }) => {
    const newCategory: Category = {
      id: Date.now().toString(),
      name: categoryData.name,
      parent: categoryData.parentCategory || "Parent Category",
      position: categoryData.position || categories.length + 1,
      course: categoryData.coursePosition,
      archived: false,
      products: categoryData.products,
    };
    saveCategories([...categories, newCategory]);
    toast({
      description: `Category "${categoryData.name}" has been added.`,
      duration: 3000,
    });
  };

  const handleEditCategory = (categoryData: {
    id: string;
    name: string;
    position: number | null;
    courseName: string;
    coursePosition: number | null;
    menuDisplayName: string;
    assignedPrinters: string[];
    parentCategory: string;
    products: string[];
  }) => {
    const updatedCategories = categories.map(cat =>
      cat.id === categoryData.id
        ? {
            ...cat,
            name: categoryData.name,
            parent: categoryData.parentCategory || "Parent Category",
            position: categoryData.position || cat.position,
            course: categoryData.coursePosition,
            products: categoryData.products,
          }
        : cat
    );
    saveCategories(updatedCategories);
    toast({
      description: `Category "${categoryData.name}" has been updated.`,
      duration: 3000,
    });
  };

  const handleArchiveItem = (item: Category) => {
    setItemToArchive(item);
  };

  const confirmArchiveItem = () => {
    if (itemToArchive) {
      const updatedItems = categories.map(cat => 
        cat.id === itemToArchive.id ? { ...cat, archived: !cat.archived } : cat
      );
      saveCategories(updatedItems);
      setItemToArchive(null);
    }
  };

  const filteredItems = useMemo(() => {
    return categories.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesArchiveFilter = showArchived ? item.archived : !item.archived;
      return matchesSearch && matchesArchiveFilter;
    });
  }, [categories, searchQuery, showArchived]);

  // Compute dynamic parent category names (categories that ARE parent categories)
  const parentCategoryNames = useMemo(() => {
    return categories
      .filter((c) => !c.archived && (c.parent === "Parent Category" || c.parent === "-"))
      .map((c) => c.name);
  }, [categories]);

  // Show Add Category Screen
  if (showAddScreen) {
    return (
      <AddCategoryContent
        onBack={() => setShowAddScreen(false)}
        onSave={(data) => {
          handleAddCategory(data);
          setShowAddScreen(false);
        }}
        parentCategoryOptions={parentCategoryNames}
        productOptions={dbProductNames}
      />
    );
  }

  // Show Edit Category Screen
  if (editingCategory) {
    return (
      <EditCategoryContent
        category={editingCategory}
        onBack={() => setEditingCategory(null)}
        onSave={(data) => {
          handleEditCategory(data);
          setEditingCategory(null);
        }}
        parentCategoryOptions={parentCategoryNames}
        productOptions={dbProductNames}
      />
    );
  }

  // Desktop / Tablet layout
  if (!isMobile) {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-background">
        {showHeader && (
          <div className="flex items-center justify-between pt-0 pb-2 relative overflow-visible px-4">
            {onBack && (
              <button
                onClick={onBack}
                className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
                aria-label="Back"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
            )}
            {!onBack && <div className="w-8 h-8" />}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              <h1 className="text-base font-medium text-foreground">
                {showArchived ? "Archived Categories" : "Categories"}
              </h1>
            </div>
            <div className="overflow-visible flex items-center justify-center" style={{ width: 32, height: 32 }}>
              <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai', { state: { context: 'menu' } }))} />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-hide px-6 pb-6">
          {/* Description */}
          <div className="mt-4 mb-4 px-1">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {showArchived
                ? "View and restore your archived categories."
                : "Organize your menu items into categories for easy navigation and management."}
            </p>
          </div>

          {/* Search + Archive + Add row */}
          <section className="mt-6 flex items-center gap-2 lg:gap-4">
            <div className="flex-1 min-w-0 rounded-full bg-neutral-800/60 px-5 py-3 flex items-center gap-3">
              <Search className="h-5 w-5 flex-shrink-0 text-[hsl(var(--text-subtle))]" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 min-w-0 bg-transparent text-foreground placeholder:text-[hsl(var(--text-subtle))] outline-none text-[15px]"
              />
              <Mic className="h-5 w-5 flex-shrink-0 text-[hsl(var(--text-subtle))]" />
            </div>

            <button
              onClick={() => setShowArchived((v) => !v)}
              className="h-12 rounded-full px-4 lg:px-7 flex-shrink-0 flex items-center justify-center gap-2 border border-neutral-700/50 bg-transparent text-foreground active:opacity-70 transition-opacity"
            >
              <Archive className="h-5 w-5" />
              <span className="text-[15px] font-semibold">Archive</span>
            </button>

            <button
              onClick={() => setShowAddScreen(true)}
              className="h-12 rounded-full px-5 lg:px-10 flex-shrink-0 flex items-center justify-center gap-2 bg-neutral-800/60 text-foreground active:opacity-70 transition-opacity"
            >
              <Plus className="h-5 w-5" />
              <span className="text-[15px] font-semibold">Add</span>
            </button>
          </section>

          {/* Table */}
          <section className="mt-6 rounded-2xl bg-neutral-800/60 overflow-hidden">
            <div className="grid grid-cols-[1.5fr_1fr_1fr_80px_24px] items-center px-8 py-5 border-b border-neutral-700/50">
              <span className="text-[15px] font-semibold text-foreground">Category Name</span>
              <span className="text-[15px] font-semibold text-foreground text-center">Parent</span>
              <span className="text-[15px] font-semibold text-foreground text-center">Category Position</span>
              <span className="text-[15px] font-semibold text-foreground text-right">Course</span>
              <span />
            </div>

            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <div key={item.id}>
                  {index > 0 && <div className="h-px bg-neutral-700/50" />}
                  <SwipeableSettingsItem
                    onTap={() => showArchived ? setItemToArchive(item) : setEditingCategory(item)}
                    onArchive={() => handleArchiveItem(item)}
                    isArchived={item.archived}
                  >
                    <div className="grid grid-cols-[1.5fr_1fr_1fr_80px_24px] items-center px-8 py-5 w-full hover:bg-neutral-700/30 transition-colors cursor-pointer">
                      <span className="text-[15px] text-foreground">{item.name}</span>
                      <span className="text-[15px] text-foreground text-center">{item.parent}</span>
                      <span className="text-[15px] text-foreground text-center">{item.position}</span>
                      <span className="text-[15px] text-[hsl(var(--text-subtle))] text-right">{item.course ?? "-"}</span>
                      <ChevronRight className="h-5 w-5 text-[hsl(var(--text-subtle))] justify-self-end" />
                    </div>
                  </SwipeableSettingsItem>
                </div>
              ))
            ) : (
              <div className="px-8 py-10 text-center text-[hsl(var(--text-subtle))]">
                {showArchived ? "No archived categories" : "No categories found"}
              </div>
            )}
          </section>
        </div>

        {/* Archive Confirmation Dialog */}
        <AlertDialog open={!!itemToArchive} onOpenChange={() => setItemToArchive(null)}>
          <AlertDialogContent className="bg-neutral-800/60 border-neutral-700/50">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">
                {itemToArchive?.archived ? "Restore Category" : "Archive Category"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[hsl(var(--text-subtle))]">
                {itemToArchive?.archived
                  ? `Are you sure you want to restore "${itemToArchive?.name}"?`
                  : `Are you sure you want to archive "${itemToArchive?.name}"?`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-neutral-700 text-foreground border-neutral-600 hover:bg-neutral-600">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmArchiveItem} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {itemToArchive?.archived ? "Restore" : "Archive"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Mobile Layout
  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {showHeader && (
        <div className="flex items-center justify-center py-4 px-4 relative">
          {onBack && (
            <button
              onClick={onBack}
              className="absolute left-4 w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center active:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          )}
          <div className="flex items-center gap-1">
            <h1 className="text-lg font-semibold text-foreground">
              {showArchived ? "Archived Categories" : "Categories"}
            </h1>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-4">
        {/* Description */}
        <div className="mb-4 px-1">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {showArchived
              ? "View and restore your archived categories."
              : "Organize your menu items into categories for easy navigation and management."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex-1 py-4 rounded-full flex items-center justify-center gap-2 transition-colors ${
              showArchived 
                ? "bg-neutral-700 border border-neutral-600" 
                : "bg-transparent border border-neutral-700"
            }`}
          >
            <Archive className="w-5 h-5 text-foreground" />
            <span className="text-foreground font-medium text-base">Archive</span>
          </button>
          <button 
            onClick={() => setShowAddScreen(true)}
            className="flex-1 py-4 bg-neutral-800 rounded-full flex items-center justify-center gap-2 active:opacity-70 transition-opacity"
          >
            <Plus className="w-5 h-5 text-foreground" />
            <span className="text-foreground font-medium text-base">Add</span>
          </button>
        </div>

        {/* Table */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_60px_50px_40px] items-center py-4 px-4 border-b border-neutral-700/50">
            <span className="text-neutral-400 text-sm font-medium text-left">Name</span>
            <span className="text-neutral-400 text-sm font-medium text-center">Parent</span>
            <span className="text-neutral-400 text-sm font-medium text-center">Point of Sale</span>
            <span className="text-neutral-400 text-sm font-medium text-right pr-5">Crs</span>
          </div>

          {/* Rows */}
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <div key={item.id}>
                {index > 0 && <div className="h-px bg-neutral-700/50 mx-4" />}
                <SwipeableSettingsItem
                  onTap={() => setEditingCategory(item)}
                  onArchive={() => handleArchiveItem(item)}
                  isArchived={item.archived}
                >
                  <div className="grid grid-cols-[1fr_60px_50px_40px] items-center w-full py-4 px-4">
                    <span className="text-foreground text-sm font-medium text-left truncate pr-2">{item.name}</span>
                    <span className="text-foreground text-sm text-center">{item.parent === "-" ? "-" : item.parent.substring(0, 5)}</span>
                    <span className="text-foreground text-sm text-center">{item.position}</span>
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-neutral-400 text-sm">{item.course ?? "-"}</span>
                      <ChevronRight className="w-4 h-4 text-neutral-500" />
                    </div>
                  </div>
                </SwipeableSettingsItem>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-neutral-500">
              {showArchived ? "No archived categories" : "No categories found"}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Search Bar */}
      <div className="px-4 pb-6 pt-2">
        <div className="bg-neutral-800/60 rounded-full flex items-center px-4 py-3">
          <Search className="w-5 h-5 text-neutral-500 mr-3" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-foreground placeholder:text-neutral-500 outline-none text-base"
          />
          <Mic className="w-5 h-5 text-neutral-500 mr-2" />
          <AnimatedAIIcon size={20} onClick={onAIClick || (() => navigate('/settings/ai', { state: { context: 'menu' } }))} />
        </div>
      </div>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={!!itemToArchive} onOpenChange={() => setItemToArchive(null)}>
        <AlertDialogContent className="bg-neutral-800 border-neutral-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              {itemToArchive?.archived ? "Restore Category" : "Archive Category"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              {itemToArchive?.archived 
                ? `Are you sure you want to restore "${itemToArchive?.name}"?`
                : `Are you sure you want to archive "${itemToArchive?.name}"?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-neutral-700 text-foreground border-neutral-600 hover:bg-neutral-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmArchiveItem}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {itemToArchive?.archived ? "Restore" : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CategoriesContent;
