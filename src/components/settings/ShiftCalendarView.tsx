import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { format, startOfWeek, addDays } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ChevronRight, SlidersHorizontal, Search, Users, X } from "lucide-react";
import { ShiftCardData } from "@/hooks/use-shift-cards";
import { toast } from "@/hooks/use-toast";
import { SettingsManager } from "@/lib/settingsManager";
import AppleAlertDialog from "@/components/AppleAlertDialog";

interface ShiftCalendarViewProps {
  cards: ShiftCardData[];
  currentWeek: Date;
  onShiftClick: (card: ShiftCardData) => void;
  toolbarJobTypes?: string[];
  toolbarShifts?: string[];
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

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  multiDay: boolean;
  endDate: string | null;
  repeat: string;
}

const EVENT_COLORS = [
  { bg: "bg-violet-500/15", border: "border-violet-500/40", text: "text-violet-400", textSub: "text-violet-400/70" },
  { bg: "bg-cyan-500/15", border: "border-cyan-500/40", text: "text-cyan-400", textSub: "text-cyan-400/70" },
  { bg: "bg-pink-500/15", border: "border-pink-500/40", text: "text-pink-400", textSub: "text-pink-400/70" },
  { bg: "bg-amber-500/15", border: "border-amber-500/40", text: "text-amber-400", textSub: "text-amber-400/70" },
  { bg: "bg-emerald-500/15", border: "border-emerald-500/40", text: "text-emerald-400", textSub: "text-emerald-400/70" },
];

const getEventColor = (index: number) => EVENT_COLORS[index % EVENT_COLORS.length];

const ShiftCalendarView = ({ cards, currentWeek, onShiftClick, toolbarJobTypes = [], toolbarShifts = [] }: ShiftCalendarViewProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayStrs = days.map((d) => format(d, "yyyy-MM-dd"));
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [hoveredEventCell, setHoveredEventCell] = useState<string | null>(null);
  const [hoveredOpenShiftCell, setHoveredOpenShiftCell] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [openShifts, setOpenShifts] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventActions, setShowEventActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedOpenShift, setSelectedOpenShift] = useState<any | null>(null);
  const [showOpenShiftActions, setShowOpenShiftActions] = useState(false);
  const [showOpenShiftDeleteConfirm, setShowOpenShiftDeleteConfirm] = useState(false);

  // Filter state
  const [showFilter, setShowFilter] = useState(false);
  const [filterTab, setFilterTab] = useState<"team" | "jobs">("team");
  const [filterSearch, setFilterSearch] = useState("");
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<Set<string>>(new Set());
  const [selectedJobFilters, setSelectedJobFilters] = useState<Set<string>>(new Set());
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter on outside click
  useEffect(() => {
    if (!showFilter) return;
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilter(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showFilter]);

  const hasActiveFilters = selectedTeamMembers.size > 0 || selectedJobFilters.size > 0;

  // Load events from localStorage and listen for updates
  const loadEvents = useCallback(() => {
    try {
      const raw = localStorage.getItem("pos_events");
      setCalendarEvents(raw ? JSON.parse(raw) : []);
    } catch { setCalendarEvents([]); }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  // Load open shifts from database
  const loadOpenShifts = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("open_shifts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Map DB fields to the format the component expects
      const mapped = (data || []).map((os: any) => ({
        id: os.id,
        shiftName: os.shift_name,
        shiftType: os.shift_type,
        date: os.shift_date,
        selectedDays: os.selected_days || [],
        daySelectionMode: os.day_selection_mode || "all",
        startTime: os.start_time,
        endTime: os.end_time,
        nextDay: os.next_day,
        recurring: os.recurring,
        allowOvertime: os.allow_overtime,
        breaks: os.breaks || [],
        shiftNote: os.shift_note,
      }));
      setOpenShifts(mapped);
    } catch { setOpenShifts([]); }
  }, []);

  useEffect(() => { loadOpenShifts(); }, [loadOpenShifts]);

  useEffect(() => {
    const handler = () => loadEvents();
    window.addEventListener("events-updated", handler);
    return () => window.removeEventListener("events-updated", handler);
  }, [loadEvents]);

  // Get events for a specific date (including multi-day and repeating)
  const getEventsForDate = useCallback((dateStr: string): CalendarEvent[] => {
    return calendarEvents.filter((ev) => {
      // Direct match
      if (ev.date === dateStr) return true;
      // Multi-day range
      if (ev.multiDay && ev.endDate && ev.date <= dateStr && ev.endDate >= dateStr) return true;
      // Repeat logic
      if (ev.repeat === "Daily" && ev.date <= dateStr) return true;
      if (ev.repeat === "Weekly" && ev.date <= dateStr) {
        const evDay = new Date(ev.date + "T00:00:00").getDay();
        const targetDay = new Date(dateStr + "T00:00:00").getDay();
        if (evDay === targetDay) return true;
      }
      if (ev.repeat === "Monthly" && ev.date <= dateStr) {
        const evDate = new Date(ev.date + "T00:00:00").getDate();
        const targetDate = new Date(dateStr + "T00:00:00").getDate();
        if (evDate === targetDate) return true;
      }
      return false;
    });
  }, [calendarEvents]);

  const startStr = dayStrs[0];
  const endStr = dayStrs[6];

  const { data: weekData, isLoading } = useQuery({
    queryKey: ["shift_week_view", startStr, endStr],
    queryFn: async () => {
      const [{ data: employees, error: empErr }, { data: shifts, error: shiftErr }] = await Promise.all([
        (supabase as any)
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

  // All employees for filter list
  const allEmployees = useMemo(() => {
    if (!weekData) return [];
    return weekData.employees.map(e => ({ id: e.id, name: e.full_name, role: e.role || "Other" }));
  }, [weekData]);

  // All unique job types from shifts
  const allJobTypes = useMemo(() => {
    if (!weekData) return [];
    const set = new Set<string>();
    weekData.shifts.forEach(s => { if (s.job_type) set.add(s.job_type); if (s.shift_type) set.add(s.shift_type); });
    weekData.employees.forEach(e => { if (e.role) set.add(e.role); });
    return Array.from(set).sort();
  }, [weekData]);

  const roleGroups = useMemo<RoleGroup[]>(() => {
    if (!weekData) return [];
    const { employees, shifts } = weekData;

    const shiftsByEmp = new Map<string, WeekShift[]>();
    shifts.forEach((s) => {
      const list = shiftsByEmp.get(s.employee_id) || [];
      list.push(s);
      shiftsByEmp.set(s.employee_id, list);
    });

    // Filter employees (combine local Week view filters + toolbar filters)
    let filteredEmployees = employees;
    if (selectedTeamMembers.size > 0) {
      filteredEmployees = filteredEmployees.filter(e => selectedTeamMembers.has(e.id));
    }
    // Combine local job filters with toolbar job type filters
    const combinedJobFilters = new Set([...selectedJobFilters, ...toolbarJobTypes]);
    if (combinedJobFilters.size > 0) {
      filteredEmployees = filteredEmployees.filter(e => combinedJobFilters.has(e.role || "Other"));
    }

    const roleMap = new Map<string, EmployeeInfo[]>();
    filteredEmployees.forEach((emp) => {
      const role = emp.role || "Other";
      const list = roleMap.get(role) || [];
      list.push(emp);
      roleMap.set(role, list);
    });

    const groups: RoleGroup[] = [];
    roleMap.forEach((emps, role) => {
      let groupTotalHours = 0;
      const empRows = emps.map((emp) => {
        let empShifts = shiftsByEmp.get(emp.id) || [];
        // Filter shifts by toolbar shift type if active
        if (toolbarShifts.length > 0) {
          empShifts = empShifts.filter(s => toolbarShifts.includes(s.shift_type || ""));
        }
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
  }, [weekData, selectedTeamMembers, selectedJobFilters, toolbarJobTypes, toolbarShifts]);

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

  const handleEventClick = (ev: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(ev);
    setShowEventActions(true);
  };

  const handleEditEvent = () => {
    if (!selectedEvent) return;
    setShowEventActions(false);
    const params = new URLSearchParams({
      edit: selectedEvent.id,
      date: selectedEvent.date,
      start_time: selectedEvent.startTime,
    });
    navigate(`/settings/workforce/shift/add-event?${params.toString()}`);
  };

  const handleDeleteEvent = () => {
    if (!selectedEvent) return;
    const events = JSON.parse(localStorage.getItem("pos_events") || "[]");
    const updated = events.filter((ev: CalendarEvent) => ev.id !== selectedEvent.id);
    localStorage.setItem("pos_events", JSON.stringify(updated));
    window.dispatchEvent(new Event("events-updated"));
    toast({ title: "Event deleted" });
    setShowDeleteConfirm(false);
    setSelectedEvent(null);
  };

  // Open Shift click, edit, delete handlers
  const handleOpenShiftClick = (os: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOpenShift(os);
    setShowOpenShiftActions(true);
  };

  const handleEditOpenShift = () => {
    if (!selectedOpenShift) return;
    setShowOpenShiftActions(false);
    const params = new URLSearchParams({
      edit: selectedOpenShift.id,
      date: selectedOpenShift.date,
      start_time: selectedOpenShift.startTime,
    });
    navigate(`/settings/workforce/shift/add-open-shift?${params.toString()}`);
  };

  const handleDeleteOpenShift = async () => {
    if (!selectedOpenShift) return;
    try {
      const { error } = await (supabase as any)
        .from("open_shifts")
        .delete()
        .eq("id", selectedOpenShift.id);
      if (error) throw error;
      await loadOpenShifts();
      toast({ title: "Open shift deleted" });
    } catch {
      toast({ title: "Failed to delete open shift" });
    }
    setShowOpenShiftDeleteConfirm(false);
    setSelectedOpenShift(null);
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

  // Event drag and drop
  const handleEventDragStart = useCallback((e: React.DragEvent, ev: CalendarEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData("application/json", JSON.stringify({ type: "event", eventId: ev.id, fromDate: ev.date }));
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleEventDragOver = useCallback((e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCell(`event-${dateStr}`);
  }, []);

  const handleEventDrop = useCallback((e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    setDragOverCell(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.type !== "event") return;
      const { eventId, fromDate } = data;
      if (fromDate === targetDate) return;

      const events = JSON.parse(localStorage.getItem("pos_events") || "[]");
      const updated = events.map((ev: any) => {
        if (ev.id !== eventId) return ev;
        const dayDiff = (new Date(targetDate + "T00:00:00").getTime() - new Date(fromDate + "T00:00:00").getTime()) / (1000 * 60 * 60 * 24);
        const newEv = { ...ev, date: targetDate };
        if (ev.multiDay && ev.endDate) {
          const newEnd = new Date(ev.endDate + "T00:00:00");
          newEnd.setDate(newEnd.getDate() + dayDiff);
          newEv.endDate = format(newEnd, "yyyy-MM-dd");
        }
        return newEv;
      });
      localStorage.setItem("pos_events", JSON.stringify(updated));
      window.dispatchEvent(new Event("events-updated"));
      toast({ title: `Event moved to ${format(new Date(targetDate + "T00:00:00"), "EEE, MMM d")}` });
    } catch { toast({ title: "Failed to move event", variant: "destructive" }); }
  }, []);

  // Open Shift drag and drop
  const handleOpenShiftDragStart = useCallback((e: React.DragEvent, os: any) => {
    e.stopPropagation();
    e.dataTransfer.setData("application/json", JSON.stringify({ type: "openshift", openShiftId: os.id, fromDate: os.date }));
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleOpenShiftDragOver = useCallback((e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCell(`openshift-${dateStr}`);
  }, []);

  const handleOpenShiftDrop = useCallback((e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    setDragOverCell(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.type !== "openshift") return;
      const { openShiftId, fromDate } = data;
      if (fromDate === targetDate) return;

      const shifts = JSON.parse(localStorage.getItem("pos_open_shifts") || "[]");
      const updated = shifts.map((s: any) => s.id === openShiftId ? { ...s, date: targetDate } : s);
      localStorage.setItem("pos_open_shifts", JSON.stringify(updated));
      window.dispatchEvent(new Event("open-shifts-updated"));
      toast({ title: `Open shift moved to ${format(new Date(targetDate + "T00:00:00"), "EEE, MMM d")}` });
    } catch { toast({ title: "Failed to move open shift", variant: "destructive" }); }
  }, []);

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
              className="flex-shrink-0 px-4 py-3 text-xs font-semibold text-foreground border-r border-calendar-border flex items-center justify-between relative"
              style={{ width: NAME_COL_W }}
            >
              <span>Team Member</span>
              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => setShowFilter(!showFilter)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${hasActiveFilters ? "bg-primary text-primary-foreground" : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"}`}
                  aria-label="Filter"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>

                {/* Filter Popover */}
                {showFilter && (
                  <div className="absolute top-9 left-0 z-[60] w-[260px] bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
                    {/* Header */}
                    <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">Filter</span>
                      {hasActiveFilters && (
                        <button
                          onClick={() => { setSelectedTeamMembers(new Set()); setSelectedJobFilters(new Set()); }}
                          className="text-[11px] text-destructive font-medium hover:underline"
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    {/* Tab Toggle */}
                    <div className="mx-3 mb-2 flex rounded-lg bg-muted/50 p-0.5">
                      <button
                        onClick={() => setFilterTab("team")}
                        className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${filterTab === "team" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
                      >
                        Team
                      </button>
                      <button
                        onClick={() => setFilterTab("jobs")}
                        className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${filterTab === "jobs" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
                      >
                        Jobs
                      </button>
                    </div>

                    {/* Search */}
                    <div className="mx-3 mb-2">
                      <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5">
                        <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <input
                          type="text"
                          placeholder={filterTab === "team" ? "Filter team members..." : "Filter jobs..."}
                          value={filterSearch}
                          onChange={(e) => setFilterSearch(e.target.value)}
                          className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
                        />
                        {filterSearch && (
                          <button onClick={() => setFilterSearch("")}>
                            <X className="w-3 h-3 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[240px] overflow-y-auto scrollbar-hide">
                      {filterTab === "team" ? (
                        <>
                          <button
                            onClick={() => setSelectedTeamMembers(new Set())}
                            className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs transition-colors hover:bg-muted/30 ${selectedTeamMembers.size === 0 ? "bg-muted/20 text-foreground font-medium" : "text-foreground"}`}
                          >
                            <Users className="w-3.5 h-3.5 text-muted-foreground" />
                            All team members
                          </button>
                          {allEmployees
                            .filter(e => !filterSearch || e.name.toLowerCase().includes(filterSearch.toLowerCase()))
                            .map(emp => (
                              <button
                                key={emp.id}
                                onClick={() => {
                                  setSelectedTeamMembers(prev => {
                                    const next = new Set(prev);
                                    next.has(emp.id) ? next.delete(emp.id) : next.add(emp.id);
                                    return next;
                                  });
                                }}
                                className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs transition-colors hover:bg-muted/30 ${selectedTeamMembers.has(emp.id) ? "bg-muted/20" : ""}`}
                              >
                                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-foreground truncate">{emp.name}</span>
                                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">{emp.role.toLowerCase()}</span>
                              </button>
                            ))}
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setSelectedJobFilters(new Set())}
                            className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs transition-colors hover:bg-muted/30 ${selectedJobFilters.size === 0 ? "bg-muted/20 text-foreground font-medium" : "text-foreground"}`}
                          >
                            All jobs
                          </button>
                          {allJobTypes
                            .filter(j => !filterSearch || j.toLowerCase().includes(filterSearch.toLowerCase()))
                            .map(job => (
                              <button
                                key={job}
                                onClick={() => {
                                  setSelectedJobFilters(prev => {
                                    const next = new Set(prev);
                                    next.has(job) ? next.delete(job) : next.add(job);
                                    return next;
                                  });
                                }}
                                className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs transition-colors hover:bg-muted/30 ${selectedJobFilters.has(job) ? "bg-muted/20" : ""}`}
                              >
                                <span className="text-foreground">{job}</span>
                              </button>
                            ))}
                        </>
                      )}
                    </div>

                    <div className="h-1" />
                  </div>
                )}
              </div>
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
              const cellKey = `event-${dayStrs[i]}`;
              const dayEvents = getEventsForDate(dayStrs[i]);
              const hasEvents = dayEvents.length > 0;
              return (
                <div
                  key={i}
                  className={`flex-1 border-r border-calendar-border last:border-r-0 p-1 flex flex-col justify-center gap-0.5 transition-colors ${isToday ? "bg-primary/5" : ""} ${isPast ? "opacity-40" : ""} ${!isPast ? "cursor-pointer hover:bg-muted/20" : ""} ${dragOverCell === `event-${dayStrs[i]}` ? "bg-primary/10 ring-2 ring-inset ring-primary/30" : ""}`}
                  onMouseEnter={() => { if (!isPast && !hasEvents) setHoveredEventCell(cellKey); }}
                  onMouseLeave={() => setHoveredEventCell(null)}
                  onDragOver={!isPast ? (e) => handleEventDragOver(e, dayStrs[i]) : undefined}
                  onDragLeave={() => { setDragOverCell(null); setHoveredEventCell(null); }}
                  onDrop={!isPast ? (e) => handleEventDrop(e, dayStrs[i]) : undefined}
                  onClick={() => {
                    if (!isPast) {
                      const params = new URLSearchParams({ date: dayStrs[i], start_time: "09:00" });
                      navigate(`/settings/workforce/shift/add-event?${params.toString()}`);
                    }
                  }}
                >
                  {hasEvents ? dayEvents.map((ev, ei) => {
                    const colors = getEventColor(ei);
                    return (
                      <div
                        key={ev.id + ei}
                        draggable={!isPast}
                        onDragStart={(e) => handleEventDragStart(e, ev)}
                        onClick={(e) => handleEventClick(ev, e)}
                        className={`w-full rounded-md px-1.5 py-1 border cursor-grab active:cursor-grabbing hover:ring-1 hover:ring-white/20 transition-all ${colors.bg} ${colors.border}`}
                      >
                        <span className={`text-[10px] font-semibold ${colors.text} block truncate`}>{ev.title}</span>
                        <span className={`text-[10px] ${colors.textSub} block truncate`}>{ev.startTime} - {ev.endTime}</span>
                      </div>
                    );
                  }) : (!isPast && hoveredEventCell === cellKey && (
                    <div className="w-full text-center rounded-md px-2 py-1.5 border border-dashed border-primary/30 bg-primary/5 transition-all animate-in fade-in-0 duration-150">
                      <span className="text-[10px] font-medium text-primary block">No Event</span>
                      <span className="text-[10px] text-primary/70 block">{(() => { const s = SettingsManager.getControlCenterSettings(); return `${s.businessHoursStart} - ${s.businessHoursEnd}`; })()}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Open Shifts row */}
          <div className="flex border-b border-calendar-border" style={{ minHeight: 48 }}>
            <div className="flex-shrink-0 px-4 py-3 flex items-center border-r border-calendar-border" style={{ width: NAME_COL_W }}>
              <span className="text-sm font-semibold text-foreground">Open Shifts</span>
            </div>
            {days.map((day, i) => {
              const isToday = dayStrs[i] === todayStr;
              const isPast = dayStrs[i] < todayStr;
              const cellKey = `open-shift-${dayStrs[i]}`;
              const dayOpenShifts = openShifts.filter((os: any) => os.date === dayStrs[i]);
              const hasOpenShifts = dayOpenShifts.length > 0;
              return (
                <div
                  key={i}
                  className={`flex-1 border-r border-calendar-border last:border-r-0 p-1 flex flex-col justify-center gap-0.5 transition-colors ${isToday ? "bg-primary/5" : ""} ${isPast ? "opacity-40" : ""} ${!isPast ? "cursor-pointer hover:bg-muted/20" : ""} ${dragOverCell === `openshift-${dayStrs[i]}` ? "bg-primary/10 ring-2 ring-inset ring-primary/30" : ""}`}
                  onMouseEnter={() => { if (!isPast && !hasOpenShifts) setHoveredOpenShiftCell(cellKey); }}
                  onMouseLeave={() => setHoveredOpenShiftCell(null)}
                  onDragOver={!isPast ? (e) => handleOpenShiftDragOver(e, dayStrs[i]) : undefined}
                  onDragLeave={() => { setDragOverCell(null); setHoveredOpenShiftCell(null); }}
                  onDrop={!isPast ? (e) => handleOpenShiftDrop(e, dayStrs[i]) : undefined}
                  onClick={() => {
                    if (!isPast) {
                      const params = new URLSearchParams({ date: dayStrs[i], start_time: "09:00" });
                      navigate(`/settings/workforce/shift/add-open-shift?${params.toString()}`);
                    }
                  }}
                >
                  {hasOpenShifts ? dayOpenShifts.map((os: any, oi: number) => {
                    const colors = getEventColor(oi);
                    return (
                      <div
                        key={os.id}
                        draggable={!isPast}
                        onDragStart={(e) => handleOpenShiftDragStart(e, os)}
                        onClick={(e) => handleOpenShiftClick(os, e)}
                        className={`w-full rounded-md px-1.5 py-1 border cursor-grab active:cursor-grabbing hover:ring-1 hover:ring-white/20 transition-all ${colors.bg} ${colors.border}`}
                      >
                        <span className={`text-[10px] font-semibold ${colors.text} block truncate`}>{os.shiftName}</span>
                        <span className={`text-[10px] ${colors.textSub} block truncate`}>{os.startTime} - {os.endTime}</span>
                      </div>
                    );
                  }) : (!isPast && hoveredOpenShiftCell === cellKey && (
                    <div className="w-full text-center rounded-md px-2 py-1.5 border border-dashed border-primary/30 bg-primary/5 transition-all animate-in fade-in-0 duration-150">
                      <span className="text-[10px] font-medium text-primary block">Available</span>
                      <span className="text-[10px] text-primary/70 block">{(() => { const s = SettingsManager.getControlCenterSettings(); return `${s.businessHoursStart} - ${s.businessHoursEnd}`; })()}</span>
                    </div>
                  ))}
                </div>
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

      {/* Event Action Sheet */}
      {showEventActions && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowEventActions(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#2C2C2E]/95 backdrop-blur-xl rounded-[14px] w-[270px] overflow-hidden shadow-2xl">
              <div className="pt-5 pb-4 px-4 space-y-1">
                <h3 className="text-[17px] font-semibold text-white text-center tracking-[-0.4px]">{selectedEvent.title}</h3>
                <p className="text-[13px] text-[#EBEBF599] text-center leading-[18px]">
                  {selectedEvent.startTime} - {selectedEvent.endTime}
                </p>
              </div>
              <div className="border-t border-[#545458]/50">
                <button
                  onClick={handleEditEvent}
                  className="w-full h-11 text-[17px] font-normal text-[#0A84FF] tracking-[-0.4px] hover:bg-[#545458]/30 transition-colors"
                >
                  Edit
                </button>
              </div>
              <div className="border-t border-[#545458]/50">
                <button
                  onClick={() => { setShowEventActions(false); setShowDeleteConfirm(true); }}
                  className="w-full h-11 text-[17px] font-normal text-[#FF453A] tracking-[-0.4px] hover:bg-[#545458]/30 transition-colors"
                >
                  Delete
                </button>
              </div>
              <div className="border-t border-[#545458]/50">
                <button
                  onClick={() => setShowEventActions(false)}
                  className="w-full h-11 text-[17px] font-semibold text-white/70 tracking-[-0.4px] hover:bg-[#545458]/30 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AppleAlertDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDeleteEvent}
        title="Delete Event"
        description={`Are you sure you want to delete "${selectedEvent?.title}"? This action cannot be undone.`}
        cancelText="Cancel"
        confirmText="Delete"
      />

      {/* Open Shift Action Sheet */}
      {showOpenShiftActions && selectedOpenShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowOpenShiftActions(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#2C2C2E]/95 backdrop-blur-xl rounded-[14px] w-[270px] overflow-hidden shadow-2xl">
              <div className="pt-5 pb-4 px-4 space-y-1">
                <h3 className="text-[17px] font-semibold text-white text-center tracking-[-0.4px]">{selectedOpenShift.shiftName}</h3>
                <p className="text-[13px] text-[#EBEBF599] text-center leading-[18px]">
                  {selectedOpenShift.startTime} - {selectedOpenShift.endTime}
                </p>
              </div>
              <div className="border-t border-[#545458]/50">
                <button
                  onClick={handleEditOpenShift}
                  className="w-full h-11 text-[17px] font-normal text-[#0A84FF] tracking-[-0.4px] hover:bg-[#545458]/30 transition-colors"
                >
                  Edit
                </button>
              </div>
              <div className="border-t border-[#545458]/50">
                <button
                  onClick={() => { setShowOpenShiftActions(false); setShowOpenShiftDeleteConfirm(true); }}
                  className="w-full h-11 text-[17px] font-normal text-[#FF453A] tracking-[-0.4px] hover:bg-[#545458]/30 transition-colors"
                >
                  Delete
                </button>
              </div>
              <div className="border-t border-[#545458]/50">
                <button
                  onClick={() => setShowOpenShiftActions(false)}
                  className="w-full h-11 text-[17px] font-semibold text-white/70 tracking-[-0.4px] hover:bg-[#545458]/30 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Open Shift Delete Confirmation */}
      <AppleAlertDialog
        open={showOpenShiftDeleteConfirm}
        onOpenChange={setShowOpenShiftDeleteConfirm}
        onConfirm={handleDeleteOpenShift}
        title="Delete Open Shift"
        description={`Are you sure you want to delete "${selectedOpenShift?.shiftName}"? This action cannot be undone.`}
        cancelText="Cancel"
        confirmText="Delete"
      />
    </div>
  );
};

export default ShiftCalendarView;
