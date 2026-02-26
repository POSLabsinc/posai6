import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search, Plus, ArrowDownUp, Mic, Clock, CalendarDays } from "lucide-react";
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek } from "date-fns";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useWeeklyShifts } from "@/hooks/use-weekly-shifts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ShiftContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

// Mock shift card data for the card-based view
const mockShiftCards = [
  {
    id: "1",
    name: "First Shift",
    badge: "Opening",
    badgeColor: "text-orange-400 bg-orange-400/15",
    timeRange: "9:00 AM - 2:00 PM",
    dateRange: "20 Nov 24 - 20 Nov 25",
    recurring: "Monday - Friday",
    avatars: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
    extraCount: 2,
  },
  {
    id: "2",
    name: "Weekday Shift",
    badge: "Afternoon",
    badgeColor: "text-blue-400 bg-blue-400/15",
    timeRange: "2:00 AM - 5:00 PM",
    dateRange: "20 Nov 24 - 20 Nov 25",
    recurring: "Weekend",
    avatars: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
    extraCount: 0,
  },
  {
    id: "3",
    name: "First Shift",
    badge: "Evening",
    badgeColor: "text-purple-400 bg-purple-400/15",
    timeRange: "6:00 AM - 10:00 PM",
    dateRange: "20 Nov 24 - 20 Nov 25",
    recurring: "Tue, Wed, Thur",
    avatars: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
    extraCount: 4,
  },
];

// Repeat for demo
const allShiftCards = [...mockShiftCards, ...mockShiftCards, ...mockShiftCards];

const ShiftContent = ({
  showHeader = true,
  onBack,
  onAIClick,
}: ShiftContentProps) => {
  const navigate = useNavigate();
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [showJobTypeDropdown, setShowJobTypeDropdown] = useState(false);
  const [showShiftDropdown, setShowShiftDropdown] = useState(false);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });

  const jobTypes = ["Server", "Manager", "Host", "Admin"];
  const shiftTypes = ["Opening", "Afternoon", "Evening"];

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

  const filteredCards = allShiftCards.filter((card) => {
    if (searchQuery && !card.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedShifts.length > 0 && !selectedShifts.includes(card.badge)) return false;
    return true;
  });

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
          <button onClick={() => navigate("/settings/workforce/shift/add")} className="h-12 rounded-full px-4 lg:px-7 flex-shrink-0 flex items-center justify-center gap-2 border border-[hsl(var(--surface-border))] bg-transparent text-foreground active:opacity-70 transition-opacity">
            <Plus className="h-5 w-5" />
            <span className="text-sm font-medium">Add</span>
          </button>
        </div>

        {/* Filters row: Job Type, Shift, Date Nav, Sort */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {/* Job Type dropdown */}
          <div className="relative">
            <button
              onClick={() => { setShowJobTypeDropdown(!showJobTypeDropdown); setShowShiftDropdown(false); }}
              className={`h-10 rounded-full px-4 flex items-center gap-2 border text-sm font-medium transition-colors ${
                selectedJobTypes.length > 0
                  ? "bg-foreground text-background border-foreground"
                  : "bg-neutral-800/60 text-foreground border-neutral-700/50"
              }`}
            >
              Job Type {selectedJobTypes.length > 0 && `(${selectedJobTypes.length})`}
              <ChevronRight className="w-3.5 h-3.5 rotate-90" />
            </button>
            {showJobTypeDropdown && (
              <div className="absolute top-12 left-0 z-50 bg-neutral-900 border border-neutral-700/50 rounded-xl shadow-lg py-1 min-w-[140px]">
                {jobTypes.map((jt) => (
                  <button
                    key={jt}
                    onClick={() => toggleJobType(jt)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      selectedJobTypes.includes(jt)
                        ? "text-foreground bg-neutral-800"
                        : "text-neutral-400 hover:text-foreground hover:bg-neutral-800/50"
                    }`}
                  >
                    {jt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Shift dropdown */}
          <div className="relative">
            <button
              onClick={() => { setShowShiftDropdown(!showShiftDropdown); setShowJobTypeDropdown(false); }}
              className={`h-10 rounded-full px-4 flex items-center gap-2 border text-sm font-medium transition-colors ${
                selectedShifts.length > 0
                  ? "bg-foreground text-background border-foreground"
                  : "bg-neutral-800/60 text-foreground border-neutral-700/50"
              }`}
            >
              Shift {selectedShifts.length > 0 && `(${selectedShifts.length})`}
              <ChevronRight className="w-3.5 h-3.5 rotate-90" />
            </button>
            {showShiftDropdown && (
              <div className="absolute top-12 left-0 z-50 bg-neutral-900 border border-neutral-700/50 rounded-xl shadow-lg py-1 min-w-[140px]">
                {shiftTypes.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleShift(s)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      selectedShifts.includes(s)
                        ? "text-foreground bg-neutral-800"
                        : "text-neutral-400 hover:text-foreground hover:bg-neutral-800/50"
                    }`}
                  >
                    {s}
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
              {format(weekStart, "dd MMM")} - {format(weekEnd, "dd MMM yyyy")}
            </span>
            <button
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
              className="w-8 h-8 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70"
            >
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
          </div>

          <div className="flex-1" />

          {/* Sort */}
          <button
            className="w-10 h-10 rounded-xl bg-neutral-800/60 flex items-center justify-center active:opacity-70 border border-neutral-700/50"
          >
            <ArrowDownUp className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Shift Cards Grid */}
        {filteredCards.length === 0 ? (
          <div className="px-4 py-12 text-center text-muted-foreground text-sm">
            No shifts found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCards.map((card, idx) => (
              <ShiftCard key={`${card.id}-${idx}`} card={card} onClick={() => navigate(`/settings/workforce/shift/edit?id=${card.id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* Close dropdowns on outside click */}
      {(showJobTypeDropdown || showShiftDropdown) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowJobTypeDropdown(false); setShowShiftDropdown(false); }} />
      )}
    </div>
  );
};

interface ShiftCardData {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  timeRange: string;
  dateRange: string;
  recurring: string;
  avatars: string[];
  extraCount: number;
}

const ShiftCard = ({ card, onClick }: { card: ShiftCardData; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="w-full text-left rounded-2xl bg-neutral-800/60 border border-neutral-700/30 p-4 hover:bg-neutral-700/50 active:opacity-80 transition-all"
  >
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

    {/* Recurring */}
    <p className="text-xs text-muted-foreground mb-3 pl-[22px]">{card.recurring}</p>

    {/* Avatars */}
    <div className="flex items-center -space-x-2">
      {card.avatars.map((src, i) => (
        <Avatar key={i} className="w-8 h-8 border-2 border-neutral-800">
          <AvatarImage src={src} />
          <AvatarFallback className="text-[10px] font-semibold bg-neutral-700 text-foreground">
            {String.fromCharCode(65 + i)}
          </AvatarFallback>
        </Avatar>
      ))}
      {card.extraCount > 0 && (
        <div className="w-8 h-8 rounded-full bg-neutral-700 border-2 border-neutral-800 flex items-center justify-center">
          <span className="text-[10px] font-semibold text-foreground">+{card.extraCount}</span>
        </div>
      )}
    </div>
  </button>
);

export default ShiftContent;
