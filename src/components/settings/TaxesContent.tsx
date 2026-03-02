import { useMemo } from "react";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, Mic, Archive } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useIsMobile } from "@/hooks/use-mobile";
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
import AddTaxContent from "./AddTaxContent";
import EditTaxContent from "./EditTaxContent";
import SwipeableTaxItem from "./SwipeableTaxItem";

interface Tax {
  id: string;
  name: string;
  amount: number;
  type: "Exclusive" | "Inclusive";
  archived: boolean;
  applicableTo?: string;
  applicableProducts?: string[];
}

interface TaxesContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const STORAGE_KEY = "taxes-settings";

const defaultTaxes: Tax[] = [];

const TaxesContent = ({ showHeader = true, onBack, onAIClick }: TaxesContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  // Use settings sync hook to listen for AI-driven updates
  const [taxes, setTaxes] = useSettingsSync<Tax[]>(
    'taxes',
    STORAGE_KEY,
    defaultTaxes
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [taxToArchive, setTaxToArchive] = useState<Tax | null>(null);
  const [showAddScreen, setShowAddScreen] = useState(false);
  const [taxToEdit, setTaxToEdit] = useState<Tax | null>(null);

  const saveTaxes = (newTaxes: Tax[]) => {
    setTaxes(newTaxes);
  };

  const handleAddTax = (taxData: {
    name: string;
    amount: number;
    type: "Exclusive" | "Inclusive";
    applicableTo: string;
    applicableProducts: string[];
  }) => {
    const newTax: Tax = {
      id: Date.now().toString(),
      name: taxData.name,
      amount: taxData.amount,
      type: taxData.type,
      applicableTo: taxData.applicableTo,
      applicableProducts: taxData.applicableProducts,
      archived: false,
    };
    saveTaxes([...taxes, newTax]);
    setShowAddScreen(false);
  };

  const handleEditTax = (updatedTax: Tax) => {
    const updatedTaxes = taxes.map(tax => 
      tax.id === updatedTax.id ? updatedTax : tax
    );
    saveTaxes(updatedTaxes);
    setTaxToEdit(null);
  };

  const handleArchiveTax = (tax: Tax) => {
    setTaxToArchive(tax);
  };

  const confirmArchiveTax = () => {
    if (taxToArchive) {
      const updatedTaxes = taxes.map(tax => 
        tax.id === taxToArchive.id ? { ...tax, archived: !tax.archived } : tax
      );
      saveTaxes(updatedTaxes);
      setTaxToArchive(null);
    }
  };

  const filteredTaxes = useMemo(() => {
    return taxes.filter((tax) => {
      const matchesSearch = tax.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesArchiveFilter = showArchived ? tax.archived : !tax.archived;
      return matchesSearch && matchesArchiveFilter;
    });
  }, [taxes, searchQuery, showArchived]);

  if (showAddScreen) {
    return (
      <AddTaxContent 
        onBack={() => setShowAddScreen(false)} 
        onSave={handleAddTax} 
      />
    );
  }

  if (taxToEdit) {
    return (
      <EditTaxContent 
        tax={taxToEdit}
        onBack={() => setTaxToEdit(null)} 
        onSave={handleEditTax} 
      />
    );
  }

  // Desktop / Tablet layout (do not affect mobile)
  if (!isMobile) {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-background">
        {showHeader && onBack && (
          <div className="flex items-center justify-between pt-4 pb-2 relative overflow-visible px-4">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-[hsl(var(--surface-1))] flex items-center justify-center active:opacity-70 transition-opacity"
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              <h1 className="text-base font-medium text-foreground">
                {showArchived ? "Archived Taxes" : "Taxes"}
              </h1>
            </div>
            <div className="overflow-visible flex items-center justify-center" style={{ width: 32, height: 32 }}>
              <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-hide px-6 pb-6 pt-4">
          {/* Description */}
          <div className="mb-4 px-1">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Taxes are levies imposed on financial transactions or income, collected by government authorities to fund public services and infrastructure.
            </p>
          </div>

          {/* Search + actions row */}
          <section className="flex items-center gap-2 lg:gap-4 mb-6">
            <div className="flex-1 min-w-0 rounded-full bg-[hsl(var(--surface-1))] px-5 py-3 flex items-center gap-3">
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
              className="h-12 rounded-full px-5 lg:px-10 flex-shrink-0 flex items-center justify-center gap-2 bg-[hsl(var(--surface-3))] text-foreground active:opacity-70 transition-opacity"
            >
              <Plus className="h-5 w-5" />
              <span className="text-[15px] font-semibold">Add</span>
            </button>
          </section>

          {/* Table */}
          <section className="mt-6 rounded-2xl bg-[#26262699] overflow-hidden">
            <div className="grid grid-cols-[1.2fr_140px_160px_24px] items-center px-8 py-5 border-b border-[hsl(var(--surface-border))]">
              <span className="text-[15px] font-semibold text-foreground">Tax Name</span>
              <span className="text-[15px] font-semibold text-foreground text-center">Amount</span>
              <span className="text-[15px] font-semibold text-foreground text-right">Type</span>
              <span />
            </div>

            {filteredTaxes.length > 0 ? (
              filteredTaxes.map((tax, index) => (
                <div key={tax.id}>
                  {index > 0 && <div className="h-px bg-[hsl(var(--surface-border))]" />}
                  {/* Keep swipe component (desktop users will just click; no behavior change) */}
                  <SwipeableTaxItem
                    onTap={() => setTaxToEdit(tax)}
                    onArchive={() => handleArchiveTax(tax)}
                    isArchived={tax.archived}
                  >
                    <div className="grid grid-cols-[1.2fr_140px_160px_24px] items-center px-8 py-5 w-full">
                      <span className="text-[15px] font-semibold text-foreground">{tax.name}</span>
                      <span className="text-[15px] text-foreground text-center">{tax.amount}%</span>
                      <span className="text-[15px] text-[hsl(var(--text-subtle))] text-right">{tax.type}</span>
                      <ChevronRight className="h-5 w-5 text-[hsl(var(--text-subtle))] justify-self-end" />
                    </div>
                  </SwipeableTaxItem>
                </div>
              ))
            ) : (
              <div className="px-8 py-10 text-center text-[hsl(var(--text-subtle))]">
                {showArchived ? "No archived taxes" : "No taxes found"}
              </div>
            )}
          </section>
        </div>

        {/* Archive Confirmation Dialog (unchanged) */}
        <AlertDialog open={!!taxToArchive} onOpenChange={() => setTaxToArchive(null)}>
          <AlertDialogContent className="bg-[#26262699] border-[hsl(var(--surface-border))]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">
                {taxToArchive?.archived ? "Restore Tax" : "Archive Tax"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[hsl(var(--text-subtle))]">
                {taxToArchive?.archived
                  ? `Are you sure you want to restore "${taxToArchive?.name}"? It will appear in your active taxes list.`
                  : `Are you sure you want to archive "${taxToArchive?.name}"? You can restore it later from the archive.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-[hsl(var(--surface-3))] text-foreground border-[hsl(var(--surface-border))] hover:bg-[hsl(var(--surface-3))]">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmArchiveTax} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {taxToArchive?.archived ? "Restore" : "Archive"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {showHeader && (
        <div className="flex items-center justify-between pt-4 pb-2 relative overflow-visible px-4">
          {onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          )}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            <h1 className="text-base font-medium text-foreground">Taxes</h1>
          </div>
          <div className="overflow-visible flex items-center justify-center" style={{ width: 32, height: 32 }}>
            <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-4">
        {/* Description */}
        <div className="mb-4 px-1 pt-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Taxes are levies imposed on financial transactions or income, collected by government authorities to fund public services and infrastructure.
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

        {/* Tax Table */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_80px_100px] items-center py-4 px-4 border-b border-neutral-700/50">
            <span className="text-neutral-400 text-base font-medium text-left">Tax Name</span>
            <span className={`text-neutral-400 text-base font-medium ${isMobile ? 'text-center' : 'text-right'}`}>Amount</span>
            <span className="text-neutral-400 text-base font-medium text-right pr-6">Type</span>
          </div>

          {/* Tax Rows */}
          {filteredTaxes.length > 0 ? (
            filteredTaxes.map((tax, index) => (
              <div key={tax.id}>
                {index > 0 && <div className="h-px bg-neutral-700/50 mx-4" />}
                <SwipeableTaxItem
                  onTap={() => setTaxToEdit(tax)}
                  onArchive={() => handleArchiveTax(tax)}
                  isArchived={tax.archived}
                >
                  <div className="grid grid-cols-[1fr_80px_100px] items-center w-full py-4 px-4">
                    <span className="text-foreground text-base font-medium text-left">{tax.name}</span>
                    <span className={`text-foreground text-base ${isMobile ? 'text-center' : 'text-right'}`}>{tax.amount}%</span>
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-neutral-400 text-base">{tax.type}</span>
                      <ChevronRight className="w-4 h-4 text-neutral-500" />
                    </div>
                  </div>
                </SwipeableTaxItem>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-neutral-500">
              {showArchived ? "No archived taxes" : "No taxes found"}
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
      <AlertDialog open={!!taxToArchive} onOpenChange={() => setTaxToArchive(null)}>
        <AlertDialogContent className="bg-neutral-800 border-neutral-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              {taxToArchive?.archived ? "Restore Tax" : "Archive Tax"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              {taxToArchive?.archived 
                ? `Are you sure you want to restore "${taxToArchive?.name}"? It will appear in your active taxes list.`
                : `Are you sure you want to archive "${taxToArchive?.name}"? You can restore it later from the archive.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-neutral-700 text-foreground border-neutral-600 hover:bg-neutral-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmArchiveTax}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {taxToArchive?.archived ? "Restore" : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TaxesContent;
