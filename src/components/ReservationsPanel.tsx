import { useState, useMemo } from "react";
import { format, addDays, subDays, isToday, isTomorrow, isYesterday, isSameDay } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Clock, Users, MapPin, Calendar as CalendarIcon, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type Reservation = {
  id: string;
  guestName: string;
  time: string;
  partySize: number;
  tableId: string | null;
  status: "upcoming" | "seated" | "late";
  phone?: string;
  notes?: string;
  date: Date; // Required for multi-day support
};

// Helper to get dates
const today = new Date();
const yesterday = subDays(today, 1);
const tomorrow = addDays(today, 1);
const dayAfterTomorrow = addDays(today, 2);
const twoDaysAgo = subDays(today, 2);

// Mock reservations data with dates
export const mockReservations: Reservation[] = [
  // Today's reservations
  { id: "R1", guestName: "Johnson Family", time: "6:30 PM", partySize: 4, tableId: "T4", status: "upcoming", phone: "(415) 555-1234", date: today },
  { id: "R2", guestName: "Maria Rodriguez", time: "7:00 PM", partySize: 2, tableId: null, status: "upcoming", phone: "(415) 555-2345", notes: "Anniversary dinner", date: today },
  { id: "R3", guestName: "Corporate Event - TechCo", time: "7:30 PM", partySize: 8, tableId: "T1", status: "upcoming", date: today },
  { id: "R4", guestName: "David Chen", time: "5:30 PM", partySize: 3, tableId: "T6", status: "late", phone: "(415) 555-3456", date: today },
  { id: "R5", guestName: "Sarah Miller", time: "6:00 PM", partySize: 2, tableId: "T3", status: "seated", date: today },
  { id: "R6", guestName: "Williams Party", time: "8:00 PM", partySize: 6, tableId: "T2", status: "upcoming", date: today },
  { id: "R7", guestName: "Emily Davis", time: "8:30 PM", partySize: 2, tableId: null, status: "upcoming", notes: "Window seat preferred", date: today },
  
  // Tomorrow's reservations
  { id: "R8", guestName: "Thompson Wedding", time: "5:00 PM", partySize: 12, tableId: "T1", status: "upcoming", notes: "Rehearsal dinner", date: tomorrow },
  { id: "R9", guestName: "Mike & Lisa", time: "6:30 PM", partySize: 2, tableId: "T3", status: "upcoming", phone: "(415) 555-7890", date: tomorrow },
  { id: "R10", guestName: "Birthday - Alex", time: "7:00 PM", partySize: 6, tableId: null, status: "upcoming", notes: "Surprise party, need cake", date: tomorrow },
  { id: "R11", guestName: "Patel Family", time: "7:30 PM", partySize: 5, tableId: "T5", status: "upcoming", date: tomorrow },
  { id: "R12", guestName: "Business Dinner", time: "8:00 PM", partySize: 4, tableId: "T2", status: "upcoming", notes: "Private room preferred", date: tomorrow },
  
  // Day after tomorrow
  { id: "R13", guestName: "Garcia Anniversary", time: "6:00 PM", partySize: 2, tableId: "T4", status: "upcoming", notes: "25th anniversary", date: dayAfterTomorrow },
  { id: "R14", guestName: "Tech Startup Lunch", time: "12:00 PM", partySize: 8, tableId: null, status: "upcoming", date: dayAfterTomorrow },
  { id: "R15", guestName: "Retirement Party", time: "7:00 PM", partySize: 15, tableId: "T1", status: "upcoming", notes: "Large group, decorations", date: dayAfterTomorrow },
  
  // Yesterday (historical)
  { id: "R16", guestName: "Smith Reunion", time: "6:00 PM", partySize: 10, tableId: "T1", status: "seated", date: yesterday },
  { id: "R17", guestName: "Date Night - Couple", time: "7:30 PM", partySize: 2, tableId: "T3", status: "seated", date: yesterday },
  { id: "R18", guestName: "Late Guest", time: "8:00 PM", partySize: 4, tableId: "T5", status: "late", date: yesterday },
  
  // Two days ago
  { id: "R19", guestName: "Book Club", time: "5:30 PM", partySize: 6, tableId: "T2", status: "seated", date: twoDaysAgo },
  { id: "R20", guestName: "Wine Tasting Group", time: "7:00 PM", partySize: 8, tableId: "T1", status: "seated", date: twoDaysAgo },
];

interface ReservationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  reservations: Reservation[];
  onReservationClick: (reservation: Reservation) => void;
  onAssignTable: (reservationId: string, tableId: string) => void;
  availableTables: { id: string; seats: number }[];
}

const statusConfig = {
  upcoming: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", label: "Upcoming" },
  seated: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", label: "Seated" },
  late: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30", label: "Late" },
};

// Parse time string to get hour for grouping
const parseTimeToHour = (timeStr: string): number => {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let hour = parseInt(match[1]);
  const isPM = match[3].toUpperCase() === "PM";
  if (isPM && hour !== 12) hour += 12;
  if (!isPM && hour === 12) hour = 0;
  return hour;
};

// Format hour to display string
const formatHourBlock = (hour: number): string => {
  const nextHour = hour + 1;
  const formatHour = (h: number) => {
    const period = h >= 12 ? "PM" : "AM";
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}:00 ${period}`;
  };
  return `${formatHour(hour)} – ${formatHour(nextHour)}`;
};

// Get current hour for highlighting
const getCurrentHour = (): number => {
  return new Date().getHours();
};

// Group reservations by hour
const groupByHour = (reservations: Reservation[]): Map<number, Reservation[]> => {
  const groups = new Map<number, Reservation[]>();
  
  reservations.forEach((res) => {
    const hour = parseTimeToHour(res.time);
    if (!groups.has(hour)) {
      groups.set(hour, []);
    }
    groups.get(hour)!.push(res);
  });
  
  // Sort each group by time
  groups.forEach((resArray) => {
    resArray.sort((a, b) => a.time.localeCompare(b.time));
  });
  
  return groups;
};

// Format date label
const getDateLabel = (date: Date): string => {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEE, MMM d");
};

const ReservationCard = ({
  reservation,
  onReservationClick,
  onAssignTable,
  availableTables,
}: {
  reservation: Reservation;
  onReservationClick: (reservation: Reservation) => void;
  onAssignTable: (reservationId: string, tableId: string) => void;
  availableTables: { id: string; seats: number }[];
}) => {
  const config = statusConfig[reservation.status];
  const isUnassigned = !reservation.tableId;
  
  return (
    <div
      onClick={() => onReservationClick(reservation)}
      className={`px-3 py-2 rounded-lg border cursor-pointer transition-all hover:bg-white/5 ${
        reservation.status === "late" 
          ? "border-red-500/40 bg-red-500/5 ring-1 ring-red-500/30" 
          : isUnassigned
            ? "border-amber-500/40 bg-amber-500/5"
            : "border-neutral-700/50 bg-neutral-800/30"
      }`}
    >
      {/* Single Row Layout */}
      <div className="flex items-center gap-3">
        {/* Status Dot */}
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
          reservation.status === "late" 
            ? "bg-red-500 animate-pulse" 
            : reservation.status === "seated"
              ? "bg-emerald-500"
              : "bg-blue-500"
        }`} />
        
        {/* Guest Name */}
        <span className="text-white text-sm font-medium truncate flex-1 min-w-0">
          {reservation.guestName}
        </span>
        
        {/* Time */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Clock className="w-3 h-3 text-neutral-500" />
          <span className="text-neutral-300 text-xs">{reservation.time}</span>
        </div>
        
        {/* Party Size */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Users className="w-3 h-3 text-neutral-500" />
          <span className="text-neutral-300 text-xs">{reservation.partySize}</span>
        </div>
        
        {/* Table */}
        <div className="flex items-center gap-1 flex-shrink-0 min-w-[48px]">
          <MapPin className="w-3 h-3 text-neutral-500" />
          {reservation.tableId ? (
            <span className="text-neutral-300 text-xs">{reservation.tableId}</span>
          ) : (
            <span className="text-amber-400 text-xs font-semibold">—</span>
          )}
        </div>
        
        {/* Status Badge */}
        <Badge 
          variant="outline" 
          className={`${config.bg} ${config.text} border-0 text-[10px] px-1.5 py-0 h-5 flex-shrink-0`}
        >
          {config.label}
        </Badge>
      </div>
      
      {/* Quick Assign Row (for unassigned only) */}
      {isUnassigned && availableTables.length > 0 && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-neutral-700/30">
          <span className="text-neutral-500 text-[10px] uppercase tracking-wide">Assign:</span>
          <div className="flex gap-1 flex-wrap">
            {availableTables.slice(0, 4).map((table) => (
              <button
                key={table.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onAssignTable(reservation.id, table.id);
                }}
                className="px-2 py-0.5 rounded bg-neutral-700/50 text-white text-[10px] font-medium hover:bg-amber-500 transition-colors"
              >
                {table.id}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ReservationsPanel = ({
  isOpen,
  onClose,
  reservations,
  onReservationClick,
  onAssignTable,
  availableTables,
}: ReservationsPanelProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const currentHour = getCurrentHour();
  const isTodaySelected = isToday(selectedDate);
  
  // Filter reservations by selected date
  const filteredReservations = useMemo(() => {
    return reservations.filter(r => isSameDay(r.date, selectedDate));
  }, [reservations, selectedDate]);
  
  // Group by hour for timeline view
  const groupedReservations = groupByHour(filteredReservations);
  const sortedHours = Array.from(groupedReservations.keys()).sort((a, b) => a - b);

  const upcomingCount = filteredReservations.filter(r => r.status === "upcoming").length;
  const lateCount = filteredReservations.filter(r => r.status === "late").length;
  const unassignedCount = filteredReservations.filter(r => !r.tableId).length;

  const handlePrevDay = () => setSelectedDate(prev => subDays(prev, 1));
  const handleNextDay = () => setSelectedDate(prev => addDays(prev, 1));
  const handleToday = () => setSelectedDate(new Date());

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-[380px] sm:w-[400px] bg-neutral-900 border-neutral-800 p-0"
      >
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-neutral-800">
          {/* Date Navigation Row */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={handlePrevDay}
              className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-neutral-400" />
            </button>
            
            <div className="flex items-center gap-2">
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors">
                    <CalendarIcon className="w-4 h-4 text-orange-400" />
                    <span className="text-white text-sm font-semibold">{getDateLabel(selectedDate)}</span>
                    {!isTodaySelected && (
                      <span className="text-neutral-500 text-xs">{format(selectedDate, "MMM d")}</span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-neutral-900 border-neutral-700" align="center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        setIsCalendarOpen(false);
                      }
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              
              {!isTodaySelected && (
                <button
                  onClick={handleToday}
                  className="px-2 py-1 rounded bg-orange-500/20 text-orange-400 text-[10px] font-semibold uppercase tracking-wide hover:bg-orange-500/30 transition-colors"
                >
                  Today
                </button>
              )}
            </div>
            
            <button
              onClick={handleNextDay}
              className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>
          </div>

          {/* Title Row */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <SheetTitle className="text-white text-base font-semibold">Reservations</SheetTitle>
              <p className="text-neutral-500 text-xs">{filteredReservations.length} {isTodaySelected ? "today" : "on this date"}</p>
            </div>
          </div>
          
          {/* Quick Stats - Compact */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/10">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-blue-400 text-[11px] font-medium">{upcomingCount}</span>
            </div>
            {lateCount > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 animate-pulse">
                <AlertCircle className="w-3 h-3 text-red-400" />
                <span className="text-red-400 text-[11px] font-medium">{lateCount} Late</span>
              </div>
            )}
            {unassignedCount > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10">
                <MapPin className="w-3 h-3 text-amber-400" />
                <span className="text-amber-400 text-[11px] font-medium">{unassignedCount} Unassigned</span>
              </div>
            )}
          </div>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="p-3 space-y-3">
            {sortedHours.map((hour) => {
              const hourReservations = groupedReservations.get(hour) || [];
              const isCurrentHour = hour === currentHour && isTodaySelected;
              
              return (
                <div key={hour} className="relative">
                  {/* Time Block Header */}
                  <div 
                    className={`sticky top-0 z-10 flex items-center gap-2 px-2.5 py-1.5 rounded-md mb-1.5 ${
                      isCurrentHour 
                        ? "bg-orange-500/15 border border-orange-500/30" 
                        : "bg-neutral-800/60"
                    }`}
                  >
                    <Clock className={`w-3.5 h-3.5 ${isCurrentHour ? "text-orange-400" : "text-neutral-500"}`} />
                    <span className={`text-xs font-semibold ${isCurrentHour ? "text-orange-400" : "text-neutral-300"}`}>
                      {formatHourBlock(hour)}
                    </span>
                    {isCurrentHour && (
                      <Badge className="bg-orange-500 text-white text-[9px] px-1.5 py-0 h-4 ml-1">
                        NOW
                      </Badge>
                    )}
                    <span className="text-neutral-500 text-[10px] ml-auto">{hourReservations.length}</span>
                  </div>
                  
                  {/* Reservations in this time block */}
                  <div className="space-y-1.5">
                    {hourReservations.map((reservation) => (
                      <ReservationCard
                        key={reservation.id}
                        reservation={reservation}
                        onReservationClick={onReservationClick}
                        onAssignTable={onAssignTable}
                        availableTables={availableTables}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
            
            {reservations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarIcon className="w-10 h-10 text-neutral-700 mb-3" />
                <h4 className="text-neutral-400 font-medium text-sm">No Reservations</h4>
                <p className="text-neutral-600 text-xs mt-1">{getDateLabel(selectedDate)}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default ReservationsPanel;
