import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, Mic, Archive } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
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

interface Product {
  id: string;
  name: string;
  price: number;
  sku: string;
  variant: number;
  archived: boolean;
}

interface ProductsContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const STORAGE_KEY = "products-settings";

const defaultProducts: Product[] = [
  { id: "1", name: "1 gallon Lemonade cateringss", price: 27.00, sku: "e5", variant: 1, archived: false },
  { id: "2", name: "A Minty Tea", price: 4.00, sku: "1", variant: 2, archived: false },
  { id: "3", name: "abcd", price: 2.00, sku: "-", variant: 1, archived: false },
  { id: "4", name: "abcdef", price: 1.00, sku: "sdfwer23", variant: 1, archived: false },
  { id: "5", name: "abcdefg", price: 3.00, sku: "abcde", variant: 1, archived: false },
  { id: "6", name: "Abuelita Dip's 2oz", price: 1.85, sku: "1", variant: 1, archived: false },
  { id: "7", name: "Acqua panna", price: 1.00, sku: "1", variant: 1, archived: false },
  { id: "8", name: "Agave Oat Latte", price: 5.75, sku: "2", variant: 2, archived: false },
  { id: "9", name: "Agave Syrup Shot (1)", price: 0.01, sku: "1", variant: 1, archived: false },
];

const ProductsContent = ({ showHeader = true, onBack, onAIClick }: ProductsContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse products from localStorage", e);
      }
    }
    return defaultProducts;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [itemToArchive, setItemToArchive] = useState<Product | null>(null);

  const saveProducts = (newItems: Product[]) => {
    setProducts(newItems);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
  };

  const handleArchiveItem = (item: Product) => {
    setItemToArchive(item);
  };

  const confirmArchiveItem = () => {
    if (itemToArchive) {
      const updatedItems = products.map(prod => 
        prod.id === itemToArchive.id ? { ...prod, archived: !prod.archived } : prod
      );
      saveProducts(updatedItems);
      setItemToArchive(null);
    }
  };

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
        {showHeader && onBack && (
          <div className="px-6 pt-5">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-hide px-6 pb-6">
          {/* Header card */}
          <section className="mt-4 rounded-[28px] bg-[hsl(var(--surface-2))] px-10 py-8 text-center">
            <div 
              className="mx-auto mb-4 h-14 w-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "#CF0064" }}
            >
              <img src={productsIcon} alt="Products" className="h-8 w-8 object-contain" />
            </div>
            <h1 className="text-2xl font-semibold leading-tight text-foreground">Products</h1>
            <p className="mx-auto mt-2 max-w-3xl text-[15px] leading-relaxed text-[hsl(var(--text-subtle))]">
              Manage your product catalog including pricing, SKUs, and inventory settings.
            </p>
          </section>

          {/* Search + actions row */}
          <section className="mt-6 flex items-center gap-4">
            <div className="flex-1 rounded-full bg-[hsl(var(--surface-1))] px-5 py-3 flex items-center gap-3">
              <Search className="h-5 w-5 text-[hsl(var(--text-subtle))]" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-foreground placeholder:text-[hsl(var(--text-subtle))] outline-none text-[15px]"
              />
              <Mic className="h-5 w-5 text-[hsl(var(--text-subtle))]" />
            </div>

            <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />

            <button
              onClick={() => setShowArchived((v) => !v)}
              className="h-12 rounded-full px-7 flex items-center justify-center gap-2 border border-[hsl(var(--surface-border))] bg-transparent text-foreground active:opacity-70 transition-opacity"
            >
              <Archive className="h-5 w-5" />
              <span className="text-[15px] font-semibold">Archive</span>
            </button>

            <button
              className="h-12 rounded-full px-10 flex items-center justify-center gap-2 bg-[hsl(var(--surface-3))] text-foreground active:opacity-70 transition-opacity"
            >
              <Plus className="h-5 w-5" />
              <span className="text-[15px] font-semibold">Add</span>
            </button>
          </section>

          {/* Table */}
          <section className="mt-6 rounded-2xl bg-[hsl(var(--surface-2))] overflow-hidden">
            <div className="grid grid-cols-[1.2fr_1fr_1fr_100px_24px] items-center px-8 py-5 border-b border-[hsl(var(--surface-border))]">
              <span className="text-[15px] font-semibold text-foreground">Product Name</span>
              <span className="text-[15px] font-semibold text-foreground text-center">SKU</span>
              <span className="text-[15px] font-semibold text-foreground text-center">Variant</span>
              <span className="text-[15px] font-semibold text-foreground text-right">Price</span>
              <span />
            </div>

            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <div key={item.id}>
                  {index > 0 && <div className="h-px bg-[hsl(var(--surface-border))]" />}
                  <button className="grid grid-cols-[1.2fr_1fr_1fr_100px_24px] items-center px-8 py-5 w-full hover:bg-neutral-700/30 transition-colors text-left">
                    <span className="text-[15px] font-semibold text-foreground">{item.name}</span>
                    <span className="text-[15px] text-foreground text-center">{item.sku}</span>
                    <span className="text-[15px] text-foreground text-center">{item.variant}</span>
                    <span className="text-[15px] text-foreground text-right">£{item.price.toFixed(2)}</span>
                    <ChevronRight className="h-5 w-5 text-[hsl(var(--text-subtle))] justify-self-end" />
                  </button>
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
          <AlertDialogContent className="bg-[hsl(var(--surface-2))] border-[hsl(var(--surface-border))]">
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
              <AlertDialogCancel className="bg-[hsl(var(--surface-3))] text-foreground border-[hsl(var(--surface-border))] hover:bg-[hsl(var(--surface-3))]">
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
            <h1 className="text-lg font-semibold text-foreground">Products</h1>
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
            className="flex-1 py-4 bg-neutral-800 rounded-full flex items-center justify-center gap-2 active:opacity-70 transition-opacity"
          >
            <Plus className="w-5 h-5 text-foreground" />
            <span className="text-foreground font-medium text-base">Add</span>
          </button>
        </div>

        {/* Table */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_60px_60px_70px] items-center py-4 px-4 border-b border-neutral-700/50">
            <span className="text-neutral-400 text-base font-medium text-left">Product Name</span>
            <span className="text-neutral-400 text-base font-medium text-center">SKU</span>
            <span className="text-neutral-400 text-base font-medium text-center">Variant</span>
            <span className="text-neutral-400 text-base font-medium text-right pr-6">Price</span>
          </div>

          {/* Rows */}
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <div key={item.id}>
                {index > 0 && <div className="h-px bg-neutral-700/50 mx-4" />}
                <SwipeableSettingsItem
                  onTap={() => {/* TODO: Edit product */}}
                  onArchive={() => handleArchiveItem(item)}
                  isArchived={item.archived}
                >
                  <div className="grid grid-cols-[1fr_60px_60px_70px] items-center w-full py-4 px-4">
                    <span className="text-foreground text-base font-medium text-left">{item.name}</span>
                    <span className="text-foreground text-base text-center">{item.sku}</span>
                    <span className="text-foreground text-base text-center">{item.variant}</span>
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-foreground text-base">£{item.price.toFixed(2)}</span>
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
          <AnimatedAIIcon size={20} onClick={onAIClick || (() => navigate('/settings/ai'))} />
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
