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

    const PickerColumn = ({
      items,
      selected,
      onSelect,
      formatItem,
    }: {
      items: (number | string)[];
      selected: number | string;
      onSelect: (val: any) => void;
      formatItem?: (item: number | string) => string;
    }) => {
      const scrollRef = React.useRef<HTMLDivElement>(null);
      const isDragging = React.useRef(false);
      const startY = React.useRef(0);
      const startScrollTop = React.useRef(0);
      const scrollTimeout = React.useRef<NodeJS.Timeout | null>(null);
      const lastIndex = React.useRef(-1);
      const itemHeight = 32;
      const visibleItems = 3;
      const containerHeight = itemHeight * visibleItems;
      const paddingHeight = itemHeight; // One item padding top/bottom

      // Scroll to selected value on mount
      React.useEffect(() => {
        if (scrollRef.current) {
          const index = items.indexOf(selected);
          if (index !== -1) {
            scrollRef.current.scrollTop = index * itemHeight;
            lastIndex.current = index;
          }
        }
      }, []);

      const snapToNearest = React.useCallback(() => {
        if (scrollRef.current) {
          const scrollTop = scrollRef.current.scrollTop;
          const index = Math.round(scrollTop / itemHeight);
          const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
          
          scrollRef.current.scrollTo({
            top: clampedIndex * itemHeight,
            behavior: "smooth",
          });
          
          if (clampedIndex !== lastIndex.current) {
            lastIndex.current = clampedIndex;
            onSelect(items[clampedIndex]);
          }
        }
      }, [items, onSelect]);

      const handleScroll = React.useCallback(() => {
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current);
        }
        
        scrollTimeout.current = setTimeout(() => {
          if (!isDragging.current) {
            snapToNearest();
          }
        }, 80);
      }, [snapToNearest]);

      // Pointer/touch handlers
      const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault();
        isDragging.current = true;
        startY.current = e.clientY;
        startScrollTop.current = scrollRef.current?.scrollTop || 0;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      };

      const handlePointerMove = (e: React.PointerEvent) => {
        if (isDragging.current && scrollRef.current) {
          const deltaY = startY.current - e.clientY;
          scrollRef.current.scrollTop = startScrollTop.current + deltaY;
        }
      };

      const handlePointerUp = (e: React.PointerEvent) => {
        if (isDragging.current) {
          isDragging.current = false;
          (e.target as HTMLElement).releasePointerCapture(e.pointerId);
          snapToNearest();
        }
      };

      const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        if (scrollRef.current) {
          scrollRef.current.scrollTop += e.deltaY;
          handleScroll();
        }
      };

      const handleItemClick = (item: number | string, idx: number) => {
        onSelect(item);
        lastIndex.current = idx;
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            top: idx * itemHeight,
            behavior: "smooth",
          });
        }
      };

      return (
        <div className="relative flex-1 flex flex-col">
          <div className="relative" style={{ height: containerHeight }}>
            {/* Fade overlays */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-zinc-900 via-zinc-900/70 to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-zinc-900 via-zinc-900/70 to-transparent z-10 pointer-events-none" />
            
            {/* Selection highlight */}
            <div 
              className="absolute left-1 right-1 bg-white/15 rounded-md z-0 pointer-events-none" 
              style={{ 
                top: paddingHeight,
                height: itemHeight,
              }}
            />
            
            {/* Scrollable items */}
            <div
              ref={scrollRef}
              className="h-full overflow-y-auto relative z-[1] cursor-grab active:cursor-grabbing touch-pan-y overscroll-contain"
              onScroll={handleScroll}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onWheel={handleWheel}
              style={{ 
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              <style>{`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              {/* Top padding */}
              <div style={{ height: paddingHeight }} />
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center justify-center font-medium cursor-pointer transition-all select-none",
                    selected === item 
                      ? "text-white text-lg" 
                      : "text-white/40 text-base"
                  )}
                  style={{ height: itemHeight }}
                  onClick={() => handleItemClick(item, idx)}
                >
                  {formatItem ? formatItem(item) : item}
                </div>
              ))}
              {/* Bottom padding */}
              <div style={{ height: paddingHeight }} />
            </div>
          </div>
        </div>
      );
    };

    return (
      <div 
        ref={ref} 
        className={cn("flex bg-zinc-900 rounded-xl gap-0 pointer-events-auto", className)}
        onClick={(e) => e.stopPropagation()}
      >
        <PickerColumn
          items={hours}
          selected={selectedHour}
          onSelect={setSelectedHour}
        />
        <div className="flex items-center justify-center text-white/60 text-lg font-medium">:</div>
        <PickerColumn
          items={minutes}
          selected={selectedMinute}
          onSelect={setSelectedMinute}
          formatItem={(m) => String(m).padStart(2, "0")}
        />
        <PickerColumn
          items={periods}
          selected={selectedPeriod}
          onSelect={setSelectedPeriod}
        />
      </div>
    );
  }
);

IOSTimePicker.displayName = "IOSTimePicker";

export { IOSTimePicker };
