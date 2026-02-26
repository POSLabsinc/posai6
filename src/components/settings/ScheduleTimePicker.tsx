import { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";
import { createPortal } from "react-dom";
import { AppleWheelTimePicker } from "@/components/ui/apple-wheel-time-picker";
import { useIsMobile } from "@/hooks/use-mobile";

interface ScheduleTimePickerProps {
  lightStart: string;
  lightEnd: string;
  onStartChange: (time: string) => void;
  onEndChange: (time: string) => void;
}

function formatTime12(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

function parse12to24(time12: string): string {
  const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return "00:00";
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const period = match[3].toUpperCase();
  if (period === "AM" && h === 12) h = 0;
  else if (period === "PM" && h !== 12) h += 12;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

const ScheduleTimePicker = ({ lightStart, lightEnd, onStartChange, onEndChange }: ScheduleTimePickerProps) => {
  const [editingField, setEditingField] = useState<"start" | "end" | null>(null);
  const isMobile = useIsMobile();
  const startRef = useRef<HTMLSpanElement>(null);
  const endRef = useRef<HTMLSpanElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!isMobile && editingField) {
      const ref = editingField === "start" ? startRef : endRef;
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom + 4,
          left: rect.right - 240, // align right edge with the time text
        });
      }
    } else {
      setDropdownPos(null);
    }
  }, [editingField, isMobile]);

  const handleConfirm = (time12: string) => {
    const time24 = parse12to24(time12);
    if (editingField === "start") onStartChange(time24);
    else if (editingField === "end") onEndChange(time24);
    setEditingField(null);
  };

  const currentTime12 = editingField === "start" ? formatTime12(lightStart) : formatTime12(lightEnd);

  return (
    <>
      <div className="mt-3 space-y-0 bg-neutral-800/40 dark:bg-neutral-800/40 rounded-xl overflow-hidden">
        {/* Light Mode Start */}
        <div
          className="flex items-center justify-between py-3 px-4 cursor-pointer active:opacity-70 transition-opacity"
          onClick={() => setEditingField("start")}
        >
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-neutral-400" />
            <span className="text-base text-foreground">Light Mode On</span>
          </div>
          <span ref={startRef} className="text-base font-medium text-primary">
            {formatTime12(lightStart)}
          </span>
        </div>

        <div className="h-px bg-neutral-700/50 mx-4" />

        {/* Light Mode End */}
        <div
          className="flex items-center justify-between py-3 px-4 cursor-pointer active:opacity-70 transition-opacity"
          onClick={() => setEditingField("end")}
        >
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-neutral-400" />
            <span className="text-base text-foreground">Light Mode Off</span>
          </div>
          <span ref={endRef} className="text-base font-medium text-primary">
            {formatTime12(lightEnd)}
          </span>
        </div>
      </div>

      {/* Mobile full-screen picker */}
      {isMobile && (
        <AppleWheelTimePicker
          isOpen={editingField !== null}
          onClose={() => setEditingField(null)}
          onConfirm={handleConfirm}
          selectedTime={currentTime12}
        />
      )}

      {/* Desktop dropdown via portal */}
      {!isMobile && editingField !== null && dropdownPos && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setEditingField(null)} />
          <div
            className="fixed z-[9999]"
            style={{ top: dropdownPos.top, left: dropdownPos.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <AppleWheelTimePicker
              isOpen
              onClose={() => setEditingField(null)}
              onConfirm={handleConfirm}
              selectedTime={currentTime12}
              compact
            />
          </div>
        </>,
        document.body
      )}
    </>
  );
};

export default ScheduleTimePicker;
