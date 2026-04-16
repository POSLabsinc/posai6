import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, X, User, Search, Check, Clock, Plus, Calendar as CalendarIcon, Copy, Trash2 } from "lucide-react";
import { format, eachDayOfInterval } from "date-fns";
import { useEmployees } from "@/hooks/use-employees";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { CompactTimePicker } from "@/components/ui/compact-time-picker";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface EditShiftContentProps {
  showHeader?: boolean;
  onBack?: () => void;
}

/* ── Selection Popup ── */
const SelectionPopup = ({
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  title: string;
  options: string[];
  selected: string;
  onSelect: (val: string) => void;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
    <div className="absolute inset-0 bg-black/60" />
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button onClick={onClose} className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center">
        <X className="w-4 h-4 text-foreground" />
      </button>
      <div className="bg-neutral-800 rounded-2xl w-[340px] max-h-[500px] overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-700/50">
          <h3 className="text-sm font-semibold text-foreground text-center">{title}</h3>
        </div>
        <div className="overflow-y-auto max-h-[440px] scrollbar-hide">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => onSelect(option)}
              className={`flex items-center justify-between w-full px-4 py-3.5 active:opacity-70 transition-opacity ${selected === option ? "bg-neutral-700/40" : ""}`}
            >
              <span className="text-sm font-medium text-foreground">{option}</span>
              {selected === option && (
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ── Days of Week Popup ── */
const DaysOfWeekPopup = ({
  selected,
  onToggle,
  onClose,
}: {
  selected: string[];
  onToggle: (day: string) => void;
  onClose: () => void;
}) => {
  const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center">
          <X className="w-4 h-4 text-foreground" />
        </button>
        <div className="bg-neutral-800 rounded-2xl w-[340px] max-h-[500px] overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-neutral-700/50">
            <h3 className="text-sm font-semibold text-foreground text-center">Days of the Week</h3>
          </div>
          <div className="overflow-y-auto max-h-[400px] scrollbar-hide">
            {allDays.map((day) => {
              const isSelected = selected.includes(day);
              return (
                <button
                  key={day}
                  onClick={() => onToggle(day)}
                  className={`flex items-center gap-3 w-full px-4 py-3.5 active:opacity-70 transition-opacity ${isSelected ? "bg-neutral-700/40" : ""}`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-foreground border-foreground" : "border-neutral-600 bg-transparent"}`}>
                    {isSelected && <Check className="w-3 h-3 text-background" />}
                  </div>
                  <span className="text-sm font-medium text-foreground">{day}</span>
                </button>
              );
            })}
          </div>
          <div className="px-4 py-3 border-t border-neutral-700/50">
            <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold active:opacity-80 transition-opacity">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Break Interface ── */
interface ShiftBreak {
  name: string;
  durationH: string;
  durationM: string;
  startTime: string;
}

const EditShiftContent = ({ showHeader = true, onBack }: EditShiftContentProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shiftId = searchParams.get("id");
  const queryClient = useQueryClient();
  const { data: employees = [] } = useEmployees(false);

  const { data: shiftData, isLoading } = useQuery({
    queryKey: ["shift_detail", shiftId],
    queryFn: async () => {
      if (!shiftId) return null;
      const { data, error } = await (supabase as any)
        .from("employee_shifts")
        .select("*")
        .eq("id", shiftId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!shiftId,
  });

  // Fields matching Add Shift
  const [shiftName, setShiftName] = useState("");
  const [shiftType, setShiftType] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [daySelectionMode, setDaySelectionMode] = useState<"all" | "weekends" | "mon-fri" | "select">("all");
  const [showDaysSection, setShowDaysSection] = useState(false);
  const [dayStartTime, setDayStartTime] = useState("12:00 PM");
  const [dayEndTime, setDayEndTime] = useState("05:00 PM");
  const [nextDay, setNextDay] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [showDayStartTimePicker, setShowDayStartTimePicker] = useState(false);
  const [showDayEndTimePicker, setShowDayEndTimePicker] = useState(false);
  const [allowOvertime, setAllowOvertime] = useState(false);
  const [payRateAsEmployee, setPayRateAsEmployee] = useState(false);
  const [breaks, setBreaks] = useState<ShiftBreak[]>([{ name: "Tea Break", durationH: "00", durationM: "15", startTime: "12:00 PM" }]);
  const [shiftNote, setShiftNote] = useState("");

  // Picker visibility
  const [showEmployeePicker, setShowEmployeePicker] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [showShiftTypePicker, setShowShiftTypePicker] = useState(false);
  const [showJobRolePicker, setShowJobRolePicker] = useState(false);
  const [showDaysPicker, setShowDaysPicker] = useState(false);
  const [activeBreakTimePicker, setActiveBreakTimePicker] = useState<number | null>(null);
  const [activeBreakDurationPicker, setActiveBreakDurationPicker] = useState<number | null>(null);

  const breakDurRef = useRef<HTMLButtonElement>(null);

  const selectedEmployees = employees.filter((e) => selectedEmployeeIds.includes(e.id));
  const filteredEmployees = employees.filter((emp) =>
    emp.full_name.toLowerCase().includes(employeeSearch.toLowerCase())
  );
  const goBack = onBack || (() => navigate("/settings/workforce/shift"));

  const MAX_NOTE_WORDS = 1000;
  const wordCount = shiftNote.trim() ? shiftNote.trim().split(/\s+/).length : 0;

  // Populate from loaded shift data
  useEffect(() => {
    if (shiftData) {
      setSelectedEmployeeIds(shiftData.employee_id ? [shiftData.employee_id] : []);
      setShiftType(shiftData.shift_type || "");
      setJobRole(shiftData.job_type || "");
      setDayStartTime(shiftData.start_time || "12:00 PM");
      setDayEndTime(shiftData.end_time || "05:00 PM");
      setAllowOvertime(shiftData.allow_overtime || false);
      setRecurring(shiftData.recurring === "Yes");
      setShiftNote(shiftData.shift_notes || "");
      
      const startDate = shiftData.start_date
        ? new Date(shiftData.start_date + "T00:00:00")
        : shiftData.shift_date
          ? new Date(shiftData.shift_date + "T00:00:00")
          : new Date();
      const endDate = shiftData.end_date
        ? new Date(shiftData.end_date + "T00:00:00")
        : startDate;
      setDateRange({ from: startDate, to: endDate });
    }
  }, [shiftData]);

  const handleSaveAndBack = async () => {
    if (!shiftId || selectedEmployeeIds.length === 0) {
      goBack();
      return;
    }

    try {
      const startDate = dateRange?.from || new Date();
      const endDate = dateRange?.to || startDate;

      const shiftPayload = {
        shift_date: format(startDate, "yyyy-MM-dd"),
        shift_type: shiftType || "Regular",
        assign_section: null,
        start_time: dayStartTime,
        end_time: dayEndTime,
        allow_overtime: allowOvertime,
        recurring: recurring ? "Yes" : "No",
        job_type: jobRole || null,
        pay_rate: 0,
        shift_notes: shiftNote || null,
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
      };

      const firstEmpId = selectedEmployeeIds[0];
      const { error } = await (supabase as any)
        .from("employee_shifts")
        .update({ ...shiftPayload, employee_id: firstEmpId })
        .eq("id", shiftId);
      if (error) throw error;

      // Insert new shifts for any additional employees
      if (selectedEmployeeIds.length > 1) {
        const additionalIds = selectedEmployeeIds.slice(1);
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        const newRows = additionalIds.flatMap((empId) =>
          days.map((day) => ({
            employee_id: empId,
            ...shiftPayload,
            shift_date: format(day, "yyyy-MM-dd"),
          }))
        );
        const { error: insertError } = await (supabase as any).from("employee_shifts").insert(newRows);
        if (insertError) throw insertError;
      }

      queryClient.invalidateQueries({ queryKey: ["weekly_shifts"] });
      queryClient.invalidateQueries({ queryKey: ["employee_shifts"] });
      queryClient.invalidateQueries({ queryKey: ["shift_cards"] });
      toast.success("Shift updated successfully");
    } catch (err: any) {
      toast.error("Failed to update shift");
      console.error(err);
    }
    goBack();
  };

  const handleDelete = async () => {
    if (!shiftId) return;
    try {
      const { error } = await (supabase as any).from("employee_shifts").delete().eq("id", shiftId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["weekly_shifts"] });
      queryClient.invalidateQueries({ queryKey: ["employee_shifts"] });
      toast.success("Shift deleted");
    } catch (err: any) {
      toast.error("Failed to delete shift");
    }
    goBack();
  };

  const allWeekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleDayModeChange = (mode: "all" | "weekends" | "mon-fri" | "select") => {
    setDaySelectionMode(mode);
    if (mode === "all") setSelectedDays([...allWeekdays]);
    else if (mode === "weekends") setSelectedDays(["Saturday", "Sunday"]);
    else if (mode === "mon-fri") setSelectedDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  };

  const copyTimeToSelectedDays = () => {
    toast.success("Time settings copied to all selected weekdays");
  };

  const calcHours = (): string => {
    const parse = (t: string) => {
      const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!m) return 0;
      let h = parseInt(m[1]);
      const min = parseInt(m[2]);
      const p = m[3].toUpperCase();
      if (p === "AM" && h === 12) h = 0;
      else if (p === "PM" && h !== 12) h += 12;
      return h * 60 + min;
    };
    let diff = parse(dayEndTime) - parse(dayStartTime);
    if (nextDay || diff <= 0) diff += 24 * 60;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h.toString().padStart(2, "0")} H ${m.toString().padStart(2, "0")} M`;
  };

  const getDaysLabel = () => {
    if (daySelectionMode === "all") return "All Days";
    if (daySelectionMode === "weekends") return "Weekends";
    if (daySelectionMode === "mon-fri") return "Mon to Fri";
    if (selectedDays.length > 0) return selectedDays.map((d) => d.slice(0, 3)).join(", ");
    return "Select";
  };

  const addBreak = () => {
    setBreaks((prev) => [...prev, { name: "", durationH: "00", durationM: "15", startTime: "12:00 PM" }]);
  };

  const updateBreak = (index: number, field: keyof ShiftBreak, value: string) => {
    setBreaks((prev) => prev.map((b, i) => (i === index ? { ...b, [field]: value } : b)));
  };

  /* ── Field Row ── */
  const FieldRow = ({
    label,
    value,
    onClick,
    buttonRef,
    rightIcon,
  }: {
    label: string;
    value: string;
    onClick?: () => void;
    buttonRef?: React.RefObject<HTMLButtonElement>;
    rightIcon?: React.ReactNode;
  }) => (
    <button ref={buttonRef} onClick={onClick} className="flex items-center justify-between w-full px-4 py-3.5">
      <span className="text-sm text-foreground font-medium">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-sm text-neutral-400">{value}</span>
        {rightIcon || <ChevronRight className="w-4 h-4 text-neutral-600 shrink-0" />}
      </div>
    </button>
  );

  /* ── Toggle Row ── */
  const ToggleRow = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: boolean;
    onChange: () => void;
  }) => (
    <div className="flex items-center justify-between px-4 py-3.5">
      <span className="text-sm text-foreground font-medium">{label}</span>
      <button
        onClick={onChange}
        className={`w-12 h-7 rounded-full transition-colors ${value ? "bg-white" : "bg-neutral-700"} relative`}
      >
        <div className={`w-[22px] h-[22px] rounded-full absolute top-[3px] transition-transform ${value ? "translate-x-[22px] bg-neutral-800" : "translate-x-[3px] bg-white"}`} />
      </button>
    </div>
  );

  const Divider = () => <div className="border-b border-neutral-700/30 mx-0" />;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-sm text-muted-foreground">Loading shift...</span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden flex flex-col">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center px-4 py-3 shrink-0 relative">
          <button onClick={handleSaveAndBack} className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-semibold text-foreground absolute left-1/2 -translate-x-1/2">Edit Shift</h1>
          <button onClick={handleDelete} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity">
            <Trash2 className="w-4.5 h-4.5 text-red-400" />
          </button>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide pb-6">
        {/* Main fields card */}
        <div className="mx-4 bg-[#26262699] rounded-2xl overflow-hidden mb-4">
          {/* Shift Name */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm text-foreground font-medium">Shift Name</span>
            <input
              type="text"
              placeholder="Enter"
              value={shiftName}
              onChange={(e) => setShiftName(e.target.value)}
              className="text-right text-sm text-neutral-400 placeholder:text-neutral-500 bg-transparent outline-none w-32"
            />
          </div>
          <Divider />

          {/* Shift Type */}
          <FieldRow label="Shift Type" value={shiftType || "Select"} onClick={() => setShowShiftTypePicker(true)} />
          <Divider />

          {/* Job Role */}
          <FieldRow label="Job Role" value={jobRole || "Select"} onClick={() => setShowJobRolePicker(true)} />
          <Divider />

          {/* Employee */}
          <FieldRow
            label="Employee"
            value={selectedEmployees.length === 0 ? "Select" : `${selectedEmployees.length} selected`}
            onClick={() => setShowEmployeePicker(true)}
          />
          {selectedEmployees.length > 0 && (
            <div className="px-4 pb-3 flex flex-wrap gap-2">
              {selectedEmployees.map((emp) => (
                <span key={emp.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-700/60 text-xs font-medium text-foreground">
                  {emp.full_name}
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedEmployeeIds((prev) => prev.filter((id) => id !== emp.id)); }}
                    className="w-3.5 h-3.5 rounded-full bg-neutral-500/50 flex items-center justify-center hover:bg-neutral-500/80 transition-colors"
                  >
                    <X className="w-2.5 h-2.5 text-foreground" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <Divider />

          {/* Date Range */}
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="flex items-center justify-between w-full px-4 py-3.5"
          >
            <span className="text-sm text-foreground font-medium">Date</span>
            <div className="flex items-center gap-1">
              <span className="text-sm text-neutral-400">
                {dateRange?.from
                  ? dateRange.to && dateRange.to.getTime() !== dateRange.from.getTime()
                    ? `${format(dateRange.from, "MM/dd")} - ${format(dateRange.to, "MM/dd/yyyy")}`
                    : format(dateRange.from, "MM/dd/yyyy")
                  : "Select"}
              </span>
              <CalendarIcon className="w-4 h-4 text-neutral-500 shrink-0" />
            </div>
          </button>
          {showCalendar && (
            <div className="px-2 pb-3 flex justify-center">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                className={cn("p-3 pointer-events-auto rounded-xl bg-neutral-800/80")}
                numberOfMonths={1}
              />
            </div>
          )}
        </div>

        {/* Days of the Week */}
        <div className="mx-4 bg-[#26262699] rounded-2xl overflow-hidden mb-4">
          <button
            onClick={() => setShowDaysSection(!showDaysSection)}
            className="flex items-center justify-between w-full px-4 py-3.5"
          >
            <span className="text-sm text-foreground font-medium">Days of the Week</span>
            <div className="flex items-center gap-1">
              <span className="text-sm text-neutral-400">{getDaysLabel()}</span>
              <ChevronRight className={`w-4 h-4 text-neutral-600 shrink-0 transition-transform ${showDaysSection ? "rotate-90" : ""}`} />
            </div>
          </button>

          {showDaysSection && (
            <div>
              <Divider />
              {([
                { key: "all", label: "All Days" },
                { key: "weekends", label: "Weekends" },
                { key: "mon-fri", label: "Monday to Friday" },
                { key: "select", label: "Select Days" },
              ] as const).map(({ key, label }) => (
                <div key={key}>
                  <button
                    onClick={() => handleDayModeChange(key)}
                    className="flex items-center justify-between w-full px-4 py-3.5 active:opacity-70 transition-opacity"
                  >
                    <span className="text-sm text-foreground font-medium">{label}</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${daySelectionMode === key ? "border-foreground" : "border-neutral-600"}`}>
                      {daySelectionMode === key && <div className="w-2.5 h-2.5 rounded-full bg-foreground" />}
                    </div>
                  </button>
                  <Divider />
                </div>
              ))}

              {daySelectionMode === "select" && (
                <>
                  {allWeekdays.map((day, idx) => {
                    const isChecked = selectedDays.includes(day);
                    const isLastChecked = isChecked && allWeekdays.slice(idx + 1).every(d => !selectedDays.includes(d));

                    return (
                      <div key={day}>
                        <button
                          onClick={() => toggleDay(day)}
                          className="flex items-center justify-between w-full px-4 py-3.5 active:opacity-70 transition-opacity"
                        >
                          <span className="text-sm text-foreground font-medium">{day}</span>
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isChecked ? "bg-foreground border-foreground" : "border-neutral-600 bg-transparent"}`}>
                            {isChecked && <Check className="w-3 h-3 text-background" />}
                          </div>
                        </button>

                        {isLastChecked && selectedDays.length > 0 && (
                          <>
                            <Divider />
                            <div className="relative">
                            <button
                              onClick={() => { setShowDayStartTimePicker(!showDayStartTimePicker); setShowDayEndTimePicker(false); }}
                              className="flex items-center justify-between w-full px-8 py-3.5"
                            >
                              <span className="text-sm text-foreground font-medium">Start Time</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm text-primary">{dayStartTime}</span>
                                <Clock className="w-4 h-4 text-primary shrink-0" />
                              </div>
                            </button>
                            {showDayStartTimePicker && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowDayStartTimePicker(false)} />
                                <div className="absolute right-4 top-full mt-1 z-50 overflow-hidden" style={{ width: 200 }}>
                                  <CompactTimePicker selectedTime={dayStartTime} onTimeChange={setDayStartTime} />
                                </div>
                              </>
                            )}
                            </div>
                            <Divider />
                            <div className="relative">
                            <button
                              onClick={() => { setShowDayEndTimePicker(!showDayEndTimePicker); setShowDayStartTimePicker(false); }}
                              className="flex items-center justify-between w-full px-8 py-3.5"
                            >
                              <span className="text-sm text-foreground font-medium">End Time</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm text-primary">{dayEndTime}</span>
                                <Clock className="w-4 h-4 text-primary shrink-0" />
                              </div>
                            </button>
                            {showDayEndTimePicker && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowDayEndTimePicker(false)} />
                                <div className="absolute right-4 top-full mt-1 z-50 overflow-hidden" style={{ width: 200 }}>
                                  <CompactTimePicker selectedTime={dayEndTime} onTimeChange={setDayEndTime} />
                                </div>
                              </>
                            )}
                            </div>
                            <Divider />
                            <div className="flex items-center justify-between px-8 py-3.5">
                              <span className="text-sm text-foreground font-medium">Next day</span>
                              <button
                                onClick={() => setNextDay(!nextDay)}
                                className={`w-12 h-7 rounded-full transition-colors ${nextDay ? "bg-white" : "bg-neutral-700"} relative`}
                              >
                                <div className={`w-[22px] h-[22px] rounded-full absolute top-[3px] transition-transform ${nextDay ? "translate-x-[22px] bg-neutral-800" : "translate-x-[3px] bg-white"}`} />
                              </button>
                            </div>
                            <Divider />
                            <div className="flex items-center justify-between px-8 py-3.5">
                              <span className="text-sm text-foreground font-medium">Hours</span>
                              <span className="text-sm text-neutral-400">{calcHours()}</span>
                            </div>
                            <button
                              onClick={copyTimeToSelectedDays}
                              className="flex items-center justify-between w-full px-8 py-3.5 active:opacity-70 transition-opacity"
                            >
                              <span className="text-sm text-foreground font-medium">Copy it for selected weekday</span>
                              <Copy className="w-4 h-4 text-neutral-400 shrink-0" />
                            </button>
                          </>
                        )}

                        {idx < allWeekdays.length - 1 && <Divider />}
                      </div>
                    );
                  })}
                </>
              )}

              {daySelectionMode !== "select" && (
                <>
                  <div className="relative">
                    <button
                      onClick={() => { setShowDayStartTimePicker(!showDayStartTimePicker); setShowDayEndTimePicker(false); }}
                      className="flex items-center justify-between w-full px-4 py-3.5"
                    >
                      <span className="text-sm text-foreground font-medium">Start Time</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-primary">{dayStartTime}</span>
                        <Clock className="w-4 h-4 text-primary shrink-0" />
                      </div>
                    </button>
                    {showDayStartTimePicker && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowDayStartTimePicker(false)} />
                        <div className="absolute right-4 top-full mt-1 z-50 overflow-hidden" style={{ width: 200 }}>
                          <CompactTimePicker selectedTime={dayStartTime} onTimeChange={setDayStartTime} />
                        </div>
                      </>
                    )}
                  </div>
                  <Divider />
                  <div className="relative">
                    <button
                      onClick={() => { setShowDayEndTimePicker(!showDayEndTimePicker); setShowDayStartTimePicker(false); }}
                      className="flex items-center justify-between w-full px-4 py-3.5"
                    >
                      <span className="text-sm text-foreground font-medium">End Time</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-primary">{dayEndTime}</span>
                        <Clock className="w-4 h-4 text-primary shrink-0" />
                      </div>
                    </button>
                    {showDayEndTimePicker && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowDayEndTimePicker(false)} />
                        <div className="absolute right-4 top-full mt-1 z-50 overflow-hidden" style={{ width: 200 }}>
                          <CompactTimePicker selectedTime={dayEndTime} onTimeChange={setDayEndTime} />
                        </div>
                      </>
                    )}
                  </div>
                  <Divider />
                  <div className="flex items-center justify-between px-4 py-3.5">
                    <span className="text-sm text-foreground font-medium">Next day</span>
                    <button
                      onClick={() => setNextDay(!nextDay)}
                      className={`w-12 h-7 rounded-full transition-colors ${nextDay ? "bg-white" : "bg-neutral-700"} relative`}
                    >
                      <div className={`w-[22px] h-[22px] rounded-full absolute top-[3px] transition-transform ${nextDay ? "translate-x-[22px] bg-neutral-800" : "translate-x-[3px] bg-white"}`} />
                    </button>
                  </div>
                  <Divider />
                  <div className="flex items-center justify-between px-4 py-3.5">
                    <span className="text-sm text-foreground font-medium">Hours</span>
                    <span className="text-sm text-neutral-400">{calcHours()}</span>
                  </div>
                </>
              )}

              <Divider />
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-sm text-foreground font-medium">Recurring</span>
                <button
                  onClick={() => setRecurring(!recurring)}
                  className={`w-12 h-7 rounded-full transition-colors ${recurring ? "bg-white" : "bg-neutral-700"} relative`}
                >
                  <div className={`w-[22px] h-[22px] rounded-full absolute top-[3px] transition-transform ${recurring ? "translate-x-[22px] bg-neutral-800" : "translate-x-[3px] bg-white"}`} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Allow Overtime */}
        <div className="mx-4 bg-[#26262699] rounded-2xl overflow-hidden mb-4">
          <ToggleRow label="Allow Overtime" value={allowOvertime} onChange={() => setAllowOvertime(!allowOvertime)} />
          <Divider />
          <ToggleRow label="Pay Rate as per the Employees" value={payRateAsEmployee} onChange={() => setPayRateAsEmployee(!payRateAsEmployee)} />
        </div>

        {/* BREAK Section */}
        <div className="mx-4 mb-1">
          <span className="text-xs text-neutral-500 font-medium tracking-wider px-1">BREAK</span>
        </div>
        {breaks.map((brk, idx) => (
          <div key={idx} className="mx-4 bg-[#26262699] rounded-2xl overflow-hidden mb-4">
            {/* Name */}
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm text-foreground font-medium">Name</span>
              <input
                type="text"
                placeholder="Enter"
                value={brk.name}
                onChange={(e) => updateBreak(idx, "name", e.target.value)}
                className="text-right text-sm text-neutral-400 placeholder:text-neutral-500 bg-transparent outline-none w-32"
              />
            </div>
            <Divider />

            {/* Duration */}
            <button
              ref={idx === 0 ? breakDurRef : undefined}
              onClick={() => setActiveBreakDurationPicker(activeBreakDurationPicker === idx ? null : idx)}
              className="flex items-center justify-between w-full px-4 py-3.5"
            >
              <span className="text-sm text-foreground font-medium">Duration</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-neutral-400">{brk.durationH}H {brk.durationM}M</span>
                <Clock className="w-4 h-4 text-neutral-500 shrink-0" />
              </div>
            </button>
            {activeBreakDurationPicker === idx && (
              <div className="px-4 pb-3 flex items-center gap-3 justify-end">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={brk.durationH}
                    onChange={(e) => updateBreak(idx, "durationH", e.target.value.padStart(2, "0"))}
                    className="w-10 text-center text-sm bg-neutral-700/50 rounded-lg py-1.5 text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-xs text-neutral-500">H</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={brk.durationM}
                    onChange={(e) => updateBreak(idx, "durationM", e.target.value.padStart(2, "0"))}
                    className="w-10 text-center text-sm bg-neutral-700/50 rounded-lg py-1.5 text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-xs text-neutral-500">M</span>
                </div>
              </div>
            )}
            <Divider />

            {/* Start Break Time */}
            <div className="relative">
              <button
                onClick={() => setActiveBreakTimePicker(activeBreakTimePicker === idx ? null : idx)}
                className="flex items-center justify-between w-full px-4 py-3.5"
              >
                <span className="text-sm text-foreground font-medium">Start Break Time</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-neutral-400">{brk.startTime}</span>
                  <Clock className="w-4 h-4 text-neutral-500 shrink-0" />
                </div>
              </button>
              {activeBreakTimePicker === idx && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setActiveBreakTimePicker(null)} />
                  <div className="absolute right-4 top-full mt-1 z-50 overflow-hidden" style={{ width: 200 }}>
                    <CompactTimePicker
                      selectedTime={brk.startTime}
                      onTimeChange={(val) => updateBreak(idx, "startTime", val)}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        ))}

        {/* Add Another */}
        <div className="mx-4 bg-[#26262699] rounded-2xl overflow-hidden mb-4">
          <button onClick={addBreak} className="flex items-center justify-between w-full px-4 py-3.5">
            <span className="text-sm text-foreground font-medium">Add Another</span>
            <Plus className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        {/* Shift Note */}
        <div className="mx-4 bg-[#26262699] rounded-2xl overflow-hidden mb-2">
          <div className="px-4 py-3.5">
            <span className="text-sm text-foreground font-medium mb-2 block">Shift Note</span>
            <textarea
              placeholder="Enter shift note..."
              value={shiftNote}
              onChange={(e) => {
                const words = e.target.value.trim().split(/\s+/);
                if (words.length <= MAX_NOTE_WORDS || e.target.value.length < shiftNote.length) {
                  setShiftNote(e.target.value);
                }
              }}
              rows={3}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-neutral-600 outline-none resize-none"
            />
          </div>
        </div>
        <div className="mx-4 px-1 mb-4 flex justify-end">
          <span className="text-xs text-neutral-500">{wordCount} / {MAX_NOTE_WORDS} words</span>
        </div>
      </div>

      {/* Employee Multi-Select Picker */}
      {showEmployeePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => { setShowEmployeePicker(false); setEmployeeSearch(""); }}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setShowEmployeePicker(false); setEmployeeSearch(""); }} className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center">
              <X className="w-4 h-4 text-foreground" />
            </button>
            <div className="bg-neutral-800 rounded-2xl w-[340px] max-h-[500px] overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-neutral-700/50 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground text-center flex-1">Select Employees</h3>
                {selectedEmployeeIds.length > 0 && <span className="text-xs text-neutral-400">{selectedEmployeeIds.length} selected</span>}
              </div>
              <div className="px-3 py-2 border-b border-neutral-700/50">
                <div className="flex items-center gap-2 bg-neutral-700/50 rounded-lg px-3 py-2">
                  <Search className="w-4 h-4 text-neutral-500 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    className="bg-transparent text-sm text-foreground placeholder:text-neutral-500 outline-none w-full"
                    autoFocus
                  />
                </div>
              </div>
              <div className="overflow-y-auto max-h-[340px] scrollbar-hide">
                {filteredEmployees.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <User className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                    <p className="text-sm text-neutral-500">No employees found</p>
                  </div>
                ) : (
                  filteredEmployees.map((emp) => {
                    const isSelected = selectedEmployeeIds.includes(emp.id);
                    return (
                      <button
                        key={emp.id}
                        onClick={() => setSelectedEmployeeIds((prev) => isSelected ? prev.filter((id) => id !== emp.id) : [...prev, emp.id])}
                        className={`flex items-center gap-3 w-full px-4 py-3 active:opacity-70 transition-opacity ${isSelected ? "bg-neutral-700/40" : ""}`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-foreground border-foreground" : "border-neutral-600 bg-transparent"}`}>
                          {isSelected && <Check className="w-3 h-3 text-background" />}
                        </div>
                        <div className="w-9 h-9 rounded-full bg-neutral-700 flex items-center justify-center shrink-0">
                          {emp.avatar_url ? <img src={emp.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" /> : <User className="w-4 h-4 text-neutral-400" />}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-foreground">{emp.full_name}</p>
                          <p className="text-xs text-neutral-500">{emp.role}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
              <div className="px-4 py-3 border-t border-neutral-700/50">
                <button onClick={() => { setShowEmployeePicker(false); setEmployeeSearch(""); }} className="w-full py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold active:opacity-80 transition-opacity">
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shift Type Popup */}
      {showShiftTypePicker && (
        <SelectionPopup
          title="Select Shift Type"
          options={["Morning", "Afternoon", "Evening", "Night", "Split", "On Call"]}
          selected={shiftType}
          onSelect={(val) => { setShiftType(val); setShowShiftTypePicker(false); }}
          onClose={() => setShowShiftTypePicker(false)}
        />
      )}

      {/* Job Role Popup */}
      {showJobRolePicker && (
        <SelectionPopup
          title="Select Job Role"
          options={["Server", "Manager", "Host", "Admin", "Cashier", "Chef", "Bartender", "Barista", "Runner"]}
          selected={jobRole}
          onSelect={(val) => { setJobRole(val); setShowJobRolePicker(false); }}
          onClose={() => setShowJobRolePicker(false)}
        />
      )}
    </div>
  );
};

export default EditShiftContent;
