import { useState, useRef, useEffect } from "react";

interface CompactTimePickerProps {
  selectedTime: string;
  onTimeChange: (time: string) => void;
  /** If true, renders as a floating overlay with backdrop. Default: true */
  overlay?: boolean;
  onClose?: () => void;
}

const ITEM_HEIGHT = 32;

const CompactTimePicker = ({ selectedTime, onTimeChange, overlay = false, onClose }: CompactTimePickerProps) => {
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

  const initial = parseTime(selectedTime);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const [period, setPeriod] = useState<"AM" | "PM">(initial.period);

  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const periods: ("AM" | "PM")[] = ["AM", "PM"];

  // Emit changes
  useEffect(() => {
    const formatted = `${hour}:${minute.toString().padStart(2, "0")} ${period}`;
    onTimeChange(formatted);
  }, [hour, minute, period]);

  // Scroll to initial position
  useEffect(() => {
    setTimeout(() => {
      if (hourRef.current) {
        const idx = hours.indexOf(hour);
        if (idx >= 0) hourRef.current.scrollTop = idx * ITEM_HEIGHT;
      }
      if (minuteRef.current) {
        minuteRef.current.scrollTop = minute * ITEM_HEIGHT;
      }
      if (periodRef.current) {
        const idx = periods.indexOf(period);
        if (idx >= 0) periodRef.current.scrollTop = idx * ITEM_HEIGHT;
      }
    }, 30);
  }, []);

  const handleScroll = (
    ref: React.RefObject<HTMLDivElement>,
    items: (number | string)[],
    setter: (value: any) => void,
  ) => {
    if (!ref.current) return;
    const index = Math.round(ref.current.scrollTop / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    setter(items[clamped]);
  };

  const renderColumn = (
    items: (number | string)[],
    selected: number | string,
    ref: React.RefObject<HTMLDivElement>,
    setter: (v: any) => void,
    format?: (v: number | string) => string,
    width?: string,
  ) => (
    <div className={`relative overflow-hidden ${width || "flex-1"}`} style={{ height: ITEM_HEIGHT * 3 }}>
      <div className="absolute inset-x-0 top-0 h-[28px] bg-gradient-to-b from-neutral-800 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[28px] bg-gradient-to-t from-neutral-800 to-transparent z-10 pointer-events-none" />
      <div
        ref={ref}
        className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory"
        style={{ scrollSnapType: "y mandatory" }}
        onScroll={() => handleScroll(ref, items, setter)}
      >
        <div style={{ height: ITEM_HEIGHT }} />
        {items.map((item, i) => {
          const isSelected = item === selected;
          const display = format ? format(item) : String(item);
          return (
            <div
              key={`${item}-${i}`}
              className="snap-center flex items-center justify-center"
              style={{ height: ITEM_HEIGHT }}
            >
              <span className={`text-xs transition-all ${isSelected ? "text-foreground font-semibold" : "text-neutral-500"}`}>
                {display}
              </span>
            </div>
          );
        })}
        <div style={{ height: ITEM_HEIGHT }} />
      </div>
    </div>
  );

  const pickerContent = (
    <div className="mx-4 my-1 bg-neutral-800/80 rounded-xl overflow-hidden">
      <div className="relative px-3 py-1">
        {/* Selection bar */}
        <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-[32px] bg-neutral-700/50 rounded-lg pointer-events-none z-0" />
        <div className="flex relative z-10">
          {renderColumn(hours, hour, hourRef, setHour)}
          {renderColumn(minutes, minute, minuteRef, setMinute, (v) => (v as number).toString().padStart(2, "0"))}
          {renderColumn(periods, period, periodRef, setPeriod)}
        </div>
      </div>
    </div>
  );

  if (overlay) {
    return (
      <>
        <div className="fixed inset-0 z-40" onClick={onClose} />
        <div className="absolute top-full mt-1 z-50 overflow-hidden" style={{ width: 200 }}>
          {pickerContent}
        </div>
      </>
    );
  }

  return pickerContent;
};

export { CompactTimePicker };
