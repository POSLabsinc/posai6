import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { format, addDays, subDays, isToday, isTomorrow, isYesterday, isSameDay } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Clock, Users, MapPin, Calendar as CalendarIcon, AlertCircle, 
  ChevronLeft, ChevronRight, Phone, FileText, CreditCard, 
  ArrowLeft, Armchair, Minimize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockReservations, type Reservation } from "@/components/ReservationsPanel";

// Status configurations
const statusConfig = {
  upcoming: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", label: "Upcoming", dot: "bg-blue-500" },
  seated: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", label: "Seated", dot: "bg-emerald-500" },
  late: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30", label: "Late", dot: "bg-red-500" },
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

// Compact Reservation Card for Timeline
const ReservationCard = ({
  reservation,
  isSelected,
  onReservationClick,
}: {
  reservation: Reservation;
  isSelected: boolean;
  onReservationClick: (reservation: Reservation) => void;
}) => {
  const config = statusConfig[reservation.status];
  const isUnassigned = !reservation.tableId;
  
  return (
    <div
      onClick={() => onReservationClick(reservation)}
      className={`pl-3 pr-5 py-2.5 rounded-lg border cursor-pointer transition-all hover:bg-white/5 ${
        isSelected 
          ? "border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/30"
          : reservation.status === "late" 
            ? "border-red-500/40 bg-red-500/5 ring-1 ring-red-500/30" 
            : isUnassigned
              ? "border-amber-500/40 bg-amber-500/5"
              : "border-neutral-700/50 bg-neutral-800/30"
      }`}
    >
      {/* Single Row Layout - with explicit right margin for breathing room */}
      <div className="flex items-center gap-2.5 mr-1">
        {/* Status Dot */}
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dot} ${
          reservation.status === "late" ? "animate-pulse" : ""
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
    </div>
  );
};

// Reservation Details Panel
const ReservationDetailsPanel = ({
  reservation,
  availableTables,
  onAssignTable,
}: {
  reservation: Reservation;
  availableTables: { id: string; seats: number }[];
  onAssignTable: (reservationId: string, tableId: string) => void;
}) => {
  const config = statusConfig[reservation.status];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <h3 className="text-white text-lg font-semibold">{reservation.guestName}</h3>
            <p className="text-neutral-500 text-sm">{reservation.time} • {getDateLabel(reservation.date)}</p>
          </div>
          <Badge 
            variant="outline" 
            className={`${config.bg} ${config.text} border-0 text-xs`}
          >
            {config.label}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Guest Info Section */}
          <div className="space-y-3">
            <h4 className="text-neutral-400 text-xs font-semibold uppercase tracking-wide">Guest Information</h4>
            <div className="bg-neutral-800/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-neutral-500" />
                <span className="text-white text-sm">{reservation.partySize} Guests</span>
              </div>
              {reservation.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-neutral-500" />
                  <span className="text-white text-sm">{reservation.phone}</span>
                </div>
              )}
              {reservation.email && (
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-neutral-500" />
                  <span className="text-white text-sm">{reservation.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Seating Section */}
          <div className="space-y-3">
            <h4 className="text-neutral-400 text-xs font-semibold uppercase tracking-wide">Seating</h4>
            <div className="bg-neutral-800/50 rounded-lg p-4">
              {reservation.tableId ? (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Armchair className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-lg">Table {reservation.tableId}</p>
                    <p className="text-neutral-500 text-sm">Assigned</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-amber-400">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Unassigned – Tap a table to assign</span>
                  </div>
                  {availableTables.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-neutral-700">
                      {availableTables.map((table) => (
                        <button
                          key={table.id}
                          onClick={() => onAssignTable(reservation.id, table.id)}
                          className="px-4 py-2 rounded-lg bg-neutral-700 hover:bg-amber-500 text-white text-sm font-medium transition-colors"
                        >
                          {table.id} ({table.seats})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Payment Section */}
          <div className="space-y-3">
            <h4 className="text-neutral-400 text-xs font-semibold uppercase tracking-wide">Payment</h4>
            <div className="bg-neutral-800/50 rounded-lg p-4">
              {reservation.depositPaid ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span className="text-white text-sm">Deposit Paid</span>
                  </div>
                  <span className="text-emerald-400 font-semibold text-lg">${reservation.depositAmount}</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-neutral-500">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-sm">No deposit</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          {(reservation.notes || reservation.specialRequests) && (
            <div className="space-y-3">
              <h4 className="text-neutral-400 text-xs font-semibold uppercase tracking-wide">Notes</h4>
              <div className="bg-neutral-800/50 rounded-lg p-4 space-y-2">
                {reservation.notes && (
                  <p className="text-white text-sm">{reservation.notes}</p>
                )}
                {reservation.specialRequests && (
                  <p className="text-amber-400/80 text-sm italic">{reservation.specialRequests}</p>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-3 pt-2">
            <h4 className="text-neutral-400 text-xs font-semibold uppercase tracking-wide">Actions</h4>
            <div className="grid grid-cols-2 gap-3">
              {reservation.status === "upcoming" && reservation.tableId && (
                <button className="px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors">
                  Seat Guest
                </button>
              )}
              {reservation.status === "late" && (
                <button className="px-4 py-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors">
                  Call Guest
                </button>
              )}
              <button className="px-4 py-3 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-medium transition-colors">
                Edit Reservation
              </button>
              <button className="px-4 py-3 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-medium transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

// Empty state for details panel
const EmptyDetailsState = () => (
  <div className="h-full flex flex-col items-center justify-center text-center px-8">
    <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4">
      <CalendarIcon className="w-8 h-8 text-neutral-600" />
    </div>
    <h4 className="text-neutral-400 font-medium text-lg mb-2">Select a Reservation</h4>
    <p className="text-neutral-600 text-sm">
      Click on a reservation from the timeline to view details, manage seating, and take actions.
    </p>
  </div>
);

// Available tables (mock data - in real app would come from context/props)
const availableTables = [
  { id: "T1", seats: 8 },
  { id: "T2", seats: 5 },
  { id: "T9", seats: 3 },
  { id: "T10", seats: 4 },
];

const FullReservationsView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get state passed from TableOrder page
  const passedState = location.state as { 
    selectedDate?: string;
    selectedReservationId?: string;
  } | null;
  
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (passedState?.selectedDate) {
      return new Date(passedState.selectedDate);
    }
    return new Date();
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(() => {
    if (passedState?.selectedReservationId) {
      return mockReservations.find(r => r.id === passedState.selectedReservationId) || null;
    }
    return null;
  });
  const [reservations, setReservations] = useState<Reservation[]>(mockReservations);
  
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

  const handleReservationSelect = (reservation: Reservation) => {
    setSelectedReservation(reservation);
  };

  const handleAssignTable = (reservationId: string, tableId: string) => {
    setReservations(prev => 
      prev.map(r => r.id === reservationId ? { ...r, tableId } : r)
    );
    if (selectedReservation?.id === reservationId) {
      setSelectedReservation(prev => prev ? { ...prev, tableId } : null);
    }
  };

  const handleBackToTables = () => {
    // Navigate back to TableOrder with state preservation
    navigate("/tableorder", {
      state: {
        openReservationsPanel: true,
        selectedDate: selectedDate.toISOString(),
        selectedReservationId: selectedReservation?.id,
      }
    });
  };

  // Auto-scroll to selected reservation's hour block
  useEffect(() => {
    if (selectedReservation) {
      const hour = parseTimeToHour(selectedReservation.time);
      const element = document.getElementById(`hour-block-${hour}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [selectedReservation]);

  return (
    <div className="h-screen bg-neutral-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left: Back to Tables */}
          <button
            onClick={handleBackToTables}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Tables</span>
          </button>
          
          {/* Center: Title + Date Navigation */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center">
                <CalendarIcon className="w-4 h-4 text-orange-400" />
              </div>
              <h1 className="text-white text-lg font-semibold">Reservations</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevDay}
                className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-neutral-400" />
              </button>
              
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
              
              <button
                onClick={handleNextDay}
                className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </button>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-2 ml-4">
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
          </div>
          
          {/* Right: Collapse button */}
          <button
            onClick={handleBackToTables}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
            title="Collapse to panel view"
          >
            <Minimize2 className="w-4 h-4" />
            <span className="text-sm font-medium">Collapse</span>
          </button>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Timeline */}
        <div className="w-[420px] border-r border-neutral-800 bg-neutral-900/50 flex flex-col">
          <div className="px-4 py-3 border-b border-neutral-800">
            <p className="text-neutral-400 text-xs font-semibold uppercase tracking-wide">
              Timeline • {filteredReservations.length} reservations
            </p>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="pl-4 pr-6 py-4 space-y-3">
              {sortedHours.map((hour) => {
                const hourReservations = groupedReservations.get(hour) || [];
                const isCurrentHour = hour === currentHour && isTodaySelected;
                
                return (
                  <div key={hour} id={`hour-block-${hour}`} className="relative">
                    {/* Time Block Header */}
                    <div 
                      className={`sticky top-0 z-10 flex items-center gap-2 px-2.5 py-1.5 rounded-md mb-2 ${
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
                    <div className="space-y-2">
                      {hourReservations.map((reservation) => (
                        <ReservationCard
                          key={reservation.id}
                          reservation={reservation}
                          isSelected={selectedReservation?.id === reservation.id}
                          onReservationClick={handleReservationSelect}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {filteredReservations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <CalendarIcon className="w-12 h-12 text-neutral-700 mb-3" />
                  <h4 className="text-neutral-400 font-medium">No Reservations</h4>
                  <p className="text-neutral-600 text-sm mt-1">{getDateLabel(selectedDate)}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Column: Details */}
        <div className="flex-1 bg-neutral-950">
          {selectedReservation ? (
            <ReservationDetailsPanel
              reservation={selectedReservation}
              availableTables={availableTables}
              onAssignTable={handleAssignTable}
            />
          ) : (
            <EmptyDetailsState />
          )}
        </div>
      </div>
    </div>
  );
};

export default FullReservationsView;
