import { useMemo, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, Mic, Archive } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
import { useAppearance } from "@/contexts/AppearanceContext";
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
import infoIcon from "@/assets/icons/info.png";
import productsIcon from "@/assets/icons/menu-products.png";
import SwipeableSettingsItem from "./SwipeableSettingsItem";
import { getAllUnifiedProducts, setArchivedId, UnifiedProduct } from "@/lib/productStore";

interface ProductsContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
  onAdd?: () => void;
}

const ProductsContent = ({ showHeader = true, onBack, onAIClick, onAdd }: ProductsContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { getIconBgColor } = useAppearance();

  // Derive products from the unified store (menu + custom)
  const [products, setProducts] = useState<UnifiedProduct[]>(() => getAllUnifiedProducts());

  // Re-derive when products-updated fires
  useEffect(() => {
    const refresh = () => setProducts(getAllUnifiedProducts());
    window.addEventListener("products-updated", refresh);
    return () => window.removeEventListener("products-updated", refresh);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [itemToArchive, setItemToArchive] = useState<UnifiedProduct | null>(null);

  const handleArchiveItem = (item: UnifiedProduct) => setItemToArchive(item);

  const confirmArchiveItem = () => {
    if (itemToArchive) {
      setArchivedId(itemToArchive.id, !itemToArchive.archived);
      setItemToArchive(null);
    }
  };

  const handleAdd = useCallback(() => {
    if (onAdd) {
      onAdd();
    } else {
      navigate('/settings/menu/products/add');
    }
  }, [onAdd, navigate]);

  const filteredItems = useMemo(() => {
    return products.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesArchiveFilter = showArchived ? item.archived : !item.archived;
      return matchesSearch && matchesArchiveFilter;
    });
  }, [products, searchQuery, showArchived]);

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
                {showArchived ? "Archived Products" : "Products"}
              </h1>
            </div>
      </div>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={!!itemToArchive} onOpenChange={() => setItemToArchive(null)}>
        <AlertDialogContent className="bg-neutral-800 border-neutral-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              {itemToArchive?.archived ? "Restore Product" : "Archive Product"}
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

export default ProductsContent;
