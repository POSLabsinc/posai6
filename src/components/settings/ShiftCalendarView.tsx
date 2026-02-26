import { format, startOfWeek, addDays } from "date-fns";
import { ShiftCardData } from "@/hooks/use-shift-cards";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ShiftCalendarViewProps {
  cards: ShiftCardData[];
  currentWeek: Date;
  onShiftClick: (card: ShiftCardData) => void;
}

const ShiftCalendarView = ({ cards, currentWeek, onShiftClick }: ShiftCalendarViewProps) => {
  const navigate = useNavigate();
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayAbbrs = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getCardsForDay = (dayAbbr: string) =>
    cards.filter((card) => (card.days || []).includes(dayAbbr));

  const handleEmptyCellClick = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    navigate(`/settings/workforce/shift/add?shift_date=${dateStr}&start_time=09:00&end_time=10:00`);
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      {/* Desktop / Tablet: full 7-column grid */}
      <div className="hidden md:grid grid-cols-7 gap-0 border border-neutral-700/30 rounded-2xl overflow-hidden bg-neutral-800/30">
        {/* Day headers */}
        {days.map((day, i) => {
          const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
          return (
            <div
              key={i}
              className={`px-3 py-3 text-center border-b border-neutral-700/30 ${i < 6 ? "border-r border-neutral-700/30" : ""}`}
            >
              <span className="text-xs text-muted-foreground uppercase tracking-wide">{dayAbbrs[i]}</span>
              <div className={`mt-1 text-sm font-semibold ${isToday ? "text-orange-400" : "text-foreground"}`}>
                {format(day, "dd")}
              </div>
            </div>
          );
        })}

        {/* Day cells */}
        {days.map((day, i) => {
          const dayCards = getCardsForDay(dayAbbrs[i]);
          return (
            <div
              key={`cell-${i}`}
              onClick={() => {
                if (dayCards.length === 0) handleEmptyCellClick(day);
              }}
              className={`min-h-[140px] p-2 ${i < 6 ? "border-r border-neutral-700/30" : ""} flex flex-col gap-1.5 ${dayCards.length === 0 ? "cursor-pointer hover:bg-muted/30 transition-colors" : ""}`}
            >
              {dayCards.length === 0 && (
                <span className="text-[11px] text-neutral-600 mt-4 text-center">—</span>
              )}
              {dayCards.map((card, ci) => (
                <CalendarShiftBlock key={`${card.id}-${ci}`} card={card} onClick={() => onShiftClick(card)} getInitials={getInitials} />
              ))}
              {dayCards.length > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleEmptyCellClick(day); }}
                  className="mt-auto text-[10px] text-muted-foreground hover:text-foreground transition-colors py-1 rounded hover:bg-muted/30"
                >
                  + Add
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: stacked day list */}
      <div className="md:hidden flex flex-col gap-3">
        {days.map((day, i) => {
          const dayCards = getCardsForDay(dayAbbrs[i]);
          const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
          return (
            <div key={i}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className={`text-sm font-semibold ${isToday ? "text-orange-400" : "text-foreground"}`}>
                  {dayAbbrs[i]}
                </span>
                <span className="text-sm text-muted-foreground">{format(day, "dd MMM")}</span>
              </div>
              {dayCards.length === 0 ? (
                <button
                  onClick={() => handleEmptyCellClick(day)}
                  className="rounded-xl bg-neutral-800/30 border border-neutral-700/20 px-4 py-4 text-center w-full hover:bg-muted/30 transition-colors"
                >
                  <span className="text-xs text-muted-foreground">+ Add Shift</span>
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  {dayCards.map((card, ci) => (
                    <CalendarShiftBlock key={`${card.id}-${ci}`} card={card} onClick={() => onShiftClick(card)} getInitials={getInitials} mobile />
                  ))}
                  <button
                    onClick={() => handleEmptyCellClick(day)}
                    className="rounded-xl border border-dashed border-neutral-700/30 px-4 py-2.5 text-center hover:bg-muted/30 transition-colors"
                  >
                    <span className="text-xs text-muted-foreground">+ Add Shift</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CalendarShiftBlock = ({
  card,
  onClick,
  getInitials,
  mobile,
}: {
  card: ShiftCardData;
  onClick: () => void;
  getInitials: (name: string) => string;
  mobile?: boolean;
}) => {
  const maxAvatars = mobile ? 3 : 2;
  const visible = card.employees.slice(0, maxAvatars);
  const extra = Math.max(0, card.employees.length - maxAvatars);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border transition-all active:opacity-80 hover:bg-neutral-700/40 ${
        mobile
          ? "bg-neutral-800/60 border-neutral-700/30 p-3"
          : "bg-neutral-800/80 border-neutral-700/20 p-2"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className={`font-semibold text-foreground ${mobile ? "text-sm" : "text-[11px]"}`}>
          {card.name}
        </span>
        <span className={`font-medium px-1.5 py-0.5 rounded ${card.badgeColor} ${mobile ? "text-[11px]" : "text-[9px]"}`}>
          {card.badge}
        </span>
      </div>
      <div className="flex items-center gap-1 mb-1.5">
        <Clock className={`text-muted-foreground ${mobile ? "w-3.5 h-3.5" : "w-3 h-3"}`} />
        <span className={`text-muted-foreground ${mobile ? "text-xs" : "text-[10px]"}`}>{card.timeRange}</span>
      </div>
      <div className="flex items-center -space-x-1.5">
        {visible.map((emp) => (
          <Avatar key={emp.id} className={`border-2 border-neutral-800 ${mobile ? "w-7 h-7" : "w-5 h-5"}`}>
            {emp.avatar_url && <AvatarImage src={emp.avatar_url} />}
            <AvatarFallback className={`font-semibold bg-neutral-700 text-foreground ${mobile ? "text-[9px]" : "text-[7px]"}`}>
              {getInitials(emp.name)}
            </AvatarFallback>
          </Avatar>
        ))}
        {extra > 0 && (
          <div className={`rounded-full bg-neutral-700 border-2 border-neutral-800 flex items-center justify-center ${mobile ? "w-7 h-7" : "w-5 h-5"}`}>
            <span className={`font-semibold text-foreground ${mobile ? "text-[9px]" : "text-[7px]"}`}>+{extra}</span>
          </div>
        )}
      </div>
    </button>
  );
};

export default ShiftCalendarView;
