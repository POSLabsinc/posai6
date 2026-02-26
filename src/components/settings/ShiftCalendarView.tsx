import { useState } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RoleGroup, ScheduleEmployee, ScheduleShift, getShiftCardColor } from "@/hooks/use-weekly-schedule";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ShiftCalendarViewProps {
  roleGroups: RoleGroup[];
  weekDays: Date[];
  totalShiftCount: number;
}

const formatTime12 = (time: string) => {
  if (!time) return "";
  // If already in AM/PM format, return as-is but lowercase
  const ampmCheck = time.trim().match(/^(\d{1,2}:\d{2})\s*(AM|PM|am|pm)$/i);
  if (ampmCheck) {
    return `${ampmCheck[1]} ${ampmCheck[2].toLowerCase()}`;
  }
  try {
    const [h, m] = time.split(":").map(Number);
    const ampm = h >= 12 ? "pm" : "am";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
  } catch {
    return time;
  }
};

const ShiftCalendarView = ({ roleGroups, weekDays, totalShiftCount }: ShiftCalendarViewProps) => {
  const todayStr = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="w-full">
      {/* Shift count */}
      <p className="text-xs text-muted-foreground mb-3">
        Showing {totalShiftCount} shifts
      </p>

      <div className="w-full overflow-x-auto scrollbar-hide">
        <div className="min-w-[900px]">
          {/* Header row */}
          <div className="grid grid-cols-[180px_repeat(7,1fr)] border-b border-border/50">
            <div className="px-4 py-3 text-sm font-semibold text-foreground sticky left-0 bg-background z-10">
              Team Member
            </div>
            {weekDays.map((day) => {
              const dayStr = format(day, "yyyy-MM-dd");
              const isToday = dayStr === todayStr;
              return (
                <div
                  key={dayStr}
                  className={`px-2 py-3 text-center ${isToday ? "bg-neutral-900 dark:bg-neutral-900" : ""}`}
                >
                  <span className={`text-sm font-semibold ${isToday ? "text-foreground" : "text-foreground"}`}>
                    {format(day, "EEE")} {format(day, "d")}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Events row */}
          <div className="grid grid-cols-[180px_repeat(7,1fr)] border-b border-border/30">
            <div className="px-4 py-4 text-sm font-medium text-foreground sticky left-0 bg-background z-10">
              Events
            </div>
            {weekDays.map((day) => {
              const dayStr = format(day, "yyyy-MM-dd");
              const isToday = dayStr === todayStr;
              return (
                <div key={dayStr} className={`px-2 py-4 border-l border-border/20 ${isToday ? "bg-blue-50/50 dark:bg-blue-950/10" : ""}`} />
              );
            })}
          </div>

          {/* Open Shifts row */}
          <div className="grid grid-cols-[180px_repeat(7,1fr)] border-b border-border/30">
            <div className="px-4 py-4 text-sm font-medium text-foreground sticky left-0 bg-background z-10">
              Open Shifts
            </div>
            {weekDays.map((day) => {
              const dayStr = format(day, "yyyy-MM-dd");
              const isToday = dayStr === todayStr;
              return (
                <div key={dayStr} className={`px-2 py-4 border-l border-border/20 ${isToday ? "bg-blue-50/50 dark:bg-blue-950/10" : ""}`} />
              );
            })}
          </div>

          {/* Role groups */}
          {roleGroups.map((group) => (
            <RoleGroupRow key={group.role} group={group} weekDays={weekDays} todayStr={todayStr} />
          ))}
        </div>
      </div>
    </div>
  );
};

const RoleGroupRow = ({
  group,
  weekDays,
  todayStr,
}: {
  group: RoleGroup;
  weekDays: Date[];
  todayStr: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      {/* Role summary row */}
      <CollapsibleTrigger asChild>
        <button className={`w-full grid grid-cols-[180px_repeat(7,1fr)] border-b border-border/30 ${group.color} hover:opacity-90 transition-opacity cursor-pointer`}>
          <div className="px-4 py-3 flex items-center gap-2 sticky left-0 z-10">
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            )}
            <span className="text-sm font-bold text-foreground">{group.role}</span>
            <span className="text-xs text-muted-foreground">{group.employeeCount} employees</span>
            <span className="text-xs text-muted-foreground">{group.totalHours}h scheduled</span>
          </div>
          {/* Empty day cells to keep grid alignment */}
          {weekDays.map((day) => (
            <div key={format(day, "yyyy-MM-dd")} className="border-l border-border/10" />
          ))}
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {group.employees.map((emp) => (
                <EmployeeRow key={emp.id} employee={emp} weekDays={weekDays} todayStr={todayStr} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </CollapsibleContent>
    </Collapsible>
  );
};

const EmployeeRow = ({
  employee,
  weekDays,
  todayStr,
}: {
  employee: ScheduleEmployee;
  weekDays: Date[];
  todayStr: string;
}) => {
  return (
    <div className="grid grid-cols-[180px_repeat(7,1fr)] border-b border-border/20 min-h-[72px]">
      {/* Employee info */}
      <div className="px-4 py-3 sticky left-0 bg-background z-10 flex flex-col justify-center">
        <div className="flex items-center gap-1">
          <span className="text-sm font-semibold text-foreground">{employee.name}</span>
          <span className="text-xs text-muted-foreground">{employee.role}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-muted-foreground">
            Hours <span className="font-semibold text-foreground">{employee.totalHours}h</span>
          </span>
          <span className="text-xs text-muted-foreground">
            Pay <span className="font-semibold text-foreground">${employee.totalPay.toFixed(2)}</span>
          </span>
        </div>
      </div>

      {/* Day cells with shift cards */}
      {weekDays.map((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        const isToday = dayStr === todayStr;
        const shifts = employee.shiftsByDay[dayStr] || [];

        return (
          <div
            key={dayStr}
            className={`px-1 py-2 border-l border-border/20 flex flex-col gap-1 ${isToday ? "bg-blue-50/50 dark:bg-blue-950/10" : ""}`}
          >
            {shifts.map((shift) => (
              <ShiftCard key={shift.id} shift={shift} />
            ))}
          </div>
        );
      })}
    </div>
  );
};

const ShiftCard = ({ shift }: { shift: ScheduleShift }) => {
  const colors = getShiftCardColor(shift.jobType);

  return (
    <div
      className={`rounded-lg border px-2 py-1.5 ${colors.bg} ${colors.border} cursor-pointer hover:opacity-80 transition-opacity`}
    >
      <div className={`text-xs font-medium ${colors.text}`}>
        {shift.jobType}
      </div>
      <div className={`text-[11px] ${colors.text} opacity-80`}>
        {formatTime12(shift.startTime)}-{formatTime12(shift.endTime)}
      </div>
    </div>
  );
};

export default ShiftCalendarView;
