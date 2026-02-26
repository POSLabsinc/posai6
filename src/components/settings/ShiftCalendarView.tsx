import { useState, useMemo } from "react";
import { format, startOfWeek, addDays } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { ShiftCardData } from "@/hooks/use-shift-cards";

interface ShiftCalendarViewProps {
  cards: ShiftCardData[];
  currentWeek: Date;
  onShiftClick: (card: ShiftCardData) => void;
}

interface WeekShift {
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
  avatar_url: string | null;
}

interface RoleGroup {
  role: string;
  employees: {
    id: string;
    name: string;
    shifts: Map<string, WeekShift[]>; // dateStr -> shifts
    totalHours: number;
  }[];
  totalEmployees: number;
  totalHours: number;
}

const ROLE_COLORS: Record<string, string> = {
  Manager: "bg-green-500/5 dark:bg-green-500/8",
  Server: "bg-blue-500/5 dark:bg-blue-500/8",
  Bartender: "bg-orange-500/5 dark:bg-orange-500/8",
  Kitchen: "bg-amber-500/5 dark:bg-amber-500/8",
  Host: "bg-rose-500/5 dark:bg-rose-500/8",
};

const getRoleColor = (role: string, index: number) => {
  if (ROLE_COLORS[role]) return ROLE_COLORS[role];
  const fallbacks = [
    "bg-purple-500/5 dark:bg-purple-500/8",
    "bg-cyan-500/5 dark:bg-cyan-500/8",
    "bg-pink-500/5 dark:bg-pink-500/8",
  ];
  return fallbacks[index % fallbacks.length];
};

const parseTimeToHours = (t: string | null): number | null => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h + (m || 0) / 60;
};

const ShiftCalendarView = ({ cards, currentWeek, onShiftClick }: ShiftCalendarViewProps) => {
  const navigate = useNavigate();
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday start per reference
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayStrs = days.map((d) => format(d, "yyyy-MM-dd"));
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());

  const startStr = dayStrs[0];
  const endStr = dayStrs[6];

  const { data: weekData, isLoading } = useQuery({
    queryKey: ["shift_week_view", startStr, endStr],
    queryFn: async () => {
      const [{ data: employees, error: empErr }, { data: shifts, error: shiftErr }] = await Promise.all([
        supabase
          .from("employees")
          .select("id, full_name, role, avatar_url")
          .eq("is_archived", false)
          .order("full_name"),
        (supabase as any)
          .from("employee_shifts")
          .select("*")
          .gte("shift_date", startStr)
          .lte("shift_date", endStr),
      ]);
      if (empErr) throw empErr;
      if (shiftErr) throw shiftErr;
      return { employees: (employees || []) as EmployeeInfo[], shifts: (shifts || []) as WeekShift[] };
    },
  });

  const roleGroups = useMemo<RoleGroup[]>(() => {
    if (!weekData) return [];
    const { employees, shifts } = weekData;

    // Map shifts by employee
    const shiftsByEmp = new Map<string, WeekShift[]>();
    shifts.forEach((s) => {
      const list = shiftsByEmp.get(s.employee_id) || [];
      list.push(s);
      shiftsByEmp.set(s.employee_id, list);
    });

    // Group employees by role
    const roleMap = new Map<string, EmployeeInfo[]>();
    employees.forEach((emp) => {
      const role = emp.role || "Other";
      const list = roleMap.get(role) || [];
      list.push(emp);
      roleMap.set(role, list);
    });

    const groups: RoleGroup[] = [];
    roleMap.forEach((emps, role) => {
      let groupTotalHours = 0;
      const empRows = emps.map((emp) => {
        const empShifts = shiftsByEmp.get(emp.id) || [];
        const byDate = new Map<string, WeekShift[]>();
        let totalHours = 0;
        empShifts.forEach((s) => {
          const list = byDate.get(s.shift_date) || [];
          list.push(s);
          byDate.set(s.shift_date, list);
          const start = parseTimeToHours(s.start_time);
          const end = parseTimeToHours(s.end_time);
          if (start !== null && end !== null && end > start) totalHours += end - start;
        });
        groupTotalHours += totalHours;
        return { id: emp.id, name: emp.full_name, shifts: byDate, totalHours };
      });

      groups.push({
        role,
        employees: empRows,
        totalEmployees: empRows.length,
        totalHours: groupTotalHours,
      });
    });

    return groups;
  }, [weekData]);

  const toggleRole = (role: string) => {
    setExpandedRoles((prev) => {
      const next = new Set(prev);
      next.has(role) ? next.delete(role) : next.add(role);
      return next;
    });
  };

  const handleCellClick = (day: Date, employeeId?: string, employeeName?: string) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const params = new URLSearchParams({ shift_date: dateStr, start_time: "09:00", end_time: "10:00" });
    if (employeeId) params.set("employee_id", employeeId);
    if (employeeName) params.set("employee_name", employeeName);
    navigate(`/settings/workforce/shift/add?${params.toString()}`);
  };

  const handleShiftClick = (shiftId: string) => {
    navigate(`/settings/workforce/shift/edit?id=${shiftId}`);
  };

  const NAME_COL_W = 160;

  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground text-sm">Loading week view...</div>;
  }

  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      {/* Desktop */}
      <div className="hidden md:block rounded-2xl border border-calendar-border bg-card/50 overflow-hidden">
        <div style={{ minWidth: NAME_COL_W + 7 * 130 }}>
          {/* Day headers */}
          <div className="flex border-b border-calendar-border">
            <div
              className="flex-shrink-0 px-4 py-3 text-xs font-semibold text-foreground border-r border-calendar-border"
              style={{ width: NAME_COL_W }}
            >
              Team Member
            </div>
            {days.map((day, i) => {
              const isToday = dayStrs[i] === todayStr;
              return (
                <div
                  key={i}
                  className={`flex-1 px-2 py-3 text-center border-r border-calendar-border last:border-r-0 ${
                    isToday ? "bg-foreground text-background" : ""
                  }`}
                >
                  <span className={`text-xs font-medium ${isToday ? "text-background/70" : "text-muted-foreground"}`}>
                    {format(day, "EEE")}
                  </span>
                  <span className={`ml-1.5 text-sm font-semibold ${isToday ? "text-background" : "text-foreground"}`}>
                    {format(day, "d")}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Events row */}
          <div className="flex border-b border-calendar-border" style={{ minHeight: 48 }}>
            <div className="flex-shrink-0 px-4 py-3 flex items-center border-r border-calendar-border" style={{ width: NAME_COL_W }}>
              <span className="text-sm font-semibold text-foreground">Events</span>
            </div>
            {days.map((_, i) => {
              const isToday = dayStrs[i] === todayStr;
              return (
                <div
                  key={i}
                  className={`flex-1 border-r border-calendar-border last:border-r-0 ${isToday ? "bg-primary/5" : ""}`}
                />
              );
            })}
          </div>

          {/* Open Shifts row */}
          <div className="flex border-b border-calendar-border" style={{ minHeight: 48 }}>
            <div className="flex-shrink-0 px-4 py-3 flex items-center border-r border-calendar-border" style={{ width: NAME_COL_W }}>
              <span className="text-sm font-semibold text-foreground">Open Shifts</span>
            </div>
            {days.map((_, i) => {
              const isToday = dayStrs[i] === todayStr;
              return (
                <div
                  key={i}
                  className={`flex-1 border-r border-calendar-border last:border-r-0 ${isToday ? "bg-primary/5" : ""}`}
                />
              );
            })}
          </div>

          {/* Role groups */}
          {roleGroups.map((group, gi) => {
            const isExpanded = expandedRoles.has(group.role);
            const bgColor = getRoleColor(group.role, gi);

            return (
              <div key={group.role}>
                {/* Role header row */}
                <button
                  onClick={() => toggleRole(group.role)}
                  className={`w-full flex items-center border-b border-calendar-border hover:bg-muted/20 transition-colors ${bgColor}`}
                  style={{ minHeight: 44 }}
                >
                  <div className="flex-shrink-0 px-4 py-2.5 flex items-center gap-2" style={{ width: NAME_COL_W }}>
                    <ChevronRight
                      className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`}
                    />
                    <span className="text-sm font-bold text-foreground">{group.role}</span>
                    <span className="text-xs text-muted-foreground">{group.totalEmployees} employees</span>
                  </div>
                  <div className="flex-1 px-3">
                    <span className="text-xs text-muted-foreground font-medium">{Math.round(group.totalHours)}h scheduled</span>
                  </div>
                </button>

                {/* Expanded employee rows */}
                {isExpanded && group.employees.map((emp) => (
                  <div key={emp.id} className={`flex border-b border-calendar-border ${bgColor}`} style={{ minHeight: 52 }}>
                    <div
                      className="flex-shrink-0 px-4 py-2 flex items-center border-r border-calendar-border pl-10"
                      style={{ width: NAME_COL_W }}
                    >
                      <span className="text-xs font-medium text-foreground truncate">{emp.name}</span>
                    </div>
                    {days.map((day, di) => {
                      const dateStr = dayStrs[di];
                      const isToday = dateStr === todayStr;
                      const dayShifts = emp.shifts.get(dateStr) || [];

                      return (
                        <div
                          key={di}
                          onClick={() => {
                            if (dayShifts.length === 0) handleCellClick(day, emp.id, emp.name);
                          }}
                          className={`flex-1 border-r border-calendar-border last:border-r-0 p-1 flex flex-col gap-0.5 ${
                            isToday ? "bg-primary/5" : ""
                          } ${dayShifts.length === 0 ? "cursor-pointer hover:bg-muted/20 transition-colors" : ""}`}
                        >
                          {dayShifts.map((s) => (
                            <button
                              key={s.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShiftClick(s.id);
                              }}
                              className="w-full text-left rounded-md bg-green-500/15 border border-green-500/20 px-1.5 py-1 hover:bg-green-500/25 transition-colors"
                            >
                              <span className="text-[10px] font-medium text-green-700 dark:text-green-400 block truncate">
                                {s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}
                              </span>
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: stacked role groups */}
      <div className="md:hidden flex flex-col gap-3">
        {/* Events */}
        <div className="rounded-xl bg-card/50 border border-border/40 px-4 py-3">
          <span className="text-sm font-semibold text-foreground">Events</span>
          <p className="text-[11px] text-muted-foreground mt-0.5">No events</p>
        </div>
        {/* Open Shifts */}
        <div className="rounded-xl bg-card/50 border border-border/40 px-4 py-3">
          <span className="text-sm font-semibold text-foreground">Open Shifts</span>
          <p className="text-[11px] text-muted-foreground mt-0.5">No open shifts</p>
        </div>

        {roleGroups.map((group, gi) => {
          const isExpanded = expandedRoles.has(group.role);
          return (
            <div key={group.role} className="rounded-xl bg-card/50 border border-border/40 overflow-hidden">
              <button
                onClick={() => toggleRole(group.role)}
                className="w-full flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <ChevronRight
                    className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  />
                  <span className="text-sm font-bold text-foreground">{group.role}</span>
                  <span className="text-xs text-muted-foreground">{group.totalEmployees} employees</span>
                </div>
                <span className="text-xs text-muted-foreground font-medium">{Math.round(group.totalHours)}h</span>
              </button>

              {isExpanded && (
                <div className="border-t border-border/30">
                  {group.employees.map((emp) => {
                    const hasShifts = Array.from(emp.shifts.values()).some((s) => s.length > 0);
                    return (
                      <div key={emp.id} className="px-4 py-2.5 border-b border-border/20 last:border-b-0">
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="text-xs font-semibold text-foreground">{emp.name}</span>
                          <span className="text-[10px] text-muted-foreground">{emp.totalHours.toFixed(1)}h</span>
                        </div>
                        {hasShifts && (
                          <div className="flex flex-wrap gap-1">
                            {days.map((day, di) => {
                              const dayShifts = emp.shifts.get(dayStrs[di]) || [];
                              return dayShifts.map((s) => (
                                <button
                                  key={s.id}
                                  onClick={() => handleShiftClick(s.id)}
                                  className="rounded-md bg-green-500/10 border border-green-500/20 px-2 py-0.5 hover:bg-green-500/20 transition-colors"
                                >
                                  <span className="text-[10px] text-green-700 dark:text-green-400">
                                    {format(day, "EEE")} {s.start_time?.slice(0, 5)}-{s.end_time?.slice(0, 5)}
                                  </span>
                                </button>
                              ));
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShiftCalendarView;
