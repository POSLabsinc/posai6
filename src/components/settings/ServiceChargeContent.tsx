import { useState, useEffect, useCallback } from "react";
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
import AddServiceChargeContent from "./AddServiceChargeContent";
import EditServiceChargeContent from "./EditServiceChargeContent";
import SwipeableServiceChargeItem from "./SwipeableServiceChargeItem";
import infoIcon from "@/assets/icons/info.png";
import serviceChargeIcon from "@/assets/icons/service-charge.png";
import { supabase } from "@/integrations/supabase/client";
import { SortableHeader, useSortableData } from "./SortableHeader";

type ServiceChargeSortKey = "name" | "amount" | "taxApplicable";

interface ServiceCharge {
  id: string;
  name: string;
  amount: number;
  type: "Percentage" | "Fixed";
  archived: boolean;
  taxApplicable?: string;
  orderType?: string | string[];
  appliedAs?: string;
  automaticApply?: boolean;
  minSeats?: number;
  requiresManagerPin?: boolean;
  isActive?: boolean;
}

interface ServiceChargeContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const SHARED_DEVICE_ID = "shared";

const ServiceChargeContent = ({ showHeader = true, onBack, onAIClick }: ServiceChargeContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { getIconBgColor } = useAppearance();

  const [serviceCharges, setServiceCharges] = useState<ServiceCharge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServiceCharges = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .from("service_charges")
      .select("*")
      .eq("device_id", SHARED_DEVICE_ID)
      .order("sort_order");
    
    if (data && !error) {
      const mapped: ServiceCharge[] = data.map((d: any) => ({
        id: d.id,
        name: d.name,
        amount: Number(d.amount),
        type: d.type as "Percentage" | "Fixed",
        archived: d.archived,
        taxApplicable: d.tax_applicable,
        orderType: d.order_type,
        appliedAs: d.applied_as,
        automaticApply: d.automatic_apply,
        minSeats: d.min_seats,
        requiresManagerPin: d.requires_manager_pin,
        isActive: d.is_active,
      }));
      setServiceCharges(mapped);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchServiceCharges();
  }, [fetchServiceCharges]);

  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [chargeToArchive, setChargeToArchive] = useState<ServiceCharge | null>(null);
  const [showAddScreen, setShowAddScreen] = useState(false);
  const [chargeToEdit, setChargeToEdit] = useState<ServiceCharge | null>(null);

  const handleAddServiceCharge = async (chargeData: {
    name: string;
    amount: number;
    type: "Percentage" | "Fixed";
    taxApplicable: string;
    orderType: string[];
    appliedAs: string;
    automaticApply: boolean;
    minSeats: number;
    requiresManagerPin: boolean;
  }) => {
    const { error } = await (supabase as any).from("service_charges").insert({
      device_id: SHARED_DEVICE_ID,
      name: chargeData.name,
      amount: chargeData.amount,
      type: chargeData.type,
      tax_applicable: chargeData.taxApplicable,
      order_type: Array.isArray(chargeData.orderType) ? chargeData.orderType.join(", ") : chargeData.orderType,
      applied_as: chargeData.appliedAs,
      automatic_apply: chargeData.automaticApply,
      min_seats: chargeData.minSeats || 0,
      requires_manager_pin: chargeData.requiresManagerPin,
      archived: false,
      sort_order: serviceCharges.length,
    });

    if (!error) {
      await fetchServiceCharges();
      toast({ description: "Service charge added successfully" });
    } else {
      toast({ description: "Failed to add service charge", variant: "destructive" });
    }
    setShowAddScreen(false);
  };

  const handleEditServiceCharge = async (updatedCharge: ServiceCharge) => {
    await (supabase as any).from("service_charges").update({
      name: updatedCharge.name,
      amount: updatedCharge.amount,
      type: updatedCharge.type,
      tax_applicable: updatedCharge.taxApplicable,
      order_type: Array.isArray(updatedCharge.orderType) ? updatedCharge.orderType.join(", ") : updatedCharge.orderType,
      applied_as: updatedCharge.appliedAs,
      automatic_apply: updatedCharge.automaticApply,
      min_seats: updatedCharge.minSeats || 0,
      requires_manager_pin: updatedCharge.requiresManagerPin,
      archived: updatedCharge.archived,
    }).eq("id", updatedCharge.id);

    await fetchServiceCharges();
    setChargeToEdit(null);
  };

  const handleArchiveServiceCharge = (charge: ServiceCharge) => {
    setChargeToArchive(charge);
  };

  const confirmArchiveServiceCharge = async () => {
    if (chargeToArchive) {
      const newArchived = !chargeToArchive.archived;
      await (supabase as any).from("service_charges").update({ archived: newArchived }).eq("id", chargeToArchive.id);
      await fetchServiceCharges();
      setChargeToArchive(null);
    }
  };

  const filteredCharges = serviceCharges.filter(charge => {
    const matchesSearch = charge.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArchiveFilter = showArchived ? charge.archived : !charge.archived;
    return matchesSearch && matchesArchiveFilter;
  });

  const formatAmount = (charge: ServiceCharge) => {
    return charge.type === "Percentage" ? `${charge.amount}%` : `$${charge.amount.toFixed(2)}`;
  };

  if (showAddScreen) {
    return (
      <AddServiceChargeContent 
        onBack={() => setShowAddScreen(false)} 
        onSave={handleAddServiceCharge} 
      />
    );
  }

  if (chargeToEdit) {
    return (
      <EditServiceChargeContent 
        serviceCharge={chargeToEdit}
        onBack={() => setChargeToEdit(null)} 
        onSave={handleEditServiceCharge} 
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
                className="absolute left-4 w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
            )}
            <div className="flex items-center gap-1">
              <h1 className="text-xl font-semibold text-foreground">Service Charge</h1>
              <button
                onClick={() => {
                  toast({
                    description: "Configure automatic service charges for orders and specific scenarios like large parties or delivery fees.",
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

          {/* Service Charge List */}
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_80px_100px_20px] items-center py-4 px-4 border-b border-neutral-700/50">
              <span className="text-neutral-400 text-sm font-medium text-left">Service Charge Name</span>
              <span className="text-neutral-400 text-sm font-medium text-center">Amount</span>
              <span className="text-neutral-400 text-sm font-medium text-right pr-2">Tax Applicable</span>
              <span />
            </div>

            {/* Service Charge Rows */}
            {filteredCharges.length > 0 ? (
              filteredCharges.map((charge, index) => (
                <div key={charge.id}>
                  {index > 0 && <div className="h-px bg-neutral-700/50 mx-4" />}
                  <SwipeableServiceChargeItem
                    onTap={() => setChargeToEdit(charge)}
                    onArchive={() => handleArchiveServiceCharge(charge)}
                    isArchived={charge.archived}
                  >
                    <div className="grid grid-cols-[1fr_80px_100px_20px] items-center w-full py-4 px-4">
                      <span className="text-foreground text-sm font-medium text-left truncate">{charge.name}</span>
                      <span className="text-foreground text-sm text-center">{formatAmount(charge)}</span>
                      <span className="text-neutral-400 text-sm text-right pr-2">{charge.taxApplicable === "Taxable" ? "1" : "0"}</span>
                      <ChevronRight className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                    </div>
                  </SwipeableServiceChargeItem>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-neutral-500">
                {showArchived ? "No archived service charges" : "No service charges found"}
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
        <AlertDialog open={!!chargeToArchive} onOpenChange={() => setChargeToArchive(null)}>
          <AlertDialogContent className="bg-neutral-800 border-neutral-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">
                {chargeToArchive?.archived ? "Restore Service Charge" : "Archive Service Charge"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-neutral-400">
                {chargeToArchive?.archived 
                  ? `Are you sure you want to restore "${chargeToArchive?.name}"? It will appear in your active service charges list.`
                  : `Are you sure you want to archive "${chargeToArchive?.name}"? You can restore it later from the archive.`
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-neutral-700 text-foreground border-neutral-600 hover:bg-neutral-600">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmArchiveServiceCharge}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {chargeToArchive?.archived ? "Restore" : "Archive"}
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
          <h1 className="text-xl font-semibold text-foreground absolute left-1/2 -translate-x-1/2">{showArchived ? "Archived Service Charges" : "Service Charge"}</h1>
        </div>
      )}

      <div className="px-6 pt-4 pb-8">
        {/* Description */}
        <div className="mb-4 px-1">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {showArchived
              ? "View and restore your archived service charges."
              : "Configure automatic service charges for orders and specific scenarios like large parties, delivery fees, or private events."}
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

        {/* Service Charge Table */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1.2fr_120px_140px_24px] items-center py-4 px-6 border-b border-neutral-700/50">
            <span className="text-neutral-400 text-base font-medium text-left">Service Charge Name</span>
            <span className="text-neutral-400 text-base font-medium text-center">Amount</span>
            <span className="text-neutral-400 text-base font-medium text-right">Tax Applicable</span>
            <span />
          </div>

          {/* Service Charge Rows */}
          {filteredCharges.length > 0 ? (
            filteredCharges.map((charge, index) => (
              <div key={charge.id}>
                {index > 0 && <div className="h-px bg-neutral-700/50 mx-6" />}
                <button
                  onClick={() => setChargeToEdit(charge)}
                  className="grid grid-cols-[1.2fr_120px_140px_24px] items-center w-full py-4 px-6 hover:bg-neutral-700/30 transition-colors text-left"
                >
                  <span className="text-foreground text-base font-medium">{charge.name}</span>
                  <span className="text-foreground text-base text-center">{formatAmount(charge)}</span>
                  <span className="text-neutral-400 text-base text-right">{charge.taxApplicable === "Taxable" ? "1" : "0"}</span>
                  <ChevronRight className="w-5 h-5 text-neutral-500 justify-self-end" />
                </button>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-neutral-500">
              {showArchived ? "No archived service charges" : "No service charges found"}
            </div>
          )}
        </div>
      </div>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={!!chargeToArchive} onOpenChange={() => setChargeToArchive(null)}>
        <AlertDialogContent className="bg-neutral-800 border-neutral-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              {chargeToArchive?.archived ? "Restore Service Charge" : "Archive Service Charge"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              {chargeToArchive?.archived 
                ? `Are you sure you want to restore "${chargeToArchive?.name}"? It will appear in your active service charges list.`
                : `Are you sure you want to archive "${chargeToArchive?.name}"? You can restore it later from the archive.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-neutral-700 text-foreground border-neutral-600 hover:bg-neutral-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmArchiveServiceCharge}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {chargeToArchive?.archived ? "Restore" : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ServiceChargeContent;
