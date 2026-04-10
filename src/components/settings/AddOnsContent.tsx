import { useEffect, useMemo, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, Mic, Archive } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
import { useAppearance } from "@/contexts/AppearanceContext";
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
import addonsIcon from "@/assets/icons/menu-addons.png";
import SwipeableSettingsItem from "./SwipeableSettingsItem";

interface AddOn {
  id: string;
  name: string;
  price: number;
  active: boolean;
  sort_order: number;
}

interface AddOnsContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const AddOnsContent = ({ showHeader = true, onBack, onAIClick }: AddOnsContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { getIconBgColor } = useAppearance();
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [itemToArchive, setItemToArchive] = useState<AddOn | null>(null);

  const fetchAddOns = useCallback(async () => {
    const { data, error } = await supabase
      .from("add_ons")
      .select("id, name, price, active, sort_order")
      .order("sort_order");
    if (data) setAddOns(data);
    if (error) console.error("Failed to fetch add-ons", error);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAddOns();

    const channel = supabase
      .channel("add_ons-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "add_ons" }, () => {
        fetchAddOns();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchAddOns]);

  const handleArchiveItem = (item: AddOn) => {
    setItemToArchive(item);
  };

  const confirmArchiveItem = async () => {
    if (!itemToArchive) return;
    const newActive = !itemToArchive.active;
    const { error } = await supabase
      .from("add_ons")
      .update({ active: newActive })
      .eq("id", itemToArchive.id);
    if (error) {
      toast({ title: "Error", description: "Failed to update add-on", variant: "destructive" });
    } else {
      setAddOns(prev => prev.map(a => a.id === itemToArchive.id ? { ...a, active: newActive } : a));
    }
    setItemToArchive(null);
  };

  const filteredItems = useMemo(() => {
    return addOns.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      // showArchived = true → show inactive; false → show active
      const matchesFilter = showArchived ? !item.active : item.active;
      return matchesSearch && matchesFilter;
    });
  }, [addOns, searchQuery, showArchived]);

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
                {showArchived ? "Archived Add-Ons" : "Add-Ons"}
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
              {itemToArchive && !itemToArchive.active ? "Restore Add-On" : "Archive Add-On"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              {itemToArchive && !itemToArchive.active
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
              {itemToArchive && !itemToArchive.active ? "Restore" : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AddOnsContent;
