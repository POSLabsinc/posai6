import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, MapPin, Calendar, AlertCircle, Check } from "lucide-react";

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

const ReservationsPanel = ({
  isOpen,
  onClose,
  reservations,
  onReservationClick,
  onAssignTable,
  availableTables,
}: ReservationsPanelProps) => {
  // Sort by time (upcoming first, then by time)
  const sortedReservations = [...reservations].sort((a, b) => {
    // First by status priority (late first, then upcoming, then seated)
    const statusPriority = { late: 0, upcoming: 1, seated: 2 };
    if (statusPriority[a.status] !== statusPriority[b.status]) {
      return statusPriority[a.status] - statusPriority[b.status];
    }
    // Then by time
    return a.time.localeCompare(b.time);
  });

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
          
          {/* Quick Stats */}
          <div className="flex items-center gap-3 mt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-blue-400 text-xs font-medium">{upcomingCount} Upcoming</span>
            </div>
            {lateCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30">
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                <span className="text-red-400 text-xs font-medium">{lateCount} Late</span>
              </div>
            )}
          </div>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="p-4 space-y-3">
            {sortedReservations.map((reservation) => {
              const config = statusConfig[reservation.status];
              
              return (
                <div
                  key={reservation.id}
                  onClick={() => onReservationClick(reservation)}
                  className={`p-4 rounded-xl border ${config.border} ${config.bg} cursor-pointer hover:scale-[1.02] transition-all`}
                >
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-white font-semibold text-sm">{reservation.guestName}</h4>
                      {reservation.phone && (
                        <p className="text-neutral-400 text-xs mt-0.5">{reservation.phone}</p>
                      )}
                    </div>
                    <Badge variant="outline" className={`${config.bg} ${config.text} ${config.border} text-[10px] px-2 py-0.5`}>
                      {config.label}
                    </Badge>
                  </div>
                  
                  {/* Details Row */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className={`w-3.5 h-3.5 ${config.text}`} />
                      <span className="text-white text-xs font-medium">{reservation.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="text-neutral-300 text-xs">{reservation.partySize} guests</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                      {reservation.tableId ? (
                        <span className="text-neutral-300 text-xs font-medium">{reservation.tableId}</span>
                      ) : (
                        <span className="text-orange-400 text-xs">Unassigned</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Notes */}
                  {reservation.notes && (
                    <p className="text-neutral-400 text-xs mt-2 italic">"{reservation.notes}"</p>
                  )}
                  
                  {/* Assign Table Button (for unassigned) */}
                  {!reservation.tableId && availableTables.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-neutral-700/50">
                      <p className="text-neutral-400 text-[10px] mb-2 uppercase tracking-wide">Quick Assign</p>
                      <div className="flex flex-wrap gap-1.5">
                        {availableTables.slice(0, 6).map((table) => (
                          <button
                            key={table.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onAssignTable(reservation.id, table.id);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-neutral-800 text-white text-xs font-medium hover:bg-orange-500 transition-colors"
                          >
                            {table.id} ({table.seats})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Seated indicator */}
                  {reservation.status === "seated" && (
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-neutral-700/50">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 text-xs">Guest has been seated</span>
                    </div>
                  )}
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
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default ReservationsPanel;
