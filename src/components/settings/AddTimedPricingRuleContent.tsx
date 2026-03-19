import { useState } from "react";
import { ChevronLeft, ChevronRight, Check, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { AppleWheelTimePicker } from "@/components/ui/apple-wheel-time-picker";
import { AppleWheelDatePicker } from "@/components/ui/apple-wheel-date-picker";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";

type RuleType = "happy_hour" | "peak_time" | "late_night" | "custom";

interface TimedPricingRule {
  id: string;
  name: string;
  type: RuleType;
  startTime: string;
  endTime: string;
  adjustment: number;
  days: string[];
  enabled: boolean;
}

interface AddTimedPricingRuleContentProps {
  onBack: () => void;
  onSave: (rule: TimedPricingRule) => void;
  editRule?: TimedPricingRule | null;
}

const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const dayAbbrev: Record<string, string> = {
  Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu",
  Friday: "Fri", Saturday: "Sat", Sunday: "Sun",
};

const formatDate = (d: Date) =>
  `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;

interface DaySchedule {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

const defaultSchedule = (): Record<string, DaySchedule> =>
  Object.fromEntries(allDays.map((d) => [d, { enabled: true, startTime: "12:00 AM", endTime: "11:59 PM" }]));

const AddTimedPricingRuleContent = ({ onBack, onSave, editRule }: AddTimedPricingRuleContentProps) => {
  const isMobile = useIsMobile();
  const isEditing = !!editRule;

  const [name, setName] = useState(editRule?.name ?? "");
  const [revenueCenter, setRevenueCenter] = useState("");
  const [orderingSource, setOrderingSource] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [daySchedules, setDaySchedules] = useState<Record<string, DaySchedule>>(() => {
    if (editRule?.days) {
      const s = defaultSchedule();
      Object.keys(s).forEach((d) => {
        s[d].enabled = editRule.days.includes(dayAbbrev[d]);
      });
      return s;
    }
    return defaultSchedule();
  });

  const [showNameInput, setShowNameInput] = useState(false);
  const [activeTimePicker, setActiveTimePicker] = useState<{ day: string; field: "startTime" | "endTime" } | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const toggleDay = (day: string) => {
    setDaySchedules((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  };

  const updateDayTime = (day: string, field: "startTime" | "endTime", value: string) => {
    setDaySchedules((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const copySchedule = (fromDay: string) => {
    const source = daySchedules[fromDay];
    setDaySchedules((prev) => {
      const next = { ...prev };
      allDays.forEach((d) => {
        if (d !== fromDay) {
          next[d] = { ...next[d], startTime: source.startTime, endTime: source.endTime };
        }
      });
      return next;
    });
    toast({ description: `Copied ${fromDay}'s schedule to all days` });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Error", description: "Please enter a name", variant: "destructive" });
      return;
    }
    const enabledDays = allDays.filter((d) => daySchedules[d].enabled).map((d) => dayAbbrev[d]);
    if (enabledDays.length === 0) {
      toast({ title: "Error", description: "Please select at least one day", variant: "destructive" });
      return;
    }

    const firstEnabled = allDays.find((d) => daySchedules[d].enabled)!;
    const ruleData = {
      name: name.trim(),
      type: "custom" as RuleType,
      start_time: daySchedules[firstEnabled].startTime,
      end_time: daySchedules[firstEnabled].endTime,
      adjustment: 0,
      days: enabledDays,
      enabled: true,
    };

    if (isEditing && editRule) {
      const { error } = await (supabase as any).from("timed_pricing_rules").update(ruleData).eq("id", editRule.id);
      if (error) {
        toast({ description: "Failed to update rule", variant: "destructive" });
        return;
      }
    } else {
      const { error } = await (supabase as any).from("timed_pricing_rules").insert(ruleData);
      if (error) {
        toast({ description: "Failed to create rule", variant: "destructive" });
        return;
      }
    }

    const rule: TimedPricingRule = {
      id: editRule?.id ?? "",
      name: name.trim(),
      type: "custom",
      startTime: ruleData.start_time,
      endTime: ruleData.end_time,
      adjustment: 0,
      days: enabledDays,
      enabled: true,
    };

    onSave(rule);
    toast({ description: `"${rule.name}" has been ${isEditing ? "updated" : "created"} successfully.` });
    onBack();
  };

  const renderTimePicker = () => {
    if (!activeTimePicker) return null;
    const { day, field } = activeTimePicker;
    const currentTime = daySchedules[day][field];

    if (isMobile) {
      return (
        <AppleWheelTimePicker
          isOpen
          onClose={() => setActiveTimePicker(null)}
          onConfirm={(time) => { updateDayTime(day, field, time); setActiveTimePicker(null); }}
          selectedTime={currentTime}
        />
      );
    }

    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={() => setActiveTimePicker(null)}>
        <div className="bg-neutral-900 rounded-2xl p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <AppleWheelTimePicker
            isOpen
            onClose={() => setActiveTimePicker(null)}
            onConfirm={(time) => { updateDayTime(day, field, time); setActiveTimePicker(null); }}
            selectedTime={currentTime}
          />
        </div>
      </div>,
      document.body
    );
  };

  const renderDatePicker = (isStart: boolean) => {
    const show = isStart ? showStartDatePicker : showEndDatePicker;
    if (!show) return null;
    const current = isStart ? startDate : endDate;
    const setDate = isStart ? setStartDate : setEndDate;
    const close = () => isStart ? setShowStartDatePicker(false) : setShowEndDatePicker(false);

    if (isMobile) {
      return (
        <AppleWheelDatePicker
          isOpen
          onClose={close}
          onConfirm={close}
          selectedDate={current}
          onDateChange={(d) => setDate(d)}
        />
      );
    }

    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={close}>
        <div className="bg-neutral-900 rounded-2xl p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <AppleWheelDatePicker
            isOpen
            onClose={close}
            onConfirm={close}
            selectedDate={current}
            onDateChange={(d) => setDate(d)}
          />
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between py-4 px-4 relative">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground absolute left-1/2 -translate-x-1/2">
          {isEditing ? "Edit Timed Pricing" : "Add Timed Pricing"}
        </h1>
        <button onClick={handleSave} className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium active:opacity-70 transition-opacity">
          Save
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide pt-0 px-6 pb-28">
        {/* Name, Revenue Center, Ordering Source */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between py-3.5 px-4 border-b border-neutral-700/30">
            <span className="text-foreground text-[15px]">Timed Pricing Name</span>
            <div className="flex items-center gap-1">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Name"
                className="bg-transparent border-none text-right text-neutral-400 placeholder:text-neutral-500 w-36 h-auto p-0 focus-visible:ring-0"
              />
              <ChevronRight className="w-4 h-4 text-neutral-500 flex-shrink-0" />
            </div>
          </div>
          <div className="flex items-center justify-between py-3.5 px-4 border-b border-neutral-700/30">
            <span className="text-foreground text-[15px]">Revenue Center</span>
            <div className="flex items-center gap-1">
              <span className="text-neutral-500 text-[15px]">{revenueCenter || "Select Revenue Center"}</span>
              <ChevronRight className="w-4 h-4 text-neutral-500 flex-shrink-0" />
            </div>
          </div>
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-[15px]">Ordering Source</span>
            <div className="flex items-center gap-1">
              <span className="text-neutral-500 text-[15px]">{orderingSource || "Select Ordering Source"}</span>
              <ChevronRight className="w-4 h-4 text-neutral-500 flex-shrink-0" />
            </div>
          </div>
        </div>

        {/* Start Date / End Date */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mt-6">
          <button
            onClick={() => setShowStartDatePicker(true)}
            className="flex items-center justify-between w-full py-3.5 px-4 border-b border-neutral-700/30 active:opacity-70 transition-opacity"
          >
            <span className="text-foreground text-[15px]">Start Date</span>
            <div className="flex items-center gap-1">
              <span className="text-neutral-400 text-[15px]">{formatDate(startDate)}</span>
              <ChevronRight className="w-4 h-4 text-neutral-500 flex-shrink-0" />
            </div>
          </button>
          <button
            onClick={() => setShowEndDatePicker(true)}
            className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity"
          >
            <span className="text-foreground text-[15px]">End Date</span>
            <div className="flex items-center gap-1">
              <span className="text-neutral-400 text-[15px]">{formatDate(endDate)}</span>
              <ChevronRight className="w-4 h-4 text-neutral-500 flex-shrink-0" />
            </div>
          </button>
        </div>

        {/* Days Schedule Table */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mt-6">
          {/* Table Header */}
          <div className="grid grid-cols-[44px_1fr_1fr_1fr_36px] items-center px-4 py-3 border-b border-neutral-700/30">
            <span />
            <span className="text-sm font-semibold text-foreground">Days</span>
            <span className="text-sm font-semibold text-foreground text-center">Start Time</span>
            <span className="text-sm font-semibold text-foreground text-right">End Time</span>
            <span />
          </div>

          {/* Day Rows */}
          {allDays.map((day, idx) => (
            <div key={day}>
              {idx > 0 && <div className="h-px bg-neutral-700/20 mx-4" />}
              <div className="grid grid-cols-[44px_1fr_1fr_1fr_36px] items-center px-4 py-3.5">
                {/* Checkbox */}
                <button onClick={() => toggleDay(day)} className="flex items-center justify-center">
                  <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                    daySchedules[day].enabled
                      ? "bg-foreground border-foreground"
                      : "border-neutral-500 bg-transparent"
                  }`}>
                    {daySchedules[day].enabled && <Check className="w-4 h-4 text-background" />}
                  </div>
                </button>

                {/* Day Name */}
                <span className={`text-[15px] ${daySchedules[day].enabled ? "text-foreground" : "text-neutral-500"}`}>
                  {day}
                </span>

                {/* Start Time */}
                <button
                  onClick={() => setActiveTimePicker({ day, field: "startTime" })}
                  className="text-[15px] text-neutral-400 text-center active:opacity-70 transition-opacity"
                >
                  {daySchedules[day].startTime}
                </button>

                {/* End Time */}
                <button
                  onClick={() => setActiveTimePicker({ day, field: "endTime" })}
                  className="text-[15px] text-neutral-400 text-right active:opacity-70 transition-opacity"
                >
                  {daySchedules[day].endTime}
                </button>

                {/* Copy Button */}
                {daySchedules[day].enabled && (
                  <button
                    onClick={() => copySchedule(day)}
                    className="flex items-center justify-center active:opacity-70 transition-opacity"
                    title={`Copy ${day}'s times to all days`}
                  >
                    <Copy className="w-4 h-4 text-neutral-500" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {renderTimePicker()}
      {renderDatePicker(true)}
      {renderDatePicker(false)}
    </div>
  );
};

export default AddTimedPricingRuleContent;
