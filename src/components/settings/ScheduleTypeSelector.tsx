import { Check } from "lucide-react";
import type { ScheduleType } from "@/hooks/useScheduledTheme";

interface ScheduleTypeSelectorProps {
  scheduleType: ScheduleType;
  onTypeChange: (type: ScheduleType) => void;
}

const ScheduleTypeSelector = ({ scheduleType, onTypeChange }: ScheduleTypeSelectorProps) => {
  return (
    <div className="mt-3 space-y-0 bg-neutral-800/40 dark:bg-neutral-800/40 rounded-xl overflow-hidden">
      <button
        className="flex items-center justify-between w-full py-3 px-4 active:opacity-70 transition-opacity"
        onClick={() => onTypeChange("sunset-sunrise")}
      >
        <span className="text-base text-foreground">Sunset to Sunrise</span>
        {scheduleType === "sunset-sunrise" && (
          <Check className="w-5 h-5 text-primary" />
        )}
      </button>

      <div className="h-px bg-neutral-700/50 mx-4" />

      <button
        className="flex items-center justify-between w-full py-3 px-4 active:opacity-70 transition-opacity"
        onClick={() => onTypeChange("custom")}
      >
        <span className="text-base text-foreground">Custom Schedule</span>
        {scheduleType === "custom" && (
          <Check className="w-5 h-5 text-primary" />
        )}
      </button>
    </div>
  );
};

export default ScheduleTypeSelector;
