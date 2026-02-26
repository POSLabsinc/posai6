import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, X, User, Search, Trash2, Check } from "lucide-react";
import { format, eachDayOfInterval } from "date-fns";
import { useEmployees } from "@/hooks/use-employees";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InlineDatePicker } from "@/components/ui/inline-date-picker";
import { InlineTimePicker } from "@/components/ui/inline-time-picker";
import { toast } from "sonner";

interface EditShiftContentProps {
  showHeader?: boolean;
  onBack?: () => void;
}

const SelectionPopup = ({
  title, options, selected, onSelect, onClose,
}: {
  title: string; options: string[]; selected: string;
  onSelect: (val: string) => void; onClose: () => void;
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
            <button key={option} onClick={() => onSelect(option)}
              className={`flex items-center justify-between w-full px-4 py-3.5 active:opacity-70 transition-opacity ${selected === option ? "bg-neutral-700/40" : ""}`}>
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

  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [shift, setShift] = useState("");
  const [shiftHours, setShiftHours] = useState("");
  const [assignSection, setAssignSection] = useState("");
  const [startTime, setStartTime] = useState(format(new Date(), "h:mm aa"));
  const [endTime, setEndTime] = useState(format(new Date(), "h:mm aa"));
  const [allowOvertime, setAllowOvertime] = useState(false);
  const [recurring, setRecurring] = useState("No");
  const [jobType, setJobType] = useState("");
  const [payRate, setPayRate] = useState("");
  const [shiftNotes, setShiftNotes] = useState("");

  // Populate fields from loaded shift data
  useEffect(() => {
    if (shiftData) {
      setSelectedEmployeeIds(shiftData.employee_id ? [shiftData.employee_id] : []);
      if (shiftData.start_date) setStartDate(new Date(shiftData.start_date + "T00:00:00"));
      if (shiftData.end_date) setEndDate(new Date(shiftData.end_date + "T00:00:00"));
      else if (shiftData.shift_date) setEndDate(new Date(shiftData.shift_date + "T00:00:00"));
      if (shiftData.shift_date) setStartDate(new Date(shiftData.shift_date + "T00:00:00"));
      setShift(shiftData.shift_type || "");
      setAssignSection(shiftData.assign_section || "");
      setStartTime(shiftData.start_time || format(new Date(), "h:mm aa"));
      setEndTime(shiftData.end_time || format(new Date(), "h:mm aa"));
      setAllowOvertime(shiftData.allow_overtime || false);
      setRecurring(shiftData.recurring || "No");
      setJobType(shiftData.job_type || "");
      setPayRate(shiftData.pay_rate ? String(shiftData.pay_rate) : "");
      setShiftNotes(shiftData.shift_notes || "");
    }
  }, [shiftData]);

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showEmployeePicker, setShowEmployeePicker] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [showShiftPicker, setShowShiftPicker] = useState(false);
  const [showSectionPicker, setShowSectionPicker] = useState(false);
  const [showJobTypePicker, setShowJobTypePicker] = useState(false);
  const [showRecurringPicker, setShowRecurringPicker] = useState(false);

  const startDateRef = useRef<HTMLButtonElement>(null);
  const endDateRef = useRef<HTMLButtonElement>(null);
  const startTimeRef = useRef<HTMLButtonElement>(null);
  const endTimeRef = useRef<HTMLButtonElement>(null);

  const selectedEmployees = employees.filter((e) => selectedEmployeeIds.includes(e.id));
  const filteredEmployees = employees.filter((emp) =>
    emp.full_name.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const goBack = onBack || (() => navigate("/settings/workforce/shift"));

  const handleBack = async () => {
    if (!shiftId || selectedEmployeeIds.length === 0) {
      goBack();
      return;
    }

    try {
      // Update the original shift with the first employee
      const firstEmpId = selectedEmployeeIds[0];
      const shiftPayload = {
        shift_date: format(startDate, "yyyy-MM-dd"),
        shift_type: shift || "Regular",
        assign_section: assignSection || null,
        start_time: startTime,
        end_time: endTime,
        allow_overtime: allowOvertime,
        recurring,
        job_type: jobType || null,
        pay_rate: payRate ? parseFloat(payRate) : 0,
        shift_notes: shiftNotes || null,
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
      };

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

  const getPickerPosition = (ref: React.RefObject<HTMLButtonElement>) => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      return { top: rect.bottom + 4, right: window.innerWidth - rect.right };
    }
    return { top: 200, right: 20 };
  };

  const FieldRow = ({
    label, value, required, onClick, buttonRef,
  }: {
    label: string; value: string; required?: boolean;
    onClick?: () => void; buttonRef?: React.RefObject<HTMLButtonElement>;
  }) => (
    <button ref={buttonRef} onClick={onClick} className="flex items-center justify-between w-full px-4 py-3.5">
      <span className="text-sm text-foreground font-medium">{label}{required && " *"}</span>
      <div className="flex items-center gap-1">
        <span className="text-sm text-neutral-400">{value}</span>
        <ChevronRight className="w-4 h-4 text-neutral-600 shrink-0" />
      </div>
    </button>
  );

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-sm text-muted-foreground">Loading shift...</span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden flex flex-col">
      {showHeader && (
        <div className="flex items-center px-4 py-3 shrink-0 relative">
          <button onClick={handleBack} className="active:opacity-70 text-neutral-400">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-base font-semibold text-foreground absolute left-1/2 -translate-x-1/2">Edit Shift</h1>
          <button onClick={handleDelete} className="absolute right-4 active:opacity-70 text-red-400">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-hide pb-28">
        <div className="mx-4 rounded-2xl overflow-hidden mb-4">
          {/* Employee multi-select field */}
          <button onClick={() => setShowEmployeePicker(true)} className="flex items-center justify-between w-full px-4 py-3.5">
            <span className="text-sm text-foreground font-medium">Employees *</span>
            <div className="flex items-center gap-1">
              <span className="text-sm text-neutral-400">
                {selectedEmployees.length === 0 ? "Select" : `${selectedEmployees.length} selected`}
              </span>
              <ChevronRight className="w-4 h-4 text-neutral-600 shrink-0" />
            </div>
          </button>
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
          <div className="border-b border-neutral-700/30 mx-0" />
          <FieldRow label="Start Date" value={format(startDate, "MM/dd/yyyy")} required onClick={() => setShowStartDatePicker(true)} buttonRef={startDateRef} />
          <div className="border-b border-neutral-700/30 mx-0" />
          <FieldRow label="End Date" value={format(endDate, "MM/dd/yyyy")} required onClick={() => setShowEndDatePicker(true)} buttonRef={endDateRef} />
          <div className="border-b border-neutral-700/30 mx-0" />
          <FieldRow label="Shift" value={shift || "Select A Shift"} onClick={() => setShowShiftPicker(true)} />
          <div className="border-b border-neutral-700/30 mx-0" />
          <FieldRow label="Shift Hours" value={shiftHours || "Choose"} />
          <div className="border-b border-neutral-700/30 mx-0" />
          <FieldRow label="Assign Section" value={assignSection || "Choose"} required onClick={() => setShowSectionPicker(true)} />
          <div className="border-b border-neutral-700/30 mx-0" />
          <FieldRow label="Start Time" value={startTime} required onClick={() => setShowStartTimePicker(true)} buttonRef={startTimeRef} />
          <div className="border-b border-neutral-700/30 mx-0" />
          <FieldRow label="End Time" value={endTime} required onClick={() => setShowEndTimePicker(true)} buttonRef={endTimeRef} />
        </div>

        <InlineDatePicker isOpen={showStartDatePicker} onClose={() => setShowStartDatePicker(false)} selectedDate={startDate} onDateChange={setStartDate} position={getPickerPosition(startDateRef)} />
        <InlineDatePicker isOpen={showEndDatePicker} onClose={() => setShowEndDatePicker(false)} selectedDate={endDate} onDateChange={setEndDate} position={getPickerPosition(endDateRef)} />
        <InlineTimePicker isOpen={showStartTimePicker} onClose={() => setShowStartTimePicker(false)} selectedTime={startTime} onTimeChange={setStartTime} position={getPickerPosition(startTimeRef)} />
        <InlineTimePicker isOpen={showEndTimePicker} onClose={() => setShowEndTimePicker(false)} selectedTime={endTime} onTimeChange={setEndTime} position={getPickerPosition(endTimeRef)} />

        <div className="mx-4 rounded-2xl overflow-hidden mb-4">
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm text-foreground font-medium">Allow Overtime</span>
            <button onClick={() => setAllowOvertime(!allowOvertime)}
              className={`w-12 h-7 rounded-full transition-colors ${allowOvertime ? "bg-white" : "bg-neutral-700"} relative`}>
              <div className={`w-[22px] h-[22px] rounded-full absolute top-[3px] transition-transform ${allowOvertime ? "translate-x-[22px] bg-neutral-800" : "translate-x-[3px] bg-white"}`} />
            </button>
          </div>
        </div>

        <div className="mx-4 mb-1">
          <span className="text-xs text-neutral-500 font-medium tracking-wider px-1">Payroll Details</span>
        </div>
        <div className="mx-4 rounded-2xl overflow-hidden mb-4">
          <div className="relative">
            <FieldRow label="Recurring" value={recurring} onClick={() => setShowRecurringPicker(!showRecurringPicker)} />
            {showRecurringPicker && (
              <div className="absolute right-4 top-full z-50 bg-neutral-800 border border-neutral-700 rounded-xl shadow-lg w-36 overflow-hidden">
                {["Yes", "No"].map((opt) => (
                  <button key={opt} onClick={() => { setRecurring(opt); setShowRecurringPicker(false); }}
                    className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium transition-colors ${recurring === opt ? "text-foreground bg-neutral-700/50" : "text-neutral-400 hover:bg-neutral-700/30"}`}>
                    {opt}
                    {recurring === opt && (
                      <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-neutral-800" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="border-b border-neutral-700/30 mx-0" />
          <FieldRow label="Job Type" value={jobType || "Select Job Type"} required onClick={() => setShowJobTypePicker(true)} />
          <div className="border-b border-neutral-700/30 mx-0" />
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm text-foreground font-medium">Pay Rate</span>
            <div className="flex items-center gap-1">
              <span className="text-sm text-neutral-500">$</span>
              <input type="number" placeholder="0.00" value={payRate} onChange={(e) => setPayRate(e.target.value)}
                min={0} step={0.01}
                className="text-right text-sm text-neutral-400 placeholder:text-neutral-600 bg-transparent outline-none w-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              <ChevronRight className="w-4 h-4 text-neutral-600 shrink-0" />
            </div>
          </div>
        </div>

        <div className="mx-4 mb-1">
          <span className="text-xs text-neutral-500 font-medium tracking-wider px-1">Shift Notes</span>
        </div>
        <div className="mx-4 rounded-2xl overflow-hidden mb-4">
          <div className="px-4 py-3.5">
            <textarea placeholder="Enter Shift Notes" value={shiftNotes} onChange={(e) => setShiftNotes(e.target.value)}
              rows={3} className="w-full bg-transparent text-sm text-foreground placeholder:text-neutral-600 outline-none resize-none" />
          </div>
        </div>

        <div className="mx-4 px-1 mb-6">
          <p className="text-xs text-neutral-600 leading-relaxed">
            Edit shift details. Changes are saved when you navigate back.
          </p>
        </div>
      </div>

      {/* Employee Multi-Select Picker */}
      {showEmployeePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => { setShowEmployeePicker(false); setEmployeeSearch(""); }}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setShowEmployeePicker(false); setEmployeeSearch(""); }}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center">
              <X className="w-4 h-4 text-foreground" />
            </button>
            <div className="bg-neutral-800 rounded-2xl w-[340px] max-h-[500px] overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-neutral-700/50 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground text-center flex-1">Select Employees</h3>
                {selectedEmployeeIds.length > 0 && (
                  <span className="text-xs text-neutral-400">{selectedEmployeeIds.length} selected</span>
                )}
              </div>
              <div className="px-3 py-2 border-b border-neutral-700/50">
                <div className="flex items-center gap-2 bg-neutral-700/50 rounded-lg px-3 py-2">
                  <Search className="w-4 h-4 text-neutral-500 shrink-0" />
                  <input type="text" placeholder="Search employees..." value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    className="bg-transparent text-sm text-foreground placeholder:text-neutral-500 outline-none w-full" autoFocus />
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
                      <button key={emp.id}
                        onClick={() => setSelectedEmployeeIds((prev) => isSelected ? prev.filter((id) => id !== emp.id) : [...prev, emp.id])}
                        className={`flex items-center gap-3 w-full px-4 py-3 active:opacity-70 transition-opacity ${isSelected ? "bg-neutral-700/40" : ""}`}>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? "bg-foreground border-foreground" : "border-neutral-600 bg-transparent"
                        }`}>
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
                <button
                  onClick={() => { setShowEmployeePicker(false); setEmployeeSearch(""); }}
                  className="w-full py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold active:opacity-80 transition-opacity"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showShiftPicker && (
        <SelectionPopup title="Select Shift" options={["Morning", "Afternoon", "Evening", "Night", "Split", "On Call"]}
          selected={shift} onSelect={(val) => { setShift(val); setShowShiftPicker(false); }} onClose={() => setShowShiftPicker(false)} />
      )}
      {showSectionPicker && (
        <SelectionPopup title="Assign Section" options={["Section A", "Section B", "Section C", "Section D", "Bar", "Patio", "Kitchen"]}
          selected={assignSection} onSelect={(val) => { setAssignSection(val); setShowSectionPicker(false); }} onClose={() => setShowSectionPicker(false)} />
      )}
      {showJobTypePicker && (
        <SelectionPopup title="Select Job Type" options={["Full-Time", "Part-Time", "Contract", "Temporary", "Seasonal"]}
          selected={jobType} onSelect={(val) => { setJobType(val); setShowJobTypePicker(false); }} onClose={() => setShowJobTypePicker(false)} />
      )}
    </div>
  );
};

export default EditShiftContent;
