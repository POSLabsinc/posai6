import { useState } from "react";
import { ChevronLeft, ChevronRight, Check, CalendarIcon } from "lucide-react";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { getAllCategories } from "@/lib/productStore";
import { MultiSelectSheet } from "@/components/ui/multi-select-sheet";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AddMenuContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onNavigate?: (path: string) => void;
  onAIClick?: () => void;
}

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
  const [posFromDate, setPosFromDate] = useState<Date | undefined>(undefined);
  const [posToDate, setPosToDate] = useState<Date | undefined>(undefined);
  const [showPosFromCalendar, setShowPosFromCalendar] = useState(false);
  const [showPosToCalendar, setShowPosToCalendar] = useState(false);
  const [posDays, setPosDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const togglePosDay = (day: string) => {
    setPosDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const formatSelection = (items: string[], placeholder: string) => {
    if (items.length === 0) return placeholder;
    if (items.length === 1) return items[0];
    return `${items.length} selected`;
  };

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
      // Save selected categories to menu_categories junction table
      if (selectedCategories.length > 0) {
        // Look up category IDs by name
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
          <div className="w-full flex items-center justify-between py-4 px-4">
            <div className="flex-1 mr-3">
              <span className="text-foreground text-base font-medium">Keep Menu Active for Point Of Sale</span>
              <p className="text-muted-foreground text-xs mt-0.5">Display this menu on Point of Sale terminals</p>
            </div>
            <Switch checked={activeForPOS} onCheckedChange={setActiveForPOS} />
          </div>

          {/* POS Schedule - Date Range & Days */}
          {activeForPOS && (
            <div className="border-t border-neutral-700/40">
              {/* From Date */}
              <button
                onClick={() => { setShowPosFromCalendar(!showPosFromCalendar); setShowPosToCalendar(false); }}
                className="flex items-center justify-between w-full py-3.5 px-6 active:opacity-70 transition-opacity"
              >
                <span className="text-foreground text-sm font-medium">From Date</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground text-sm">
                    {posFromDate ? format(posFromDate, "MM/dd/yyyy") : "Select"}
                  </span>
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
              {showPosFromCalendar && (
                <div className="px-4 pb-3 flex justify-center">
                  <Calendar
                    mode="single"
                    selected={posFromDate}
                    onSelect={(d) => { setPosFromDate(d); setShowPosFromCalendar(false); }}
                    className={cn("p-3 pointer-events-auto rounded-xl bg-neutral-800/80")}
                  />
                </div>
              )}

              <div className="border-t border-neutral-700/20" />

              {/* To Date */}
              <button
                onClick={() => { setShowPosToCalendar(!showPosToCalendar); setShowPosFromCalendar(false); }}
                className="flex items-center justify-between w-full py-3.5 px-6 active:opacity-70 transition-opacity"
              >
                <span className="text-foreground text-sm font-medium">To Date</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground text-sm">
                    {posToDate ? format(posToDate, "MM/dd/yyyy") : "Select"}
                  </span>
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
              {showPosToCalendar && (
                <div className="px-4 pb-3 flex justify-center">
                  <Calendar
                    mode="single"
                    selected={posToDate}
                    onSelect={(d) => { setPosToDate(d); setShowPosToCalendar(false); }}
                    className={cn("p-3 pointer-events-auto rounded-xl bg-neutral-800/80")}
                  />
                </div>
              )}

              <div className="border-t border-neutral-700/20" />

              {/* Active Days */}
              <div className="px-6 py-3.5">
                <span className="text-foreground text-sm font-medium block mb-3">Active Days</span>
                <div className="flex gap-1.5">
                  {dayLabels.map((day) => {
                    const isActive = posDays.includes(day);
                    return (
                      <button
                        key={day}
                        onClick={() => togglePosDay(day)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? "bg-foreground text-background"
                            : "bg-neutral-800/40 text-muted-foreground"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <div className="w-full flex items-center justify-between py-4 px-4">
            <div className="flex-1 mr-3">
              <span className="text-foreground text-base font-medium">Keep Menu Active for Point Of Purchase</span>
              <p className="text-muted-foreground text-xs mt-0.5">Display this menu on purchase screens</p>
            </div>
            <Switch checked={activeForPOP} onCheckedChange={setActiveForPOP} />
          </div>
          <div className="w-full flex items-center justify-between py-4 px-4">
            <div className="flex-1 mr-3">
              <span className="text-foreground text-base font-medium">Keep Menu Active for KIOSK</span>
              <p className="text-muted-foreground text-xs mt-0.5">Display this menu on self-service kiosks</p>
            </div>
            <Switch checked={activeForKiosk} onCheckedChange={setActiveForKiosk} />
          </div>
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
