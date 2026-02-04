import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, MapPin, Calendar, AlertCircle, Check, List, LayoutGrid } from "lucide-react";

export type Reservation = {
  id: string;
  guestName: string;
  time: string;
  partySize: number;
  tableId: string | null;
  status: "upcoming" | "seated" | "late";
  phone?: string;
  notes?: string;
};

// Mock reservations data
export const mockReservations: Reservation[] = [
  { id: "R1", guestName: "Johnson Family", time: "6:30 PM", partySize: 4, tableId: "T4", status: "upcoming", phone: "(415) 555-1234" },
  { id: "R2", guestName: "Maria Rodriguez", time: "7:00 PM", partySize: 2, tableId: null, status: "upcoming", phone: "(415) 555-2345", notes: "Anniversary dinner" },
  { id: "R3", guestName: "Corporate Event - TechCo", time: "7:30 PM", partySize: 8, tableId: "T1", status: "upcoming" },
  { id: "R4", guestName: "David Chen", time: "5:30 PM", partySize: 3, tableId: "T6", status: "late", phone: "(415) 555-3456" },
  { id: "R5", guestName: "Sarah Miller", time: "6:00 PM", partySize: 2, tableId: "T3", status: "seated" },
  { id: "R6", guestName: "Williams Party", time: "8:00 PM", partySize: 6, tableId: "T2", status: "upcoming" },
  { id: "R7", guestName: "Emily Davis", time: "8:30 PM", partySize: 2, tableId: null, status: "upcoming", notes: "Window seat preferred" },
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
  upcoming: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/50", label: "Upcoming" },
  seated: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/50", label: "Seated" },
  late: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/50", label: "Late" },
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

const ReservationCard = ({
  reservation,
  onReservationClick,
  onAssignTable,
  availableTables,
  compact = false,
}: {
  reservation: Reservation;
  onReservationClick: (reservation: Reservation) => void;
  onAssignTable: (reservationId: string, tableId: string) => void;
  availableTables: { id: string; seats: number }[];
  compact?: boolean;
}) => {
  const config = statusConfig[reservation.status];
  
  return (
    <div
      onClick={() => onReservationClick(reservation)}
      className={`p-3 rounded-xl border ${config.border} ${config.bg} cursor-pointer hover:scale-[1.01] transition-all ${
        reservation.status === "late" ? "ring-1 ring-red-500/50 shadow-lg shadow-red-500/10" : ""
      }`}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-sm truncate">{reservation.guestName}</h4>
          {!compact && reservation.phone && (
            <p className="text-neutral-400 text-xs mt-0.5">{reservation.phone}</p>
          )}
        </div>
        <Badge variant="outline" className={`${config.bg} ${config.text} ${config.border} text-[10px] px-2 py-0.5 ml-2 flex-shrink-0`}>
          {config.label}
        </Badge>
      </div>
      
      {/* Details Row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Clock className={`w-3.5 h-3.5 ${config.text}`} />
          <span className="text-white text-xs font-medium">{reservation.time}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-neutral-300 text-xs">{reservation.partySize}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-neutral-400" />
          {reservation.tableId ? (
            <span className="text-neutral-300 text-xs font-medium">{reservation.tableId}</span>
          ) : (
            <span className="text-orange-400 text-xs font-medium">Unassigned</span>
          )}
        </div>
      </div>
      
      {/* Notes */}
      {!compact && reservation.notes && (
        <p className="text-neutral-400 text-xs mt-2 italic">"{reservation.notes}"</p>
      )}
      
      {/* Assign Table Button (for unassigned) */}
      {!reservation.tableId && availableTables.length > 0 && (
        <div className="mt-2.5 pt-2.5 border-t border-neutral-700/50">
          <p className="text-neutral-400 text-[10px] mb-1.5 uppercase tracking-wide">Quick Assign</p>
          <div className="flex flex-wrap gap-1.5">
            {availableTables.slice(0, 5).map((table) => (
              <button
                key={table.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onAssignTable(reservation.id, table.id);
                }}
                className="px-2 py-0.5 rounded-lg bg-neutral-800 text-white text-xs font-medium hover:bg-orange-500 transition-colors"
              >
                {table.id} ({table.seats})
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Seated indicator */}
      {reservation.status === "seated" && (
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-neutral-700/50">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-emerald-400 text-xs">Guest has been seated</span>
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
  const [viewMode, setViewMode] = useState<"timeline" | "list">("timeline");
  const currentHour = getCurrentHour();
  
  // Sort by time for list view (late first, then upcoming, then seated)
  const sortedReservations = [...reservations].sort((a, b) => {
    const statusPriority = { late: 0, upcoming: 1, seated: 2 };
    if (statusPriority[a.status] !== statusPriority[b.status]) {
      return statusPriority[a.status] - statusPriority[b.status];
    }
    return a.time.localeCompare(b.time);
  });

  // Group by hour for timeline view
  const groupedReservations = groupByHour(reservations);
  const sortedHours = Array.from(groupedReservations.keys()).sort((a, b) => a - b);

  const upcomingCount = reservations.filter(r => r.status === "upcoming").length;
  const lateCount = reservations.filter(r => r.status === "late").length;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-[380px] sm:w-[420px] bg-neutral-900 border-neutral-800 p-0"
      >
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-neutral-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <SheetTitle className="text-white text-lg font-semibold">Today's Reservations</SheetTitle>
                <p className="text-neutral-400 text-sm">{reservations.length} total reservations</p>
              </div>
            </div>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center gap-2 mt-4">
            <div className="flex items-center bg-neutral-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode("timeline")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === "timeline"
                    ? "bg-orange-500 text-white"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Timeline
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === "list"
                    ? "bg-orange-500 text-white"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                List
              </button>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-blue-400 text-xs font-medium">{upcomingCount} Upcoming</span>
            </div>
            {lateCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 animate-pulse">
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                <span className="text-red-400 text-xs font-medium">{lateCount} Late</span>
              </div>
            )}
          </div>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-220px)]">
          {viewMode === "timeline" ? (
            /* Timeline View - Grouped by Hour */
            <div className="p-4 space-y-4">
              {sortedHours.map((hour) => {
                const hourReservations = groupedReservations.get(hour) || [];
                const isCurrentHour = hour === currentHour;
                const hasLate = hourReservations.some(r => r.status === "late");
                
                return (
                  <div key={hour} className="relative">
                    {/* Time Block Header */}
                    <div 
                      className={`sticky top-0 z-10 flex items-center gap-2 px-3 py-2 rounded-lg mb-2 ${
                        isCurrentHour 
                          ? "bg-orange-500/20 border border-orange-500/40" 
                          : hasLate
                            ? "bg-red-500/10 border border-red-500/30"
                            : "bg-neutral-800/80 border border-neutral-700/50"
                      }`}
                    >
                      <Clock className={`w-4 h-4 ${
                        isCurrentHour ? "text-orange-400" : hasLate ? "text-red-400" : "text-neutral-400"
                      }`} />
                      <span className={`text-sm font-semibold ${
                        isCurrentHour ? "text-orange-400" : hasLate ? "text-red-400" : "text-white"
                      }`}>
                        {formatHourBlock(hour)}
                      </span>
                      {isCurrentHour && (
                        <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0 ml-auto">
                          NOW
                        </Badge>
                      )}
                      <span className="text-neutral-400 text-xs ml-auto">
                        {hourReservations.length} {hourReservations.length === 1 ? "reservation" : "reservations"}
                      </span>
                    </div>
                    
                    {/* Reservations in this time block */}
                    <div className="space-y-2 pl-2">
                      {/* Left timeline bar */}
                      <div className="absolute left-0 top-12 bottom-0 w-0.5 bg-neutral-700/50 rounded-full" />
                      
                      {hourReservations.map((reservation) => (
                        <div key={reservation.id} className="relative pl-4">
                          {/* Timeline dot */}
                          <div className={`absolute left-[-3px] top-4 w-2 h-2 rounded-full ${
                            reservation.status === "late" 
                              ? "bg-red-500 animate-pulse" 
                              : reservation.status === "seated"
                                ? "bg-emerald-500"
                                : "bg-blue-500"
                          }`} />
                          
                          <ReservationCard
                            reservation={reservation}
                            onReservationClick={onReservationClick}
                            onAssignTable={onAssignTable}
                            availableTables={availableTables}
                            compact
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {reservations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="w-12 h-12 text-neutral-600 mb-4" />
                  <h4 className="text-white font-medium mb-1">No Reservations Today</h4>
                  <p className="text-neutral-400 text-sm">Check back later or add a new reservation</p>
                </div>
              )}
            </div>
          ) : (
            /* List View - Flat sorted list */
            <div className="p-4 space-y-3">
              {sortedReservations.map((reservation) => (
                <ReservationCard
                  key={reservation.id}
                  reservation={reservation}
                  onReservationClick={onReservationClick}
                  onAssignTable={onAssignTable}
                  availableTables={availableTables}
                />
              ))}
              
              {reservations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="w-12 h-12 text-neutral-600 mb-4" />
                  <h4 className="text-white font-medium mb-1">No Reservations Today</h4>
                  <p className="text-neutral-400 text-sm">Check back later or add a new reservation</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default ReservationsPanel;
