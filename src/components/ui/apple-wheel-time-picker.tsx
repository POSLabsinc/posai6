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
}: AppleWheelTimePickerProps) => {
  // Parse the initial time
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

  const ITEM_HEIGHT = 44;

  // Sync internal state when selectedTime prop changes
  useEffect(() => {
    if (isOpen) {
      const parsed = parseTime(selectedTime);
      setSelectedHour(parsed.hour);
      setSelectedMinute(parsed.minute);
      setSelectedPeriod(parsed.period);
    }
  }, [isOpen, selectedTime]);

  // Scroll to selected items on mount
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
      }, 50);
    }
  }, [isOpen, selectedHour, selectedMinute, selectedPeriod]);

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
      <div className="relative h-[220px] overflow-hidden flex-1">
        {/* Gradient overlays for fade effect */}
        <div className="absolute inset-x-0 top-0 h-[88px] bg-gradient-to-b from-neutral-900 via-neutral-900/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-[88px] bg-gradient-to-t from-neutral-900 via-neutral-900/80 to-transparent z-10 pointer-events-none" />

        <div
          ref={ref}
          className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory"
          style={{ scrollSnapType: "y mandatory" }}
          onScroll={() => handleScroll(ref, items, setter, isHour)}
        >
          {/* Padding items for centering */}
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
                      ? "text-foreground text-xl font-semibold"
                      : "text-neutral-500 text-lg font-normal"
                  }`}
                >
                  {displayValue}
                </span>
              </div>
            );
          })}
          {/* Padding items for centering */}
          <div style={{ height: ITEM_HEIGHT * 2 }} />
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-neutral-900 rounded-t-3xl animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4">
          <button onClick={onClose} className="text-neutral-400 text-base font-medium">
            Cancel
          </button>
          <button onClick={handleConfirm} className="text-foreground text-base font-medium">
            Done
          </button>
        </div>

        {/* Selection indicator bar */}
        <div className="relative">
          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-[44px] bg-neutral-800/50 rounded-xl pointer-events-none z-0" />

          {/* Three-column wheel picker */}
          <div className="flex px-4 relative z-10">
            {/* Hour Column */}
            {renderWheelColumn(hours, selectedHour, hourScrollRef, setSelectedHour, true)}

            {/* Minute Column */}
            {renderWheelColumn(
              minutes,
              selectedMinute,
              minuteScrollRef,
              setSelectedMinute,
              false,
              (val) => (val as number).toString().padStart(2, "0")
            )}

            {/* AM/PM Column */}
            {renderWheelColumn(periods, selectedPeriod, periodScrollRef, setSelectedPeriod)}
          </div>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
};

export { AppleWheelTimePicker };
