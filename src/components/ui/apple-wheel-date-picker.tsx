import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AppleWheelDatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  mode?: "fullscreen" | "inline";
}

const AppleWheelDatePicker = ({
  isOpen,
  onClose,
  onConfirm,
  selectedDate,
  onDateChange,
  mode = "fullscreen",
}: AppleWheelDatePickerProps) => {
  const [selectedMonth, setSelectedMonth] = useState(selectedDate.getMonth());
  const [selectedDay, setSelectedDay] = useState(selectedDate.getDate());
  const [selectedYear, setSelectedYear] = useState(selectedDate.getFullYear());

  const monthScrollRef = useRef<HTMLDivElement>(null);
  const dayScrollRef = useRef<HTMLDivElement>(null);
  const yearScrollRef = useRef<HTMLDivElement>(null);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - 25 + i);

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const daysInCurrentMonth = getDaysInMonth(selectedMonth, selectedYear);
  const days = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);

  // Adjust selected day if it exceeds days in new month
  useEffect(() => {
    if (selectedDay > daysInCurrentMonth) {
      setSelectedDay(daysInCurrentMonth);
    }
  }, [selectedMonth, selectedYear, daysInCurrentMonth, selectedDay]);

  // Update parent date when selections change
  useEffect(() => {
    const newDate = new Date(selectedYear, selectedMonth, Math.min(selectedDay, daysInCurrentMonth));
    onDateChange(newDate);
  }, [selectedMonth, selectedDay, selectedYear, daysInCurrentMonth, onDateChange]);

  // Sync internal state when selectedDate prop changes
  useEffect(() => {
    if (isOpen) {
      setSelectedMonth(selectedDate.getMonth());
      setSelectedDay(selectedDate.getDate());
      setSelectedYear(selectedDate.getFullYear());
    }
  }, [isOpen, selectedDate]);

  const ITEM_HEIGHT = 44;

  // Scroll to selected items on mount
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (monthScrollRef.current) {
          monthScrollRef.current.scrollTop = selectedMonth * ITEM_HEIGHT;
        }
        if (dayScrollRef.current) {
          dayScrollRef.current.scrollTop = (selectedDay - 1) * ITEM_HEIGHT;
        }
        if (yearScrollRef.current) {
          const yearIndex = years.indexOf(selectedYear);
          if (yearIndex >= 0) {
            yearScrollRef.current.scrollTop = yearIndex * ITEM_HEIGHT;
          }
        }
      }, 50);
    }
  }, [isOpen, selectedMonth, selectedDay, selectedYear, years]);

  const handleScroll = (
    ref: React.RefObject<HTMLDivElement>,
    items: (string | number)[],
    setter: (value: number) => void,
    isDay?: boolean
  ) => {
    if (!ref.current) return;
    const scrollTop = ref.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
    if (isDay) {
      setter(clampedIndex + 1);
    } else if (typeof items[0] === "string") {
      setter(clampedIndex);
    } else {
      setter(items[clampedIndex] as number);
    }
  };

  const goToPrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  if (!isOpen) return null;

  const WHEEL_HEIGHT = mode === "inline" ? 150 : 220;
  const GRADIENT_HEIGHT = mode === "inline" ? 55 : 88;
  const PADDING_ITEMS = mode === "inline" ? 1.5 : 2;

  const renderWheelColumn = (
    items: (string | number)[],
    selectedValue: number | string,
    ref: React.RefObject<HTMLDivElement>,
    setter: (value: number) => void,
    isDay?: boolean,
    align: "left" | "center" | "right" = "center"
  ) => {
    return (
      <div className="relative overflow-hidden" style={{ height: WHEEL_HEIGHT }}>
        <div className={`absolute inset-x-0 top-0 bg-gradient-to-b from-neutral-900 via-neutral-900/80 to-transparent z-10 pointer-events-none`} style={{ height: GRADIENT_HEIGHT }} />
        <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-neutral-900 via-neutral-900/80 to-transparent z-10 pointer-events-none`} style={{ height: GRADIENT_HEIGHT }} />

        <div
          ref={ref}
          className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory"
          style={{ scrollSnapType: "y mandatory" }}
          onScroll={() => handleScroll(ref, items, setter, isDay)}
        >
          <div style={{ height: ITEM_HEIGHT * PADDING_ITEMS }} />
          {items.map((item, index) => {
            const isSelected = isDay
              ? item === selectedValue
              : typeof items[0] === "string"
              ? index === selectedValue
              : item === selectedValue;

            return (
              <div
                key={`${item}-${index}`}
                className="snap-center flex items-center justify-center"
                style={{ height: ITEM_HEIGHT }}
              >
                <span
                  className={`transition-all duration-150 ${
                    isSelected
                      ? mode === "inline" ? "text-foreground text-base font-semibold" : "text-foreground text-xl font-semibold"
                      : mode === "inline" ? "text-neutral-500 text-sm font-normal" : "text-neutral-500 text-lg font-normal"
                  } ${
                    align === "left"
                      ? "text-left w-full pl-2"
                      : align === "right"
                      ? "text-right w-full pr-2"
                      : "text-center"
                  }`}
                >
                  {typeof item === "string" && mode === "inline" ? item.slice(0, 3) : item}
                </span>
              </div>
            );
          })}
          <div style={{ height: ITEM_HEIGHT * PADDING_ITEMS }} />
        </div>
      </div>
    );
  };

  if (mode === "inline") {
    return (
      <>
        <div className="fixed inset-0 z-40" onClick={onClose} />
        <div className="absolute top-full mt-1 z-50 overflow-hidden" style={{ width: 240 }}>
          {/* Header */}
          <div className="flex items-center justify-between px-2 py-2">
            <div className="flex items-center gap-1">
              <button onClick={goToPrevMonth} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-neutral-800 transition-colors">
                <ChevronLeft className="w-4 h-4 text-neutral-400" />
              </button>
              <button onClick={goToNextMonth} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-neutral-800 transition-colors">
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </button>
            </div>
            <button onClick={onConfirm} className="text-foreground text-sm font-medium">Done</button>
          </div>

          <div className="relative">
            <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-[36px] bg-neutral-800/50 rounded-lg pointer-events-none z-0" />
            <div className="grid grid-cols-3 px-2 relative z-10">
              {renderWheelColumn(months, selectedMonth, monthScrollRef, setSelectedMonth, false, "right")}
              {renderWheelColumn(days, selectedDay, dayScrollRef, setSelectedDay, true, "center")}
              {renderWheelColumn(years, selectedYear, yearScrollRef, setSelectedYear, false, "left")}
            </div>
          </div>
          <div className="h-2" />
        </div>
      </>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-neutral-900 rounded-t-3xl animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <button onClick={goToPrevMonth} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-neutral-800 transition-colors">
              <ChevronLeft className="w-5 h-5 text-neutral-400" />
            </button>
            <button onClick={goToNextMonth} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-neutral-800 transition-colors">
              <ChevronRight className="w-5 h-5 text-neutral-400" />
            </button>
          </div>
          <button onClick={onConfirm} className="text-foreground text-base font-medium">Done</button>
        </div>

        <div className="relative">
          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-[44px] bg-neutral-800/50 rounded-xl pointer-events-none z-0" />
          <div className="grid grid-cols-3 px-4 relative z-10">
            {renderWheelColumn(months, selectedMonth, monthScrollRef, setSelectedMonth, false, "right")}
            {renderWheelColumn(days, selectedDay, dayScrollRef, setSelectedDay, true, "center")}
            {renderWheelColumn(years, selectedYear, yearScrollRef, setSelectedYear, false, "left")}
          </div>
        </div>
        <div className="h-8" />
      </div>
    </div>
  );
};

export { AppleWheelDatePicker };
