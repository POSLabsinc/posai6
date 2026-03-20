import { useState, useRef, useEffect } from "react";

interface AppleWheelTimePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (time: string) => void;
  selectedTime: string;
  compact?: boolean;
}

const AppleWheelTimePicker = ({
  isOpen,
  onClose,
  onConfirm,
  selectedTime,
  compact = false,
}: AppleWheelTimePickerProps) => {
  const parseTime = (timeStr: string) => {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      return {
        hour: parseInt(match[1]),
        minute: parseInt(match[2]),
        period: match[3].toUpperCase() as "AM" | "PM",
      };
    }
    return { hour: 12, minute: 0, period: "AM" as "AM" | "PM" };
  };

  const initialTime = parseTime(selectedTime);
  const [selectedHour, setSelectedHour] = useState(initialTime.hour);
  const [selectedMinute, setSelectedMinute] = useState(initialTime.minute);
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">(initialTime.period);

  const hourScrollRef = useRef<HTMLDivElement>(null);
  const minuteScrollRef = useRef<HTMLDivElement>(null);
  const periodScrollRef = useRef<HTMLDivElement>(null);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const periods: ("AM" | "PM")[] = ["AM", "PM"];

  const ITEM_HEIGHT = compact ? 34 : 44;
  const COLUMN_HEIGHT = compact ? 170 : 220;
  const GRADIENT_HEIGHT = compact ? 58 : 88;

  useEffect(() => {
    if (isOpen) {
      const parsed = parseTime(selectedTime);
      setSelectedHour(parsed.hour);
      setSelectedMinute(parsed.minute);
      setSelectedPeriod(parsed.period);
    }
  }, [isOpen, selectedTime]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (hourScrollRef.current) {
          const hourIndex = hours.indexOf(selectedHour);
          if (hourIndex >= 0) {
            hourScrollRef.current.scrollTop = hourIndex * ITEM_HEIGHT;
          }
        }
        if (minuteScrollRef.current) {
          minuteScrollRef.current.scrollTop = selectedMinute * ITEM_HEIGHT;
        }
        if (periodScrollRef.current) {
          const periodIndex = periods.indexOf(selectedPeriod);
          if (periodIndex >= 0) {
            periodScrollRef.current.scrollTop = periodIndex * ITEM_HEIGHT;
          }
        }
      }, 30);
    }
  }, [isOpen, selectedHour, selectedMinute, selectedPeriod, ITEM_HEIGHT]);

  const handleScroll = (
    ref: React.RefObject<HTMLDivElement>,
    items: (number | string)[],
    setter: (value: any) => void,
    isHour?: boolean
  ) => {
    if (!ref.current) return;
    const scrollTop = ref.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, items.length - 1));

    if (isHour) {
      setter(items[clampedIndex] as number);
    } else if (typeof items[0] === "number") {
      setter(items[clampedIndex] as number);
    } else {
      setter(items[clampedIndex] as "AM" | "PM");
    }
  };

  const handleConfirm = () => {
    const formattedMinute = selectedMinute.toString().padStart(2, "0");
    const formattedTime = `${selectedHour}:${formattedMinute} ${selectedPeriod}`;
    onConfirm(formattedTime);
  };

  if (!isOpen) return null;

  const renderWheelColumn = (
    items: (number | string)[],
    selectedValue: number | string,
    ref: React.RefObject<HTMLDivElement>,
    setter: (value: any) => void,
    isHour?: boolean,
    formatFn?: (value: number | string) => string
  ) => {
    return (
      <div className="relative overflow-hidden flex-1" style={{ height: COLUMN_HEIGHT }}>
        <div
          className="absolute inset-x-0 top-0 bg-gradient-to-b from-neutral-900 via-neutral-900/80 to-transparent z-10 pointer-events-none"
          style={{ height: GRADIENT_HEIGHT }}
        />
        <div
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-neutral-900 via-neutral-900/80 to-transparent z-10 pointer-events-none"
          style={{ height: GRADIENT_HEIGHT }}
        />

        <div
          ref={ref}
          className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory"
          style={{ scrollSnapType: "y mandatory" }}
          onScroll={() => handleScroll(ref, items, setter, isHour)}
        >
          <div style={{ height: ITEM_HEIGHT * 2 }} />
          {items.map((item, index) => {
            const isSelected = item === selectedValue;
            const displayValue = formatFn ? formatFn(item) : item;

            return (
              <div
                key={`${item}-${index}`}
                className="snap-center flex items-center justify-center"
                style={{ height: ITEM_HEIGHT }}
              >
                <span
                  className={`transition-all duration-150 ${
                    isSelected
                      ? compact
                        ? "text-foreground text-base font-semibold"
                        : "text-foreground text-xl font-semibold"
                      : compact
                        ? "text-neutral-500 text-sm font-normal"
                        : "text-neutral-500 text-lg font-normal"
                  }`}
                >
                  {displayValue}
                </span>
              </div>
            );
          })}
          <div style={{ height: ITEM_HEIGHT * 2 }} />
        </div>
      </div>
    );
  };

  const pickerContent = (
    <div
      className={compact ? "w-[280px] bg-neutral-900 rounded-xl border border-neutral-700/50 shadow-2xl" : "w-full max-w-md bg-neutral-900 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={compact ? "flex items-center justify-between px-3 py-2 border-b border-neutral-700/40" : "flex items-center justify-between px-4 py-4"}>
        <button onClick={onClose} className={compact ? "text-neutral-400 text-xs font-medium" : "text-neutral-400 text-base font-medium"}>
          Cancel
        </button>
        <button onClick={handleConfirm} className={compact ? "text-foreground text-xs font-medium" : "text-foreground text-base font-medium"}>
          Done
        </button>
      </div>

      <div className="relative">
        <div
          className={compact ? "absolute left-2 right-2 top-1/2 -translate-y-1/2 h-[34px] bg-neutral-800/50 rounded-md pointer-events-none z-0" : "absolute left-4 right-4 top-1/2 -translate-y-1/2 h-[44px] bg-neutral-800/50 rounded-xl pointer-events-none z-0"}
        />

        <div className={compact ? "flex px-2 relative z-10" : "flex px-4 relative z-10"}>
          {renderWheelColumn(hours, selectedHour, hourScrollRef, setSelectedHour, true)}
          {renderWheelColumn(
            minutes,
            selectedMinute,
            minuteScrollRef,
            setSelectedMinute,
            false,
            (val) => (val as number).toString().padStart(2, "0")
          )}
          {renderWheelColumn(periods, selectedPeriod, periodScrollRef, setSelectedPeriod)}
        </div>
      </div>

      <div className={compact ? "h-2" : "h-8"} />
    </div>
  );

  if (compact) {
    return pickerContent;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {pickerContent}
    </div>
  );
};

export { AppleWheelTimePicker };
