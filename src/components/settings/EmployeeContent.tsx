import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search, Plus, ArrowDownAZ, Calendar as CalendarIcon, Archive, Mic, Check, Clock } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { CompactWheelDatePicker } from "@/components/ui/compact-wheel-date-picker";
import { useEmployees, useArchiveEmployee, useAllEmployeeShiftsForDate } from "@/hooks/use-employees";
import EmployeeExpanded from "@/components/settings/EmployeeExpanded";
import SwipeableSettingsItem from "./SwipeableSettingsItem";
import { toast } from "sonner";

interface EmployeeContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const EmployeeContent = ({
  showHeader = true,
  onBack,
  onAIClick,
}: EmployeeContentProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showArchived, setShowArchived] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);

  const { data: employees = [], isLoading } = useEmployees(showArchived);
  const { data: allShifts = [] } = useAllEmployeeShiftsForDate(selectedDate);
  const archiveEmployee = useArchiveEmployee();

  // Build a map of employeeId -> shift for selected date
  const shiftMap = useMemo(() => {
    const map: Record<string, typeof allShifts[0]> = {};
    allShifts.forEach((s) => { map[s.employee_id] = s; });
    return map;
  }, [allShifts]);

  const handleArchive = (employee: { id: string; full_name: string; is_archived: boolean }) => {
    const archive = !employee.is_archived;
    archiveEmployee.mutate(
      { employeeId: employee.id, archive },
      {
        onSuccess: () => {
          toast.success(archive ? `${employee.full_name} archived` : `${employee.full_name} restored`);
        },
      }
    );
  };

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
            <h1 className="text-base font-medium text-foreground absolute left-1/2 -translate-x-1/2">Employees</h1>
            <div className="overflow-visible flex items-center justify-center" style={{ width: 32, height: 32 }}>
              <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />
            </div>
          </div>
        )}

        {/* Description */}
        <div className="mb-4 px-1 pt-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Individuals employed by a company, contributing to its operations and collectively forming the organization's human resources.
          </p>
        </div>

        {/* Search + Archive + Add row */}
        <div className="flex items-center gap-2 mb-4">
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

          {/* Archive */}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`h-12 rounded-full px-4 flex-shrink-0 flex items-center justify-center gap-2 border text-sm font-medium transition-colors ${
              showArchived
                ? "bg-foreground text-background border-foreground"
                : "border-[hsl(var(--surface-border))] bg-transparent text-foreground"
            }`}
          >
            <Archive className="h-4 w-4" />
            Archive
          </button>

          <button onClick={() => navigate("/settings/workforce/employee/add")} className="h-12 rounded-full px-4 lg:px-7 flex-shrink-0 flex items-center justify-center gap-2 border border-[hsl(var(--surface-border))] bg-transparent text-foreground active:opacity-70 transition-opacity">
            <Plus className="h-5 w-5" />
            <span className="text-sm font-medium">Add</span>
          </button>
        </div>

        {/* Job Roles + Date + Archive (left) | AZ (right) row */}
        <div className="flex items-center gap-2 mb-2">
          {/* Job Roles filter */}
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className={`h-10 rounded-full px-4 flex items-center gap-2 border text-sm font-medium transition-colors ${
                selectedRoles.length > 0
                  ? "bg-foreground text-background border-foreground"
                  : "bg-neutral-800/60 text-foreground border-neutral-700/50"
              }`}
            >
              Job Roles {selectedRoles.length > 0 && `(${selectedRoles.length})`}
              <ChevronRight className="w-3.5 h-3.5 rotate-90" />
            </button>

            {showRoleDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowRoleDropdown(false)} />
                <div className="absolute top-14 left-0 z-50 bg-neutral-800 border border-neutral-700 rounded-2xl shadow-xl py-2 w-52">
                  {roles.map((role) => (
                    <button
                      key={role}
                      onClick={() => toggleRole(role)}
                      className="flex items-center justify-between w-full px-4 py-3 text-sm text-foreground hover:bg-neutral-700/60 transition-colors"
                    >
                      <span>{role}</span>
                      {selectedRoles.includes(role) && <Check className="w-4 h-4 text-foreground" />}
                    </button>
                  ))}
                  {selectedRoles.length > 0 && (
                    <button
                      onClick={() => { setSelectedRoles([]); setShowRoleDropdown(false); }}
                      className="w-full px-4 py-3 text-sm text-neutral-500 hover:bg-neutral-700/60 transition-colors text-left border-t border-neutral-700/50 mt-1"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Date picker */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="h-10 rounded-full px-4 flex items-center gap-2 border border-neutral-700/50 bg-neutral-800/60 text-foreground text-sm font-medium"
            >
              <CalendarIcon className="h-4 w-4" />
              {format(selectedDate, "dd MMM yyyy")}
            </button>
            {showDatePicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)} />
                <div
                  className="absolute top-14 left-0 z-50 bg-neutral-800 border border-neutral-700 rounded-2xl shadow-xl w-[280px] overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-700/50">
                    <button onClick={() => setShowDatePicker(false)} className="text-neutral-400 text-sm">Cancel</button>
                    <button onClick={() => setShowDatePicker(false)} className="text-green-500 text-sm font-semibold">Confirm</button>
                  </div>
                  <CompactWheelDatePicker selectedDate={selectedDate} onDateChange={setSelectedDate} />
                </div>
              </>
            )}
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

        {/* Employee list */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-neutral-500 text-sm">Loading employees...</p>
          </div>
        ) : (
          <div>
            {(() => {
              const grouped: Record<string, typeof filteredEmployees> = {};
              filteredEmployees.forEach((emp) => {
                const letter = emp.full_name.charAt(0).toUpperCase();
                if (!grouped[letter]) grouped[letter] = [];
                grouped[letter].push(emp);
              });
              const letters = Object.keys(grouped).sort();

              return letters.map((letter) => (
                <div key={letter}>
                  <div className="px-1 pt-4 pb-2">
                    <span className="text-xs font-semibold text-neutral-500">{letter}</span>
                  </div>
                  <div className="space-y-2.5">
                    {grouped[letter].map((employee) => {
                      const isExpanded = expandedEmployee === employee.id;
                      const shift = shiftMap[employee.id];

                      // Determine status and sub-line from shift data
                      let statusLabel = "Off";
                      let statusBg = "bg-neutral-700 text-neutral-300";
                      let subLine = "";
                      let footerLine = "";

                      if (employee.is_archived) {
                        statusLabel = "Archived";
                        statusBg = "bg-neutral-600/80 text-neutral-200";
                      } else if (shift) {
                        if (shift.clock_in && !shift.clock_out) {
                          if (shift.break_minutes > 0) {
                            statusLabel = "On Break";
                            statusBg = "bg-orange-500/20 text-orange-400";
                            subLine = `Break at ${format(new Date(shift.clock_in), "h:mm a")}`;
                          } else {
                            statusLabel = "Working";
                            statusBg = "bg-neutral-700 text-foreground";
                            subLine = `Clocked in at ${format(new Date(shift.clock_in), "h:mm a")}`;
                            // Calculate working duration without break
                            const mins = differenceInMinutes(new Date(), new Date(shift.clock_in));
                            if (mins >= 180 && shift.break_minutes === 0) {
                              const h = Math.floor(mins / 60);
                              const m = mins % 60;
                              footerLine = `Working for ${h}h${m > 0 ? `${m}m` : ""} without break`;
                            }
                          }
                        } else if (shift.clock_in && shift.clock_out) {
                          statusLabel = "Clocked Out";
                          statusBg = "bg-red-500/20 text-red-400";
                          subLine = `Clocked Out at ${format(new Date(shift.clock_out), "h:mm a")}`;
                        }
                      }

                      return (
                        <SwipeableSettingsItem
                          key={employee.id}
                          onTap={() => setExpandedEmployee(isExpanded ? null : employee.id)}
                          onArchive={() => handleArchive(employee)}
                          isArchived={employee.is_archived}
                        >
                          <div className="rounded-2xl overflow-hidden transition-all duration-300 border border-neutral-700/40">
                            <div className="flex items-start justify-between w-full py-3.5 px-3.5">
                              <div className="flex items-center gap-3.5">
                                <img
                                  src={employee.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.full_name)}&background=2a2a2a&color=fff&size=52&font-size=0.38&bold=true`}
                                  alt={employee.full_name}
                                  className="w-[52px] h-[52px] rounded-full object-cover flex-shrink-0"
                                />
                                <div className="text-left">
                                  <p className="text-foreground text-[15px] font-bold leading-tight">
                                    {employee.full_name}
                                    <span className="text-muted-foreground font-normal text-[14px]"> • {employee.role}</span>
                                  </p>
                                  {subLine && (
                                    <p className="text-muted-foreground text-[13px] mt-1">{subLine}</p>
                                  )}
                                </div>
                              </div>
                              <span className={`text-[12px] font-semibold px-3 py-1.5 rounded-md whitespace-nowrap mt-0.5 ${statusBg}`}>
                                {statusLabel}
                              </span>
                            </div>

                            {footerLine && (
                              <div className="flex items-center justify-between px-3.5 py-2.5 bg-red-500/10 border-t border-red-500/20">
                                <div className="flex items-center gap-2 text-red-400 text-[12px]">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{footerLine}</span>
                                </div>
                                <span className="text-red-400 text-[12px] font-semibold">Put on break</span>
                              </div>
                            )}

                            {isExpanded && (
                              <EmployeeExpanded employee={employee} selectedDate={selectedDate} />
                            )}
                          </div>
                        </SwipeableSettingsItem>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}

        {!isLoading && filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-500 text-sm">No employees found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeContent;
