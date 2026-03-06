import { useState } from "react";
import { ChevronRight, Check, Copy, ClipboardPaste } from "lucide-react";
import { format } from "date-fns";
import { AppleWheelDatePicker } from "@/components/ui/apple-wheel-date-picker";
import { CompactTimePicker } from "@/components/ui/compact-time-picker";
import { toast } from "sonner";

export interface DaySchedule {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

const ALL_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;

export const defaultDaySchedule = (): Record<string, DaySchedule> =>
  Object.fromEntries(ALL_DAYS.map((d) => [d, { enabled: false, startTime: "12:00 AM", endTime: "11:59 PM" }]));

interface MenuScheduleSectionProps {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (d: Date) => void;
  onEndDateChange: (d: Date) => void;
  startDateSet: boolean;
  endDateSet: boolean;
  onStartDateSetChange: (v: boolean) => void;
  onEndDateSetChange: (v: boolean) => void;
  daySchedules: Record<string, DaySchedule>;
  onDaySchedulesChange: (s: Record<string, DaySchedule>) => void;
}

const MenuScheduleSection = ({
  startDate, endDate, onStartDateChange, onEndDateChange,
  startDateSet, endDateSet, onStartDateSetChange, onEndDateSetChange,
  daySchedules, onDaySchedulesChange,
}: MenuScheduleSectionProps) => {
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [activeTimePicker, setActiveTimePicker] = useState<string | null>(null);
  const [copiedDay, setCopiedDay] = useState<string | null>(null);

  const toggleDayEnabled = (day: string) => {
    onDaySchedulesChange({
      ...daySchedules,
      [day]: { ...daySchedules[day], enabled: !daySchedules[day].enabled },
    });
  };

  const toggleTimePicker = (day: string, field: "startTime" | "endTime") => {
    const key = `${day}-${field}`;
    setActiveTimePicker((prev) => (prev === key ? null : key));
  };

  const updateDayTime = (day: string, field: "startTime" | "endTime", time: string) => {
    onDaySchedulesChange({
      ...daySchedules,
      [day]: { ...daySchedules[day], [field]: time },
    });
  };

  const copyDay = (day: string) => {
    setCopiedDay(day);
    toast.success(`Copied ${day.charAt(0) + day.slice(1).toLowerCase()}'s schedule`);
  };

  const pasteDay = (targetDay: string) => {
    if (!copiedDay) return;
    const source = daySchedules[copiedDay];
    onDaySchedulesChange({
      ...daySchedules,
      [targetDay]: { ...daySchedules[targetDay], startTime: source.startTime, endTime: source.endTime },
    });
    toast.success(`Pasted to ${targetDay.charAt(0) + targetDay.slice(1).toLowerCase()}`);
  };

  return (
    <div>
      {/* Start Date */}
      <div className="relative">
        <button
          onClick={() => { setShowStartDatePicker(!showStartDatePicker); setShowEndDatePicker(false); }}
          className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity border-t border-neutral-700/30"
        >
          <span className="text-foreground text-sm font-medium">Start Date</span>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground text-sm">
              {startDateSet ? format(startDate, "MM/dd/yyyy") : "Choose"}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </button>
        <AppleWheelDatePicker
          isOpen={showStartDatePicker}
          onClose={() => { onStartDateSetChange(true); setShowStartDatePicker(false); }}
          onConfirm={() => { onStartDateSetChange(true); setShowStartDatePicker(false); }}
          selectedDate={startDate}
          onDateChange={(d) => { onStartDateChange(d); onStartDateSetChange(true); }}
          mode="inline"
        />
      </div>

      {/* End Date */}
      <div className="relative">
        <button
          onClick={() => { setShowEndDatePicker(!showEndDatePicker); setShowStartDatePicker(false); }}
          className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity border-t border-neutral-700/30"
        >
          <span className="text-foreground text-sm font-medium">End Date</span>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground text-sm">
              {endDateSet ? format(endDate, "MM/dd/yyyy") : "Choose"}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </button>
        <AppleWheelDatePicker
          isOpen={showEndDatePicker}
          onClose={() => { onEndDateSetChange(true); setShowEndDatePicker(false); }}
          onConfirm={() => { onEndDateSetChange(true); setShowEndDatePicker(false); }}
          selectedDate={endDate}
          onDateChange={(d) => { onEndDateChange(d); onEndDateSetChange(true); }}
          mode="inline"
        />
      </div>

      {/* Days Table Header */}
      <div className="border-t border-neutral-700/30 px-4 py-2.5 flex items-center">
        <span className="text-muted-foreground text-xs font-semibold w-[40%]">Days</span>
        <span className="text-muted-foreground text-xs font-semibold w-[25%] text-center">Start Time</span>
        <span className="text-muted-foreground text-xs font-semibold w-[25%] text-center">End Time</span>
        <span className="w-[10%]" />
      </div>

      {/* Day Rows */}
      {ALL_DAYS.map((day) => {
        const schedule = daySchedules[day];
        const startPickerKey = `${day}-startTime`;
        const endPickerKey = `${day}-endTime`;
        return (
          <div key={day} className="border-t border-neutral-700/20">
            <div className="px-4 py-3 flex items-center">
              <button
                onClick={() => toggleDayEnabled(day)}
                className="flex items-center gap-2.5 w-[40%] active:opacity-70 transition-opacity"
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    schedule.enabled ? "bg-foreground border-foreground" : "border-neutral-600 bg-transparent"
                  }`}
                >
                  {schedule.enabled && <Check className="w-3.5 h-3.5 text-background" />}
                </div>
                <span className={`text-sm font-medium ${schedule.enabled ? "text-foreground" : "text-muted-foreground"}`}>
                  {day.charAt(0) + day.slice(1).toLowerCase()}
                </span>
              </button>

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
                    <div className="absolute top-full mt-1 z-50 overflow-hidden" style={{ width: 200 }}>
                      <CompactTimePicker
                        selectedTime={schedule.startTime}
                        onTimeChange={(time) => updateDayTime(day, "startTime", time)}
                      />
                    </div>
                  </>
                )}
              </div>

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
                    <div className="absolute top-full mt-1 z-50 overflow-hidden" style={{ width: 200 }}>
                      <CompactTimePicker
                        selectedTime={schedule.endTime}
                        onTimeChange={(time) => updateDayTime(day, "endTime", time)}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="w-[10%] flex justify-center gap-0.5">
                <button
                  onClick={() => schedule.enabled && copyDay(day)}
                  disabled={!schedule.enabled}
                  className={`p-1 rounded active:opacity-70 transition-opacity ${
                    copiedDay === day ? "text-blue-400" : schedule.enabled ? "text-muted-foreground" : "text-muted-foreground/30"
                  }`}
                  title="Copy this day's schedule"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {copiedDay && copiedDay !== day && (
                  <button
                    onClick={() => schedule.enabled && pasteDay(day)}
                    disabled={!schedule.enabled}
                    className={`p-1 rounded active:opacity-70 transition-opacity ${schedule.enabled ? "text-green-400" : "text-muted-foreground/30"}`}
                    title="Paste copied schedule"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MenuScheduleSection;
