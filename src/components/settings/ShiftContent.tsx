import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search, Plus, ArrowDownAZ, Mic } from "lucide-react";
import { format, addWeeks, subWeeks, startOfWeek, differenceInMinutes, parseISO } from "date-fns";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useEmployees } from "@/hooks/use-employees";
import { useWeeklyShifts, getWeekDays } from "@/hooks/use-weekly-shifts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ShiftContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const ShiftContent = ({
  showHeader = true,
  onBack,
  onAIClick,
}: ShiftContentProps) => {
  const navigate = useNavigate();
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);
  

  const { data: employees = [] } = useEmployees(false);
  const { data: shifts = [] } = useWeeklyShifts(currentWeek);

  const weekDays = useMemo(() => getWeekDays(currentWeek), [currentWeek]);
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });

  const roles = ["Server", "Manager", "Host", "Admin"];

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const filteredEmployees = employees
    .filter((e) => {
      if (selectedRoles.length > 0 && !selectedRoles.includes(e.role)) return false;
      if (searchQuery && !e.full_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => sortAsc ? a.full_name.localeCompare(b.full_name) : b.full_name.localeCompare(a.full_name));

  const getShiftForDay = (employeeId: string, day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    return shifts.find((s) => s.employee_id === employeeId && s.shift_date === dateStr);
  };

  const formatShiftHours = (shift: any) => {
    if (!shift) return null;
    // If it has start_time/end_time (scheduled shift), show those
    if (shift.start_time && shift.end_time) {
      return `${shift.start_time.replace(/:00\s/, ' ')} - ${shift.end_time.replace(/:00\s/, ' ')}`;
    }
    // Fallback to clock_in/clock_out
    if (!shift.clock_in) return null;
    if (!shift.clock_out) return "In";
    const mins = differenceInMinutes(parseISO(shift.clock_out), parseISO(shift.clock_in)) - (shift.break_minutes || 0);
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return remainMins > 0 ? `${hrs}h${remainMins}m` : `${hrs}h`;
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      <div className="px-4 pb-28">
        {/* Header */}
        {showHeader && (
          <div className="flex items-center justify-between pt-4 pb-2 relative overflow-visible px-0">
            {onBack && (
              <button
                onClick={onBack}
                className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
                aria-label="Back"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
            )}
            <h1 className="text-base font-medium text-foreground absolute left-1/2 -translate-x-1/2">Shift</h1>
            <div className="overflow-visible flex items-center justify-center" style={{ width: 32, height: 32 }}>
              <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />
            </div>
          </div>
        )}

        {/* Description */}
        <div className="mb-4 px-1 pt-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Refers to a scheduled period during which a specific group of employees works, ensuring continuous operations and productivity.
          </p>
        </div>

        {/* Search + Add row */}
        <div className="flex items-center gap-2 mb-4">
          {/* Search bar */}
          <div className="flex-1 min-w-[140px] rounded-full bg-neutral-800/60 px-4 py-3 flex items-center gap-3">
            <Search className="h-5 w-5 flex-shrink-0 text-neutral-500" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-0 bg-transparent text-foreground placeholder:text-neutral-500 outline-none text-[15px]"
            />
            <Mic className="h-5 w-5 flex-shrink-0 text-neutral-500" />
          </div>

          {/* Add button - right side */}
          <button onClick={() => navigate("/settings/workforce/shift/add")} className="h-12 rounded-full px-4 lg:px-7 flex-shrink-0 flex items-center justify-center gap-2 border border-[hsl(var(--surface-border))] bg-transparent text-foreground active:opacity-70 transition-opacity">
            <Plus className="h-5 w-5" />
            <span className="text-sm font-medium">Add</span>
          </button>
        </div>

        {/* Job Types + Date (left) | AZ (right) row */}
        <div className="flex items-center gap-2 mb-4">
          {/* Job Types */}
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className={`h-10 rounded-full px-4 flex items-center gap-2 border text-sm font-medium transition-colors ${
                selectedRoles.length > 0
                  ? "bg-foreground text-background border-foreground"
                  : "bg-neutral-800/60 text-foreground border-neutral-700/50"
              }`}
            >
              Job Types {selectedRoles.length > 0 && `(${selectedRoles.length})`}
              <ChevronRight className="w-3.5 h-3.5 rotate-90" />
            </button>
            {showRoleDropdown && (
              <div className="absolute top-12 left-0 z-50 bg-neutral-900 border border-neutral-700/50 rounded-xl shadow-lg py-1 min-w-[140px]">
                {roles.map((role) => (
                  <button
                    key={role}
                    onClick={() => toggleRole(role)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      selectedRoles.includes(role)
                        ? "text-foreground bg-neutral-800"
                        : "text-neutral-400 hover:text-foreground hover:bg-neutral-800/50"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Week Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
              className="w-8 h-8 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70"
            >
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <span className="text-sm font-medium text-foreground px-2 whitespace-nowrap">
              {format(weekDays[0], "dd MMM")} – {format(weekDays[6], "dd MMM yyyy")}
            </span>
            <button
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
              className="w-8 h-8 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70"
            >
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Sort AZ - right corner */}
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="w-10 h-10 rounded-xl bg-neutral-800/60 flex items-center justify-center active:opacity-70 border border-neutral-700/50"
          >
            <ArrowDownAZ className={`w-5 h-5 text-foreground transition-transform ${!sortAsc ? "scale-y-[-1]" : ""}`} />
          </button>
        </div>

        {/* Weekly Calendar Grid */}
        <div className="rounded-2xl border border-neutral-700/30 overflow-hidden bg-neutral-900/40">
          {/* Header row */}
          <div className="grid grid-cols-[minmax(120px,1.5fr)_repeat(7,1fr)] border-b border-neutral-700/30">
            <div className="px-3 py-3 text-xs font-semibold text-muted-foreground tracking-wide">
              Employees
            </div>
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={`px-1 py-3 text-center border-l border-neutral-700/30 ${
                  format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                    ? "bg-primary/10"
                    : ""
                }`}
              >
                <div className="text-xs font-semibold text-foreground">{format(day, "EEE")}</div>
                <div className="text-[10px] text-muted-foreground">{format(day, "MM/dd")}</div>
              </div>
            ))}
          </div>

          {/* Employee rows */}
          {filteredEmployees.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm">
              No employees found
            </div>
          ) : (
            filteredEmployees.map((employee, idx) => (
              <div
                key={employee.id}
                className={`grid grid-cols-[minmax(120px,1.5fr)_repeat(7,1fr)] ${
                  idx < filteredEmployees.length - 1 ? "border-b border-neutral-700/20" : ""
                } hover:bg-neutral-800/30 transition-colors`}
              >
                {/* Employee info */}
                <div className="px-3 py-3 flex items-center gap-2.5 min-w-0">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    {employee.avatar_url && <AvatarImage src={employee.avatar_url} />}
                    <AvatarFallback className="text-[10px] font-semibold bg-neutral-700 text-foreground">
                      {getInitials(employee.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{employee.full_name}</p>
                    <p className="text-[10px] text-muted-foreground">{employee.role}</p>
                  </div>
                </div>

                {/* Day cells */}
                {weekDays.map((day) => {
                  const shift = getShiftForDay(employee.id, day);
                  const hours = formatShiftHours(shift);
                  const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => {
                        const dateStr = format(day, "yyyy-MM-dd");
                        if (shift) {
                          navigate(`/settings/workforce/shift/edit?id=${shift.id}`);
                        } else {
                          navigate(`/settings/workforce/shift/add?employeeId=${employee.id}&date=${dateStr}`);
                        }
                      }}
                      className={`flex items-center justify-center border-l border-neutral-700/30 px-1 py-3 cursor-pointer hover:bg-neutral-800/50 active:opacity-70 transition-colors ${
                        isToday ? "bg-primary/5" : ""
                      }`}
                    >
                      {hours ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full leading-tight ${
                              hours === "In"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-primary/15 text-primary"
                            }`}
                          >
                            {hours}
                          </span>
                          {shift?.shift_type && (
                            <span className="text-[8px] text-muted-foreground truncate max-w-full">{shift.shift_type}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-600">–</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Add shift button */}
      </div>

      {/* Close role dropdown on outside click */}
      {showRoleDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => setShowRoleDropdown(false)} />
      )}
    </div>
  );
};

export default ShiftContent;
