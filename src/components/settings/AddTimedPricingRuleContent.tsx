import { useState } from "react";
import { ChevronLeft, Plus, Minus, Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { AppleWheelTimePicker } from "@/components/ui/apple-wheel-time-picker";
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

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const typeOptions: { value: RuleType; label: string; color: string }[] = [
  { value: "happy_hour", label: "Happy Hour", color: "#34C759" },
  { value: "peak_time", label: "Peak Time", color: "#FF9500" },
  { value: "late_night", label: "Late Night", color: "#AF52DE" },
  { value: "custom", label: "Custom", color: "#0088FF" },
];

const AddTimedPricingRuleContent = ({ onBack, onSave, editRule }: AddTimedPricingRuleContentProps) => {
  const isMobile = useIsMobile();
  const isEditing = !!editRule;

  const [name, setName] = useState(editRule?.name ?? "");
  const [type, setType] = useState<RuleType>(editRule?.type ?? "happy_hour");
  const [startTime, setStartTime] = useState(editRule?.startTime ?? "4:00 PM");
  const [endTime, setEndTime] = useState(editRule?.endTime ?? "6:00 PM");
  const [adjustment, setAdjustment] = useState(editRule?.adjustment ?? -10);
  const [days, setDays] = useState<string[]>(editRule?.days ?? ["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [enabled, setEnabled] = useState(editRule?.enabled ?? true);

  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const toggleDay = (day: string) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Error", description: "Please enter a rule name", variant: "destructive" });
      return;
    }
    if (days.length === 0) {
      toast({ title: "Error", description: "Please select at least one day", variant: "destructive" });
      return;
    }

    const ruleData = {
      name: name.trim(),
      type,
      start_time: startTime,
      end_time: endTime,
      adjustment,
      days,
      enabled,
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
      type,
      startTime,
      endTime,
      adjustment,
      days,
      enabled,
    };

    onSave(rule);
    toast({ title: isEditing ? "Rule Updated" : "Rule Created", description: `"${rule.name}" has been ${isEditing ? "updated" : "created"} successfully.` });
    onBack();
  };

  const selectedTypeOption = typeOptions.find((t) => t.value === type)!;

  const timePickerPortal = (
    <>
      {isMobile ? (
        <>
          <AppleWheelTimePicker isOpen={showStartTimePicker} onClose={() => setShowStartTimePicker(false)} onConfirm={(time) => { setStartTime(time); setShowStartTimePicker(false); }} selectedTime={startTime} />
          <AppleWheelTimePicker isOpen={showEndTimePicker} onClose={() => setShowEndTimePicker(false)} onConfirm={(time) => { setEndTime(time); setShowEndTimePicker(false); }} selectedTime={endTime} />
        </>
      ) : (
        <>
          {showStartTimePicker && createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={() => setShowStartTimePicker(false)}>
              <div className="bg-neutral-900 rounded-2xl p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <AppleWheelTimePicker isOpen onClose={() => setShowStartTimePicker(false)} onConfirm={(time) => { setStartTime(time); setShowStartTimePicker(false); }} selectedTime={startTime} />
              </div>
            </div>,
            document.body
          )}
          {showEndTimePicker && createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={() => setShowEndTimePicker(false)}>
              <div className="bg-neutral-900 rounded-2xl p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <AppleWheelTimePicker isOpen onClose={() => setShowEndTimePicker(false)} onConfirm={(time) => { setEndTime(time); setShowEndTimePicker(false); }} selectedTime={endTime} />
              </div>
            </div>,
            document.body
          )}
        </>
      )}
    </>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <div className="flex items-center justify-between py-4 px-4 relative">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground absolute left-1/2 -translate-x-1/2">
          {isEditing ? "Edit Rule" : "Add Rule"}
        </h1>
        <button onClick={handleSave} className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium active:opacity-70 transition-opacity">
          Save
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide pt-0 px-6 pb-28">
        <div className="mb-1">
          <span className="text-xs font-medium text-neutral-500 tracking-wider mb-3 block">Rule Type</span>
          <div className="grid grid-cols-2 gap-3">
            {typeOptions.map((opt) => (
              <button key={opt.value} onClick={() => setType(opt.value)} className={`flex items-center gap-3 py-3.5 px-4 rounded-2xl transition-all ${type === opt.value ? "bg-neutral-800/80" : "bg-neutral-800/40"}`} style={type === opt.value ? { boxShadow: `0 0 0 2px ${opt.color}` } : {}}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: opt.color + "22" }}>
                  <Clock className="w-4 h-4" style={{ color: opt.color }} />
                </div>
                <span className="text-foreground text-[15px] font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-6">Select the type of pricing rule.</p>

        <div className="mb-1">
          <span className="text-xs font-medium text-neutral-500 tracking-wider mb-3 block">Rule Details</span>
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between py-3.5 px-4 border-b border-neutral-700/50">
              <span className="text-foreground text-[15px]">Rule Name</span>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter Name" className="bg-transparent border-none text-right text-neutral-400 placeholder:text-neutral-500 w-40 h-auto p-0 focus-visible:ring-0" />
            </div>
            <div className="flex items-center justify-between py-3.5 px-4">
              <span className="text-foreground text-[15px]">Enabled</span>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>
          </div>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-6">Give this rule a descriptive name.</p>

        <div className="mb-1">
          <span className="text-xs font-medium text-neutral-500 tracking-wider mb-3 block">Schedule</span>
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
            <button onClick={() => setShowStartTimePicker(true)} className="flex items-center justify-between w-full py-3.5 px-4 border-b border-neutral-700/50 active:opacity-70 transition-opacity">
              <span className="text-foreground text-[15px]">Start Time</span>
              <div className="flex items-center gap-2">
                <span className="text-neutral-400 text-[15px]">{startTime}</span>
                <Clock className="w-4 h-4 text-neutral-500" />
              </div>
            </button>
            <button onClick={() => setShowEndTimePicker(true)} className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity">
              <span className="text-foreground text-[15px]">End Time</span>
              <div className="flex items-center gap-2">
                <span className="text-neutral-400 text-[15px]">{endTime}</span>
                <Clock className="w-4 h-4 text-neutral-500" />
              </div>
            </button>
          </div>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-6">Set the time window.</p>

        <div className="mb-1">
          <span className="text-xs font-medium text-neutral-500 tracking-wider mb-3 block">Active Days</span>
          <div className="flex gap-2">
            {dayLabels.map((day) => {
              const isActive = days.includes(day);
              return (
                <button key={day} onClick={() => toggleDay(day)} className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? "text-primary-foreground" : "bg-neutral-800/40 text-neutral-500"}`} style={isActive ? { backgroundColor: selectedTypeOption.color } : {}}>
                  {day}
                </button>
              );
            })}
          </div>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-6">Choose which days.</p>

        <div className="mb-1">
          <span className="text-xs font-medium text-neutral-500 tracking-wider mb-3 block">Price Adjustment</span>
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between py-3.5 px-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-semibold" style={{ color: adjustment < 0 ? "#34C759" : adjustment > 0 ? "#FF9500" : undefined }}>
                  {adjustment > 0 ? "+" : ""}{adjustment}%
                </span>
                <span className="text-neutral-500 text-sm">{adjustment < 0 ? "Discount" : adjustment > 0 ? "Surcharge" : "No Change"}</span>
              </div>
              <div className="flex items-center bg-neutral-700/50 rounded-lg overflow-hidden">
                <button onClick={() => setAdjustment(Math.max(-100, adjustment - 5))} className="w-10 h-10 flex items-center justify-center text-foreground active:opacity-70 transition-opacity border-r border-neutral-600">
                  <Minus className="w-4 h-4" />
                </button>
                <button onClick={() => setAdjustment(Math.min(100, adjustment + 5))} className="w-10 h-10 flex items-center justify-center text-foreground active:opacity-70 transition-opacity">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-6">Set the percentage adjustment.</p>

        <div className="mb-1">
          <span className="text-xs font-medium text-neutral-500 tracking-wider mb-3 block">Preview</span>
          <div className="bg-neutral-800/60 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: selectedTypeOption.color + "22" }}>
                <Clock className="w-5 h-5" style={{ color: selectedTypeOption.color }} />
              </div>
              <div>
                <p className="text-foreground text-base font-medium">{name || "Untitled Rule"}</p>
                <p className="text-muted-foreground text-xs">{selectedTypeOption.label}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{startTime} – {endTime}</span>
              <span className="text-muted-foreground">{days.length === 7 ? "Every day" : days.length === 0 ? "No days" : days.join(", ")}</span>
              <span className="font-medium" style={{ color: adjustment < 0 ? "#34C759" : "#FF9500" }}>
                {adjustment > 0 ? "+" : ""}{adjustment}%
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-neutral-700/50">
              <p className="text-xs text-neutral-500 mb-2">Example: Product priced at £10.00</p>
              <div className="flex items-center gap-3">
                <span className="text-neutral-500 line-through text-sm">£10.00</span>
                <span className="text-foreground font-semibold text-base">£{(10 + (10 * adjustment / 100)).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {timePickerPortal}
    </div>
  );
};

export default AddTimedPricingRuleContent;
