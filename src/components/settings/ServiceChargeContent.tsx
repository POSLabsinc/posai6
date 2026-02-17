import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, Mic, Archive } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
import { useSettingsSync } from "@/hooks/useSettingsSync";
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

const STORAGE_KEY = "service-charges-settings";

const defaultServiceCharges: ServiceCharge[] = [
  { id: "1", name: "Large Party (6+)", amount: 18, type: "Percentage", archived: false, requiresManagerPin: false, orderType: "Dine-In Only", appliedAs: "Large Table", automaticApply: true, minSeats: 6, taxApplicable: "Taxable" },
  { id: "2", name: "Delivery Fee", amount: 5, type: "Fixed", archived: false, orderType: "Delivery Only", requiresManagerPin: false, appliedAs: "Basic", taxApplicable: "Non-Taxable" },
  { id: "3", name: "Private Event", amount: 20, type: "Percentage", archived: false, requiresManagerPin: true, orderType: "All Orders", appliedAs: "Private Event", taxApplicable: "Taxable" },
];

const ServiceChargeContent = ({ showHeader = true, onBack, onAIClick }: ServiceChargeContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  // Use settings sync hook to listen for AI-driven updates
  const [serviceCharges, setServiceCharges] = useSettingsSync<ServiceCharge[]>(
    'serviceCharges',
    STORAGE_KEY,
    defaultServiceCharges
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [chargeToArchive, setChargeToArchive] = useState<ServiceCharge | null>(null);
  const [showAddScreen, setShowAddScreen] = useState(false);
  const [chargeToEdit, setChargeToEdit] = useState<ServiceCharge | null>(null);

  const saveServiceCharges = (newCharges: ServiceCharge[]) => {
    setServiceCharges(newCharges);
  };

  const handleAddServiceCharge = (chargeData: {
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
    const newCharge: ServiceCharge = {
      id: Date.now().toString(),
      name: chargeData.name,
      amount: chargeData.amount,
      type: chargeData.type,
      taxApplicable: chargeData.taxApplicable,
      orderType: chargeData.orderType,
      appliedAs: chargeData.appliedAs,
      automaticApply: chargeData.automaticApply,
      minSeats: chargeData.minSeats,
      requiresManagerPin: chargeData.requiresManagerPin,
      archived: false,
    };
    saveServiceCharges([...serviceCharges, newCharge]);
    setShowAddScreen(false);
  };

  const handleEditServiceCharge = (updatedCharge: ServiceCharge) => {
    const updatedCharges = serviceCharges.map(charge => 
      charge.id === updatedCharge.id ? updatedCharge : charge
    );
    saveServiceCharges(updatedCharges);
    setChargeToEdit(null);
  };

  const handleArchiveServiceCharge = (charge: ServiceCharge) => {
    setChargeToArchive(charge);
  };

  const confirmArchiveServiceCharge = () => {
    if (chargeToArchive) {
      const updatedCharges = serviceCharges.map(charge => 
        charge.id === chargeToArchive.id ? { ...charge, archived: !charge.archived } : charge
      );
      saveServiceCharges(updatedCharges);
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
                className="absolute left-4 w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center active:opacity-70 transition-opacity"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
            )}
            <div className="flex items-center gap-1">
              <h1 className="text-lg font-semibold text-foreground">Service Charge</h1>
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
            <AnimatedAIIcon size={20} onClick={onAIClick || (() => navigate('/settings/ai'))} />
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
        <div className="px-6 pt-5">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        </div>
      )}

      <div className="px-6 pt-4 pb-8">
        {/* Header Card */}
        <div className={`bg-neutral-800/60 rounded-2xl p-6 mb-6 flex flex-col ${isMobile ? 'items-start' : 'items-center text-center'}`}>
          {/* Service Charge Icon */}
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: "#FF3F7D" }}
          >
            <img src={serviceChargeIcon} alt="Service Charge" className="w-8 h-8 object-contain" />
          </div>

          {/* Title */}
          <h1 className="text-xl font-semibold text-foreground mb-2">Service Charge</h1>

          {/* Description */}
          <p className="text-base text-neutral-400 leading-relaxed max-w-2xl">
            Configure automatic service charges for orders and specific scenarios like large parties, delivery fees, or private events.
          </p>
        </div>

        {/* Search and Action Buttons Row */}
        <div className="flex items-center gap-4 mb-6">
          {/* Search Bar */}
          <div className="flex-1 bg-neutral-800/60 rounded-full flex items-center px-4 py-3">
            <Search className="w-5 h-5 text-neutral-500 mr-3" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-foreground placeholder:text-neutral-500 outline-none text-base"
            />
            <Mic className="w-5 h-5 text-neutral-500" />
          </div>

          <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />

          {/* Archive Button */}
          <button 
            onClick={() => setShowArchived(!showArchived)}
            className={`px-6 py-3 rounded-full flex items-center gap-2 transition-colors ${
              showArchived 
                ? "bg-neutral-700 border border-neutral-600" 
                : "bg-neutral-800/60 border border-neutral-700"
            }`}
          >
            <Archive className="w-5 h-5 text-foreground" />
            <span className="text-foreground font-medium text-base">Archive</span>
          </button>

          {/* Add Button */}
          <button 
            onClick={() => setShowAddScreen(true)}
            className="px-6 py-3 bg-neutral-800/60 rounded-full flex items-center gap-2 active:opacity-70 transition-opacity border border-neutral-700"
          >
            <Plus className="w-5 h-5 text-foreground" />
            <span className="text-foreground font-medium text-base">Add</span>
          </button>
        </div>

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
