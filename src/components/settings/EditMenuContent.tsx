import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import OrganizeCategoriesContent from "@/components/settings/OrganizeCategoriesContent";

import { MultiSelectSheet } from "@/components/ui/multi-select-sheet";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import MenuScheduleSection, { defaultDaySchedule } from "./MenuScheduleSection";
import type { DaySchedule } from "./MenuScheduleSection";

const REVENUE_CENTERS = ["Full Service", "Quick Service"];

interface EditMenuContentProps {
  menuId: string;
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

const EditMenuContent = ({
  menuId,
  showHeader = true,
  onBack,
  onNavigate,
  onAIClick,
}: EditMenuContentProps) => {
  const [allCategories, setAllCategories] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCategoriesSheet, setShowCategoriesSheet] = useState(false);
  const [showRevenueCentersSheet, setShowRevenueCentersSheet] = useState(false);
  const [selectedRevenueCenters, setSelectedRevenueCenters] = useState<string[]>([]);
  const [showOrganize, setShowOrganize] = useState(false);

  const [activeChannels, setActiveChannels] = useState<Record<string, boolean>>({
    pos: false, pop: false, kiosk: false, orderos: false,
  });

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

  useEffect(() => {
    const fetchMenu = async () => {
      const { data } = await supabase
        .from("menus")
        .select("id, name, enabled, revenue_centers, channel_schedules")
        .eq("id", menuId)
        .single();
      if (data) {
        setName(data.name);
        setEnabled(data.enabled);
        setSelectedRevenueCenters((data as any).revenue_centers || []);
        // Load channel schedules
        const cs = (data as any).channel_schedules;
        if (cs && typeof cs === 'object') {
          const newChannels: Record<string, boolean> = { pos: false, pop: false, kiosk: false, orderos: false };
          const newSchedules: Record<string, ScheduleState> = {
            pos: createScheduleState(), pop: createScheduleState(),
            kiosk: createScheduleState(), orderos: createScheduleState(),
          };
          for (const key of Object.keys(newChannels)) {
            if (cs[key]) {
              newChannels[key] = cs[key].active || false;
              newSchedules[key] = {
                startDate: cs[key].startDate ? new Date(cs[key].startDate) : new Date(),
                endDate: cs[key].endDate ? new Date(cs[key].endDate) : new Date(),
                startDateSet: cs[key].startDateSet || false,
                endDateSet: cs[key].endDateSet || false,
                daySchedules: cs[key].daySchedules || defaultDaySchedule(),
              };
            }
          }
          setActiveChannels(newChannels);
          setSchedules(newSchedules);
        }
      }

      const { data: catData } = await supabase
        .from("menu_categories")
        .select("categories(name)")
        .eq("menu_id", menuId);
      if (catData) {
        const catNames = catData
          .map((c: any) => c.categories?.name)
          .filter(Boolean);
        setSelectedCategories(catNames);
      }

      setLoading(false);
    };
    fetchMenu();
  }, [menuId]);

  const formatSelection = (items: string[], placeholder: string) => {
    if (items.length === 0) return placeholder;
    if (items.length === 1) return items[0];
    return `${items.length} selected`;
  };

  const updateSchedule = (key: string, partial: Partial<ScheduleState>) => {
    setSchedules((prev) => ({ ...prev, [key]: { ...prev[key], ...partial } }));
  };

  const handleSave = () => {
    if (onBack) {
      onBack();
    }
    
    if (name.trim()) {
      const channelSchedulesData: Record<string, any> = {};
      for (const key of Object.keys(activeChannels)) {
        channelSchedulesData[key] = {
          active: activeChannels[key],
          startDate: schedules[key].startDate.toISOString(),
          endDate: schedules[key].endDate.toISOString(),
          startDateSet: schedules[key].startDateSet,
          endDateSet: schedules[key].endDateSet,
          daySchedules: schedules[key].daySchedules,
        };
      }
      supabase
        .from("menus")
        .update({ name: name.trim(), enabled, revenue_centers: selectedRevenueCenters, channel_schedules: channelSchedulesData } as any)
        .eq("id", menuId);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  if (showOrganize) {
    return (
      <OrganizeCategoriesContent
        categories={selectedCategories}
        onBack={(reordered) => {
          setSelectedCategories(reordered);
          setShowOrganize(false);
        }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between py-4 px-4 flex-shrink-0">
        {onBack ? (
          <button
            type="button"
            onClick={() => handleSave()}
            className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        ) : (
          <div className="w-12 h-12" />
        )}
        <h1 className="text-xl font-semibold text-foreground">Edit Menu</h1>
        <button
          type="button"
          className="w-12 h-12 flex items-center justify-center"
          onClick={onAIClick || (() => {})}
          aria-label="AI Assistant"
        >
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-4">
        {/* Menu Name */}
        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-3">
          <button className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity">
            <span className="text-foreground text-base font-medium">Menu Name</span>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Name"
                className="bg-transparent text-right text-muted-foreground placeholder:text-muted-foreground outline-none text-base w-32"
                onClick={(e) => e.stopPropagation()}
              />
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </button>
        </div>

        {/* Keep Menu Active Group */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-3 divide-y divide-neutral-700/40">
          {SCHEDULE_CHANNELS.map(({ key, label, desc }) => (
            <div key={key}>
              <div className="w-full flex items-center justify-between py-4 px-4">
                <div className="flex-1 mr-3">
                  <span className="text-foreground text-base font-medium">{label}</span>
                  <p className="text-muted-foreground text-xs mt-0.5">{desc}</p>
                </div>
                <Switch
                  checked={activeChannels[key]}
                  onCheckedChange={(v) => setActiveChannels((prev) => ({ ...prev, [key]: v }))}
                />
              </div>

              {activeChannels[key] && (
                <MenuScheduleSection
                  startDate={schedules[key].startDate}
                  endDate={schedules[key].endDate}
                  onStartDateChange={(d) => updateSchedule(key, { startDate: d })}
                  onEndDateChange={(d) => updateSchedule(key, { endDate: d })}
                  startDateSet={schedules[key].startDateSet}
                  endDateSet={schedules[key].endDateSet}
                  onStartDateSetChange={(v) => updateSchedule(key, { startDateSet: v })}
                  onEndDateSetChange={(v) => updateSchedule(key, { endDateSet: v })}
                  daySchedules={schedules[key].daySchedules}
                  onDaySchedulesChange={(s) => updateSchedule(key, { daySchedules: s })}
                />
              )}
            </div>
          ))}
        </div>

        {/* Categories */}
        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-1">
          <button
            className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity"
            onClick={() => setShowCategoriesSheet(true)}
          >
            <span className="text-foreground text-base font-medium">Categories</span>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground text-base">{formatSelection(selectedCategories, "0")}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </button>
        </div>
        <p className="text-muted-foreground text-xs px-1 mt-1 mb-3">Select which categories appear in this menu.</p>

        {/* Organize */}
        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-1">
          <button
            className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity"
            onClick={() => setShowOrganize(true)}
          >
            <span className="text-foreground text-base font-medium">Organize</span>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground text-base">Organize Categories</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </button>
        </div>
        <p className="text-muted-foreground text-xs px-1 mt-1 mb-3">Reorder and arrange categories within this menu.</p>

        {/* Revenue Centers */}
        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-1">
          <button
            className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity"
            onClick={() => setShowRevenueCentersSheet(true)}
          >
            <span className="text-foreground text-base font-medium">Revenue Centers</span>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground text-base">{formatSelection(selectedRevenueCenters, "None")}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </button>
        </div>
        <p className="text-muted-foreground text-xs px-1 mt-1 mb-6">Assign this menu to specific revenue centers.</p>
      </div>

      {/* Categories Sheet */}
      <MultiSelectSheet
        isOpen={showCategoriesSheet}
        onClose={(selected) => {
          setSelectedCategories(selected);
          setShowCategoriesSheet(false);
        }}
        title="Select Categories"
        options={allCategories}
        initialSelected={selectedCategories}
      />

      {/* Revenue Centers Sheet */}
      <MultiSelectSheet
        isOpen={showRevenueCentersSheet}
        onClose={(selected) => {
          setSelectedRevenueCenters(selected);
          setShowRevenueCentersSheet(false);
        }}
        title="Select Revenue Centers"
        options={REVENUE_CENTERS}
        initialSelected={selectedRevenueCenters}
      />
    </div>
  );
};

export default EditMenuContent;
