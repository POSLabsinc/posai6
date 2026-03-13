import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, Mic, Archive } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
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
import modifiersIcon from "@/assets/icons/menu-modifiers.png";
import SwipeableSettingsItem from "./SwipeableSettingsItem";
import AddModifierContent from "./AddModifierContent";
import EditModifierContent from "./EditModifierContent";

interface ModifierOption {
  id: string;
  name: string;
  price: string;
}

interface Modifier {
  id: string;
  name: string;
  type: string;
  selectedOptions: number;
  price: number;
  archived: boolean;
  orderTypeTags?: string[];
  canBeServed?: boolean;
  is86?: boolean;
  hasOptions?: boolean;
  options?: ModifierOption[];
  hasMaxSelections?: boolean;
  maxSelections?: number;
}

interface ModifiersContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const STORAGE_KEY = "modifiers-settings";

const defaultModifiers: Modifier[] = [
  { id: "1", name: "75% Sugar", type: "Regular", selectedOptions: 1, price: 1.00, archived: false },
  { id: "2", name: "Blackberry", type: "Regular", selectedOptions: 1, price: 0.00, archived: false },
  { id: "3", name: "Brioche", type: "Regular", selectedOptions: 1, price: 0.00, archived: false },
  { id: "4", name: "Cajeta Dip", type: "Regular", selectedOptions: 1, price: 0.00, archived: false },
  { id: "5", name: "Candied Nuts", type: "Regular", selectedOptions: 1, price: 0.00, archived: false },
  { id: "6", name: "Chamomile Tea", type: "Regular", selectedOptions: 1, price: 0.00, archived: false },
  { id: "7", name: "Chili Infused Honey", type: "Regular", selectedOptions: 1, price: 0.00, archived: false },
];

const ModifiersContent = ({ showHeader = true, onBack, onAIClick }: ModifiersContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { getIconBgColor } = useAppearance();
  const [modifiers, setModifiers] = useState<Modifier[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse modifiers from localStorage", e);
      }
    }
    return defaultModifiers;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [itemToArchive, setItemToArchive] = useState<Modifier | null>(null);
  const [showAddScreen, setShowAddScreen] = useState(false);
  const [editingModifier, setEditingModifier] = useState<Modifier | null>(null);

  const saveModifiers = (newItems: Modifier[]) => {
    setModifiers(newItems);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
  };

  const handleArchiveItem = (item: Modifier) => {
    setItemToArchive(item);
  };

  const confirmArchiveItem = () => {
    if (itemToArchive) {
      const updatedItems = modifiers.map(mod => 
        mod.id === itemToArchive.id ? { ...mod, archived: !mod.archived } : mod
      );
      saveModifiers(updatedItems);
      setItemToArchive(null);
    }
  };

  const filteredItems = useMemo(() => {
    return modifiers.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesArchiveFilter = showArchived ? item.archived : !item.archived;
      return matchesSearch && matchesArchiveFilter;
    });
  }, [modifiers, searchQuery, showArchived]);

  const handleAddModifier = (data: {
    name: string;
    orderTypeTags: string[];
    canBeServed: boolean;
    is86: boolean;
    hasOptions: boolean;
    options: { id: string; name: string; price: string }[];
    hasMaxSelections: boolean;
    maxSelections: number;
  }) => {
    const newModifier: Modifier = {
      id: Date.now().toString(),
      name: data.name,
      type: "Regular",
      selectedOptions: data.hasOptions ? data.options.length : 0,
      price: data.hasOptions && data.options.length > 0 
        ? parseFloat(data.options[0].price) || 0 
        : 0,
      archived: false,
    };
    const updatedModifiers = [...modifiers, newModifier];
    saveModifiers(updatedModifiers);
    setShowAddScreen(false);
    toast({
      title: "Success",
      description: `Modifier "${data.name}" has been added`,
    });
  };

  const handleEditModifier = (data: {
    id: string;
    name: string;
    orderTypeTags: string[];
    canBeServed: boolean;
    is86: boolean;
    hasOptions: boolean;
    options: { id: string; name: string; price: string }[];
    hasMaxSelections: boolean;
    maxSelections: number;
  }) => {
    const updatedModifiers = modifiers.map(mod => {
      if (mod.id === data.id) {
        return {
          ...mod,
          name: data.name,
          orderTypeTags: data.orderTypeTags,
          canBeServed: data.canBeServed,
          is86: data.is86,
          hasOptions: data.hasOptions,
          options: data.options,
          hasMaxSelections: data.hasMaxSelections,
          maxSelections: data.maxSelections,
          selectedOptions: data.hasOptions ? data.options.length : 0,
          price: data.hasOptions && data.options.length > 0 
            ? parseFloat(data.options[0].price) || 0 
            : mod.price,
        };
      }
      return mod;
    });
    saveModifiers(updatedModifiers);
    toast({
      title: "Success",
      description: `Modifier "${data.name}" has been updated`,
    });
  };

  // Show Edit Modifier screen
  if (editingModifier) {
    return (
      <EditModifierContent
        modifier={editingModifier}
        onBack={() => setEditingModifier(null)}
        onSave={(data) => {
          handleEditModifier(data);
          setEditingModifier(null);
        }}
      />
    );
  }

  // Show Add Modifier screen
  if (showAddScreen) {
    return (
      <AddModifierContent
        onBack={() => setShowAddScreen(false)}
        onSave={handleAddModifier}
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
                {showArchived ? "Archived Modifiers" : "Modifiers"}
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
                ? "View and restore your archived modifiers."
                : "Create and manage modifiers that customers can use to customize their orders."}
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
              onClick={() => setShowAddScreen(true)}
              className="h-12 rounded-full px-5 lg:px-10 flex-shrink-0 flex items-center justify-center gap-2 bg-neutral-800/60 text-foreground active:opacity-70 transition-opacity"
            >
              <Plus className="h-5 w-5" />
              <span className="text-[15px] font-semibold">Add</span>
            </button>
          </section>

          {/* Table */}
          <section className="mt-6 rounded-2xl bg-neutral-800/60 overflow-hidden">
            <div className="grid grid-cols-[1.5fr_1fr_1fr_100px_24px] items-center px-8 py-5 border-b border-neutral-700/50">
              <span className="text-[15px] font-semibold text-foreground">Modifier Name</span>
              <span className="text-[15px] font-semibold text-foreground text-center">Type</span>
              <span className="text-[15px] font-semibold text-foreground text-center">Selected Options</span>
              <span className="text-[15px] font-semibold text-foreground text-right">Price</span>
              <span />
            </div>

            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <div key={item.id}>
                  {index > 0 && <div className="h-px bg-neutral-700/50" />}
                  <button 
                    onClick={() => setEditingModifier(item)}
                    className="grid grid-cols-[1.5fr_1fr_1fr_100px_24px] items-center px-8 py-5 w-full hover:bg-neutral-700/30 transition-colors text-left"
                  >
                    <span className="text-[15px] font-semibold text-foreground">{item.name}</span>
                    <span className="text-[15px] text-foreground text-center">{item.type}</span>
                    <span className="text-[15px] text-foreground text-center">{item.selectedOptions}</span>
                    <span className="text-[15px] text-[hsl(var(--text-subtle))] text-right">£ {(item.price ?? 0).toFixed(2)}</span>
                    <ChevronRight className="h-5 w-5 text-[hsl(var(--text-subtle))] justify-self-end" />
                  </button>
                </div>
              ))
            ) : (
              <div className="px-8 py-10 text-center text-[hsl(var(--text-subtle))]">
                {showArchived ? "No archived modifiers" : "No modifiers found"}
              </div>
            )}
          </section>
        </div>

        {/* Archive Confirmation Dialog */}
        <AlertDialog open={!!itemToArchive} onOpenChange={() => setItemToArchive(null)}>
          <AlertDialogContent className="bg-neutral-800/60 border-neutral-700/50">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">
                {itemToArchive?.archived ? "Restore Modifier" : "Archive Modifier"}
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
            <h1 className="text-lg font-semibold text-foreground">Modifiers</h1>
            <button
              onClick={() => {
                toast({
                  description: "Create and manage modifiers that customers can use to customize their orders.",
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

        {/* Table */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_70px] items-center py-4 px-4 border-b border-neutral-700/50">
            <span className="text-neutral-400 text-sm font-medium text-left">Modifier Name</span>
            <span className="text-neutral-400 text-sm font-medium text-center">Type</span>
            <span className="text-neutral-400 text-sm font-medium text-center">Selected Options</span>
            <span className="text-neutral-400 text-sm font-medium text-right pr-6">Price</span>
          </div>

          {/* Rows */}
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <div key={item.id}>
                {index > 0 && <div className="h-px bg-neutral-700/50 mx-4" />}
                <SwipeableSettingsItem
                  onTap={() => setEditingModifier(item)}
                  onArchive={() => handleArchiveItem(item)}
                  isArchived={item.archived}
                >
                  <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_70px] items-center w-full py-4 px-4">
                    <span className="text-foreground text-sm font-medium text-left">{item.name}</span>
                    <span className="text-foreground text-sm text-center">{item.type}</span>
                    <span className="text-foreground text-sm text-center">{item.selectedOptions}</span>
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-neutral-400 text-sm">£ {(item.price ?? 0).toFixed(2)}</span>
                      <ChevronRight className="w-4 h-4 text-neutral-500" />
                    </div>
                  </div>
                </SwipeableSettingsItem>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-neutral-500">
              {showArchived ? "No archived modifiers" : "No modifiers found"}
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
              {itemToArchive?.archived ? "Restore Modifier" : "Archive Modifier"}
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

export default ModifiersContent;
