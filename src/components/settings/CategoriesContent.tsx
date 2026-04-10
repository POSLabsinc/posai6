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
              <h1 className="text-base font-medium text-foreground">
                {showArchived ? "Archived Categories" : "Categories"}
              </h1>
            </div>
            <div className="overflow-visible flex items-center justify-center" style={{ width: 32, height: 32 }}>
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
