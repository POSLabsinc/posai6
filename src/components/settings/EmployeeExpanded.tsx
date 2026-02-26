import { ShoppingBag, DollarSign, Clock, CreditCard, Phone, Mail, LogIn, LogOut, Coffee, Timer } from "lucide-react";
import { useEmployeeShifts, useClockIn, useClockOut, type Employee } from "@/hooks/use-employees";
import { format } from "date-fns";

interface EmployeeExpandedProps {
  employee: Employee;
  selectedDate: Date;
}

const formatHoursWorked = (clockIn: string | null, clockOut: string | null, breakMinutes: number) => {
  if (!clockIn) return { hours: 0, minutes: 0, display: "0H 00M" };
  const end = clockOut ? new Date(clockOut) : new Date();
  const start = new Date(clockIn);
  const totalMinutes = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 60000) - breakMinutes);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { hours, minutes, display: `${hours}H ${String(minutes).padStart(2, "0")}M` };
};

const formatTime = (isoStr: string | null) => {
  if (!isoStr) return "—";
  return format(new Date(isoStr), "h:mm a");
};

const EmployeeExpanded = ({ employee, selectedDate }: EmployeeExpandedProps) => {
  const { data: shift } = useEmployeeShifts(employee.id, selectedDate);
  const clockIn = useClockIn();
  const clockOut = useClockOut();

  const worked = formatHoursWorked(shift?.clock_in ?? null, shift?.clock_out ?? null, shift?.break_minutes ?? 0);
  const shiftDisplay = shift?.clock_in ? worked.display : "—";

  const handleClockIn = () => clockIn.mutate({ employeeId: employee.id, date: selectedDate });
  const handleClockOut = () => clockOut.mutate({ employeeId: employee.id, date: selectedDate });

  const breakDisplay = `${Math.floor((shift?.break_minutes ?? 0) / 60)}H ${String((shift?.break_minutes ?? 0) % 60).padStart(2, "0")}M`;

  // Timeline
  const getTimelinePosition = (isoStr: string | null) => {
    if (!isoStr) return null;
    const d = new Date(isoStr);
    return ((d.getHours() * 60 + d.getMinutes()) / (24 * 60)) * 100;
  };
  const clockInPos = getTimelinePosition(shift?.clock_in ?? null);
  const clockOutPos = getTimelinePosition(shift?.clock_out ?? null);

  return (
    <div className="bg-neutral-900/40 px-4 pb-5 pt-3 space-y-4 animate-in slide-in-from-top-2 duration-200 rounded-b-2xl">
      {/* Contact info (mobile) */}
      <div className="flex items-center justify-between sm:hidden">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="w-3.5 h-3.5" />
          <span className="text-xs">{employee.phone || "—"}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="w-3.5 h-3.5" />
          <span className="text-xs">{employee.email || "—"}</span>
        </div>
      </div>

      {/* Summary stats - clean row layout */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: <ShoppingBag className="w-4 h-4" />, value: String(shift?.total_orders ?? 0), label: "Orders" },
          { icon: <DollarSign className="w-4 h-4" />, value: `$${(shift?.total_tips ?? 0).toFixed(0)}`, label: "Tips" },
          { icon: <Clock className="w-4 h-4" />, value: shiftDisplay, label: "Hours" },
          { icon: <CreditCard className="w-4 h-4" />, value: `$${employee.hourly_rate.toFixed(2)}`, label: "Rate" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="relative rounded-xl bg-neutral-800/70 border border-white/[0.04] px-3 py-3 flex flex-col items-center gap-2 overflow-hidden"
          >
            <div className="w-9 h-9 rounded-lg bg-neutral-700/50 flex items-center justify-center text-foreground/70">
              {stat.icon}
            </div>
            <span className="text-foreground text-base font-semibold tabular-nums">{stat.value}</span>
            <span className="text-muted-foreground text-[10px] font-medium tracking-wider">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Clock actions - clean horizontal layout */}
      <div className="grid grid-cols-4 gap-2">
        {/* Clock In */}
        <button
          onClick={handleClockIn}
          disabled={!!shift?.clock_in}
          className="group rounded-xl bg-neutral-800/70 border border-white/[0.04] px-3 py-3 flex flex-col items-center gap-2 transition-all active:scale-[0.97] disabled:opacity-40"
        >
          <div className="w-9 h-9 rounded-lg bg-neutral-700/50 group-hover:bg-neutral-700/80 flex items-center justify-center text-foreground/70 transition-colors">
            <LogIn className="w-4 h-4" />
          </div>
          <span className="text-foreground/80 text-[11px] font-medium">Clock In</span>
          <span className="text-muted-foreground text-[10px] font-mono tabular-nums">{formatTime(shift?.clock_in ?? null)}</span>
        </button>

        {/* Clock Out */}
        <button
          onClick={handleClockOut}
          disabled={!shift?.clock_in || !!shift?.clock_out}
          className="group rounded-xl bg-neutral-800/70 border border-white/[0.04] px-3 py-3 flex flex-col items-center gap-2 transition-all active:scale-[0.97] disabled:opacity-40"
        >
          <div className="w-9 h-9 rounded-lg bg-neutral-700/50 group-hover:bg-neutral-700/80 flex items-center justify-center text-foreground/70 transition-colors">
            <LogOut className="w-4 h-4" />
          </div>
          <span className="text-foreground/80 text-[11px] font-medium">Clock Out</span>
          <span className="text-muted-foreground text-[10px] font-mono tabular-nums">{formatTime(shift?.clock_out ?? null)}</span>
        </button>

        {/* Break */}
        <div className="rounded-xl bg-neutral-800/70 border border-white/[0.04] px-3 py-3 flex flex-col items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-neutral-700/50 flex items-center justify-center text-foreground/70">
            <Coffee className="w-4 h-4" />
          </div>
          <span className="text-foreground/80 text-[11px] font-medium">Break</span>
          <span className="text-foreground text-[10px] font-bold font-mono tabular-nums">{breakDisplay}</span>
        </div>

        {/* Hours Worked */}
        <div className="rounded-xl bg-neutral-800/70 border border-white/[0.04] px-3 py-3 flex flex-col items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-neutral-700/50 flex items-center justify-center text-foreground/70">
            <Timer className="w-4 h-4" />
          </div>
          <span className="text-foreground/80 text-[11px] font-medium">Worked</span>
          <span className="text-foreground text-[10px] font-bold font-mono tabular-nums">{worked.display}</span>
        </div>
      </div>

      {/* Timeline - refined */}
      <div className="pt-1">
        <div className="relative h-8 bg-neutral-800/50 rounded-lg overflow-hidden border border-white/[0.03]">
          <div className="absolute inset-0 flex items-center px-3">
            <div className="w-full h-[3px] bg-neutral-700/40 rounded-full relative">
              {clockInPos !== null && clockOutPos !== null && (
                <div
                  className="absolute top-0 h-full bg-emerald-500/50 rounded-full"
                  style={{ left: `${clockInPos}%`, width: `${clockOutPos - clockInPos}%` }}
                />
              )}
              {clockInPos !== null && !clockOutPos && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"
                  style={{ left: `${clockInPos}%` }}
                />
              )}
              <div className="absolute top-1/2 -translate-y-1/2 left-[45%] w-px h-4 bg-neutral-500/40 rounded-full" />
            </div>
          </div>
        </div>
        <div className="flex justify-between mt-1 px-1">
          {["12A", "3A", "6A", "9A", "12P", "3P", "6P", "9P"].map((t) => (
            <span key={t} className="text-[8px] text-muted-foreground/50 font-mono">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmployeeExpanded;
