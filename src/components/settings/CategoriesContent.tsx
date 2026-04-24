import { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, Mic, Archive } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { SortableHeader, useSortableData } from "./SortableHeader";

type CategorySortKey = "name" | "parent" | "position" | "course";

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

const CategoriesContent = ({ showHeader = true, onBack, onAIClick }: CategoriesContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { getIconBgColor } = useAppearance();
  const [showAddScreen, setShowAddScreen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [itemToArchive, setItemToArchive] = useState<Category | null>(null);
  const [dbProductNames, setDbProductNames] = useState<string[]>([]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order");
    if (data) {
      setCategories(data.map((c: any) => ({
        id: c.id,
        name: c.name,
        parent: c.icon || "-",
        position: c.sort_order,
        course: null,
        archived: !c.active,
        products: [],
      })));
    }
    if (error) console.error("Failed to fetch categories", error);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
    const refresh = () => fetchCategories();
    window.addEventListener("pos-data-changed", refresh);
    return () => window.removeEventListener("pos-data-changed", refresh);
  }, []);

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

  const handleAddCategory = async (categoryData: {
    name: string;
    position: number | null;
    courseName: string;
    coursePosition: number | null;
    menuDisplayName: string;
    assignedPrinters: string[];
    parentCategory: string;
    products: string[];
  }) => {
    const { error } = await supabase.from("categories").insert({
      name: categoryData.name,
      icon: categoryData.parentCategory || "-",
      sort_order: categoryData.position || categories.length + 1,
      active: true,
    });
    if (!error) {
      await fetchCategories();
      toast({ description: `Category "${categoryData.name}" has been added.`, duration: 3000 });
    } else {
      toast({ description: "Failed to add category", variant: "destructive" });
    }
  };

  const handleEditCategory = async (categoryData: {
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
    const { error } = await supabase.from("categories").update({
      name: categoryData.name,
      icon: categoryData.parentCategory || "-",
      sort_order: categoryData.position || 0,
    }).eq("id", categoryData.id);
    if (!error) {
      await fetchCategories();
      toast({ description: `Category "${categoryData.name}" has been updated.`, duration: 3000 });
    } else {
      toast({ description: "Failed to update category", variant: "destructive" });
    }
  };

  const handleArchiveItem = (item: Category) => {
    setItemToArchive(item);
  };

  const confirmArchiveItem = async () => {
    if (itemToArchive) {
      const { error } = await supabase.from("categories").update({
        active: itemToArchive.archived, // toggle: archived=true means active=false, so restore means set active=true
      }).eq("id", itemToArchive.id);
      if (!error) {
        await fetchCategories();
      }
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

  const { sortedItems, sort: catSort, requestSort: sortCats } =
    useSortableData<Category, CategorySortKey>(filteredItems, (item, key) => {
      if (key === "position") return item.position;
      if (key === "course") return item.course ?? Number.NEGATIVE_INFINITY;
      if (key === "parent") return item.parent;
      return item.name;
    });

  // Compute dynamic parent category names
  const parentCategoryNames = useMemo(() => {
    return categories
      .filter((c) => !c.archived && (c.parent === "Parent Category" || c.parent === "-"))
      .map((c) => c.name);
  }, [categories]);

  if (loading) {
    return <div className="h-full flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

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
              <h1 className="text-xl font-semibold text-foreground">
                {showArchived ? "Archived Categories" : "Categories"}
              </h1>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 md:px-6 pb-6">
          <div className="mt-4 mb-4 px-1">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {showArchived
                ? "View and restore your archived categories."
                : "Organize your menu products into categories for easy navigation and management."}
            </p>
          </div>

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

          <section className="mt-6 rounded-2xl bg-neutral-800/60 overflow-hidden">
            <div className="grid grid-cols-[1.5fr_1fr_1fr_80px_24px] items-center px-8 py-5 border-b border-neutral-700/50 text-[15px] text-foreground">
              <SortableHeader<CategorySortKey> label="Category Name" sortKey="name" sort={catSort} onSort={sortCats} />
              <SortableHeader<CategorySortKey> label="Parent" sortKey="parent" sort={catSort} onSort={sortCats} align="center" />
              <SortableHeader<CategorySortKey> label="Category Position" sortKey="position" sort={catSort} onSort={sortCats} align="center" />
              <SortableHeader<CategorySortKey> label="Course" sortKey="course" sort={catSort} onSort={sortCats} align="right" />
              <span />
            </div>

            {sortedItems.length > 0 ? (
              sortedItems.map((item, index) => (
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
              className="absolute left-4 w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          )}
          <div className="flex items-center gap-1">
            <h1 className="text-xl font-semibold text-foreground">
              {showArchived ? "Archived Categories" : "Categories"}
            </h1>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-4">
        <div className="mb-4 px-1">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {showArchived
              ? "View and restore your archived categories."
              : "Organize your menu products into categories for easy navigation and management."}
          </p>
        </div>

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

        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_60px_50px_40px] items-center py-4 px-4 border-b border-neutral-700/50 text-neutral-400 text-sm">
            <SortableHeader<CategorySortKey> label="Name" sortKey="name" sort={catSort} onSort={sortCats} bold={false} />
            <SortableHeader<CategorySortKey> label="Parent" sortKey="parent" sort={catSort} onSort={sortCats} align="center" bold={false} />
            <SortableHeader<CategorySortKey> label="Point of Sale" sortKey="position" sort={catSort} onSort={sortCats} align="center" bold={false} />
            <SortableHeader<CategorySortKey> label="Crs" sortKey="course" sort={catSort} onSort={sortCats} align="right" bold={false} className="pr-5" />
          </div>

          {sortedItems.length > 0 ? (
            sortedItems.map((item, index) => (
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
        </div>
      </div>

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
