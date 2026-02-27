import { useState, useMemo, useCallback } from "react";
import { format, startOfWeek, addDays } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { ShiftCardData } from "@/hooks/use-shift-cards";
import { toast } from "@/hooks/use-toast";
import { SettingsManager } from "@/lib/settingsManager";

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
    role: string;
    shifts: Map<string, WeekShift[]>;
    totalHours: number;
    totalPay: number;
  }[];
  totalEmployees: number;
  totalHours: number;
}

const ROLE_COLORS: Record<string, string> = {
  Manager: "bg-green-100/60 dark:bg-green-500/10",
  Server: "bg-blue-100/60 dark:bg-blue-500/10",
  Bartender: "bg-orange-100/60 dark:bg-orange-500/10",
  Kitchen: "bg-lime-100/60 dark:bg-lime-500/10",
  Host: "bg-rose-100/50 dark:bg-rose-500/10",
};

const getRoleColor = (role: string, index: number) => {
  if (ROLE_COLORS[role]) return ROLE_COLORS[role];
  const fallbacks = [
    "bg-purple-100/60 dark:bg-purple-500/10",
    "bg-cyan-100/60 dark:bg-cyan-500/10",
    "bg-pink-100/60 dark:bg-pink-500/10",
  ];
  return fallbacks[index % fallbacks.length];
};

const SHIFT_BLOCK_COLORS: Record<string, { bg: string; border: string; text: string; textSub: string }> = {
  Manager: { bg: "bg-green-500/10 hover:bg-green-500/20", border: "border-green-500/30", text: "text-green-700 dark:text-green-400", textSub: "text-green-700/80 dark:text-green-400/80" },
  Server: { bg: "bg-blue-500/10 hover:bg-blue-500/20", border: "border-blue-500/30", text: "text-blue-700 dark:text-blue-400", textSub: "text-blue-700/80 dark:text-blue-400/80" },
  Bartender: { bg: "bg-orange-500/10 hover:bg-orange-500/20", border: "border-orange-500/30", text: "text-orange-700 dark:text-orange-400", textSub: "text-orange-700/80 dark:text-orange-400/80" },
  Kitchen: { bg: "bg-amber-500/10 hover:bg-amber-500/20", border: "border-amber-500/30", text: "text-amber-700 dark:text-amber-400", textSub: "text-amber-700/80 dark:text-amber-400/80" },
  Host: { bg: "bg-rose-500/10 hover:bg-rose-500/20", border: "border-rose-500/30", text: "text-rose-700 dark:text-rose-400", textSub: "text-rose-700/80 dark:text-rose-400/80" },
};

const DEFAULT_SHIFT_COLOR = { bg: "bg-purple-500/10 hover:bg-purple-500/20", border: "border-purple-500/30", text: "text-purple-700 dark:text-purple-400", textSub: "text-purple-700/80 dark:text-purple-400/80" };

const getShiftBlockColor = (role: string) => {
  return SHIFT_BLOCK_COLORS[role] || DEFAULT_SHIFT_COLOR;
};

const PAY_RATE = 16.50;

const parseTimeToHours = (t: string | null): number | null => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h + (m || 0) / 60;
};

const formatTime12 = (t: string | null): string => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${(m || 0).toString().padStart(2, "0")} ${ampm}`;
};

const ShiftCalendarView = ({ cards, currentWeek, onShiftClick }: ShiftCalendarViewProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayStrs = days.map((d) => format(d, "yyyy-MM-dd"));
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

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

    const shiftsByEmp = new Map<string, WeekShift[]>();
    shifts.forEach((s) => {
      const list = shiftsByEmp.get(s.employee_id) || [];
      list.push(s);
      shiftsByEmp.set(s.employee_id, list);
    });

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
        return { id: emp.id, name: emp.full_name, role: emp.role || role, shifts: byDate, totalHours, totalPay: totalHours * PAY_RATE };
      });

      groups.push({ role, employees: empRows, totalEmployees: empRows.length, totalHours: groupTotalHours });
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

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, shift: WeekShift) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ shiftId: shift.id, fromEmployee: shift.employee_id, fromDate: shift.shift_date }));
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, empId: string, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCell(`${empId}-${dateStr}`);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverCell(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetEmpId: string, targetDate: string, targetEmpName: string) => {
    e.preventDefault();
    setDragOverCell(null);

    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      const { shiftId, fromEmployee, fromDate } = data;

      // No change
      if (fromEmployee === targetEmpId && fromDate === targetDate) return;

      const updates: Record<string, string> = {};
      if (fromDate !== targetDate) updates.shift_date = targetDate;
      if (fromEmployee !== targetEmpId) updates.employee_id = targetEmpId;

      const { error } = await (supabase as any)
        .from("employee_shifts")
        .update(updates)
        .eq("id", shiftId);

      if (error) throw error;

      const action = fromEmployee !== targetEmpId
        ? `Shift reassigned to ${targetEmpName}`
        : `Shift moved to ${format(new Date(targetDate + "T00:00:00"), "EEE, MMM d")}`;

      toast({ title: action });
      queryClient.invalidateQueries({ queryKey: ["shift_week_view"] });
    } catch (err) {
      toast({ title: "Failed to move shift", variant: "destructive" });
    }
  }, [queryClient]);

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
            {days.map((day, i) => {
              const isToday = dayStrs[i] === todayStr;
              const isPast = dayStrs[i] < todayStr;
              return (
                <div
                  key={i}
                  className={`flex-1 border-r border-calendar-border last:border-r-0 ${isToday ? "bg-primary/5" : ""} ${!isPast ? "cursor-pointer hover:bg-accent/20 transition-colors" : ""}`}
                  onClick={() => {
                    if (!isPast) {
                      const params = new URLSearchParams({ date: dayStrs[i], start_time: "09:00" });
                      navigate(`/settings/workforce/shift/add-event?${params.toString()}`);
                    }
                  }}
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
                <div key={i} className={`flex-1 border-r border-calendar-border last:border-r-0 ${isToday ? "bg-primary/5" : ""}`} />
              );
            })}
          </div>

          {/* Role groups */}
          {roleGroups.map((group, gi) => {
            const isExpanded = expandedRoles.has(group.role);
            const bgColor = getRoleColor(group.role, gi);

            return (
              <div key={group.role}>
                <button
                  onClick={() => toggleRole(group.role)}
                  className={`w-full flex items-center border-b border-calendar-border hover:bg-muted/20 transition-colors ${bgColor}`}
                  style={{ minHeight: 44 }}
                >
                  <div className="px-4 py-2.5 flex items-center gap-3">
                    <ChevronRight
                      className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`}
                    />
                    <span className="text-sm font-bold text-foreground">{group.role}</span>
                    <span className="text-xs text-muted-foreground">{group.totalEmployees} employees</span>
                    <span className="text-xs text-muted-foreground font-medium">{Math.round(group.totalHours)}h scheduled</span>
                  </div>
                </button>

                {isExpanded && group.employees.map((emp) => (
                  <div key={emp.id} className="flex border-b border-calendar-border bg-card/30" style={{ minHeight: 72 }}>
                    <div
                      className="flex-shrink-0 px-4 py-2.5 flex flex-col justify-center border-r border-calendar-border"
                      style={{ width: NAME_COL_W }}
                    >
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-bold text-foreground truncate">{emp.name}</span>
                        <span className="text-[10px] text-muted-foreground">{emp.role}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">Hours <span className="font-bold text-foreground">{emp.totalHours.toFixed(1)}h</span></span>
                        <span className="text-[10px] text-muted-foreground">Pay <span className="font-bold text-foreground">${emp.totalPay.toFixed(2)}</span></span>
                      </div>
                    </div>
                    {days.map((day, di) => {
                      const dateStr = dayStrs[di];
                      const isToday = dateStr === todayStr;
                      const isPast = dateStr < todayStr;
                      const dayShifts = emp.shifts.get(dateStr) || [];
                      const isDropTarget = dragOverCell === `${emp.id}-${dateStr}`;

                      return (
                        <div
                          key={di}
                          onClick={() => {
                            if (dayShifts.length === 0 && !isPast) handleCellClick(day, emp.id, emp.name);
                          }}
                          onDragOver={!isPast ? (e) => handleDragOver(e, emp.id, dateStr) : undefined}
                          onDragLeave={() => { handleDragLeave(); setHoveredCell(null); }}
                          onDrop={!isPast ? (e) => handleDrop(e, emp.id, dateStr, emp.name) : undefined}
                          onMouseEnter={() => {
                            if (dayShifts.length === 0 && !isPast) setHoveredCell(`${emp.id}-${dateStr}`);
                          }}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`flex-1 border-r border-calendar-border last:border-r-0 p-1 flex flex-col justify-center gap-0.5 transition-colors ${
                            isToday ? "bg-primary/5" : ""
                          } ${isPast ? "opacity-40" : ""} ${
                            isDropTarget ? "bg-primary/10 ring-2 ring-inset ring-primary/30" : ""
                          } ${dayShifts.length === 0 && !isPast ? "cursor-pointer hover:bg-muted/20" : ""}`}
                        >
                          {dayShifts.length === 0 && !isPast && hoveredCell === `${emp.id}-${dateStr}` && (() => {
                            const settings = SettingsManager.getControlCenterSettings();
                            return (
                              <div className="w-full text-center rounded-md px-2 py-1.5 border border-dashed border-primary/30 bg-primary/5 transition-all animate-in fade-in-0 duration-150">
                                <span className="text-[10px] font-medium text-primary block">Available</span>
                                <span className="text-[10px] text-primary/70 block">{settings.businessHoursStart} - {settings.businessHoursEnd}</span>
                              </div>
                            );
                          })()}
                          {dayShifts.map((s) => {
                            const shiftRole = s.job_type || s.shift_type || group.role;
                            const colors = isPast
                              ? { bg: "bg-muted/20", border: "border-border/30", text: "text-muted-foreground", textSub: "text-muted-foreground/70" }
                              : getShiftBlockColor(shiftRole);
                            return (
                              <div
                                key={s.id}
                                draggable={!isPast}
                                onDragStart={!isPast ? (e) => handleDragStart(e, s) : undefined}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShiftClick(s.id);
                                }}
                                className={`w-full text-left rounded-md px-2 py-1.5 transition-colors border cursor-grab active:cursor-grabbing ${colors.bg} ${colors.border}`}
                              >
                                <span className={`text-[10px] font-medium block truncate ${colors.text}`}>
                                  {shiftRole}
                                </span>
                                <span className={`text-[10px] block truncate ${colors.textSub}`}>
                                  {formatTime12(s.start_time)}-{formatTime12(s.end_time)}
                                </span>
                              </div>
                            );
                          })}
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
        <div className="rounded-xl bg-card/50 border border-border/40 px-4 py-3">
          <span className="text-sm font-semibold text-foreground">Events</span>
          <p className="text-[11px] text-muted-foreground mt-0.5">No events</p>
        </div>
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
                                  className="rounded-md bg-muted/30 border border-border/40 px-2 py-0.5 hover:bg-muted/50 transition-colors"
                                >
                                  <span className="text-[10px] text-muted-foreground">
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
