import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search, Plus, Mic, Clock, CalendarDays, Maximize2, Minimize2, SlidersHorizontal, X, Download, Printer, Info, FileText, FileSpreadsheet, Table } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, addDays, subDays, addMonths, subMonths } from "date-fns";
import { useShiftCards, ShiftCardData } from "@/hooks/use-shift-cards";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ShiftCalendarView from "@/components/settings/ShiftCalendarView";
import ShiftDayView from "@/components/settings/ShiftDayView";
import ShiftMonthView from "@/components/settings/ShiftMonthView";

interface ShiftContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
  isExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
  viewMode?: "card" | "day" | "week" | "month";
  setViewMode?: (v: "card" | "day" | "week" | "month") => void;
  currentWeek?: Date;
  setCurrentWeek?: (d: Date) => void;
  currentDate?: Date;
  setCurrentDate?: (d: Date) => void;
  currentMonth?: Date;
  setCurrentMonth?: (d: Date) => void;
}

const ShiftContent = ({
  showHeader = true,
  onBack,
  onAIClick,
  isExpanded = false,
  onExpandChange,
  viewMode: viewModeProp,
  setViewMode: setViewModeProp,
  currentWeek: currentWeekProp,
  setCurrentWeek: setCurrentWeekProp,
  currentDate: currentDateProp,
  setCurrentDate: setCurrentDateProp,
  currentMonth: currentMonthProp,
  setCurrentMonth: setCurrentMonthProp,
}: ShiftContentProps) => {
  const navigate = useNavigate();

  // Use lifted state from props if provided, otherwise fall back to local state
  const [localCurrentWeek, localSetCurrentWeek] = useState<Date>(new Date());
  const [localSearchQuery, setSearchQuery] = useState("");
  const [localViewMode, localSetViewMode] = useState<"card" | "day" | "week" | "month">("week");
  const [localCurrentDate, localSetCurrentDate] = useState<Date>(new Date());
  const [localCurrentMonth, localSetCurrentMonth] = useState<Date>(new Date());
  const [showJobTypeDropdown, setShowJobTypeDropdown] = useState(false);
  const [showShiftDropdown, setShowShiftDropdown] = useState(false);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [filterTab, setFilterTab] = useState<"jobType" | "shift">("jobType");
  const [filterSearch, setFilterSearch] = useState("");
  const [showExportPopover, setShowExportPopover] = useState(false);
  const [includePayRates, setIncludePayRates] = useState(false);
  const [includeNotes, setIncludeNotes] = useState(true);
  const exportPopoverRef = useRef<HTMLDivElement>(null);
  const filterPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showFilterPopover) return;
    const handler = (e: MouseEvent) => {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(e.target as Node)) {
        setShowFilterPopover(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showFilterPopover]);

  useEffect(() => {
    if (!showExportPopover) return;
    const handler = (e: MouseEvent) => {
      if (exportPopoverRef.current && !exportPopoverRef.current.contains(e.target as Node)) {
        setShowExportPopover(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showExportPopover]);

  const currentWeek = currentWeekProp ?? localCurrentWeek;
  const setCurrentWeek = setCurrentWeekProp ?? localSetCurrentWeek;
  const searchQuery = localSearchQuery;
  const viewMode = viewModeProp ?? localViewMode;
  const setViewMode = setViewModeProp ?? localSetViewMode;
  const currentDate = currentDateProp ?? localCurrentDate;
  const setCurrentDate = setCurrentDateProp ?? localSetCurrentDate;
  const currentMonth = currentMonthProp ?? localCurrentMonth;
  const setCurrentMonth = setCurrentMonthProp ?? localSetCurrentMonth;

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });

  const { data: shiftCards = [], isLoading } = useShiftCards(currentWeek, searchQuery, selectedShifts, selectedJobTypes);

  const jobTypes = ["Server", "Manager", "Host", "Admin"];
  const shiftTypes = ["Opening", "Afternoon", "Evening", "Regular"];

  const toggleJobType = (jt: string) => {
    setSelectedJobTypes((prev) =>
    prev.includes(jt) ? prev.filter((r) => r !== jt) : [...prev, jt]
    );
  };

  const toggleShift = (s: string) => {
    setSelectedShifts((prev) =>
    prev.includes(s) ? prev.filter((r) => r !== s) : [...prev, s]
    );
  };

  const viewLabel = viewMode === "card" ? "Cards View" : viewMode === "day" ? "Day View" : viewMode === "month" ? "Month View" : "Week View";

  const fetchExportData = useCallback(async () => {
    const startStr = viewMode === "day" ? format(currentDate, "yyyy-MM-dd") : viewMode === "month" ? format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1), "yyyy-MM-dd") : format(weekStart, "yyyy-MM-dd");
    const endStr = viewMode === "day" ? format(currentDate, "yyyy-MM-dd") : viewMode === "month" ? format(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0), "yyyy-MM-dd") : format(weekEnd, "yyyy-MM-dd");

    const { data: shifts } = await (supabase as any)
      .from("employee_shifts")
      .select("*")
      .gte("shift_date", startStr)
      .lte("shift_date", endStr);

    const { data: employees } = await (supabase as any)
      .from("employees")
      .select("id, full_name, role, hourly_rate");

    const empMap = new Map<string, any>();
    (employees || []).forEach((e: any) => empMap.set(e.id, e));

    return (shifts || []).map((s: any) => {
      const emp = empMap.get(s.employee_id);
      return {
        employee: emp?.full_name || "Unassigned",
        role: emp?.role || "",
        shiftType: s.shift_type || "Regular",
        date: s.shift_date,
        startTime: s.start_time || "",
        endTime: s.end_time || "",
        section: s.assign_section || "",
        payRate: s.pay_rate || emp?.hourly_rate || 0,
        notes: s.shift_notes || "",
        overtime: s.allow_overtime ? "Yes" : "No",
        jobType: s.job_type || "",
      };
    });
  }, [viewMode, currentDate, currentMonth, weekStart, weekEnd]);

  const buildRows = (data: any[]) => {
    const headers = ["Employee", "Role", "Shift Type", "Date", "Start Time", "End Time", "Section", "Job Type"];
    if (includePayRates) headers.push("Pay Rate ($)");
    if (includeNotes) headers.push("Notes");
    headers.push("Overtime");

    const rows = data.map((d) => {
      const row = [d.employee, d.role, d.shiftType, d.date, d.startTime, d.endTime, d.section, d.jobType];
      if (includePayRates) row.push(String(d.payRate));
      if (includeNotes) row.push(d.notes);
      row.push(d.overtime);
      return row;
    });
    return { headers, rows };
  };

  const handleExportCSV = async () => {
    const data = await fetchExportData();
    const { headers, rows } = buildRows(data);
    const csvLines = [headers, ...rows].map((r) => r.map((c: string) => `"${c.replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shift-schedule-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportPopover(false);
  };

  const handleExportExcel = async () => {
    const data = await fetchExportData();
    const { headers, rows } = buildRows(data);
    const tableRows = rows.map((r) => `<tr>${r.map((c: string) => `<td>${c}</td>`).join("")}</tr>`).join("");
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${tableRows}</tbody></table></body></html>`;
    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shift-schedule-${format(new Date(), "yyyy-MM-dd")}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportPopover(false);
  };

  const handleExportPDF = async () => {
    const data = await fetchExportData();
    const { headers, rows } = buildRows(data);
    const dateLabel = viewMode === "day" ? format(currentDate, "dd MMM yyyy") : viewMode === "month" ? format(currentMonth, "MMMM yyyy") : `${format(weekStart, "dd MMM")} - ${format(weekEnd, "dd MMM yyyy")}`;
    const tableRows = rows.map((r) => `<tr>${r.map((c: string) => `<td style="border:1px solid #ddd;padding:6px 8px;font-size:11px;">${c}</td>`).join("")}</tr>`).join("");
    const html = `<html><head><title>Shift Schedule</title><style>body{font-family:Arial,sans-serif;padding:20px}h2{margin-bottom:4px}table{border-collapse:collapse;width:100%}th{border:1px solid #333;padding:6px 8px;font-size:11px;background:#f5f5f5;text-align:left}</style></head><body><h2>Shift Schedule</h2><p style="color:#666;margin-bottom:16px;">${viewLabel} • ${dateLabel} • ${data.length} shifts</p><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${tableRows}</tbody></table></body></html>`;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => { printWindow.print(); };
    }
    setShowExportPopover(false);
  };

  // Client-side filtering
  const filteredCards = shiftCards.filter((card) => {
    if (searchQuery && !card.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedShifts.length > 0 && !selectedShifts.includes(card.badge)) return false;
    return true;
  });

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      <div className={`flex flex-col h-full transition-all duration-300 ${isExpanded ? "px-2 pb-4" : "px-4 pb-28"}`}>
        {/* Header */}
        {showHeader &&
        <div className="flex items-center justify-between pt-4 pb-2 relative overflow-visible px-0">
            {onBack &&
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
            aria-label="Back">

                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
          }
            <h1 className="text-base font-medium text-foreground absolute left-1/2 -translate-x-1/2">Shift</h1>
            <div className="overflow-visible flex items-center justify-center" style={{ width: 32, height: 32 }}>}
            <AvatarFallback className="text-[10px] font-semibold bg-neutral-700 text-foreground">
              {getInitials(emp.name)}
            </AvatarFallback>
          </Avatar>
        )}
        {extraCount > 0 &&
        <div className="w-8 h-8 rounded-full bg-neutral-700 border-2 border-neutral-800 flex items-center justify-center">
            <span className="text-[10px] font-semibold text-foreground">+{extraCount}</span>
          </div>
        }
        {card.employees.length === 0 &&
        <span className="text-xs text-neutral-600">No employees assigned</span>
        }
      </div>
    </button>);

};

export default ShiftContent;