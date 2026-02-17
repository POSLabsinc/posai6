import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface InlineDatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  position: { top: number; right: number };
}

const InlineDatePicker = ({
  isOpen,
  onClose,
  selectedDate,
  onDateChange,
  position,
}: InlineDatePickerProps) => {
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

  const ITEM_HEIGHT = 40;

  // Adjust selected day if it exceeds days in new month
  useEffect(() => {
    if (selectedDay > daysInCurrentMonth) {
      setSelectedDay(daysInCurrentMonth);
    }
  }, [selectedMonth, selectedYear, daysInCurrentMonth, selectedDay]);

  // Auto-save when selections change
  useEffect(() => {
    const newDate = new Date(selectedYear, selectedMonth, Math.min(selectedDay, daysInCurrentMonth));
    onDateChange(newDate);
  }, [selectedMonth, selectedDay, selectedYear, daysInCurrentMonth]);

  // Sync internal state when selectedDate prop changes
  useEffect(() => {
    if (isOpen) {
      setSelectedMonth(selectedDate.getMonth());
      setSelectedDay(selectedDate.getDate());
      setSelectedYear(selectedDate.getFullYear());
    }
  }, [isOpen, selectedDate]);

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

  const renderWheelColumn = (
    items: (string | number)[],
    selectedValue: number | string,
    ref: React.RefObject<HTMLDivElement>,
    setter: (value: number) => void,
    isDay?: boolean,
    align: "left" | "center" | "right" = "center"
  ) => {
    return (
      <div className="relative h-[200px] overflow-hidden flex-1">
        {/* Gradient overlays for fade effect */}
        <div className="absolute inset-x-0 top-0 h-[80px] bg-gradient-to-b from-neutral-800 via-neutral-800/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-[80px] bg-gradient-to-t from-neutral-800 via-neutral-800/80 to-transparent z-10 pointer-events-none" />

        <div
          ref={ref}
          className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory"
          style={{ scrollSnapType: "y mandatory" }}
          onScroll={() => handleScroll(ref, items, setter, isDay)}
        >
          {/* Padding items for centering */}
          <div style={{ height: ITEM_HEIGHT * 2 }} />
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
                  className={`transition-all duration-150 text-sm ${
                    isSelected
                      ? "text-foreground font-semibold"
                      : "text-neutral-500 font-normal"
                  } ${
                    align === "left"
                      ? "text-left w-full pl-2"
                      : align === "right"
                      ? "text-right w-full pr-2"
                      : "text-center"
                  }`}
                >
                  {item}
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
      className="fixed inset-0 z-50"
      onClick={onClose}
    >
      <div
        className="fixed bg-neutral-800 rounded-xl shadow-2xl w-[280px] animate-in zoom-in-95 fade-in duration-200"
        style={{ top: position.top, right: position.right }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with navigation */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-neutral-700/50">
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrevMonth}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-neutral-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-neutral-400" />
            </button>
            <button
              onClick={goToNextMonth}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-neutral-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>
          </div>
          <button onClick={onClose} className="text-foreground text-sm font-medium">
            Done
          </button>
        </div>

        {/* Selection indicator bar */}
        <div className="relative px-3 py-2">
          <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-[40px] bg-neutral-700/50 rounded-lg pointer-events-none z-0" />

          {/* Three-column wheel picker */}
          <div className="flex relative z-10">
            {/* Month Column */}
            {renderWheelColumn(months, selectedMonth, monthScrollRef, setSelectedMonth, false, "right")}

            {/* Day Column */}
            {renderWheelColumn(days, selectedDay, dayScrollRef, setSelectedDay, true, "center")}

            {/* Year Column */}
            {renderWheelColumn(years, selectedYear, yearScrollRef, setSelectedYear, false, "left")}
          </div>
        </div>
      </div>
    </div>
  );
};

export { InlineDatePicker };
