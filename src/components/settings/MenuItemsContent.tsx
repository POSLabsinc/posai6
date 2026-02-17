import { useMemo, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, Mic, Archive } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { SettingsManager, MenuItem as SettingsMenuItem } from "@/lib/settingsManager";
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
import menuSettingsIcon from "@/assets/icons/menu-settings.png";
import AddMenuItemContent from "./AddMenuItemContent";
import EditMenuItemContent from "./EditMenuItemContent";
import SwipeableSettingsItem from "./SwipeableSettingsItem";
import { format } from "date-fns";

// Internal UI representation - extends SettingsManager MenuItem with additional fields
interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  archived: boolean;
  enabled: boolean;
  startDate: string | null;
  endDate: string | null;
  pointOfSale?: boolean;
  pointOfPurchase?: boolean;
  selfServiceKiosk?: boolean;
  onlineOrders?: boolean;
  categories?: boolean;
  reorderCategories?: boolean;
  operationCategories?: string;
  organize?: string;
  revenueCenters?: string;
  // Fields from SettingsManager MenuItem interface
  isActive?: boolean;
  posEnabled?: boolean;
  popEnabled?: boolean;
  kioskEnabled?: boolean;
  onlineEnabled?: boolean;
}

interface MenuItemsContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const STORAGE_KEY = "menu-items-settings";

// Convert SettingsManager format to UI format
const convertFromSettingsManager = (items: SettingsMenuItem[]): MenuItem[] => {
  return items.map(item => ({
    id: item.id,
    name: item.name,
    price: 0,
    category: item.isActive ? "Active" : "Inactive",
    archived: false,
    enabled: item.isActive,
    startDate: item.startDate || null,
    endDate: item.endDate || null,
    isActive: item.isActive,
    posEnabled: item.posEnabled,
    popEnabled: item.popEnabled,
    kioskEnabled: item.kioskEnabled,
    onlineEnabled: item.onlineEnabled,
    pointOfSale: item.posEnabled,
    pointOfPurchase: item.popEnabled,
    selfServiceKiosk: item.kioskEnabled,
    onlineOrders: item.onlineEnabled,
  }));
};

const MenuItemsContent = ({ showHeader = true, onBack, onAIClick }: MenuItemsContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  // Initialize from SettingsManager
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const settingsItems = SettingsManager.getMenuItems();
    return convertFromSettingsManager(settingsItems);
  });

  // Listen for AI-driven settings updates
  useEffect(() => {
    const handleSettingsUpdate = (event: CustomEvent) => {
      const { type, data } = event.detail || {};
      if (type === 'menus' && Array.isArray(data)) {
        console.log('[MenuItemsContent] Received menus update from SettingsManager:', data);
        setMenuItems(convertFromSettingsManager(data));
      }
    };

    window.addEventListener('settings-updated', handleSettingsUpdate as EventListener);
    return () => {
      window.removeEventListener('settings-updated', handleSettingsUpdate as EventListener);
    };
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [itemToArchive, setItemToArchive] = useState<MenuItem | null>(null);
  const [showAddScreen, setShowAddScreen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const handleAddMenu = (menu: {
    name: string;
    pointOfSale: boolean;
    pointOfPurchase: boolean;
    selfServiceKiosk: boolean;
    onlineOrders: boolean;
    categories: boolean;
    reorderCategories: boolean;
    operationCategories: string;
    organize: string;
    revenueCenters: string;
  }) => {
    const newItem: MenuItem = {
      id: Date.now().toString(),
      name: menu.name,
      price: 0,
      category: "Active",
      archived: false,
      enabled: true,
      startDate: new Date().toISOString().split('T')[0],
      endDate: null,
      ...menu,
    };
    saveMenuItems([...menuItems, newItem]);
  };

  const saveMenuItems = (newItems: MenuItem[]) => {
    setMenuItems(newItems);
    // Also persist to localStorage with SettingsManager format
    const settingsFormat = newItems.map(item => ({
      id: item.id,
      name: item.name,
      isActive: item.enabled,
      startDate: item.startDate || undefined,
      endDate: item.endDate || undefined,
      posEnabled: item.posEnabled ?? item.pointOfSale ?? true,
      popEnabled: item.popEnabled ?? item.pointOfPurchase,
      kioskEnabled: item.kioskEnabled ?? item.selfServiceKiosk,
      onlineEnabled: item.onlineEnabled ?? item.onlineOrders,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsFormat));
  };

  const handleToggleEnabled = (itemId: string) => {
    const updatedItems = menuItems.map(item =>
      item.id === itemId ? { ...item, enabled: !item.enabled } : item
    );
    saveMenuItems(updatedItems);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "MMM d, yyyy");
    } catch {
      return "—";
    }
  };

  const handleArchiveItem = (item: MenuItem) => {
    setItemToArchive(item);
  };

  const confirmArchiveItem = () => {
    if (itemToArchive) {
      const updatedItems = menuItems.map(item => 
        item.id === itemToArchive.id ? { ...item, archived: !item.archived } : item
      );
      saveMenuItems(updatedItems);
      setItemToArchive(null);
    }
  };

  const handleEditItem = (updatedItem: MenuItem) => {
    const updatedItems = menuItems.map(item =>
      item.id === updatedItem.id ? updatedItem : item
    );
    saveMenuItems(updatedItems);
  };

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesArchiveFilter = showArchived ? item.archived : !item.archived;
      return matchesSearch && matchesArchiveFilter;
    });
  }, [menuItems, searchQuery, showArchived]);

  // Show Edit Screen
  if (editingItem) {
    return (
      <EditMenuItemContent
        item={editingItem}
        onBack={() => setEditingItem(null)}
        onSave={handleEditItem}
      />
    );
  }

  // Show Add Screen
  if (showAddScreen) {
    return (
      <AddMenuItemContent
        onBack={() => setShowAddScreen(false)}
        onSave={handleAddMenu}
      />
    );
  }

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
              <img src={menuSettingsIcon} alt="Menu" className="h-8 w-8 object-contain" />
            </div>
            <h1 className="text-2xl font-semibold leading-tight text-foreground">Menu Items</h1>
            <p className="mx-auto mt-2 max-w-3xl text-[15px] leading-relaxed text-[hsl(var(--text-subtle))]">
              Manage your menu items including names, prices, categories, and availability settings.
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
              onClick={() => setShowAddScreen(true)}
              className="h-12 rounded-full px-10 flex items-center justify-center gap-2 bg-[hsl(var(--surface-3))] text-foreground active:opacity-70 transition-opacity"
            >
              <Plus className="h-5 w-5" />
              <span className="text-[15px] font-semibold">Add</span>
            </button>
          </section>

          {/* Table */}
          <section className="mt-6 rounded-2xl bg-[hsl(var(--surface-2))] overflow-hidden">
            <div className="grid grid-cols-[1.5fr_120px_120px_80px_24px] items-center px-8 py-5 border-b border-[hsl(var(--surface-border))]">
              <span className="text-[15px] font-semibold text-foreground">Menu Name</span>
              <span className="text-[15px] font-semibold text-foreground text-center">Start Date</span>
              <span className="text-[15px] font-semibold text-foreground text-center">End Date</span>
              <span className="text-[15px] font-semibold text-foreground text-center">Status</span>
              <span />
            </div>

            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <div key={item.id}>
                  {index > 0 && <div className="h-px bg-[hsl(var(--surface-border))]" />}
                  <div 
                    className="grid grid-cols-[1.5fr_120px_120px_80px_24px] items-center px-8 py-5 w-full hover:bg-neutral-700/30 transition-colors cursor-pointer"
                    onClick={() => setEditingItem(item)}
                  >
                    <span className="text-[15px] font-semibold text-foreground text-left">{item.name}</span>
                    <span className="text-[15px] text-[hsl(var(--text-subtle))] text-center">{formatDate(item.startDate)}</span>
                    <span className="text-[15px] text-[hsl(var(--text-subtle))] text-center">{formatDate(item.endDate)}</span>
                    <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={item.enabled}
                        onCheckedChange={() => handleToggleEnabled(item.id)}
                      />
                    </div>
                    <ChevronRight className="h-5 w-5 text-[hsl(var(--text-subtle))] justify-self-end" />
                  </div>
                </div>
              ))
            ) : (
              <div className="px-8 py-10 text-center text-[hsl(var(--text-subtle))]">
                {showArchived ? "No archived items" : "No items found"}
              </div>
            )}
          </section>
        </div>

        {/* Archive Confirmation Dialog */}
        <AlertDialog open={!!itemToArchive} onOpenChange={() => setItemToArchive(null)}>
          <AlertDialogContent className="bg-[hsl(var(--surface-2))] border-[hsl(var(--surface-border))]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">
                {itemToArchive?.archived ? "Restore Item" : "Archive Item"}
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
            <h1 className="text-lg font-semibold text-foreground">Menu Items</h1>
            <button
              onClick={() => {
                toast({
                  description: "Manage your menu items including names, prices, categories, and availability settings.",
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
          <div className="grid grid-cols-[1fr_80px_80px_24px] items-center py-4 px-4 border-b border-neutral-700/50">
            <span className="text-neutral-400 text-base font-medium text-left">Menu Name</span>
            <span className="text-neutral-400 text-base font-medium text-center">Start</span>
            <span className="text-neutral-400 text-base font-medium text-center">End</span>
            <span />
          </div>

          {/* Rows */}
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <div key={item.id}>
                {index > 0 && <div className="h-px bg-neutral-700/50 mx-4" />}
                <SwipeableSettingsItem
                  onTap={() => setEditingItem(item)}
                  onArchive={() => handleArchiveItem(item)}
                  isArchived={item.archived}
                >
                  <div className="grid grid-cols-[1fr_80px_80px_24px] items-center w-full py-4 px-4">
                    <span className="text-foreground text-base font-medium text-left">{item.name}</span>
                    <span className="text-neutral-400 text-sm text-center">{formatDate(item.startDate)}</span>
                    <span className="text-neutral-400 text-sm text-center">{formatDate(item.endDate)}</span>
                    <ChevronRight className="w-4 h-4 text-neutral-500 justify-self-end" />
                  </div>
                </SwipeableSettingsItem>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-neutral-500">
              {showArchived ? "No archived items" : "No items found"}
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
              {itemToArchive?.archived ? "Restore Item" : "Archive Item"}
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

export default MenuItemsContent;
