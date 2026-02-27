import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isToday, isBefore } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface ShiftMonthViewProps {
  currentMonth: Date;
}

interface MonthShift {
  id: string;
  employee_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  shift_type: string | null;
  job_type: string | null;
}

interface EmployeeInfo {
  id: string;
  full_name: string;
  role: string;
}

const SHIFT_BLOCK_COLORS: Record<string, { bg: string; border: string; text: string; sub: string }> = {
  Manager: { bg: "bg-green-500/15", border: "border-green-500/30", text: "text-green-600 dark:text-green-400", sub: "text-green-600/70 dark:text-green-400/70" },
  Server: { bg: "bg-blue-500/15", border: "border-blue-500/30", text: "text-blue-600 dark:text-blue-400", sub: "text-blue-600/70 dark:text-blue-400/70" },
  Bartender: { bg: "bg-orange-500/15", border: "border-orange-500/30", text: "text-orange-600 dark:text-orange-400", sub: "text-orange-600/70 dark:text-orange-400/70" },
  Kitchen: { bg: "bg-amber-500/15", border: "border-amber-500/30", text: "text-amber-600 dark:text-amber-400", sub: "text-amber-600/70 dark:text-amber-400/70" },
  Host: { bg: "bg-rose-500/15", border: "border-rose-500/30", text: "text-rose-600 dark:text-rose-400", sub: "text-rose-600/70 dark:text-rose-400/70" },
};

const DEFAULT_COLOR = { bg: "bg-purple-500/15", border: "border-purple-500/30", text: "text-purple-600 dark:text-purple-400", sub: "text-purple-600/70 dark:text-purple-400/70" };

const getColor = (role: string) => SHIFT_BLOCK_COLORS[role] || DEFAULT_COLOR;

const formatTime12 = (t: string | null): string => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${(m || 0).toString().padStart(2, "0")} ${ampm}`;
};

interface DayShiftDisplay {
  id: string;
  role: string;
  timeRange: string;
  employeeName: string;
}

const ShiftMonthView = ({ currentMonth }: ShiftMonthViewProps) => {
  const navigate = useNavigate();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const startStr = format(calStart, "yyyy-MM-dd");
  const endStr = format(calEnd, "yyyy-MM-dd");

  const { data, isLoading } = useQuery({
    queryKey: ["shift_month_view", startStr, endStr],
    queryFn: async () => {
      const [{ data: employees, error: empErr }, { data: shifts, error: shiftErr }] = await Promise.all([
        supabase
          .from("employees")
          .select("id, full_name, role")
          .eq("is_archived", false),
        (supabase as any)
          .from("employee_shifts")
          .select("*")
          .gte("shift_date", startStr)
          .lte("shift_date", endStr),
      ]);
      if (empErr) throw empErr;
      if (shiftErr) throw shiftErr;
      return { employees: (employees || []) as EmployeeInfo[], shifts: (shifts || []) as MonthShift[] };
    },
  });

  // Build a map: dateStr -> DayShiftDisplay[]
  const shiftsByDate = useMemo(() => {
    if (!data) return new Map<string, DayShiftDisplay[]>();
    const empMap = new Map<string, EmployeeInfo>();
    data.employees.forEach((e) => empMap.set(e.id, e));

    const map = new Map<string, DayShiftDisplay[]>();
    data.shifts.forEach((s) => {
      const emp = empMap.get(s.employee_id);
      const role = s.job_type || s.shift_type || emp?.role || "Other";
      const entry: DayShiftDisplay = {
        id: s.id,
        role,
        timeRange: `${formatTime12(s.start_time)} – ${formatTime12(s.end_time)}`,
        employeeName: emp?.full_name || "Unassigned",
      };
      const list = map.get(s.shift_date) || [];
      list.push(entry);
      map.set(s.shift_date, list);
    });
    return map;
  }, [data]);

  // Build calendar grid (weeks array of 7 days)
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    let cursor = calStart;
    while (cursor <= calEnd) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(cursor);
        cursor = addDays(cursor, 1);
      }
      result.push(week);
    }
    return result;
  }, [calStart, calEnd]);

  const todayDate = new Date();
  const todayStr = format(todayDate, "yyyy-MM-dd");
  const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const MAX_VISIBLE_SHIFTS = 3;

  const handleCellClick = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    if (dateStr < todayStr) return;
    const params = new URLSearchParams({ shift_date: dateStr, start_time: "09:00", end_time: "17:00" });
    navigate(`/settings/workforce/shift/add?${params.toString()}`);
  };

  const handleShiftClick = (e: React.MouseEvent, shiftId: string) => {
    e.stopPropagation();
    navigate(`/settings/workforce/shift/edit?id=${shiftId}`);
  };

  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground text-sm">Loading month view...</div>;
  }

  return (
    <div className="w-full overflow-hidden">
      {/* Desktop */}
      <div className="hidden md:block rounded-2xl border border-calendar-border bg-card/50 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-calendar-border">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="px-2 py-2.5 text-center text-xs font-semibold text-muted-foreground border-r border-calendar-border last:border-r-0">
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-calendar-border last:border-b-0" style={{ minHeight: 120 }}>
            {week.map((day, di) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const inMonth = isSameMonth(day, currentMonth);
              const isCurrentDay = isToday(day);
              const isPast = isBefore(day, todayDate) && !isCurrentDay;
              const dayShifts = shiftsByDate.get(dateStr) || [];
              const visibleShifts = dayShifts.slice(0, MAX_VISIBLE_SHIFTS);
              const moreCount = dayShifts.length - MAX_VISIBLE_SHIFTS;

              return (
                <div
                  key={di}
                  onClick={() => dayShifts.length === 0 && handleCellClick(day)}
                  className={`border-r border-calendar-border last:border-r-0 p-1.5 flex flex-col transition-colors ${
                    !inMonth ? "bg-muted/10" : isCurrentDay ? "bg-primary/5 ring-1 ring-inset ring-primary/20" : ""
                  } ${isPast ? "opacity-40" : ""} ${
                    dayShifts.length === 0 && !isPast ? "cursor-pointer hover:bg-muted/20" : ""
                  }`}
                >
                  {/* Date number */}
                  <div className="flex justify-end mb-1">
                    <span
                      className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                        isCurrentDay
                          ? "bg-primary text-primary-foreground"
                          : !inMonth
                          ? "text-muted-foreground/40"
                          : "text-foreground"
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                  </div>

                  {/* Shift cards */}
                  <div className="flex flex-col gap-0.5 flex-1 min-h-0">
                    {visibleShifts.map((shift) => {
                      const colors = isPast
                        ? { bg: "bg-muted/20", border: "border-border/30", text: "text-muted-foreground", sub: "text-muted-foreground/60" }
                        : getColor(shift.role);
                      return (
                        <button
                          key={shift.id}
                          onClick={(e) => handleShiftClick(e, shift.id)}
                          className={`w-full text-left rounded-md px-1.5 py-1 border transition-colors hover:brightness-110 ${colors.bg} ${colors.border}`}
                        >
                          <span className={`text-[10px] font-semibold block truncate leading-tight ${colors.text}`}>
                            {shift.role}
                          </span>
                          <span className={`text-[9px] block truncate leading-tight ${colors.sub}`}>
                            {shift.timeRange}
                          </span>
                          <span className={`text-[9px] block truncate leading-tight ${colors.sub}`}>
                            {shift.employeeName}
                          </span>
                        </button>
                      );
                    })}
                    {moreCount > 0 && (
                      <span className="text-[9px] text-muted-foreground font-medium px-1">
                        +{moreCount} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Mobile */}
      <div className="md:hidden flex flex-col gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-0.5">
            {week.map((day, di) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const inMonth = isSameMonth(day, currentMonth);
              const isCurrentDay = isToday(day);
              const isPast = isBefore(day, todayDate) && !isCurrentDay;
              const dayShifts = shiftsByDate.get(dateStr) || [];

              return (
                <div
                  key={di}
                  onClick={() => dayShifts.length === 0 && !isPast && handleCellClick(day)}
                  className={`rounded-lg p-1 min-h-[60px] flex flex-col ${
                    !inMonth ? "opacity-30" : ""
                  } ${isCurrentDay ? "bg-primary/10 ring-1 ring-primary/30" : "bg-card/30"} ${isPast ? "opacity-40" : ""}`}
                >
                  <span className={`text-[10px] font-semibold text-center ${isCurrentDay ? "text-primary" : "text-foreground"}`}>
                    {format(day, "d")}
                  </span>
                  {dayShifts.length > 0 && (
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      {dayShifts.slice(0, 2).map((s) => {
                        const c = getColor(s.role);
                        return (
                          <div key={s.id} className={`rounded px-0.5 py-0.5 ${c.bg}`}>
                            <span className={`text-[7px] font-semibold block truncate ${c.text}`}>{s.role}</span>
                          </div>
                        );
                      })}
                      {dayShifts.length > 2 && (
                        <span className="text-[7px] text-muted-foreground text-center">+{dayShifts.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShiftMonthView;
