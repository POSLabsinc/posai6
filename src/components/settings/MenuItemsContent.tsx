import { useMemo, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, Mic, Archive } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
import { useAppearance } from "@/contexts/AppearanceContext";
import { Switch } from "@/components/ui/switch";
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
import infoIcon from "@/assets/icons/info.png";
import SwipeableSettingsItem from "./SwipeableSettingsItem";
import { format } from "date-fns";

interface DbMenu {
  id: string;
  name: string;
  enabled: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
  sort_order: number;
}

function useDbMenus() {
  const [menus, setMenus] = useState<DbMenu[]>([]);

  const fetchMenus = useCallback(async () => {
    const { data } = await supabase
      .from("menus")
      .select("id, name, enabled, archived, created_at, updated_at, sort_order")
      .order("sort_order");
    if (data) setMenus(data);
  }, []);

  useEffect(() => {
    fetchMenus();
    const channel = supabase
      .channel("menu-items-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "menus" }, () => {
        fetchMenus();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchMenus]);

  const toggleEnabled = async (menu: DbMenu) => {
    const newEnabled = !menu.enabled;
    // Optimistic update
    setMenus((prev) => prev.map((m) => m.id === menu.id ? { ...m, enabled: newEnabled } : m));
    await supabase.from("menus").update({ enabled: newEnabled }).eq("id", menu.id);
  };

  const archiveMenu = async (menu: DbMenu) => {
    setMenus((prev) => prev.map((m) => m.id === menu.id ? { ...m, archived: true, enabled: false } : m));
    await supabase.from("menus").update({ archived: true, enabled: false }).eq("id", menu.id);
  };

  const unarchiveMenu = async (menu: DbMenu) => {
    setMenus((prev) => prev.map((m) => m.id === menu.id ? { ...m, archived: false } : m));
    await supabase.from("menus").update({ archived: false }).eq("id", menu.id);
  };

  return { menus, toggleEnabled, archiveMenu, unarchiveMenu };
}

interface MenuItemsContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const MenuItemsContent = ({ showHeader = true, onBack, onAIClick }: MenuItemsContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { getIconBgColor } = useAppearance();
  
  const { menus, toggleEnabled, archiveMenu, unarchiveMenu } = useDbMenus();

  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [itemToArchive, setItemToArchive] = useState<DbMenu | null>(null);

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "MMM d, yyyy");
    } catch {
      return "—";
    }
  };

  const confirmArchiveItem = async () => {
    if (itemToArchive) {
      if (itemToArchive.archived) {
        await unarchiveMenu(itemToArchive);
        toast({ description: `"${itemToArchive.name}" has been restored.`, duration: 3000 });
      } else {
        await archiveMenu(itemToArchive);
        toast({ description: `"${itemToArchive.name}" has been archived.`, duration: 3000 });
      }
      setItemToArchive(null);
    }
  };

  const filteredItems = useMemo(() => {
    return menus.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesArchived = showArchived ? item.archived === true : item.archived !== true;
      return matchesSearch && matchesArchived;
    });
  }, [menus, searchQuery, showArchived]);

  const archivedCount = useMemo(() => menus.filter(m => m.archived === true).length, [menus]);

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
                {showArchived ? "Archived Menus" : "Menu Items"}
              </h1>
            </div>
            <div className="overflow-visible flex items-center justify-center" style={{ width: 32, height: 32 }}>
        </div>
      </div>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={!!itemToArchive} onOpenChange={() => setItemToArchive(null)}>
        <AlertDialogContent className="bg-neutral-800 border-neutral-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              {itemToArchive?.archived ? "Restore Menu" : "Archive Menu"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              {itemToArchive?.archived
                ? `Are you sure you want to restore "${itemToArchive?.name}"?`
                : `Are you sure you want to archive "${itemToArchive?.name}"? It will be moved to the archived section.`}
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
