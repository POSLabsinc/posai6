import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, X, Check, Clock, Plus, Calendar as CalendarIcon, Copy } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { CompactTimePicker } from "@/components/ui/compact-time-picker";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface AddOpenShiftContentProps {
  showHeader?: boolean;
  onBack?: () => void;
}

/* ── Selection Popup ── */
const SelectionPopup = ({
  title, options, selected, onSelect, onClose,
}: {
  title: string; options: string[]; selected: string; onSelect: (val: string) => void; onClose: () => void;
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
            <button key={option} onClick={() => onSelect(option)} className={`flex items-center justify-between w-full px-4 py-3.5 active:opacity-70 transition-opacity ${selected === option ? "bg-neutral-700/40" : ""}`}>
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

/* ── Break Interface ── */
interface ShiftBreak {
  name: string;
  durationH: string;
  durationM: string;
  startTime: string;
}

const AddOpenShiftContent = ({ showHeader = true, onBack }: AddOpenShiftContentProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const editId = searchParams.get("edit");
  const isEditMode = !!editId;
  const prefillDate = searchParams.get("shift_date") || searchParams.get("date");

  const to12h = (t: string | null, fallback: string): string => {
    if (!t) return fallback;
    const [hStr, mStr] = t.split(":");
    let h = parseInt(hStr);
    const m = mStr || "00";
    const ampm = h >= 12 ? "PM" : "AM";
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${h.toString().padStart(2, "0")}:${m} ${ampm}`;
  };

  // Fields
  const [shiftName, setShiftName] = useState("");
  const [shiftType, setShiftType] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    prefillDate ? new Date(prefillDate + "T00:00:00") : undefined
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [daySelectionMode, setDaySelectionMode] = useState<"all" | "weekends" | "mon-fri" | "select">("all");
  const [showDaysSection, setShowDaysSection] = useState(false);
  const [dayStartTime, setDayStartTime] = useState(to12h(searchParams.get("start_time"), "09:00 AM"));
  const [dayEndTime, setDayEndTime] = useState(to12h(searchParams.get("end_time"), "05:00 PM"));
  const [showDayStartTimePicker, setShowDayStartTimePicker] = useState(false);
  const [showDayEndTimePicker, setShowDayEndTimePicker] = useState(false);
  const [nextDay, setNextDay] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [allowOvertime, setAllowOvertime] = useState(false);
  const [breaks, setBreaks] = useState<ShiftBreak[]>([{ name: "Tea Break", durationH: "00", durationM: "15", startTime: "12:00 PM" }]);
  const [shiftNote, setShiftNote] = useState("");

  // Picker visibility
  const [showShiftTypePicker, setShowShiftTypePicker] = useState(false);
  const [activeBreakTimePicker, setActiveBreakTimePicker] = useState<number | null>(null);
  const [activeBreakDurationPicker, setActiveBreakDurationPicker] = useState<number | null>(null);

  const goBack = onBack || (() => navigate("/settings/workforce/shift"));

  // Load existing data in edit mode
  useEffect(() => {
    if (!editId) return;
    const shifts = JSON.parse(localStorage.getItem("pos_open_shifts") || "[]");
    const os = shifts.find((s: any) => s.id === editId);
    if (os) {
      setShiftName(os.shiftName || "");
      setShiftType(os.shiftType || "");
      setSelectedDate(os.date ? new Date(os.date + "T00:00:00") : undefined);
      setSelectedDays(os.selectedDays || []);
      setDaySelectionMode(os.daySelectionMode || "all");
      setDayStartTime(os.startTime || "09:00 AM");
      setDayEndTime(os.endTime || "05:00 PM");
      setNextDay(os.nextDay || false);
      setRecurring(os.recurring || false);
      setAllowOvertime(os.allowOvertime || false);
      if (os.breaks) setBreaks(os.breaks);
      setShiftNote(os.shiftNote || "");
    }
  }, [editId]);

  const MAX_NOTE_WORDS = 1000;
  const wordCount = shiftNote.trim() ? shiftNote.trim().split(/\s+/).length : 0;
  const isFormEmpty = !shiftName.trim() && !shiftType && !shiftNote.trim();

  const handleCreate = () => {
    if (isFormEmpty) { goBack(); return; }
    if (!shiftName.trim()) { toast.error("Please enter a shift name"); return; }
    if (!shiftType) { toast.error("Please select a shift type"); return; }
    if (!selectedDate) { toast.error("Please select a date"); return; }

    const openShift = {
      id: isEditMode ? editId : Date.now().toString(),
      shiftName,
      shiftType,
      date: format(selectedDate, "yyyy-MM-dd"),
      selectedDays,
      daySelectionMode,
      startTime: dayStartTime,
      endTime: dayEndTime,
      nextDay,
      recurring,
      allowOvertime,
      breaks,
      shiftNote,
    };

    const existing = JSON.parse(localStorage.getItem("pos_open_shifts") || "[]");
    if (isEditMode) {
      const updated = existing.map((s: any) => s.id === editId ? openShift : s);
      localStorage.setItem("pos_open_shifts", JSON.stringify(updated));
      toast.success("Open shift updated successfully");
    } else {
      existing.push(openShift);
      localStorage.setItem("pos_open_shifts", JSON.stringify(existing));
      toast.success("Open shift created successfully");
    }
    window.dispatchEvent(new Event("open-shifts-updated"));
    goBack();
  };

  const allWeekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const toggleDay = (day: string) => {
    setSelectedDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  const handleDayModeChange = (mode: "all" | "weekends" | "mon-fri" | "select") => {
    setDaySelectionMode(mode);
    if (mode === "all") setSelectedDays([...allWeekdays]);
    else if (mode === "weekends") setSelectedDays(["Saturday", "Sunday"]);
    else if (mode === "mon-fri") setSelectedDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  };

  const copyTimeToSelectedDays = () => { toast.success("Time settings copied to all selected weekdays"); };

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
  const FieldRow = ({ label, value, onClick, rightIcon }: {
    label: string; value: string; onClick?: () => void; rightIcon?: React.ReactNode;
  }) => (
    <button onClick={onClick} className="flex items-center justify-between w-full px-4 py-3.5">
      <span className="text-sm text-foreground font-medium">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-sm text-neutral-400">{value}</span>
        {rightIcon || <ChevronRight className="w-4 h-4 text-neutral-600 shrink-0" />}
      </div>
    </button>
  );

  /* ── Toggle Row ── */
  const ToggleRow = ({ label, value, onChange }: { label: string; value: boolean; onChange: () => void; }) => (
    <div className="flex items-center justify-between px-4 py-3.5">
      <span className="text-sm text-foreground font-medium">{label}</span>
      <button onClick={onChange} className={`w-12 h-7 rounded-full transition-colors ${value ? "bg-white" : "bg-neutral-700"} relative`}>
        <div className={`w-[22px] h-[22px] rounded-full absolute top-[3px] transition-transform ${value ? "translate-x-[22px] bg-neutral-800" : "translate-x-[3px] bg-white"}`} />
      </button>
    </div>
  );

  const Divider = () => <div className="border-b border-neutral-700/30 mx-0" />;

  return (
    <div className="h-full overflow-hidden flex flex-col">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center px-4 py-3 shrink-0 relative">
          <button onClick={handleCreate} className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-base font-semibold text-foreground absolute left-1/2 -translate-x-1/2">{isEditMode ? "Edit Open Shift" : "Add Open Shift"}</h1>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide pb-6">
        {/* Basic Information */}
        <div className="mx-4 bg-[#26262699] rounded-2xl overflow-hidden mb-4">
          {/* Shift Name */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm text-foreground font-medium">Shift Name</span>
            <input type="text" placeholder="Enter" value={shiftName} onChange={(e) => setShiftName(e.target.value)} className="text-right text-sm text-neutral-400 placeholder:text-neutral-500 bg-transparent outline-none w-32" />
          </div>
          <Divider />

          {/* Shift Type */}
          <FieldRow label="Shift Type" value={shiftType || "Select"} onClick={() => setShowShiftTypePicker(true)} />
        </div>

        {/* Schedule - Date */}
        <div className="mx-4 bg-[#26262699] rounded-2xl overflow-hidden mb-4">
          <button onClick={() => setShowCalendar(!showCalendar)} className="flex items-center justify-between w-full px-4 py-3.5">
            <span className="text-sm text-foreground font-medium">Date</span>
            <div className="flex items-center gap-1">
              <span className="text-sm text-neutral-400">{selectedDate ? format(selectedDate, "MM/dd/yyyy") : "Select"}</span>
              <CalendarIcon className="w-4 h-4 text-neutral-500 shrink-0" />
            </div>
          </button>
          {showCalendar && (
            <div className="px-2 pb-3 flex justify-center">
              <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className={cn("p-3 pointer-events-auto rounded-xl bg-neutral-800/80")} numberOfMonths={1} />
            </div>
          )}
        </div>

        {/* Days of the Week */}
        <div className="mx-4 bg-[#26262699] rounded-2xl overflow-hidden mb-4">
          <button onClick={() => setShowDaysSection(!showDaysSection)} className="flex items-center justify-between w-full px-4 py-3.5">
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
                  <button onClick={() => handleDayModeChange(key)} className="flex items-center justify-between w-full px-4 py-3.5 active:opacity-70 transition-opacity">
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
                        <button onClick={() => toggleDay(day)} className="flex items-center justify-between w-full px-4 py-3.5 active:opacity-70 transition-opacity">
                          <span className="text-sm text-foreground font-medium">{day}</span>
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isChecked ? "bg-foreground border-foreground" : "border-neutral-600 bg-transparent"}`}>
                            {isChecked && <Check className="w-3 h-3 text-background" />}
                          </div>
                        </button>
                        {isLastChecked && selectedDays.length > 0 && (
                          <>
                            <Divider />
                            <div className="relative">
                              <button onClick={() => { setShowDayStartTimePicker(!showDayStartTimePicker); setShowDayEndTimePicker(false); }} className="flex items-center justify-between w-full px-8 py-3.5">
                              <span className="text-sm text-foreground font-medium">Start Time</span>
                              <div className="flex items-center gap-1.5"><span className="text-sm text-primary">{dayStartTime}</span><Clock className="w-4 h-4 text-primary shrink-0" /></div>
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
                              <button onClick={() => { setShowDayEndTimePicker(!showDayEndTimePicker); setShowDayStartTimePicker(false); }} className="flex items-center justify-between w-full px-8 py-3.5">
                              <span className="text-sm text-foreground font-medium">End Time</span>
                              <div className="flex items-center gap-1.5"><span className="text-sm text-primary">{dayEndTime}</span><Clock className="w-4 h-4 text-primary shrink-0" /></div>
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
                              <button onClick={() => setNextDay(!nextDay)} className={`w-12 h-7 rounded-full transition-colors ${nextDay ? "bg-white" : "bg-neutral-700"} relative`}>
                                <div className={`w-[22px] h-[22px] rounded-full absolute top-[3px] transition-transform ${nextDay ? "translate-x-[22px] bg-neutral-800" : "translate-x-[3px] bg-white"}`} />
                              </button>
                            </div>
                            <Divider />
                            <div className="flex items-center justify-between px-8 py-3.5">
                              <span className="text-sm text-foreground font-medium">Hours</span>
                              <span className="text-sm text-neutral-400">{calcHours()}</span>
                            </div>
                            <button onClick={copyTimeToSelectedDays} className="flex items-center justify-between w-full px-8 py-3.5 active:opacity-70 transition-opacity">
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
                    <button onClick={() => { setShowDayStartTimePicker(!showDayStartTimePicker); setShowDayEndTimePicker(false); }} className="flex items-center justify-between w-full px-4 py-3.5">
                    <span className="text-sm text-foreground font-medium">Start Time</span>
                    <div className="flex items-center gap-1.5"><span className="text-sm text-primary">{dayStartTime}</span><Clock className="w-4 h-4 text-primary shrink-0" /></div>
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
                    <button onClick={() => { setShowDayEndTimePicker(!showDayEndTimePicker); setShowDayStartTimePicker(false); }} className="flex items-center justify-between w-full px-4 py-3.5">
                    <span className="text-sm text-foreground font-medium">End Time</span>
                    <div className="flex items-center gap-1.5"><span className="text-sm text-primary">{dayEndTime}</span><Clock className="w-4 h-4 text-primary shrink-0" /></div>
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
                    <button onClick={() => setNextDay(!nextDay)} className={`w-12 h-7 rounded-full transition-colors ${nextDay ? "bg-white" : "bg-neutral-700"} relative`}>
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
                <button onClick={() => setRecurring(!recurring)} className={`w-12 h-7 rounded-full transition-colors ${recurring ? "bg-white" : "bg-neutral-700"} relative`}>
                  <div className={`w-[22px] h-[22px] rounded-full absolute top-[3px] transition-transform ${recurring ? "translate-x-[22px] bg-neutral-800" : "translate-x-[3px] bg-white"}`} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Allow Overtime */}
        <div className="mx-4 bg-[#26262699] rounded-2xl overflow-hidden mb-4">
          <ToggleRow label="Allow Overtime" value={allowOvertime} onChange={() => setAllowOvertime(!allowOvertime)} />
        </div>

        {/* BREAK Section */}
        <div className="mx-4 mb-1">
          <span className="text-xs text-neutral-500 font-medium tracking-wider px-1">BREAK</span>
        </div>
        {breaks.map((brk, idx) => (
          <div key={idx} className="mx-4 bg-[#26262699] rounded-2xl overflow-hidden mb-4">
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm text-foreground font-medium">Name</span>
              <input type="text" placeholder="Enter" value={brk.name} onChange={(e) => updateBreak(idx, "name", e.target.value)} className="text-right text-sm text-neutral-400 placeholder:text-neutral-500 bg-transparent outline-none w-32" />
            </div>
            <Divider />
            <button onClick={() => setActiveBreakDurationPicker(activeBreakDurationPicker === idx ? null : idx)} className="flex items-center justify-between w-full px-4 py-3.5">
              <span className="text-sm text-foreground font-medium">Duration</span>
              <div className="flex items-center gap-1.5"><span className="text-sm text-neutral-400">{brk.durationH}H {brk.durationM}M</span><Clock className="w-4 h-4 text-neutral-500 shrink-0" /></div>
            </button>
            {activeBreakDurationPicker === idx && (
              <div className="px-4 pb-3 flex items-center gap-3 justify-end">
                <div className="flex items-center gap-1">
                  <input type="number" min={0} max={23} value={brk.durationH} onChange={(e) => updateBreak(idx, "durationH", e.target.value.padStart(2, "0"))} className="w-10 text-center text-sm bg-neutral-700/50 rounded-lg py-1.5 text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  <span className="text-xs text-neutral-500">H</span>
                </div>
                <div className="flex items-center gap-1">
                  <input type="number" min={0} max={59} value={brk.durationM} onChange={(e) => updateBreak(idx, "durationM", e.target.value.padStart(2, "0"))} className="w-10 text-center text-sm bg-neutral-700/50 rounded-lg py-1.5 text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  <span className="text-xs text-neutral-500">M</span>
                </div>
              </div>
            )}
            <Divider />
            <button onClick={() => setActiveBreakTimePicker(activeBreakTimePicker === idx ? null : idx)} className="flex items-center justify-between w-full px-4 py-3.5">
              <span className="text-sm text-foreground font-medium">Start Break Time</span>
              <div className="flex items-center gap-1.5"><span className="text-sm text-neutral-400">{brk.startTime}</span><Clock className="w-4 h-4 text-neutral-500 shrink-0" /></div>
            </button>
            {activeBreakTimePicker === idx && <CompactTimePicker selectedTime={brk.startTime} onTimeChange={(val) => updateBreak(idx, "startTime", val)} />}
          </div>
        ))}

        {/* Add Another Break */}
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

      {/* Shift Type Popup */}
      {showShiftTypePicker && (
        <SelectionPopup
          title="Select Shift Type"
          options={["Opening Shift", "Afternoon Shift", "Evening Shift", "Closing Shift"]}
          selected={shiftType}
          onSelect={(val) => { setShiftType(val); setShowShiftTypePicker(false); }}
          onClose={() => setShowShiftTypePicker(false)}
        />
      )}
    </div>
  );
};

export default AddOpenShiftContent;
