import * as React from "react";
import { cn } from "@/lib/utils";

interface IOSTimePickerProps {
  value: string; // HH:mm format (24h)
  onChange: (value: string) => void;
  className?: string;
}

const IOSTimePicker = React.forwardRef<HTMLDivElement, IOSTimePickerProps>(
  ({ value, onChange, className }, ref) => {
    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 60 }, (_, i) => i);
    const periods = ["AM", "PM"];

    // Parse current value
    const parseTime = (timeStr: string) => {
      if (!timeStr) return { hour: 9, minute: 0, period: "AM" };
      const [h, m] = timeStr.split(":").map(Number);
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const period = h >= 12 ? "PM" : "AM";
      return { hour: hour12, minute: m || 0, period };
    };

    const { hour, minute, period } = parseTime(value);

    const [selectedHour, setSelectedHour] = React.useState(hour);
    const [selectedMinute, setSelectedMinute] = React.useState(minute);
    const [selectedPeriod, setSelectedPeriod] = React.useState(period);

    const hourRef = React.useRef<HTMLDivElement>(null);
    const minuteRef = React.useRef<HTMLDivElement>(null);
    const periodRef = React.useRef<HTMLDivElement>(null);

    // Update parent when selection changes
    React.useEffect(() => {
      let hour24 = selectedHour;
      if (selectedPeriod === "AM" && selectedHour === 12) {
        hour24 = 0;
      } else if (selectedPeriod === "PM" && selectedHour !== 12) {
        hour24 = selectedHour + 12;
      }
      const timeStr = `${hour24.toString().padStart(2, "0")}:${selectedMinute.toString().padStart(2, "0")}`;
      onChange(timeStr);
    }, [selectedHour, selectedMinute, selectedPeriod, onChange]);

    // Scroll to selected values on mount
    React.useEffect(() => {
      const scrollToSelected = (ref: React.RefObject<HTMLDivElement>, index: number) => {
        if (ref.current) {
          const itemHeight = 36;
          ref.current.scrollTop = index * itemHeight;
        }
      };

      setTimeout(() => {
        scrollToSelected(hourRef, hours.indexOf(selectedHour));
        scrollToSelected(minuteRef, selectedMinute);
        scrollToSelected(periodRef, periods.indexOf(selectedPeriod));
      }, 50);
    }, []);

    const handleScroll = (
      ref: React.RefObject<HTMLDivElement>,
      items: (number | string)[],
      setter: (val: any) => void
    ) => {
      if (ref.current) {
        const itemHeight = 36;
        const scrollTop = ref.current.scrollTop;
        const index = Math.round(scrollTop / itemHeight);
        const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
        setter(items[clampedIndex]);
      }
    };

    const PickerColumn = ({
      items,
      selected,
      onSelect,
      scrollRef,
      formatItem,
      label,
    }: {
      items: (number | string)[];
      selected: number | string;
      onSelect: (val: any) => void;
      scrollRef: React.RefObject<HTMLDivElement>;
      formatItem?: (item: number | string) => string;
      label: string;
    }) => (
      <div className="relative flex-1 flex flex-col">
        {/* Column label */}
        <div className="text-center text-xs font-medium text-gray-400 pb-1 uppercase tracking-wide">
          {label}
        </div>
        
        <div className="relative h-[144px]">
          {/* Fade overlays */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white via-white/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white via-white/80 to-transparent z-10 pointer-events-none" />
          
          {/* Selection highlight */}
          <div className="absolute top-1/2 left-0 right-0 h-9 -translate-y-1/2 bg-gray-100/80 rounded-lg z-0" />
          
          {/* Scrollable items */}
          <div
            ref={scrollRef}
            className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory relative z-[1]"
            onScroll={() => handleScroll(scrollRef, items, onSelect)}
            style={{ scrollBehavior: "smooth" }}
          >
            {/* Padding for centering - 54px = (144px - 36px) / 2 */}
            <div className="h-[54px]" />
            {items.map((item, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-9 flex items-center justify-center text-lg font-semibold snap-center cursor-pointer transition-colors",
                  selected === item ? "text-gray-900" : "text-gray-300"
                )}
                onClick={() => {
                  onSelect(item);
                  if (scrollRef.current) {
                    const itemHeight = 36;
                    scrollRef.current.scrollTo({
                      top: idx * itemHeight,
                      behavior: "smooth",
                    });
                  }
                }}
              >
                {formatItem ? formatItem(item) : item}
              </div>
            ))}
            <div className="h-[54px]" />
          </div>
        </div>
      </div>
    );

    return (
      <div ref={ref} className={cn("flex bg-white rounded-xl gap-0", className)}>
        <PickerColumn
          items={hours}
          selected={selectedHour}
          onSelect={setSelectedHour}
          scrollRef={hourRef}
          label="Hour"
        />
        <PickerColumn
          items={minutes}
          selected={selectedMinute}
          onSelect={setSelectedMinute}
          scrollRef={minuteRef}
          formatItem={(m) => String(m).padStart(2, "0")}
          label="Min"
        />
        <PickerColumn
          items={periods}
          selected={selectedPeriod}
          onSelect={setSelectedPeriod}
          scrollRef={periodRef}
          label=""
        />
      </div>
    );
  }
);

IOSTimePicker.displayName = "IOSTimePicker";

export { IOSTimePicker };
