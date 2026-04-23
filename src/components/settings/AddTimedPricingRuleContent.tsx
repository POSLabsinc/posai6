import { useState } from "react";
import { ChevronLeft, ChevronRight, Check, Copy, ClipboardPaste } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { AppleWheelTimePicker } from "@/components/ui/apple-wheel-time-picker";
import { AppleWheelDatePicker } from "@/components/ui/apple-wheel-date-picker";

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
  const [showRevenueCenterPicker, setShowRevenueCenterPicker] = useState(false);
  const [showOrderingSourcePicker, setShowOrderingSourcePicker] = useState(false);
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
  const [copiedDay, setCopiedDay] = useState<string | null>(null);
  const [activeTimePicker, setActiveTimePicker] = useState<{
    day: string;
    field: "startTime" | "endTime";
    top: number;
    left: number;
  } | null>(null);
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

  const copySchedule = (day: string) => {
    setCopiedDay(day);
    toast({ description: `Copied ${day}'s schedule` });
  };

  const pasteSchedule = (day: string) => {
    if (!copiedDay) return;
    const source = daySchedules[copiedDay];
    setDaySchedules((prev) => ({
      ...prev,
      [day]: { ...prev[day], startTime: source.startTime, endTime: source.endTime },
    }));
    toast({ description: `Pasted schedule to ${day}` });
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

  const renderInlineTimePicker = (day: string, field: "startTime" | "endTime") => {
    if (!activeTimePicker || activeTimePicker.day !== day || activeTimePicker.field !== field) return null;
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

    const pickerLeft = typeof window !== "undefined"
      ? Math.min(Math.max(activeTimePicker.left, 170), window.innerWidth - 170)
      : activeTimePicker.left;

    return (
      <>
        <div className="fixed inset-0 z-[99]" onClick={() => setActiveTimePicker(null)} />
        <div
          className="fixed z-[100]"
          style={{ top: activeTimePicker.top, left: pickerLeft, transform: "translate(-50%, -50%)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <AppleWheelTimePicker
            isOpen
            compact
            onClose={() => setActiveTimePicker(null)}
            onConfirm={(time) => { updateDayTime(day, field, time); setActiveTimePicker(null); }}
            selectedTime={currentTime}
          />
        </div>
      </>
    );
  };

  const renderInlineDatePicker = (isStart: boolean) => {
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

    return (
      <AppleWheelDatePicker
        isOpen
        mode="inline"
        onClose={close}
        onConfirm={close}
        selectedDate={current}
        onDateChange={(d) => setDate(d)}
      />
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between py-4 px-4 relative">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-semibold text-foreground absolute left-1/2 -translate-x-1/2">
          {isEditing ? "Edit Timed Pricing" : "Add Timed Pricing"}
        </h1>
        <button onClick={handleSave} className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium active:opacity-70 transition-opacity">
          Save
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide pt-0 px-4 md:px-6 pb-28">
        {/* Name, Revenue Center, Ordering Source */}
        <div className="bg-neutral-800/60 rounded-2xl" style={{ overflow: "visible" }}>
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
          <div className="relative">
            <button
              onClick={() => { setShowRevenueCenterPicker(!showRevenueCenterPicker); setShowOrderingSourcePicker(false); }}
              className="w-full flex items-center justify-between py-3.5 px-4 border-b border-neutral-700/30 active:opacity-70 transition-opacity"
            >
              <span className="text-foreground text-[15px]">Revenue Center</span>
              <div className="flex items-center gap-1">
                <span className="text-neutral-500 text-[15px]">{revenueCenter || "Select Revenue Center"}</span>
                <ChevronRight className="w-4 h-4 text-neutral-500 flex-shrink-0" />
              </div>
            </button>
            {showRevenueCenterPicker && (
              <div className="absolute right-4 top-full mt-1 z-50 bg-neutral-700 rounded-xl shadow-lg overflow-hidden min-w-[180px]">
                {["Full Service", "Quick Service"].map((rc) => (
                  <button
                    key={rc}
                    onClick={() => { setRevenueCenter(rc); setShowRevenueCenterPicker(false); }}
                    className={`w-full text-left px-4 py-3 text-[15px] transition-colors flex items-center justify-between ${revenueCenter === rc ? "text-primary" : "text-foreground"} hover:bg-neutral-600/50`}
                  >
                    {rc}
                    {revenueCenter === rc && <Check className="w-4 h-4 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => { setShowOrderingSourcePicker(!showOrderingSourcePicker); setShowRevenueCenterPicker(false); }}
              className="w-full flex items-center justify-between py-3.5 px-4 active:opacity-70 transition-opacity"
            >
              <span className="text-foreground text-[15px]">Ordering Source</span>
              <div className="flex items-center gap-1">
                <span className="text-neutral-500 text-[15px]">{orderingSource || "Select Ordering Source"}</span>
                <ChevronRight className="w-4 h-4 text-neutral-500 flex-shrink-0" />
              </div>
            </button>
            {showOrderingSourcePicker && (
              <div className="absolute right-4 bottom-full mb-1 z-50 bg-neutral-700 rounded-xl shadow-lg overflow-hidden min-w-[180px]">
                {["POS", "Kiosk", "Order-OS", "Online"].map((os) => (
                  <button
                    key={os}
                    onClick={() => { setOrderingSource(os); setShowOrderingSourcePicker(false); }}
                    className={`w-full text-left px-4 py-3 text-[15px] transition-colors flex items-center justify-between ${orderingSource === os ? "text-primary" : "text-foreground"} hover:bg-neutral-600/50`}
                  >
                    {os}
                    {orderingSource === os && <Check className="w-4 h-4 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Start Date / End Date */}
        <div className="bg-neutral-800/60 rounded-2xl mt-6" style={{ overflow: "visible" }}>
          <div className="relative flex items-center justify-between w-full py-3.5 px-4 border-b border-neutral-700/30">
            <span className="text-foreground text-[15px]">Start Date</span>
            <button
              onClick={() => { setShowStartDatePicker(!showStartDatePicker); setShowEndDatePicker(false); }}
              className="flex items-center gap-1 active:opacity-70 transition-opacity"
            >
              <span className="text-neutral-400 text-[15px]">{formatDate(startDate)}</span>
              <ChevronRight className="w-4 h-4 text-neutral-500 flex-shrink-0" />
            </button>
            {renderInlineDatePicker(true)}
          </div>
          <div className="relative flex items-center justify-between w-full py-3.5 px-4">
            <span className="text-foreground text-[15px]">End Date</span>
            <button
              onClick={() => { setShowEndDatePicker(!showEndDatePicker); setShowStartDatePicker(false); }}
              className="flex items-center gap-1 active:opacity-70 transition-opacity"
            >
              <span className="text-neutral-400 text-[15px]">{formatDate(endDate)}</span>
              <ChevronRight className="w-4 h-4 text-neutral-500 flex-shrink-0" />
            </button>
            {renderInlineDatePicker(false)}
          </div>
        </div>

        {/* Days Schedule Table */}
        <div className="bg-neutral-800/60 rounded-2xl mt-6" style={{ overflow: "visible" }}>
          {/* Table Header */}
          <div className="grid grid-cols-[44px_1fr_1fr_1fr_68px] items-center px-4 py-3 border-b border-neutral-700/30">
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
              <div className="grid grid-cols-[44px_1fr_1fr_1fr_68px] items-center px-4 py-3.5">
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
                <span className={`text-[15px] font-medium ${daySchedules[day].enabled ? "text-foreground" : "text-neutral-500"}`}>
                  {day}
                </span>

                {/* Start Time */}
                <div className="relative flex justify-center">
                  <button
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setActiveTimePicker({
                        day,
                        field: "startTime",
                        top: rect.top + rect.height / 2,
                        left: rect.left + rect.width / 2,
                      });
                    }}
                    className={`text-[15px] text-center active:opacity-70 transition-opacity ${daySchedules[day].enabled ? "text-foreground" : "text-neutral-500"}`}
                  >
                    {daySchedules[day].startTime}
                  </button>
                  {renderInlineTimePicker(day, "startTime")}
                </div>

                {/* End Time */}
                <div className="relative flex justify-end">
                  <button
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setActiveTimePicker({
                        day,
                        field: "endTime",
                        top: rect.top + rect.height / 2,
                        left: rect.left + rect.width / 2,
                      });
                    }}
                    className={`text-[15px] text-right active:opacity-70 transition-opacity ${daySchedules[day].enabled ? "text-foreground" : "text-neutral-500"}`}
                  >
                    {daySchedules[day].endTime}
                  </button>
                  {renderInlineTimePicker(day, "endTime")}
                </div>

                {/* Copy & Paste Buttons */}
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => copySchedule(day)}
                    className="flex items-center justify-center active:opacity-70 transition-opacity"
                    title={`Copy ${day}'s times`}
                  >
                    <Copy className={`w-4 h-4 ${copiedDay === day ? "text-foreground" : "text-neutral-500"}`} />
                  </button>
                  {copiedDay && copiedDay !== day && (
                    <button
                      onClick={() => pasteSchedule(day)}
                      className="flex items-center justify-center active:opacity-70 transition-opacity"
                      title={`Paste ${copiedDay}'s times`}
                    >
                      <ClipboardPaste className="w-4 h-4 text-emerald-500" />
                    </button>
                  )}
                  {(!copiedDay || copiedDay === day) && (
                    <div className="w-4" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      
    </div>
  );
};

export default AddTimedPricingRuleContent;
