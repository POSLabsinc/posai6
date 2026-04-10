import { useMemo, useState, useEffect } from "react";
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
import SwipeableSettingsItem from "./SwipeableSettingsItem";

interface Group {
  id: string;
  name: string;
  type: string;
  archived: boolean;
}

interface GroupsContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const GroupsContent = ({ showHeader = true, onBack, onAIClick }: GroupsContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { getIconBgColor } = useAppearance();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [itemToArchive, setItemToArchive] = useState<Group | null>(null);

  const fetchGroups = async () => {
    const { data, error } = await (supabase as any)
      .from("groups")
      .select("*")
      .order("sort_order");
    if (data) {
      setGroups(data.map((g: any) => ({
        id: g.id,
        name: g.name,
        type: g.type,
        archived: g.archived,
      })));
    }
    if (error) console.error("Failed to fetch groups", error);
    setLoading(false);
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleArchiveItem = (item: Group) => {
    setItemToArchive(item);
  };

  const confirmArchiveItem = async () => {
    if (itemToArchive) {
      const { error } = await (supabase as any).from("groups").update({
        archived: !itemToArchive.archived,
      }).eq("id", itemToArchive.id);
      if (!error) await fetchGroups();
      setItemToArchive(null);
    }
  };

  const filteredItems = useMemo(() => {
    return groups.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesArchiveFilter = showArchived ? item.archived : !item.archived;
      return matchesSearch && matchesArchiveFilter;
    });
  }, [groups, searchQuery, showArchived]);

  if (loading) {
    return <div className="h-full flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  // Desktop / Tablet layout
  if (!isMobile) {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-background">
        {showHeader && (
          <div className="flex items-center justify-between pt-0 pb-2 relative overflow-visible px-4">
            {onBack && (
              <button onClick={onBack} className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity" aria-label="Back">
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
            )}
            {!onBack && <div className="w-8 h-8" />}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              <h1 className="text-base font-medium text-foreground">
                {showArchived ? "Archived Groups" : "Groups"}
              </h1>
            </div>
      </div>

      <AlertDialog open={!!itemToArchive} onOpenChange={() => setItemToArchive(null)}>
        <AlertDialogContent className="bg-neutral-800 border-neutral-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">{itemToArchive?.archived ? "Restore Group" : "Archive Group"}</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              {itemToArchive?.archived ? `Are you sure you want to restore "${itemToArchive?.name}"?` : `Are you sure you want to archive "${itemToArchive?.name}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-neutral-700 text-foreground border-neutral-600 hover:bg-neutral-600">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmArchiveItem} className="bg-primary text-primary-foreground hover:bg-primary/90">{itemToArchive?.archived ? "Restore" : "Archive"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GroupsContent;
