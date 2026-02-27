import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search, Plus, Mic, Clock, CalendarDays, Maximize2, Minimize2, SlidersHorizontal, X } from "lucide-react";
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, addDays, subDays, addMonths, subMonths } from "date-fns";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
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
            <div className="overflow-visible flex items-center justify-center" style={{ width: 32, height: 32 }}>
              <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />
            </div>
          </div>
        }

        {/* Description */}
        {!isExpanded && (
        <div className="mb-4 px-1 pt-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Refers to a scheduled period during which a specific group of employees works, ensuring continuous operations and productivity.
          </p>
        </div>
        )}

        {/* Search + Add row */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 min-w-[140px] rounded-full bg-neutral-800/60 px-4 py-3 flex items-center gap-3">
            <Search className="h-5 w-5 flex-shrink-0 text-neutral-500" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-0 bg-transparent text-foreground placeholder:text-neutral-500 outline-none text-[15px]" />

            <Mic className="h-5 w-5 flex-shrink-0 text-neutral-500" />
          </div>
          <button onClick={() => navigate("/settings/workforce/shift/add")} className="h-12 rounded-full px-4 lg:px-7 flex-shrink-0 flex items-center justify-center gap-2 border border-[hsl(var(--surface-border))] bg-transparent text-foreground active:opacity-70 transition-opacity">
            <Plus className="h-5 w-5" />
            <span className="text-sm font-medium">Add</span>
          </button>
        </div>

        {/* Filters row */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {/* Filter icon */}
          <div className="relative" ref={filterPopoverRef}>
            <button
              onClick={() => setShowFilterPopover(!showFilterPopover)}
              className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${
                selectedJobTypes.length > 0 || selectedShifts.length > 0
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
              }`}
              aria-label="Filter"
            >
              <SlidersHorizontal className="w-4.5 h-4.5" />
            </button>

            {showFilterPopover && (
              <div className="absolute top-12 left-0 z-[60] w-[260px] bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
                {/* Header */}
                <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Filter</span>
                  {(selectedJobTypes.length > 0 || selectedShifts.length > 0) && (
                    <button
                      onClick={() => { setSelectedJobTypes([]); setSelectedShifts([]); }}
                      className="text-[11px] text-destructive font-medium hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Tab Toggle */}
                <div className="mx-3 mb-2 flex rounded-lg bg-muted/50 p-0.5">
                  <button
                    onClick={() => { setFilterTab("jobType"); setFilterSearch(""); }}
                    className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${filterTab === "jobType" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
                  >
                    Job Type
                  </button>
                  <button
                    onClick={() => { setFilterTab("shift"); setFilterSearch(""); }}
                    className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${filterTab === "shift" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
                  >
                    Shift
                  </button>
                </div>

                {/* Search */}
                <div className="mx-3 mb-2">
                  <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5">
                    <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <input
                      type="text"
                      placeholder={filterTab === "jobType" ? "Filter job types..." : "Filter shifts..."}
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
                  {filterTab === "jobType" ? (
                    <>
                      <button
                        onClick={() => setSelectedJobTypes([])}
                        className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs transition-colors hover:bg-muted/30 ${selectedJobTypes.length === 0 ? "bg-muted/20 text-foreground font-medium" : "text-foreground"}`}
                      >
                        All Job Types
                      </button>
                      {jobTypes
                        .filter(jt => !filterSearch || jt.toLowerCase().includes(filterSearch.toLowerCase()))
                        .map(jt => (
                          <button
                            key={jt}
                            onClick={() => toggleJobType(jt)}
                            className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs transition-colors hover:bg-muted/30 ${selectedJobTypes.includes(jt) ? "bg-muted/20 font-medium" : ""} text-foreground`}
                          >
                            {jt}
                          </button>
                        ))}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setSelectedShifts([])}
                        className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs transition-colors hover:bg-muted/30 ${selectedShifts.length === 0 ? "bg-muted/20 text-foreground font-medium" : "text-foreground"}`}
                      >
                        All Shifts
                      </button>
                      {shiftTypes
                        .filter(s => !filterSearch || s.toLowerCase().includes(filterSearch.toLowerCase()))
                        .map(s => (
                          <button
                            key={s}
                            onClick={() => toggleShift(s)}
                            className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs transition-colors hover:bg-muted/30 ${selectedShifts.includes(s) ? "bg-muted/20 font-medium" : ""} text-foreground`}
                          >
                            {s}
                          </button>
                        ))}
                    </>
                  )}
                </div>
                <div className="h-1" />
              </div>
            )}
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (viewMode === "day") setCurrentDate(subDays(currentDate, 1));
                else if (viewMode === "month") setCurrentMonth(subMonths(currentMonth, 1));
                else setCurrentWeek(subWeeks(currentWeek, 1));
              }}
              className="w-8 h-8 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70">
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <span className="text-sm font-medium text-foreground px-2 whitespace-nowrap">
              {viewMode === "day" ?
              format(currentDate, "EEEE, dd MMM yyyy") :
              viewMode === "month" ?
              format(currentMonth, "MMMM yyyy") :
              `${format(weekStart, "dd MMM")} - ${format(weekEnd, "dd MMM yyyy")}`}
            </span>
            <button
              onClick={() => {
                if (viewMode === "day") setCurrentDate(addDays(currentDate, 1));
                else if (viewMode === "month") setCurrentMonth(addMonths(currentMonth, 1));
                else setCurrentWeek(addWeeks(currentWeek, 1));
              }}
              className="w-8 h-8 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70">
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
          </div>

          <div className="flex-1" />

          {/* View Toggle */}
          <div className="flex items-center rounded-xl overflow-hidden border border-neutral-700/50">
            {(["card", "day", "week", "month"] as const).map((mode) =>
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`h-10 px-3.5 flex items-center justify-center text-xs font-medium transition-colors capitalize ${
              viewMode === mode ? "bg-foreground text-background" : "bg-neutral-800/60 text-foreground hover:bg-neutral-700/60"}`
              }>

                {mode === "card" ? "Cards" : mode === "day" ? "Day" : mode === "week" ? "Week" : "Month"}
              </button>
            )}
          </div>

          {/* Expand/Collapse */}
          <button
            onClick={() => onExpandChange?.(!isExpanded)}
            className="w-10 h-10 rounded-xl bg-neutral-800/60 flex items-center justify-center active:opacity-70 border border-neutral-700/50 transition-colors hover:bg-neutral-700/60"
            aria-label={isExpanded ? "Collapse view" : "Expand view"}
          >
            {isExpanded ? <Minimize2 className="w-4.5 h-4.5 text-foreground" /> : <Maximize2 className="w-4.5 h-4.5 text-foreground" />}
          </button>

        </div>

        {/* Shift Views — wrapped in a visually distinct container */}
        <div className={`rounded-2xl border border-border/60 bg-muted/30 backdrop-blur-sm transition-all duration-300 ${isExpanded ? "flex-1 min-h-0" : ""}`}>
          {isLoading ?
          <div className="px-4 py-12 text-center text-muted-foreground text-sm">
              Loading shifts...
            </div> :
          viewMode === "day" ?
          <ShiftDayView currentDate={currentDate} /> :
          viewMode === "week" ?
          <ShiftCalendarView
            cards={filteredCards}
            currentWeek={currentWeek}
            toolbarJobTypes={selectedJobTypes}
            toolbarShifts={selectedShifts}
            onShiftClick={(card) => navigate(`/settings/workforce/shift/edit?id=${card.id}`)} /> :

          viewMode === "month" ?
          <ShiftMonthView currentMonth={currentMonth} /> :
          filteredCards.length === 0 ?
          <div className="px-4 py-12 text-center text-muted-foreground text-sm">
              No shifts found for this week
            </div> :

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCards.map((card, idx) =>
            <ShiftCard key={`${card.id}-${idx}`} card={card} onClick={() => navigate(`/settings/workforce/shift/edit?id=${card.id}`)} />
            )}
            </div>
          }
        </div>
      </div>

    </div>);

};

const ShiftCard = ({ card, onClick }: {card: ShiftCardData;onClick: () => void;}) => {
  const maxAvatars = 4;
  const visibleEmployees = card.employees.slice(0, maxAvatars);
  const extraCount = Math.max(0, card.employees.length - maxAvatars);

  const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl bg-neutral-800/60 border border-neutral-700/30 p-4 hover:bg-neutral-700/50 active:opacity-80 transition-all">

      {/* Top row: name + badge */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">{card.name}</h3>
        <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-md ${card.badgeColor}`}>
          {card.badge}
        </span>
      </div>

      {/* Time */}
      <div className="flex items-center gap-2 mb-1.5">
        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{card.timeRange}</span>
      </div>

      {/* Date range */}
      <div className="flex items-center gap-2 mb-1.5">
        <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{card.dateRange}</span>
      </div>

      {/* Days */}
      {(card.days || []).length > 0 &&
      <div className="flex items-center gap-1.5 mb-3 pl-[22px] flex-wrap">
          {(card.days || []).map((day) =>
        <span key={day} className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted/30 text-muted-foreground">
              {day}
            </span>
        )}
        </div>
      }

      {/* Avatars */}
      <div className="flex items-center -space-x-2">
        {visibleEmployees.map((emp) =>
        <Avatar key={emp.id} className="w-8 h-8 border-2 border-neutral-800">
            {emp.avatar_url && <AvatarImage src={emp.avatar_url} />}
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