import { useState, useRef, useEffect, useCallback } from "react";

interface CompactWheelDatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const ITEM_HEIGHT = 36;

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CompactWheelDatePicker = ({ selectedDate, onDateChange }: CompactWheelDatePickerProps) => {
  const [selectedMonth, setSelectedMonth] = useState(selectedDate.getMonth());
  const [selectedDay, setSelectedDay] = useState(selectedDate.getDate());
  const [selectedYear, setSelectedYear] = useState(selectedDate.getFullYear());

  const monthRef = useRef<HTMLDivElement>(null);
  const dayRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - 15 + i);
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => {
    if (selectedDay > daysInMonth) setSelectedDay(daysInMonth);
  }, [selectedMonth, selectedYear, daysInMonth, selectedDay]);

  useEffect(() => {
    const d = new Date(selectedYear, selectedMonth, Math.min(selectedDay, daysInMonth));
    onDateChange(d);
  }, [selectedMonth, selectedDay, selectedYear, daysInMonth, onDateChange]);

  useEffect(() => {
    setTimeout(() => {
      if (monthRef.current) monthRef.current.scrollTop = selectedMonth * ITEM_HEIGHT;
      if (dayRef.current) dayRef.current.scrollTop = (selectedDay - 1) * ITEM_HEIGHT;
      if (yearRef.current) {
        const idx = years.indexOf(selectedYear);
        if (idx >= 0) yearRef.current.scrollTop = idx * ITEM_HEIGHT;
      }
    }, 30);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = useCallback(
    (ref: React.RefObject<HTMLDivElement>, items: (string | number)[], setter: (v: number) => void, isDay?: boolean) => {
      if (!ref.current) return;
      const idx = Math.round(ref.current.scrollTop / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(idx, items.length - 1));
      if (isDay) setter(clamped + 1);
      else if (typeof items[0] === "string") setter(clamped);
      else setter(items[clamped] as number);
    },
    []
  );

  const renderColumn = (
    items: (string | number)[],
    selected: number | string,
    ref: React.RefObject<HTMLDivElement>,
    setter: (v: number) => void,
    isDay?: boolean
  ) => (
    <div className="relative h-[180px] overflow-hidden flex-1">
      <div className="absolute inset-x-0 top-0 h-[72px] bg-gradient-to-b from-neutral-800 via-neutral-800/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[72px] bg-gradient-to-t from-neutral-800 via-neutral-800/80 to-transparent z-10 pointer-events-none" />
      <div
        ref={ref}
        className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory"
        onScroll={() => handleScroll(ref, items, setter, isDay)}
      >
        <div style={{ height: ITEM_HEIGHT * 2 }} />
        {items.map((item, i) => {
          const isSel = isDay ? item === selected : typeof items[0] === "string" ? i === selected : item === selected;
          return (
            <div key={`${item}-${i}`} className="snap-center flex items-center justify-center" style={{ height: ITEM_HEIGHT }}>
              <span className={`transition-all duration-150 text-center ${isSel ? "text-foreground text-base font-semibold" : "text-neutral-500 text-sm"}`}>
                {typeof item === "string" ? item.slice(0, 3) : item}
              </span>
            </div>
          );
        })}
        <div style={{ height: ITEM_HEIGHT * 2 }} />
      </div>
    </div>
  );

  return (
    <div className="relative px-2 py-1">
      <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-[36px] bg-neutral-700/50 rounded-lg pointer-events-none z-0" />
      <div className="flex relative z-10">
        {renderColumn(months, selectedMonth, monthRef, setSelectedMonth)}
        {renderColumn(days, selectedDay, dayRef, setSelectedDay, true)}
        {renderColumn(years, selectedYear, yearRef, setSelectedYear)}
      </div>
    </div>
  );
};

export { CompactWheelDatePicker };
