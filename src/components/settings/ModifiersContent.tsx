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
import AddModifierContent from "./AddModifierContent";
import EditModifierContent from "./EditModifierContent";

interface Modifier {
  id: string;
  name: string;
  type: string;
  selectedOptions: number;
  price: number;
  archived: boolean;
  modifier_group_id?: string;
}

interface ModifiersContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const ModifiersContent = ({ showHeader = true, onBack, onAIClick }: ModifiersContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { getIconBgColor } = useAppearance();
  const [modifiers, setModifiers] = useState<Modifier[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [itemToArchive, setItemToArchive] = useState<Modifier | null>(null);
  const [showAddScreen, setShowAddScreen] = useState(false);
  const [editingModifier, setEditingModifier] = useState<Modifier | null>(null);
  const [defaultGroupId, setDefaultGroupId] = useState<string | null>(null);

  const fetchModifiers = async () => {
    // Ensure a default modifier group exists
    let groupId = defaultGroupId;
    if (!groupId) {
      const { data: groups } = await supabase
        .from("modifier_groups")
        .select("id")
        .eq("name", "Default")
        .limit(1);
      if (groups && groups.length > 0) {
        groupId = groups[0].id;
      } else {
        const { data: newGroup } = await supabase
          .from("modifier_groups")
          .insert({ name: "Default", active: true })
          .select("id")
          .single();
        if (newGroup) groupId = newGroup.id;
      }
      setDefaultGroupId(groupId);
    }

    const { data, error } = await supabase
      .from("modifiers")
      .select("*")
      .order("sort_order");
    if (data) {
      setModifiers(data.map((m: any) => ({
        id: m.id,
        name: m.name,
        type: m.is_default ? "Default" : "Regular",
        selectedOptions: 1,
        price: Number(m.price) || 0,
        archived: !m.active,
        modifier_group_id: m.modifier_group_id,
      })));
    }
    if (error) console.error("Failed to fetch modifiers", error);
    setLoading(false);
  };

  useEffect(() => {
    fetchModifiers();
  }, []);

  const handleArchiveItem = (item: Modifier) => {
    setItemToArchive(item);
  };

  const confirmArchiveItem = async () => {
    if (itemToArchive) {
      const { error } = await supabase.from("modifiers").update({
        active: itemToArchive.archived, // toggle
      }).eq("id", itemToArchive.id);
      if (!error) await fetchModifiers();
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

  const handleAddModifier = async (data: {
    name: string;
    orderTypeTags: string[];
    canBeServed: boolean;
    is86: boolean;
    hasOptions: boolean;
    options: { id: string; name: string; price: string }[];
    hasMaxSelections: boolean;
    maxSelections: number;
  }) => {
    if (!defaultGroupId) return;
    const price = data.hasOptions && data.options.length > 0 
      ? parseFloat(data.options[0].price) || 0 
      : 0;
    const { error } = await supabase.from("modifiers").insert({
      name: data.name,
      price,
      modifier_group_id: defaultGroupId,
      active: true,
      sort_order: modifiers.length,
    });
    if (!error) {
      await fetchModifiers();
      setShowAddScreen(false);
      toast({ description: `Modifier "${data.name}" has been added` });
    } else {
      toast({ description: "Failed to add modifier", variant: "destructive" });
    }
  };

  const handleEditModifier = async (data: {
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
    const price = data.hasOptions && data.options.length > 0 
      ? parseFloat(data.options[0].price) || 0 
      : 0;
    const { error } = await supabase.from("modifiers").update({
      name: data.name,
      price,
    }).eq("id", data.id);
    if (!error) {
      await fetchModifiers();
      toast({ description: `Modifier "${data.name}" has been updated` });
    }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

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
              <button onClick={onBack} className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity" aria-label="Back">
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
            )}
            {!onBack && <div className="w-8 h-8" />}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              <h1 className="text-base font-medium text-foreground">
                {showArchived ? "Archived Modifiers" : "Modifiers"}
              </h1>
            </div>
      </div>

      <AlertDialog open={!!itemToArchive} onOpenChange={() => setItemToArchive(null)}>
        <AlertDialogContent className="bg-neutral-800 border-neutral-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">{itemToArchive?.archived ? "Restore Modifier" : "Archive Modifier"}</AlertDialogTitle>
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

export default ModifiersContent;
