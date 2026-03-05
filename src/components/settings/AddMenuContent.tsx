import { useState } from "react";
import { ChevronLeft, ChevronRight, Check, Copy, Clock } from "lucide-react";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { getAllCategories } from "@/lib/productStore";
import { MultiSelectSheet } from "@/components/ui/multi-select-sheet";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CompactTimePicker } from "@/components/ui/compact-time-picker";

interface AddMenuContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onNavigate?: (path: string) => void;
  onAIClick?: () => void;
}

interface DaySchedule {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

const ALL_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;

const defaultDaySchedule = (): Record<string, DaySchedule> =>
  Object.fromEntries(ALL_DAYS.map((d) => [d, { enabled: false, startTime: "12:00 AM", endTime: "11:59 PM" }]));

const AddMenuContent = ({
  showHeader = true,
  onBack,
  onNavigate,
  onAIClick,
}: AddMenuContentProps) => {
  const allCategories = getAllCategories();
  const [name, setName] = useState("");

  const [enabled, setEnabled] = useState(true);
  const [activeForPOS, setActiveForPOS] = useState(false);
  const [activeForPOP, setActiveForPOP] = useState(false);
  const [activeForKiosk, setActiveForKiosk] = useState(false);
  const [activeForOrderOS, setActiveForOrderOS] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCategoriesSheet, setShowCategoriesSheet] = useState(false);

  // POS schedule state
  const [posStartDate, setPosStartDate] = useState<Date | undefined>(undefined);
  const [posEndDate, setPosEndDate] = useState<Date | undefined>(undefined);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [posDaySchedules, setPosDaySchedules] = useState<Record<string, DaySchedule>>(defaultDaySchedule());
  const [showDaysSheet, setShowDaysSheet] = useState(false);

  // Track which day+field has inline picker open: e.g. "MONDAY-startTime"
  const [activeTimePicker, setActiveTimePicker] = useState<string | null>(null);

  const formatSelection = (items: string[], placeholder: string) => {
    if (items.length === 0) return placeholder;
    if (items.length === 1) return items[0];
    return `${items.length} selected`;
  };

  const toggleDayEnabled = (day: string) => {
    setPosDaySchedules((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  };

  const toggleTimePicker = (day: string, field: "startTime" | "endTime") => {
    const key = `${day}-${field}`;
    setActiveTimePicker((prev) => (prev === key ? null : key));
  };

  const updateDayTime = (day: string, field: "startTime" | "endTime", time: string) => {
    setPosDaySchedules((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: time },
    }));
  };

  const copyTimeToAllDays = (sourceDay: string) => {
    const source = posDaySchedules[sourceDay];
    setPosDaySchedules((prev) => {
      const updated = { ...prev };
      for (const day of ALL_DAYS) {
        if (updated[day].enabled) {
          updated[day] = { ...updated[day], startTime: source.startTime, endTime: source.endTime };
        }
      }
      return updated;
    });
    toast.success("Time copied to all selected days");
  };

  // Get selected days for the sheet
  const selectedDayNames = ALL_DAYS.filter((d) => posDaySchedules[d].enabled);

  const handleSave = async () => {
    if (name.trim()) {
      const { data, error } = await supabase.from("menus").insert({
        name: name.trim(),
        enabled,
        description: "",
      }).select("id").single();
      if (error || !data) {
        toast.error("Failed to add menu");
        return;
      }
      if (selectedCategories.length > 0) {
        const { data: cats } = await supabase
          .from("categories")
          .select("id, name")
          .in("name", selectedCategories);
        if (cats && cats.length > 0) {
          const rows = cats.map((c, i) => ({
            menu_id: data.id,
            category_id: c.id,
            sort_order: i,
          }));
          await supabase.from("menu_categories").insert(rows);
        }
      }
    }
    onBack?.();
  };

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
        <div className="absolute right-4 overflow-visible flex items-center justify-center" style={{ width: 32, height: 32 }}>
          <AnimatedAIIcon size={24} onClick={onAIClick || (() => {})} />
        </div>
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
          {/* POS Toggle */}
          <div className="w-full flex items-center justify-between py-4 px-4">
            <div className="flex-1 mr-3">
              <span className="text-foreground text-base font-medium">Keep Menu Active for Point Of Sale</span>
              <p className="text-muted-foreground text-xs mt-0.5">Display this menu on Point of Sale terminals</p>
            </div>
            <Switch checked={activeForPOS} onCheckedChange={setActiveForPOS} />
          </div>

          {/* POS Schedule Expanded */}
          {activeForPOS && (
            <div>
              {/* Start Date */}
              <button
                onClick={() => { setShowStartCalendar(!showStartCalendar); setShowEndCalendar(false); }}
                className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity border-t border-neutral-700/30"
              >
                <span className="text-foreground text-sm font-medium">Start Date</span>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-sm">
                    {posStartDate ? format(posStartDate, "MM/dd/yyyy") : "Choose"}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
              {showStartCalendar && (
                <div className="px-2 pb-3 flex justify-center">
                  <Calendar
                    mode="single"
                    selected={posStartDate}
                    onSelect={(d) => { setPosStartDate(d); setShowStartCalendar(false); }}
                    className={cn("p-3 pointer-events-auto rounded-xl bg-neutral-800/80")}
                  />
                </div>
              )}

              {/* End Date */}
              <button
                onClick={() => { setShowEndCalendar(!showEndCalendar); setShowStartCalendar(false); }}
                className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity border-t border-neutral-700/30"
              >
                <span className="text-foreground text-sm font-medium">End Date</span>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-sm">
                    {posEndDate ? format(posEndDate, "MM/dd/yyyy") : "Choose"}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
              {showEndCalendar && (
                <div className="px-2 pb-3 flex justify-center">
                  <Calendar
                    mode="single"
                    selected={posEndDate}
                    onSelect={(d) => { setPosEndDate(d); setShowEndCalendar(false); }}
                    className={cn("p-3 pointer-events-auto rounded-xl bg-neutral-800/80")}
                  />
                </div>
              )}

              {/* Days Table Header */}
              <div className="border-t border-neutral-700/30 px-4 py-2.5 flex items-center">
                <span className="text-muted-foreground text-xs font-semibold w-[40%]">Days</span>
                <span className="text-muted-foreground text-xs font-semibold w-[25%] text-center">Start Time</span>
                <span className="text-muted-foreground text-xs font-semibold w-[25%] text-center">End Time</span>
                <span className="w-[10%]" />
              </div>

              {/* Day Rows */}
              {ALL_DAYS.map((day) => {
                const schedule = posDaySchedules[day];
                const startPickerKey = `${day}-startTime`;
                const endPickerKey = `${day}-endTime`;
                return (
                  <div key={day} className="border-t border-neutral-700/20">
                    <div className="px-4 py-3 flex items-center">
                      {/* Checkbox + Day Name */}
                      <button
                        onClick={() => toggleDayEnabled(day)}
                        className="flex items-center gap-2.5 w-[40%] active:opacity-70 transition-opacity"
                      >
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            schedule.enabled
                              ? "bg-foreground border-foreground"
                              : "border-neutral-600 bg-transparent"
                          }`}
                        >
                          {schedule.enabled && <Check className="w-3.5 h-3.5 text-background" />}
                        </div>
                        <span className={`text-sm font-medium ${schedule.enabled ? "text-foreground" : "text-muted-foreground"}`}>
                          {day.charAt(0) + day.slice(1).toLowerCase()}
                        </span>
                      </button>

                      {/* Start Time */}
                      <div className="w-[25%] flex justify-center relative">
                        <button
                          onClick={() => schedule.enabled && toggleTimePicker(day, "startTime")}
                          className={`text-center text-sm ${schedule.enabled ? "text-foreground" : "text-muted-foreground/50"}`}
                          disabled={!schedule.enabled}
                        >
                          {schedule.startTime}
                        </button>
                        {activeTimePicker === startPickerKey && schedule.enabled && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setActiveTimePicker(null)} />
                            <div className="absolute top-full mt-1 z-50 bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden" style={{ width: 200 }}>
                              <CompactTimePicker
                                selectedTime={schedule.startTime}
                                onTimeChange={(time) => updateDayTime(day, "startTime", time)}
                              />
                            </div>
                          </>
                        )}
                      </div>

                      {/* End Time */}
                      <div className="w-[25%] flex justify-center relative">
                        <button
                          onClick={() => schedule.enabled && toggleTimePicker(day, "endTime")}
                          className={`text-center text-sm ${schedule.enabled ? "text-foreground" : "text-muted-foreground/50"}`}
                          disabled={!schedule.enabled}
                        >
                          {schedule.endTime}
                        </button>
                        {activeTimePicker === endPickerKey && schedule.enabled && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setActiveTimePicker(null)} />
                            <div className="absolute top-full mt-1 z-50 bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden" style={{ width: 200 }}>
                              <CompactTimePicker
                                selectedTime={schedule.endTime}
                                onTimeChange={(time) => updateDayTime(day, "endTime", time)}
                              />
                            </div>
                          </>
                        )}
                      </div>

                      {/* Copy icon */}
                      <div className="w-[10%] flex justify-center">
                        <button
                          onClick={() => schedule.enabled && copyTimeToAllDays(day)}
                          disabled={!schedule.enabled}
                          className={`p-1 rounded active:opacity-70 transition-opacity ${schedule.enabled ? "text-muted-foreground" : "text-muted-foreground/30"}`}
                          title="Copy time to all selected days"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* POP Toggle */}
          <div className="w-full flex items-center justify-between py-4 px-4">
            <div className="flex-1 mr-3">
              <span className="text-foreground text-base font-medium">Keep Menu Active for Point Of Purchase</span>
              <p className="text-muted-foreground text-xs mt-0.5">Display this menu on purchase screens</p>
            </div>
            <Switch checked={activeForPOP} onCheckedChange={setActiveForPOP} />
          </div>

          {/* KIOSK Toggle */}
          <div className="w-full flex items-center justify-between py-4 px-4">
            <div className="flex-1 mr-3">
              <span className="text-foreground text-base font-medium">Keep Menu Active for KIOSK</span>
              <p className="text-muted-foreground text-xs mt-0.5">Display this menu on self-service kiosks</p>
            </div>
            <Switch checked={activeForKiosk} onCheckedChange={setActiveForKiosk} />
          </div>

          {/* Order-OS Toggle */}
          <div className="w-full flex items-center justify-between py-4 px-4">
            <div className="flex-1 mr-3">
              <span className="text-foreground text-base font-medium">Keep Menu Active for Order-OS</span>
              <p className="text-muted-foreground text-xs mt-0.5">Display this menu on Order-OS devices</p>
            </div>
            <Switch checked={activeForOrderOS} onCheckedChange={setActiveForOrderOS} />
          </div>
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
          <button className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity">
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
          <button className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity">
            <span className="text-foreground text-base font-medium">Revenue Centers</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
    </div>
  );
};

export default AddMenuContent;
