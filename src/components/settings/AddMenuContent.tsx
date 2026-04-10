import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MultiSelectSheet } from "@/components/ui/multi-select-sheet";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import OrganizeCategoriesContent from "./OrganizeCategoriesContent";
import MenuScheduleSection, { defaultDaySchedule } from "./MenuScheduleSection";
import type { DaySchedule } from "./MenuScheduleSection";

interface AddMenuContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onNavigate?: (path: string) => void;
  onAIClick?: () => void;
}

interface ScheduleState {
  startDate: Date;
  endDate: Date;
  startDateSet: boolean;
  endDateSet: boolean;
  daySchedules: Record<string, DaySchedule>;
}

const createScheduleState = (): ScheduleState => ({
  startDate: new Date(),
  endDate: new Date(),
  startDateSet: false,
  endDateSet: false,
  daySchedules: defaultDaySchedule(),
});

const SCHEDULE_CHANNELS = [
  { key: "pos", label: "Keep Menu Active for Point Of Sale", desc: "Display this menu on Point of Sale terminals" },
  { key: "pop", label: "Keep Menu Active for Point Of Purchase", desc: "Display this menu on purchase screens" },
  { key: "kiosk", label: "Keep Menu Active for KIOSK", desc: "Display this menu on self-service kiosks" },
  { key: "orderos", label: "Keep Menu Active for Order-OS", desc: "Display this menu on Order-OS devices" },
] as const;

const AddMenuContent = ({
  showHeader = true,
  onBack,
  onNavigate,
  onAIClick,
}: AddMenuContentProps) => {
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCategoriesSheet, setShowCategoriesSheet] = useState(false);
  const [showOrganizeScreen, setShowOrganizeScreen] = useState(false);
  const [showRevenueCentersSheet, setShowRevenueCentersSheet] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRevenueCenters, setSelectedRevenueCenters] = useState<string[]>([]);

  // Toggle states for each channel
  const [activeChannels, setActiveChannels] = useState<Record<string, boolean>>({
    pos: false, pop: false, kiosk: false, orderos: false,
  });

  // Schedule states for each channel
  const [schedules, setSchedules] = useState<Record<string, ScheduleState>>({
    pos: createScheduleState(),
    pop: createScheduleState(),
    kiosk: createScheduleState(),
    orderos: createScheduleState(),
  });

  // Fetch real categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("categories")
        .select("name")
        .eq("active", true)
        .order("sort_order");
      if (data) setAllCategories(data.map(c => c.name));
    };
    fetchCategories();
  }, []);

  const serializeSchedules = (channels: Record<string, boolean>, scheds: Record<string, ScheduleState>) => {
    const result: Record<string, any> = {};
    for (const key of Object.keys(channels)) {
      result[key] = {
        active: channels[key],
        startDate: scheds[key].startDate.toISOString(),
        endDate: scheds[key].endDate.toISOString(),
        startDateSet: scheds[key].startDateSet,
        endDateSet: scheds[key].endDateSet,
        daySchedules: scheds[key].daySchedules,
      };
    }
    return result;
  };

  const formatSelection = (items: string[], placeholder: string) => {
    if (items.length === 0) return placeholder;
    if (items.length === 1) return items[0];
    return `${items.length} selected`;
  };

  const updateSchedule = (key: string, partial: Partial<ScheduleState>) => {
    setSchedules((prev) => ({ ...prev, [key]: { ...prev[key], ...partial } }));
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      if (name.trim()) {
        const { data, error } = await supabase.from("menus").insert({
          name: name.trim(),
          enabled,
          description: "",
          revenue_centers: selectedRevenueCenters,
          channel_schedules: serializeSchedules(activeChannels, schedules),
        } as any).select("id").single();
        if (error || !data) {
          toast.error("Failed to add menu");
          onBack?.();
          return;
        }
        if (selectedCategories.length > 0) {
          // First check which categories exist in the DB
          const { data: existingCats } = await supabase
            .from("categories")
            .select("id, name")
            .in("name", selectedCategories);
          const existingNames = new Set((existingCats || []).map(c => c.name));
          // Create any categories that only exist in localStorage
          const missingNames = selectedCategories.filter(n => !existingNames.has(n));
          let allCats = [...(existingCats || [])];
          if (missingNames.length > 0) {
            const { data: newCats } = await supabase
              .from("categories")
              .insert(missingNames.map((n, i) => ({ name: n, sort_order: (existingCats?.length || 0) + i })))
              .select("id, name");
            if (newCats) allCats.push(...newCats);
          }
          if (allCats.length > 0) {
            const rows = selectedCategories
              .map((catName, i) => {
                const cat = allCats.find(c => c.name === catName);
                return cat ? { menu_id: data.id, category_id: cat.id, sort_order: i } : null;
              })
              .filter(Boolean);
            await supabase.from("menu_categories").insert(rows);
          }
        }
        toast.success("Menu saved successfully");
      }
    } catch (err) {
      console.error("Error saving menu:", err);
      toast.error("Failed to save menu");
    } finally {
      setIsSaving(false);
    }
    onBack?.();
  };

  if (showOrganizeScreen) {
    return (
      <OrganizeCategoriesContent
        categories={selectedCategories}
        onBack={(reorderedCategories) => {
          setSelectedCategories(reorderedCategories);
          setShowOrganizeScreen(false);
        }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-center py-4 px-4 relative">
        {onBack ? (
          <button
            onClick={handleSave}
            className="absolute left-4 w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center active:opacity-70 transition-opacity"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        ) : (
          <div className="w-12 h-12" />
        )}
        <h1 className="text-lg font-semibold text-foreground">Add Menu</h1>
  );
};

export default AddMenuContent;
