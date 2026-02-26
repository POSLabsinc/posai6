import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";

interface ShiftDayViewProps {
  currentDate: Date;
}

interface DayShift {
  id: string;
  employee_id: string;
  shift_date: string;
  start_time: string | null;
  end_time: string | null;
  shift_type: string | null;
  job_type: string | null;
}

interface EmployeeRow {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
  hourly_rate: number;
  shifts: DayShift[];
  totalHours: number;
  totalPay: number;
}

const HOURS = Array.from({ length: 18 }, (_, i) => i + 5); // 5 AM to 10 PM
const COL_WIDTH = 80;
const NAME_COL_WIDTH = 180;

const formatHourLabel = (h: number) => {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
};

const parseTimeToHours = (time: string | null): number | null => {
  if (!time) return null;
  const parts = time.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (!parts) return null;
  let hours = parseInt(parts[1]);
  const mins = parseInt(parts[2]);
  const ampm = parts[3]?.toLowerCase();
  if (ampm === "pm" && hours < 12) hours += 12;
  if (ampm === "am" && hours === 12) hours = 0;
  return hours + mins / 60;
};

const hoursToTimeString = (h: number): string => {
  const totalMins = Math.round(h * 60);
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const period = hrs >= 12 ? "PM" : "AM";
  const displayHrs = hrs === 0 ? 12 : hrs > 12 ? hrs - 12 : hrs;
  return `${displayHrs}:${mins.toString().padStart(2, "0")} ${period}`;
};

// Snap to nearest 15 min
const snapTo15 = (h: number): number => Math.round(h * 4) / 4;

const GridLines = () => (
  <div className="absolute inset-0 flex">
    {HOURS.map((h) => (
      <div key={h} className="flex-shrink-0 border-l border-calendar-border/50 h-full" style={{ width: COL_WIDTH }} />
    ))}
  </div>
);

interface DraggableShiftBlockProps {
  shift: DayShift;
  onDragEnd: (shiftId: string, newStartHours: number, duration: number) => void;
}

const DraggableShiftBlock = ({ shift, onDragEnd }: DraggableShiftBlockProps) => {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const blockRef = useRef<HTMLDivElement>(null);

  const start = parseTimeToHours(shift.start_time);
  const end = parseTimeToHours(shift.end_time);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX.current;
    setDragOffset(dx);
  }, [isDragging]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging || start === null || end === null) return;
    setIsDragging(false);
    const duration = end - start;
    const dx = e.clientX - dragStartX.current;
    const hoursDelta = dx / COL_WIDTH;
    const newStart = snapTo15(start + hoursDelta);
    const clampedStart = Math.max(HOURS[0], Math.min(HOURS[HOURS.length - 1] + 1 - duration, newStart));
    setDragOffset(0);
    if (Math.abs(clampedStart - start) > 0.01) {
      onDragEnd(shift.id, clampedStart, duration);
    }
  }, [isDragging, start, end, shift.id, onDragEnd]);

  if (start === null || end === null || end <= start) return null;

  const duration = end - start;
  const left = (start - HOURS[0]) * COL_WIDTH + dragOffset;
  const width = duration * COL_WIDTH;

  const displayStart = isDragging ? hoursToTimeString(snapTo15(start + dragOffset / COL_WIDTH)) : shift.start_time;
  const displayEnd = isDragging ? hoursToTimeString(snapTo15(start + dragOffset / COL_WIDTH) + duration) : shift.end_time;

  return (
    <div
      ref={blockRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`absolute top-2 bottom-2 rounded-lg border border-green-500/30 bg-green-500/10 flex flex-col justify-center px-3 overflow-hidden select-none transition-shadow ${
        isDragging ? "z-30 shadow-lg ring-2 ring-green-500/40 cursor-grabbing opacity-90" : "cursor-grab hover:bg-green-500/15"
      }`}
      style={{ left, width, touchAction: "none" }}
    >
      <span className="text-xs font-semibold text-green-700 dark:text-green-400 truncate">
        {shift.job_type || shift.shift_type || "Shift"}
      </span>
      <span className="text-[10px] text-green-600/70 dark:text-green-400/70 truncate">
        {displayStart} - {displayEnd}
      </span>
    </div>
  );
};

const ShiftDayView = ({ currentDate }: ShiftDayViewProps) => {
  const dateStr = format(currentDate, "yyyy-MM-dd");
  const queryClient = useQueryClient();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["shift_day_view", dateStr],
    queryFn: async () => {
      const { data: employees, error: empErr } = await supabase
        .from("employees")
        .select("id, full_name, role, avatar_url, hourly_rate")
        .eq("is_archived", false)
        .order("full_name");
      if (empErr) throw empErr;

      const { data: shifts, error: shiftErr } = await (supabase as any)
        .from("employee_shifts")
        .select("*")
        .eq("shift_date", dateStr);
      if (shiftErr) throw shiftErr;

      const shiftsByEmp = new Map<string, DayShift[]>();
      (shifts || []).forEach((s: any) => {
        const list = shiftsByEmp.get(s.employee_id) || [];
        list.push(s);
        shiftsByEmp.set(s.employee_id, list);
      });

      return (employees || []).map((emp: any): EmployeeRow => {
        const empShifts = shiftsByEmp.get(emp.id) || [];
        let totalHours = 0;
        empShifts.forEach((s) => {
          const start = parseTimeToHours(s.start_time);
          const end = parseTimeToHours(s.end_time);
          if (start !== null && end !== null && end > start) {
            totalHours += end - start;
          }
        });
        return {
          id: emp.id,
          name: emp.full_name,
          role: emp.role || "",
          avatar_url: emp.avatar_url,
          hourly_rate: emp.hourly_rate || 0,
          shifts: empShifts,
          totalHours,
          totalPay: totalHours * (emp.hourly_rate || 0),
        };
      });
    },
  });

  const handleShiftDrag = useCallback(async (shiftId: string, newStartHours: number, duration: number) => {
    const newEndHours = newStartHours + duration;
    const newStartTime = hoursToTimeString(newStartHours);
    const newEndTime = hoursToTimeString(newEndHours);

    // Optimistic update
    queryClient.setQueryData(["shift_day_view", dateStr], (old: EmployeeRow[] | undefined) => {
      if (!old) return old;
      return old.map((row) => ({
        ...row,
        shifts: row.shifts.map((s) =>
          s.id === shiftId ? { ...s, start_time: newStartTime, end_time: newEndTime } : s
        ),
        totalHours: row.shifts.reduce((acc, s) => {
          const st = s.id === shiftId ? newStartHours : parseTimeToHours(s.start_time);
          const en = s.id === shiftId ? newEndHours : parseTimeToHours(s.end_time);
          if (st !== null && en !== null && en > st) return acc + (en - st);
          return acc;
        }, 0),
        totalPay: row.shifts.reduce((acc, s) => {
          const st = s.id === shiftId ? newStartHours : parseTimeToHours(s.start_time);
          const en = s.id === shiftId ? newEndHours : parseTimeToHours(s.end_time);
          if (st !== null && en !== null && en > st) return acc + (en - st) * row.hourly_rate;
          return acc;
        }, 0),
      }));
    });

    const { error } = await (supabase as any)
      .from("employee_shifts")
      .update({ start_time: newStartTime, end_time: newEndTime })
      .eq("id", shiftId);

    if (error) {
      toast.error("Failed to update shift time");
      queryClient.invalidateQueries({ queryKey: ["shift_day_view", dateStr] });
    } else {
      toast.success(`Shift moved to ${newStartTime} - ${newEndTime}`);
    }
  }, [dateStr, queryClient]);

  const totalHours = rows.reduce((s, r) => s + r.totalHours, 0);
  const totalPay = rows.reduce((s, r) => s + r.totalPay, 0);

  if (isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">Loading day view...</div>
    );
  }

  return (
    <div className="w-full">
      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto scrollbar-hide rounded-2xl border border-calendar-border bg-card/50">
        <div style={{ minWidth: NAME_COL_WIDTH + HOURS.length * COL_WIDTH }}>
          {/* Header row */}
          <div className="flex border-b border-calendar-border">
            <div
              className="flex-shrink-0 px-4 py-3 text-xs font-semibold text-foreground border-r border-calendar-border"
              style={{ width: NAME_COL_WIDTH }}
            >
              Team Member
            </div>
            {HOURS.map((h) => (
              <div
                key={h}
                className="flex-shrink-0 px-1 py-3 text-center text-[11px] text-muted-foreground font-medium border-l border-calendar-border/50"
                style={{ width: COL_WIDTH }}
              >
                {formatHourLabel(h)}
              </div>
            ))}
          </div>

          {/* Events row */}
          <div className="flex border-b border-calendar-border relative" style={{ minHeight: 56 }}>
            <div className="flex-shrink-0 px-4 py-3 flex items-center border-r border-calendar-border" style={{ width: NAME_COL_WIDTH }}>
              <span className="text-sm font-semibold text-foreground">Events</span>
            </div>
            <div className="flex-1 relative">
              <GridLines />
            </div>
          </div>

          {/* Open Shifts row */}
          <div className="flex border-b border-calendar-border relative" style={{ minHeight: 56 }}>
            <div className="flex-shrink-0 px-4 py-3 flex items-center border-r border-calendar-border" style={{ width: NAME_COL_WIDTH }}>
              <span className="text-sm font-semibold text-foreground">Open Shifts</span>
            </div>
            <div className="flex-1 relative">
              <GridLines />
            </div>
          </div>

          {/* Employee rows */}
          {rows.map((row) => (
            <div key={row.id} className="flex border-b border-calendar-border relative" style={{ minHeight: 72 }}>
              {/* Employee info */}
              <div className="flex-shrink-0 px-4 py-3 flex flex-col justify-center border-r border-calendar-border" style={{ width: NAME_COL_WIDTH }}>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-semibold text-foreground truncate max-w-[100px]">{row.name}</span>
                  <span className="text-[11px] text-muted-foreground">{row.role}</span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground/70">Hours</span> {row.totalHours.toFixed(1)}h
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground/70">Pay</span> ${row.totalPay.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Timeline cells */}
              <div className="flex-1 relative" style={{ width: HOURS.length * COL_WIDTH }}>
                <GridLines />
                {row.shifts.map((shift) => (
                  <DraggableShiftBlock
                    key={shift.id}
                    shift={shift}
                    onDragEnd={handleShiftDrag}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Totals row */}
          <div className="flex border-t border-calendar-border">
            <div className="flex-shrink-0 px-4 py-3 border-r border-calendar-border" style={{ width: NAME_COL_WIDTH }}>
              <span className="text-sm font-bold text-foreground">Totals</span>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground/70">Hours</span> {totalHours.toFixed(1)}h
                </span>
                <span className="text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground/70">Pay</span> ${totalPay.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex flex-col gap-3">
        <div className="rounded-xl bg-card/50 border border-border/40 px-4 py-3">
          <span className="text-sm font-semibold text-foreground">Events</span>
          <p className="text-[11px] text-muted-foreground mt-0.5">No events</p>
        </div>
        <div className="rounded-xl bg-card/50 border border-border/40 px-4 py-3">
          <span className="text-sm font-semibold text-foreground">Open Shifts</span>
          <p className="text-[11px] text-muted-foreground mt-0.5">No open shifts</p>
        </div>

        {rows.map((row) => (
          <div key={row.id} className="rounded-xl bg-card/50 border border-border/40 p-3">
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-sm font-semibold text-foreground">{row.name}</span>
              <span className="text-[11px] text-muted-foreground">{row.role}</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground/70">Hours</span> {row.totalHours.toFixed(1)}h
              </span>
              <span className="text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground/70">Pay</span> ${row.totalPay.toFixed(2)}
              </span>
            </div>
            {row.shifts.length === 0 ? (
              <div className="text-[11px] text-muted-foreground">No shifts</div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {row.shifts.map((shift) => {
                  const start = parseTimeToHours(shift.start_time);
                  const end = parseTimeToHours(shift.end_time);
                  const hours = start !== null && end !== null && end > start ? end - start : 0;
                  return (
                    <div
                      key={shift.id}
                      className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                          {shift.job_type || shift.shift_type || "Shift"}
                        </span>
                        <span className="text-[10px] text-green-600/70 dark:text-green-400/70 ml-2">
                          {shift.start_time} - {shift.end_time}
                        </span>
                      </div>
                      {hours > 0 && (
                        <span className="text-[11px] font-semibold text-green-600/60 dark:text-green-400/60">{hours.toFixed(1)}h</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        <div className="rounded-xl bg-card/60 border border-border/50 p-3">
          <span className="text-sm font-bold text-foreground">Totals</span>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground/70">Hours</span> {totalHours.toFixed(1)}h
            </span>
            <span className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground/70">Pay</span> ${totalPay.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftDayView;
