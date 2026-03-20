import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AppleWheelDatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  selectedDate: Date;
  onDateChange?: (date: Date) => void;
  mode?: "fullscreen" | "inline" | "overlay";
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
  const initializedRef = useRef(false);

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

  // Sync internal state when picker opens
  useEffect(() => {
    if (isOpen) {
      setSelectedMonth(selectedDate.getMonth());
      setSelectedDay(selectedDate.getDate());
      setSelectedYear(selectedDate.getFullYear());
      initializedRef.current = false;
    }
  }, [isOpen]); // only re-sync on open, not on selectedDate changes

  // Adjust selected day if it exceeds days in new month
  useEffect(() => {
    if (selectedDay > daysInCurrentMonth) {
      setSelectedDay(daysInCurrentMonth);
    }
  }, [selectedMonth, selectedYear, daysInCurrentMonth, selectedDay]);

  // Notify parent of changes (for inline/overlay auto-confirm modes)
  useEffect(() => {
    if (!initializedRef.current) return;
    if (onDateChange) {
      const newDate = new Date(selectedYear, selectedMonth, Math.min(selectedDay, daysInCurrentMonth));
      onDateChange(newDate);
    }
  }, [selectedMonth, selectedDay, selectedYear, daysInCurrentMonth]);

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
        initializedRef.current = true;
      }, 50);
    }
  }, [isOpen]);

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

  const handleDone = () => {
    const finalDate = new Date(selectedYear, selectedMonth, Math.min(selectedDay, daysInCurrentMonth));
    onConfirm(finalDate);
  };

  if (!isOpen) return null;

  const isInline = mode === "inline";
  const isOverlay = mode === "overlay";
  const isCompact = isInline || isOverlay;
  const WHEEL_HEIGHT = isCompact ? 96 : 220;
  const GRADIENT_HEIGHT = isCompact ? 28 : 88;
  const PADDING_ITEMS = isCompact ? 1 : 2;

  const renderWheelColumn = (
    items: (string | number)[],
    selectedValue: number | string,
    ref: React.RefObject<HTMLDivElement>,
    setter: (value: number) => void,
    isDay?: boolean,
  ) => {
    return (
      <div className="relative overflow-hidden flex-1" style={{ height: WHEEL_HEIGHT }}>
        <div className={`absolute inset-x-0 top-0 z-10 pointer-events-none ${isCompact ? "bg-gradient-to-b from-neutral-800 to-transparent" : "bg-gradient-to-b from-neutral-900 via-neutral-900/80 to-transparent"}`} style={{ height: GRADIENT_HEIGHT }} />
        <div className={`absolute inset-x-0 bottom-0 z-10 pointer-events-none ${isCompact ? "bg-gradient-to-t from-neutral-800 to-transparent" : "bg-gradient-to-t from-neutral-900 via-neutral-900/80 to-transparent"}`} style={{ height: GRADIENT_HEIGHT }} />

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
                      ? isCompact ? "text-foreground text-xs font-semibold" : "text-foreground text-xl font-semibold"
                      : isCompact ? "text-neutral-500 text-xs font-normal" : "text-neutral-500 text-lg font-normal"
                  }`}
                >
                  {typeof item === "string" && isCompact ? item.slice(0, 3) : item}
                </span>
              </div>
            );
          })}
          <div style={{ height: ITEM_HEIGHT * PADDING_ITEMS }} />
        </div>
      </div>
    );
  };

  // Inline mode: positioned relative to parent
  if (isInline) {
    return (
      <>
        <div className="fixed inset-0 z-40" onClick={onClose} />
        <div className="absolute bottom-full right-0 mb-1 z-50" style={{ width: 220 }}>
          <div className="mx-0 my-1 bg-neutral-800/80 rounded-xl overflow-hidden">
            <div className="relative px-3 py-1">
              <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-[32px] bg-neutral-700/50 rounded-lg pointer-events-none z-0" />
              <div className="flex relative z-10">
                {renderWheelColumn(months, selectedMonth, monthScrollRef, setSelectedMonth)}
                {renderWheelColumn(days, selectedDay, dayScrollRef, setSelectedDay, true)}
                {renderWheelColumn(years, selectedYear, yearScrollRef, setSelectedYear)}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Overlay mode: centered on screen with backdrop
  if (isOverlay) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="w-[280px] bg-neutral-800 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <span className="text-sm font-semibold text-foreground">Select Date</span>
            <button onClick={handleDone} className="text-sm font-medium text-primary active:opacity-70 transition-opacity">Done</button>
          </div>
          <div className="relative px-3 pb-3">
            <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-[32px] bg-neutral-700/50 rounded-lg pointer-events-none z-0" />
            <div className="flex relative z-10">
              {renderWheelColumn(months, selectedMonth, monthScrollRef, setSelectedMonth)}
              {renderWheelColumn(days, selectedDay, dayScrollRef, setSelectedDay, true)}
              {renderWheelColumn(years, selectedYear, yearScrollRef, setSelectedYear)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fullscreen mode: bottom sheet
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
          <button onClick={handleDone} className="text-foreground text-base font-medium">Done</button>
        </div>

        <div className="relative">
          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-[44px] bg-neutral-800/50 rounded-xl pointer-events-none z-0" />
          <div className="grid grid-cols-3 px-4 relative z-10">
            {renderWheelColumn(months, selectedMonth, monthScrollRef, setSelectedMonth)}
            {renderWheelColumn(days, selectedDay, dayScrollRef, setSelectedDay, true)}
            {renderWheelColumn(years, selectedYear, yearScrollRef, setSelectedYear)}
          </div>
        </div>
        <div className="h-8" />
      </div>
    </div>
  );
};

export { AppleWheelDatePicker };
