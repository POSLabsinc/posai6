import { useState, useEffect, useCallback } from "react";
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
import AddDiscountContent from "./AddDiscountContent";
import EditDiscountContent from "./EditDiscountContent";
import SwipeableDiscountItem from "./SwipeableDiscountItem";
import { useAppearance } from "@/contexts/AppearanceContext";
import infoIcon from "@/assets/icons/info.png";
import discountsIcon from "@/assets/icons/discounts.png";
import { supabase } from "@/integrations/supabase/client";

interface Discount {
  id: string;
  name: string;
  amount: number;
  type: "Percentage" | "Fixed";
  archived: boolean;
  applicableTo?: string;
  applicableProducts?: string[];
  requiresManagerPin?: boolean;
  scheduleEnabled?: boolean;
}

interface DiscountsContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const SHARED_DEVICE_ID = "shared";

const DiscountsContent = ({ showHeader = true, onBack, onAIClick }: DiscountsContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { getIconBgColor } = useAppearance();
  
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDiscounts = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .from("discounts")
      .select("*")
      .eq("device_id", SHARED_DEVICE_ID)
      .order("sort_order");
    
    if (data && !error) {
      const mapped: Discount[] = data.map((d: any) => ({
        id: d.id,
        name: d.name,
        amount: Number(d.amount),
        type: d.type as "Percentage" | "Fixed",
        archived: d.archived,
        applicableTo: d.applicable_to,
        applicableProducts: d.applicable_products || [],
        requiresManagerPin: d.requires_manager_pin,
        scheduleEnabled: d.schedule_enabled,
      }));
      setDiscounts(mapped);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [discountToArchive, setDiscountToArchive] = useState<Discount | null>(null);
  const [showAddScreen, setShowAddScreen] = useState(false);
  const [discountToEdit, setDiscountToEdit] = useState<Discount | null>(null);

  const handleAddDiscount = async (discountData: {
    name: string;
    amount: number;
    type: "Percentage" | "Fixed";
    applicableTo: string;
    applicableProducts: string[];
    requiresManagerPin: boolean;
    scheduleEnabled: boolean;
  }) => {
    const { data, error } = await (supabase as any).from("discounts").insert({
      device_id: SHARED_DEVICE_ID,
      name: discountData.name,
      amount: discountData.amount,
      type: discountData.type,
      applicable_to: discountData.applicableTo || "All Products",
      applicable_products: discountData.applicableProducts || [],
      requires_manager_pin: discountData.requiresManagerPin,
      schedule_enabled: discountData.scheduleEnabled,
      archived: false,
      sort_order: discounts.length,
    }).select().single();

    if (!error && data) {
      await fetchDiscounts();
      toast({ description: "Discount added successfully" });
    } else {
      toast({ description: "Failed to add discount", variant: "destructive" });
    }
    setShowAddScreen(false);
  };

  const handleEditDiscount = async (updatedDiscount: Discount) => {
    const { error } = await (supabase as any).from("discounts").update({
      name: updatedDiscount.name,
      amount: updatedDiscount.amount,
      type: updatedDiscount.type,
      applicable_to: updatedDiscount.applicableTo || "All Products",
      applicable_products: updatedDiscount.applicableProducts || [],
      requires_manager_pin: updatedDiscount.requiresManagerPin,
      schedule_enabled: updatedDiscount.scheduleEnabled || false,
      archived: updatedDiscount.archived,
    }).eq("id", updatedDiscount.id);

    if (!error) {
      await fetchDiscounts();
    }
    setDiscountToEdit(null);
  };

  const handleArchiveDiscount = (discount: Discount) => {
    setDiscountToArchive(discount);
  };

  const confirmArchiveDiscount = async () => {
    if (discountToArchive) {
      const newArchived = !discountToArchive.archived;
      await (supabase as any).from("discounts").update({ archived: newArchived }).eq("id", discountToArchive.id);
      await fetchDiscounts();
      setDiscountToArchive(null);
    }
  };

  const filteredDiscounts = discounts.filter(discount => {
    const matchesSearch = discount.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArchiveFilter = showArchived ? discount.archived : !discount.archived;
    return matchesSearch && matchesArchiveFilter;
  });

  const formatAmount = (discount: Discount) => {
    return discount.type === "Percentage" ? `${discount.amount}%` : `$${discount.amount}`;
  };

  if (showAddScreen) {
    return (
      <AddDiscountContent 
        onBack={() => setShowAddScreen(false)} 
        onSave={handleAddDiscount} 
      />
    );
  }

  if (discountToEdit) {
    return (
      <EditDiscountContent 
        discount={discountToEdit}
        onBack={() => setDiscountToEdit(null)} 
        onSave={handleEditDiscount} 
      />
    );
  }

  // Mobile Layout
  if (isMobile) {
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
              <h1 className="text-lg font-semibold text-foreground">Discounts</h1>
              <button
                onClick={() => {
                  toast({
                    description: "Discounts allow you to offer price reductions on orders, items, or special promotions to attract and reward customers.",
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
              onClick={() => setShowAddScreen(true)}
              className="flex-1 py-4 bg-neutral-800 rounded-full flex items-center justify-center gap-2 active:opacity-70 transition-opacity"
            >
              <Plus className="w-5 h-5 text-foreground" />
              <span className="text-foreground font-medium text-base">Add</span>
            </button>
          </div>

          {/* Discount List */}
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_70px_70px_90px] items-center py-4 px-4 border-b border-neutral-700/50">
              <span className="text-neutral-400 text-sm font-medium text-left">Name</span>
              <span className="text-neutral-400 text-sm font-medium text-center">Amount</span>
              <span className="text-neutral-400 text-sm font-medium text-center">PIN</span>
              <span className="text-neutral-400 text-sm font-medium text-right pr-5">Products</span>
            </div>

            {/* Discount Rows */}
            {filteredDiscounts.length > 0 ? (
              filteredDiscounts.map((discount, index) => (
                <div key={discount.id}>
                  {index > 0 && <div className="h-px bg-neutral-700/50 mx-4" />}
                  <SwipeableDiscountItem
                    onTap={() => setDiscountToEdit(discount)}
                    onArchive={() => handleArchiveDiscount(discount)}
                    isArchived={discount.archived}
                  >
                    <div className="grid grid-cols-[1fr_70px_70px_90px] items-center w-full py-4 px-4">
                      <span className="text-foreground text-sm font-medium text-left truncate">{discount.name}</span>
                      <span className="text-foreground text-sm text-center">{formatAmount(discount)}</span>
                      <span className="text-neutral-400 text-sm text-center">{discount.requiresManagerPin ? "Yes" : "No"}</span>
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-neutral-400 text-sm truncate max-w-[70px]">{discount.applicableTo || "All"}</span>
                        <ChevronRight className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                      </div>
                    </div>
                  </SwipeableDiscountItem>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-neutral-500">
                {showArchived ? "No archived discounts" : "No discounts found"}
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
        <AlertDialog open={!!discountToArchive} onOpenChange={() => setDiscountToArchive(null)}>
          <AlertDialogContent className="bg-neutral-800 border-neutral-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">
                {discountToArchive?.archived ? "Restore Discount" : "Archive Discount"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-neutral-400">
                {discountToArchive?.archived 
                  ? `Are you sure you want to restore "${discountToArchive?.name}"? It will appear in your active discounts list.`
                  : `Are you sure you want to archive "${discountToArchive?.name}"? You can restore it later from the archive.`
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-neutral-700 text-foreground border-neutral-600 hover:bg-neutral-600">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmArchiveDiscount}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {discountToArchive?.archived ? "Restore" : "Archive"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Desktop/Tablet Layout
  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {/* Back Button */}
      {onBack && (
        <div className="flex items-center justify-between pt-0 pb-2 relative overflow-visible px-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-base font-medium text-foreground absolute left-1/2 -translate-x-1/2">{showArchived ? "Archived Discounts" : "Discounts"}</h1>
          <div className="overflow-visible flex items-center justify-center" style={{ width: 32, height: 32 }}>
            <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />
          </div>
        </div>
      )}

      <div className="px-6 pt-4 pb-8">
        {/* Description */}
        <div className="mb-4 px-1">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {showArchived
              ? "View and restore your archived discounts."
              : "Discounts allow you to offer price reductions on orders, products, or special promotions to attract and reward customers."}
          </p>
        </div>

        {/* Search + actions row */}
        <section className="flex items-center gap-2 lg:gap-4 mb-6">
          <div className="flex-1 min-w-0 rounded-full bg-neutral-800/60 px-5 py-3 flex items-center gap-3">
            <Search className="h-5 w-5 flex-shrink-0 text-neutral-500" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-0 bg-transparent text-foreground placeholder:text-neutral-500 outline-none text-[15px]"
            />
            <Mic className="h-5 w-5 flex-shrink-0 text-neutral-500" />
          </div>

          <button
            onClick={() => setShowArchived((v) => !v)}
            className={`h-12 rounded-full px-4 lg:px-7 flex-shrink-0 flex items-center justify-center gap-2 border active:opacity-70 transition-all ${
              showArchived
                ? "bg-neutral-700 border-neutral-600"
                : "bg-transparent border-neutral-700/50"
            } text-foreground`}
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

        {/* Discount Table */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1.2fr_100px_100px_140px_24px] items-center py-4 px-6 border-b border-neutral-700/50">
            <span className="text-neutral-400 text-base font-medium text-left">Discount Name</span>
            <span className="text-neutral-400 text-base font-medium text-center">Amount</span>
            <span className="text-neutral-400 text-base font-medium text-center">Manager PIN</span>
            <span className="text-neutral-400 text-base font-medium text-right">Products</span>
            <span />
          </div>

          {/* Discount Rows */}
          {filteredDiscounts.length > 0 ? (
            filteredDiscounts.map((discount, index) => (
              <div key={discount.id}>
                {index > 0 && <div className="h-px bg-neutral-700/50 mx-6" />}
                <button
                  onClick={() => setDiscountToEdit(discount)}
                  className="grid grid-cols-[1.2fr_100px_100px_140px_24px] items-center w-full py-4 px-6 hover:bg-neutral-700/30 transition-colors text-left"
                >
                  <span className="text-foreground text-base font-medium">{discount.name}</span>
                  <span className="text-foreground text-base text-center">{formatAmount(discount)}</span>
                  <span className="text-neutral-400 text-base text-center">{discount.requiresManagerPin ? "Yes" : "No"}</span>
                  <span className="text-neutral-400 text-base text-right">{discount.applicableTo || "All Products"}</span>
                  <ChevronRight className="w-5 h-5 text-neutral-500 justify-self-end" />
                </button>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-neutral-500">
              {showArchived ? "No archived discounts" : "No discounts found"}
            </div>
          )}
        </div>
      </div>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={!!discountToArchive} onOpenChange={() => setDiscountToArchive(null)}>
        <AlertDialogContent className="bg-neutral-800 border-neutral-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              {discountToArchive?.archived ? "Restore Discount" : "Archive Discount"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              {discountToArchive?.archived 
                ? `Are you sure you want to restore "${discountToArchive?.name}"? It will appear in your active discounts list.`
                : `Are you sure you want to archive "${discountToArchive?.name}"? You can restore it later from the archive.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-neutral-700 text-foreground border-neutral-600 hover:bg-neutral-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmArchiveDiscount}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {discountToArchive?.archived ? "Restore" : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DiscountsContent;
