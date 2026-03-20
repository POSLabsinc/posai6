import { useState } from "react";
import { ChevronLeft, ChevronRight, Check, Copy, ClipboardPaste } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { AppleWheelTimePicker } from "@/components/ui/apple-wheel-time-picker";
import { AppleWheelDatePicker } from "@/components/ui/apple-wheel-date-picker";
import { supabase } from "@/integrations/supabase/client";

interface AddScheduleContentProps {
  onBack: () => void;
}

const allDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dayAbbrev: Record<string, string> = {
  Sunday: "Sun", Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed",
  Thursday: "Thu", Friday: "Fri", Saturday: "Sat",
};

const formatDate = (d: Date) =>
  `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;

interface DaySchedule {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

const defaultSchedule = (): Record<string, DaySchedule> =>
  Object.fromEntries(allDays.map((d) => [d, { enabled: false, startTime: "Choose", endTime: "Choose" }]));

const AddScheduleContent = ({ onBack }: AddScheduleContentProps) => {
  const isMobile = useIsMobile();

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [daySchedules, setDaySchedules] = useState<Record<string, DaySchedule>>(defaultSchedule);

  const [copiedDay, setCopiedDay] = useState<string | null>(null);
  const [activeTimePicker, setActiveTimePicker] = useState<{
    day: string;
    field: "startTime" | "endTime";
    top: number;
    left: number;
  } | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [datePickerPos, setDatePickerPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

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
      toast({ title: "Error", description: "Please enter a schedule name", variant: "destructive" });
      return;
    }
    const enabledDays = allDays.filter((d) => daySchedules[d].enabled);
    if (enabledDays.length === 0) {
      toast({ title: "Error", description: "Please select at least one day", variant: "destructive" });
      return;
    }

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    const shifts = enabledDays.map((day) => ({
      employee_id: "00000000-0000-0000-0000-000000000000",
      shift_date: startDateStr,
      start_date: startDateStr,
      end_date: endDateStr,
      job_type: name.trim(),
      shift_type: "Scheduled",
      start_time: daySchedules[day].startTime === "Choose" ? null : daySchedules[day].startTime,
      end_time: daySchedules[day].endTime === "Choose" ? null : daySchedules[day].endTime,
    }));

    const { error } = await (supabase as any).from("employee_shifts").insert(shifts);
    if (error) {
      toast({ description: "Failed to create schedule", variant: "destructive" });
      return;
    }

    toast({ description: `"${name.trim()}" schedule created successfully.` });
    onBack();
  };

  const renderInlineTimePicker = (day: string, field: "startTime" | "endTime") => {
    if (!activeTimePicker || activeTimePicker.day !== day || activeTimePicker.field !== field) return null;
    const currentTime = daySchedules[day][field];
    const timeValue = currentTime === "Choose" ? "12:00 AM" : currentTime;

    if (isMobile) {
      return (
        <AppleWheelTimePicker
          isOpen
          onClose={() => setActiveTimePicker(null)}
          onConfirm={(time) => { updateDayTime(day, field, time); setActiveTimePicker(null); }}
          selectedTime={timeValue}
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
            selectedTime={timeValue}
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

    return (
      <AppleWheelDatePicker
        isOpen
        mode="overlay"
        onClose={close}
        onConfirm={(d) => { setDate(d); close(); }}
        selectedDate={current}
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
        <h1 className="text-lg font-semibold text-foreground absolute left-1/2 -translate-x-1/2">
          Add Schedule
        </h1>
        <button onClick={handleSave} className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium active:opacity-70 transition-opacity">
          Save
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide pt-0 px-6 pb-28">
        {/* Name, Start Date, End Date */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between py-3.5 px-4 border-b border-neutral-700/30">
            <span className="text-foreground text-[15px]">Restaurant Schedule</span>
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
          <div className="grid grid-cols-[44px_1fr_1fr_1fr_68px] items-center px-4 py-3 border-b border-neutral-700/30">
            <span />
            <span className="text-sm font-semibold text-foreground">Days</span>
            <span className="text-sm font-semibold text-foreground text-center">Start Time</span>
            <span className="text-sm font-semibold text-foreground text-right">End Time</span>
            <span />
          </div>

          {allDays.map((day, idx) => (
            <div key={day}>
              {idx > 0 && <div className="h-px bg-neutral-700/20 mx-4" />}
              <div className="grid grid-cols-[44px_1fr_1fr_1fr_68px] items-center px-4 py-3.5">
                <button onClick={() => toggleDay(day)} className="flex items-center justify-center">
                  <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                    daySchedules[day].enabled
                      ? "bg-foreground border-foreground"
                      : "border-neutral-500 bg-transparent"
                  }`}>
                    {daySchedules[day].enabled && <Check className="w-4 h-4 text-background" />}
                  </div>
                </button>

                <span className={`text-[15px] font-medium uppercase ${daySchedules[day].enabled ? "text-foreground" : "text-neutral-500"}`}>
                  {day}
                </span>

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

export default AddScheduleContent;
