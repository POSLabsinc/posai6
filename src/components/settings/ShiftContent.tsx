import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search, Plus, ArrowDownUp, Mic, Clock, CalendarDays, Maximize2, Minimize2 } from "lucide-react";
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, addDays, subDays } from "date-fns";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useShiftCards, ShiftCardData } from "@/hooks/use-shift-cards";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ShiftCalendarView from "@/components/settings/ShiftCalendarView";
import ShiftDayView from "@/components/settings/ShiftDayView";

interface ShiftContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
  onExpandChange?: (expanded: boolean) => void;
}

const ShiftContent = ({
  showHeader = true,
  onBack,
  onAIClick,
  onExpandChange
}: ShiftContentProps) => {
  const navigate = useNavigate();
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "day" | "week" | "month">("week");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [showJobTypeDropdown, setShowJobTypeDropdown] = useState(false);
  const [showShiftDropdown, setShowShiftDropdown] = useState(false);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

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
          {/* Job Type dropdown */}
          <div className="relative">
            <button
              onClick={() => {setShowJobTypeDropdown(!showJobTypeDropdown);setShowShiftDropdown(false);}}
              className={`h-10 rounded-full px-4 flex items-center gap-2 border text-sm font-medium transition-colors ${
              selectedJobTypes.length > 0 ?
              "bg-foreground text-background border-foreground" :
              "bg-neutral-800/60 text-foreground border-neutral-700/50"}`
              }>

              Job Type {selectedJobTypes.length > 0 && `(${selectedJobTypes.length})`}
              <ChevronRight className="w-3.5 h-3.5 rotate-90" />
            </button>
            {showJobTypeDropdown &&
            <div className="absolute top-12 left-0 z-50 bg-neutral-900 border border-neutral-700/50 rounded-xl shadow-lg py-1 min-w-[140px]">
                {jobTypes.map((jt) =>
              <button
                key={jt}
                onClick={() => toggleJobType(jt)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                selectedJobTypes.includes(jt) ?
                "text-foreground bg-neutral-800" :
                "text-neutral-400 hover:text-foreground hover:bg-neutral-800/50"}`
                }>

                    {jt}
                  </button>
              )}
              </div>
            }
          </div>

          {/* Shift dropdown */}
          <div className="relative">
            <button
              onClick={() => {setShowShiftDropdown(!showShiftDropdown);setShowJobTypeDropdown(false);}}
              className={`h-10 rounded-full px-4 flex items-center gap-2 border text-sm font-medium transition-colors ${
              selectedShifts.length > 0 ?
              "bg-foreground text-background border-foreground" :
              "bg-neutral-800/60 text-foreground border-neutral-700/50"}`
              }>

              Shift {selectedShifts.length > 0 && `(${selectedShifts.length})`}
              <ChevronRight className="w-3.5 h-3.5 rotate-90" />
            </button>
            {showShiftDropdown &&
            <div className="absolute top-12 left-0 z-50 bg-neutral-900 border border-neutral-700/50 rounded-xl shadow-lg py-1 min-w-[140px]">
                {shiftTypes.map((s) =>
              <button
                key={s}
                onClick={() => toggleShift(s)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                selectedShifts.includes(s) ?
                "text-foreground bg-neutral-800" :
                "text-neutral-400 hover:text-foreground hover:bg-neutral-800/50"}`
                }>

                    {s}
                  </button>
              )}
              </div>
            }
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (viewMode === "day") setCurrentDate(subDays(currentDate, 1));else
                setCurrentWeek(subWeeks(currentWeek, 1));
              }}
              className="w-8 h-8 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70">

              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <span className="text-sm font-medium text-foreground px-2 whitespace-nowrap">
              {viewMode === "day" ?
              format(currentDate, "EEEE, dd MMM yyyy") :
              `${format(weekStart, "dd MMM")} - ${format(weekEnd, "dd MMM yyyy")}`}
            </span>
            <button
              onClick={() => {
                if (viewMode === "day") setCurrentDate(addDays(currentDate, 1));else
                setCurrentWeek(addWeeks(currentWeek, 1));
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
            onClick={() => { const next = !isExpanded; setIsExpanded(next); onExpandChange?.(next); }}
            className="w-10 h-10 rounded-xl bg-neutral-800/60 flex items-center justify-center active:opacity-70 border border-neutral-700/50 transition-colors hover:bg-neutral-700/60"
            aria-label={isExpanded ? "Collapse view" : "Expand view"}
          >
            {isExpanded ? <Minimize2 className="w-4.5 h-4.5 text-foreground" /> : <Maximize2 className="w-4.5 h-4.5 text-foreground" />}
          </button>

          {/* Sort */}
          <button className="w-10 h-10 rounded-xl bg-neutral-800/60 flex items-center justify-center active:opacity-70 border border-neutral-700/50">
            <ArrowDownUp className="w-5 h-5 text-foreground" />
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
            onShiftClick={(card) => navigate(`/settings/workforce/shift/edit?id=${card.id}`)} /> :

          viewMode === "month" ?
          <div className="px-4 py-12 text-center text-muted-foreground text-sm">
              Month view coming soon
            </div> :
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

      {/* Close dropdowns on outside click */}
      {(showJobTypeDropdown || showShiftDropdown) &&
      <div className="fixed inset-0 z-40" onClick={() => {setShowJobTypeDropdown(false);setShowShiftDropdown(false);}} />
      }
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