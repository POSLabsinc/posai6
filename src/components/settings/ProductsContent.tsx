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
              <h1 className="text-xl font-semibold text-foreground">
                {showArchived ? "Archived Products" : "Products"}
              </h1>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-hide px-6 pb-6">
          {/* Description */}
          <div className="mt-4 mb-4 px-1">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {showArchived
                ? "View and restore your archived products."
                : "Manage your product catalog including pricing, SKUs, and inventory settings."}
            </p>
          </div>

          {/* Search + actions row */}
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
              onClick={handleAdd}
              className="h-12 rounded-full px-5 lg:px-10 flex-shrink-0 flex items-center justify-center gap-2 bg-neutral-800/60 text-foreground active:opacity-70 transition-opacity"
            >
              <Plus className="h-5 w-5" />
              <span className="text-[15px] font-semibold">Add</span>
            </button>
          </section>

          {/* Table */}
          <section className="mt-6 rounded-2xl bg-neutral-800/60 overflow-hidden">
            <div className="grid grid-cols-[1.2fr_1fr_1fr_100px_24px] items-center px-8 py-5 border-b border-neutral-700/50">
              <span className="text-[15px] font-semibold text-foreground">Product Name</span>
              <span className="text-[15px] font-semibold text-foreground text-center">Category</span>
              <span className="text-[15px] font-semibold text-foreground text-center">SKU</span>
              <span className="text-[15px] font-semibold text-foreground text-right">Price</span>
              <span />
            </div>

            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <div key={item.id}>
                  {index > 0 && <div className="h-px bg-neutral-700/50" />}
                  <SwipeableSettingsItem
                    onTap={() => navigate(`/settings/menu/products/edit/${item.id}`)}
                    onArchive={() => handleArchiveItem(item)}
                    isArchived={item.archived}
                  >
                    <div className="grid grid-cols-[1.2fr_1fr_1fr_100px_24px] items-center px-8 py-5 w-full hover:bg-neutral-700/30 transition-colors text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-semibold text-foreground">{item.name}</span>
                        {item.isCustom && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">NEW</span>
                        )}
                      </div>
                      <span className="text-[15px] text-foreground text-center">{item.category}</span>
                      <span className="text-[15px] text-foreground text-center">{item.sku}</span>
                      <span className="text-[15px] text-foreground text-right">${item.price.toFixed(2)}</span>
                      <ChevronRight className="h-5 w-5 text-[hsl(var(--text-subtle))] justify-self-end" />
                    </div>
                  </SwipeableSettingsItem>
                </div>
              ))
            ) : (
              <div className="px-8 py-10 text-center text-[hsl(var(--text-subtle))]">
                {showArchived ? "No archived products" : "No products found"}
              </div>
            )}
          </section>
        </div>

        {/* Archive Confirmation Dialog */}
        <AlertDialog open={!!itemToArchive} onOpenChange={() => setItemToArchive(null)}>
          <AlertDialogContent className="bg-neutral-800/60 border-neutral-700/50">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">
                {itemToArchive?.archived ? "Restore Product" : "Archive Product"}
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
            <h1 className="text-xl font-semibold text-foreground">Products</h1>
            <button
              onClick={() => {
                toast({
                  description: "Manage your product catalog including pricing, SKUs, and inventory settings.",
                  duration: 4000,
                });
              }}
              className="active:opacity-70 transition-opacity"
            >
              <img src={infoIcon} alt="Info" className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-4">
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
            onClick={handleAdd}
            className="flex-1 py-4 bg-neutral-800 rounded-full flex items-center justify-center gap-2 active:opacity-70 transition-opacity"
          >
            <Plus className="w-5 h-5 text-foreground" />
            <span className="text-foreground font-medium text-base">Add</span>
          </button>
        </div>

        {/* Table */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_80px_70px] items-center py-4 px-4 border-b border-neutral-700/50">
            <span className="text-neutral-400 text-base font-medium text-left">Product Name</span>
            <span className="text-neutral-400 text-base font-medium text-center">Category</span>
            <span className="text-neutral-400 text-base font-medium text-right pr-4">Price</span>
          </div>

          {/* Rows */}
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <div key={item.id}>
                {index > 0 && <div className="h-px bg-neutral-700/50 mx-4" />}
                <SwipeableSettingsItem
                  onTap={() => navigate(`/settings/menu/products/edit/${item.id}`)}
                  onArchive={() => handleArchiveItem(item)}
                  isArchived={item.archived}
                >
                  <div className="grid grid-cols-[1fr_80px_70px] items-center w-full py-4 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-foreground text-base font-medium text-left">{item.name}</span>
                      {item.isCustom && (
                        <span className="text-[9px] font-medium px-1 py-0.5 rounded-full bg-primary/20 text-primary leading-none">NEW</span>
                      )}
                    </div>
                    <span className="text-neutral-400 text-sm text-center">{item.category}</span>
                    <div className="flex items-center justify-end gap-1 pr-1">
                      <span className="text-foreground text-base">${item.price.toFixed(2)}</span>
                      <ChevronRight className="w-4 h-4 text-neutral-500" />
                    </div>
                  </div>
                </SwipeableSettingsItem>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-neutral-500">
              {showArchived ? "No archived products" : "No products found"}
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
