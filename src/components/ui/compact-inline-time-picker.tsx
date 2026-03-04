import { useState, useRef, useEffect } from "react";

interface CompactInlineTimePickerProps {
  selectedTime: string;
  onTimeChange: (time: string) => void;
}

const ITEM_HEIGHT = 32;

const CompactInlineTimePicker = ({
  selectedTime,
  onTimeChange,
}: CompactInlineTimePickerProps) => {
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

  useEffect(() => {
    const parsed = parseTime(selectedTime);
    setSelectedHour(parsed.hour);
    setSelectedMinute(parsed.minute);
    setSelectedPeriod(parsed.period);
  }, [selectedTime]);

  useEffect(() => {
    const formattedMinute = selectedMinute.toString().padStart(2, "0");
    const formattedTime = `${selectedHour}:${formattedMinute} ${selectedPeriod}`;
    if (formattedTime !== selectedTime) {
      onTimeChange(formattedTime);
    }
  }, [selectedHour, selectedMinute, selectedPeriod]);

  useEffect(() => {
    setTimeout(() => {
      if (hourScrollRef.current) {
        const hourIndex = hours.indexOf(selectedHour);
        if (hourIndex >= 0) hourScrollRef.current.scrollTop = hourIndex * ITEM_HEIGHT;
      }
      if (minuteScrollRef.current) {
        minuteScrollRef.current.scrollTop = selectedMinute * ITEM_HEIGHT;
      }
      if (periodScrollRef.current) {
        const periodIndex = periods.indexOf(selectedPeriod);
        if (periodIndex >= 0) periodScrollRef.current.scrollTop = periodIndex * ITEM_HEIGHT;
      }
    }, 50);
  }, []);

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
    if (isHour) setter(items[clampedIndex] as number);
    else if (typeof items[0] === "number") setter(items[clampedIndex] as number);
    else setter(items[clampedIndex] as "AM" | "PM");
  };

  const renderColumn = (
    items: (number | string)[],
    selectedValue: number | string,
    ref: React.RefObject<HTMLDivElement>,
    setter: (value: any) => void,
    isHour?: boolean,
    formatFn?: (value: number | string) => string
  ) => (
    <div className="relative h-[120px] overflow-hidden flex-1">
      <div className="absolute inset-x-0 top-0 h-[44px] bg-gradient-to-b from-surface via-surface/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[44px] bg-gradient-to-t from-surface via-surface/80 to-transparent z-10 pointer-events-none" />
      <div
        ref={ref}
        className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory"
        style={{ scrollSnapType: "y mandatory" }}
        onScroll={() => handleScroll(ref, items, setter, isHour)}
      >
        <div style={{ height: ITEM_HEIGHT * 1.4 }} />
        {items.map((item, index) => {
          const isSelected = item === selectedValue;
          const displayValue = formatFn ? formatFn(item) : item;
          return (
            <div
              key={`${item}-${index}`}
              className="snap-center flex items-center justify-center"
              style={{ height: ITEM_HEIGHT }}
            >
              <span className={`transition-all duration-150 text-xs ${isSelected ? "text-foreground font-semibold" : "text-muted-foreground font-normal"}`}>
                {displayValue}
              </span>
            </div>
          );
        })}
        <div style={{ height: ITEM_HEIGHT * 1.4 }} />
      </div>
    </div>
  );

  return (
    <div className="bg-background/60 rounded-xl overflow-hidden">
      <div className="relative px-2 py-1">
        <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-[32px] bg-accent/40 rounded-lg pointer-events-none z-0" />
        <div className="flex relative z-10">
          {renderColumn(hours, selectedHour, hourScrollRef, setSelectedHour, true)}
          {renderColumn(minutes, selectedMinute, minuteScrollRef, setSelectedMinute, false, (val) => (val as number).toString().padStart(2, "0"))}
          {renderColumn(periods, selectedPeriod, periodScrollRef, setSelectedPeriod)}
        </div>
      </div>
    </div>
  );
};

export { CompactInlineTimePicker };
