import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { format, addDays, subDays, isToday, isTomorrow, isYesterday, isSameDay } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, Users, MapPin, Calendar as CalendarIcon, AlertCircle, 
  ChevronLeft, ChevronRight, Phone, FileText, CreditCard, 
  ArrowLeft, Armchair, Mail, Timer, Gift, Building, Globe,
  User, Hash, Utensils, Baby, Accessibility, Bell, StickyNote,
  ExternalLink, CheckCircle2, XCircle
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
      className={`pl-3 pr-4 py-2.5 rounded-lg border cursor-pointer transition-all hover:bg-white/5 overflow-hidden ${
        isSelected 
          ? "border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/30"
          : reservation.status === "late" 
            ? "border-red-500/40 bg-red-500/5 ring-1 ring-red-500/30" 
            : isUnassigned
              ? "border-amber-500/40 bg-amber-500/5"
              : "border-neutral-700/50 bg-neutral-800/30"
      }`}
    >
      {/* Single Row Layout */}
      <div className="flex items-center gap-2">
        {/* Status Dot - color communicates status */}
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${config.dot} ${
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
        <div className="flex items-center gap-1 flex-shrink-0">
          <MapPin className="w-3 h-3 text-neutral-500" />
          {reservation.tableId ? (
            <span className="text-neutral-300 text-xs font-medium">{reservation.tableId}</span>
          ) : (
            <span className="text-amber-400 text-xs font-semibold">—</span>
          )}
        </div>
      </div>
    </div>
  );
};

// Field display helper - shows value or "Not specified"
const FieldRow = ({ 
  icon: Icon, 
  label, 
  value, 
  valueClass = "text-white" 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number | undefined | null; 
  valueClass?: string;
}) => (
  <div className="flex items-start gap-3 py-2">
    <Icon className="w-4 h-4 text-neutral-500 mt-0.5 flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-neutral-500 text-xs uppercase tracking-wide mb-0.5">{label}</p>
      <p className={cn("text-sm", value ? valueClass : "text-neutral-600 italic")}>
        {value || "Not specified"}
      </p>
    </div>
  </div>
);

// Boolean field display
const BooleanFieldRow = ({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: boolean | undefined; 
}) => (
  <div className="flex items-start gap-3 py-2">
    <Icon className="w-4 h-4 text-neutral-500 mt-0.5 flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-neutral-500 text-xs uppercase tracking-wide mb-0.5">{label}</p>
      <div className="flex items-center gap-1.5">
        {value === true ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-sm">Enabled</span>
          </>
        ) : value === false ? (
          <>
            <XCircle className="w-4 h-4 text-neutral-600" />
            <span className="text-neutral-600 text-sm">Disabled</span>
          </>
        ) : (
          <span className="text-neutral-600 italic text-sm">Not specified</span>
        )}
      </div>
    </div>
  </div>
);

// Reservation Details Panel with Tabs
const ReservationDetailsPanel = ({
  reservation,
  availableTables,
  onAssignTable,
  onSeatGuest,
}: {
  reservation: Reservation;
  availableTables: { id: string; seats: number }[];
  onAssignTable: (reservationId: string, tableId: string) => void;
  onSeatGuest: (reservation: Reservation) => void;
}) => {
  const config = statusConfig[reservation.status];
  const formattedDate = format(reservation.date, "EEEE, MMMM d, yyyy");

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

      {/* Tabs - Match old POS exactly */}
      <Tabs defaultValue="guest-info" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full justify-start rounded-none border-b border-neutral-800 bg-neutral-900/50 h-auto p-0 px-4">
          <TabsTrigger 
            value="guest-info" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent data-[state=active]:text-white text-neutral-400 px-4 py-3 text-sm"
          >
            Guest Info
          </TabsTrigger>
          <TabsTrigger 
            value="sitting" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent data-[state=active]:text-white text-neutral-400 px-4 py-3 text-sm"
          >
            Sitting
          </TabsTrigger>
          <TabsTrigger 
            value="payment" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent data-[state=active]:text-white text-neutral-400 px-4 py-3 text-sm"
          >
            Payment
          </TabsTrigger>
          <TabsTrigger 
            value="other" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent data-[state=active]:text-white text-neutral-400 px-4 py-3 text-sm"
          >
            Other
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {/* Guest Info Tab */}
          <TabsContent value="guest-info" className="mt-0 p-6 space-y-4">
            <div className="bg-neutral-800/50 rounded-lg p-4 divide-y divide-neutral-700/50">
              <FieldRow 
                icon={User} 
                label="Guest Name (First)" 
                value={reservation.firstName} 
              />
              <FieldRow 
                icon={User} 
                label="Guest Name (Last)" 
                value={reservation.lastName} 
              />
              <FieldRow 
                icon={Mail} 
                label="Email" 
                value={reservation.email} 
              />
              <FieldRow 
                icon={Phone} 
                label="Phone Number" 
                value={reservation.phone} 
              />
              <FieldRow 
                icon={Users} 
                label="Guest Count (Party Size)" 
                value={reservation.partySize ? `${reservation.partySize} guests` : undefined} 
              />
              <FieldRow 
                icon={CalendarIcon} 
                label="Reservation Date & Time" 
                value={`${formattedDate} at ${reservation.time}`} 
              />
              <FieldRow 
                icon={Timer} 
                label="Duration" 
                value={reservation.duration} 
              />
              <FieldRow 
                icon={Gift} 
                label="Occasion" 
                value={reservation.occasion} 
              />
              <FieldRow 
                icon={StickyNote} 
                label="Guest Notes" 
                value={reservation.guestNotes} 
              />
            </div>
          </TabsContent>

          {/* Sitting Tab */}
          <TabsContent value="sitting" className="mt-0 p-6 space-y-4">
            <div className="bg-neutral-800/50 rounded-lg p-4 divide-y divide-neutral-700/50">
              <FieldRow 
                icon={Building} 
                label="Floor" 
                value={reservation.floor} 
              />
              <FieldRow 
                icon={MapPin} 
                label="Area / Service Area" 
                value={reservation.area} 
              />
              <div className="py-2">
                <div className="flex items-start gap-3">
                  <Armchair className="w-4 h-4 text-neutral-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-500 text-xs uppercase tracking-wide mb-0.5">Assigned Table(s)</p>
                    {reservation.tableId ? (
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium">Table {reservation.tableId}</span>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">Assigned</Badge>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                          <span className="text-amber-400 text-sm font-medium">Unassigned</span>
                        </div>
                        {availableTables.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-700">
                            <span className="text-neutral-500 text-xs w-full mb-1">Quick Assign:</span>
                            {availableTables.map((table) => (
                              <button
                                key={table.id}
                                onClick={() => onAssignTable(reservation.id, table.id)}
                                className="px-4 py-2 rounded-lg bg-neutral-700 hover:bg-amber-500 text-white text-sm font-medium transition-colors"
                              >
                                {table.id} ({table.seats} seats)
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment" className="mt-0 p-6 space-y-4">
            <div className="bg-neutral-800/50 rounded-lg p-4 divide-y divide-neutral-700/50">
              <div className="py-2">
                <div className="flex items-start gap-3">
                  <CreditCard className="w-4 h-4 text-neutral-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-500 text-xs uppercase tracking-wide mb-0.5">Advance Amount / Deposit</p>
                    {reservation.depositPaid && reservation.depositAmount ? (
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 text-lg font-semibold">${reservation.depositAmount}</span>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">Paid</Badge>
                      </div>
                    ) : (
                      <span className="text-neutral-600 italic text-sm">No deposit</span>
                    )}
                  </div>
                </div>
              </div>
              <FieldRow 
                icon={FileText} 
                label="Payment Status" 
                value={reservation.paymentStatus} 
                valueClass={reservation.paymentStatus === "Fully Paid" ? "text-emerald-400" : reservation.paymentStatus === "Partial Payment" ? "text-amber-400" : "text-white"}
              />
            </div>
          </TabsContent>

          {/* Other Tab */}
          <TabsContent value="other" className="mt-0 p-6 space-y-4">
            <div className="bg-neutral-800/50 rounded-lg p-4 divide-y divide-neutral-700/50">
              <FieldRow 
                icon={Utensils} 
                label="Service Type" 
                value={reservation.serviceType} 
              />
              <FieldRow 
                icon={Globe} 
                label="Reservation Source" 
                value={reservation.reservationSource} 
              />
              <FieldRow 
                icon={User} 
                label="Assigned Server" 
                value={reservation.assignedServer} 
              />
              <FieldRow 
                icon={ExternalLink} 
                label="External Reference" 
                value={reservation.externalReference} 
              />
              <FieldRow 
                icon={Hash} 
                label="Confirmation Number" 
                value={reservation.confirmationNumber} 
              />
              <FieldRow 
                icon={AlertCircle} 
                label="Dietary Restrictions" 
                value={reservation.dietaryRestrictions} 
                valueClass="text-amber-400"
              />
              <FieldRow 
                icon={Baby} 
                label="High Chair Count" 
                value={reservation.highChairCount !== undefined ? `${reservation.highChairCount}` : undefined} 
              />
              <FieldRow 
                icon={Users} 
                label="Kids Count" 
                value={reservation.kidsCount !== undefined ? `${reservation.kidsCount}` : undefined} 
              />
              <FieldRow 
                icon={Accessibility} 
                label="Accessibility Requirements" 
                value={reservation.accessibilityRequirements} 
              />
              <FieldRow 
                icon={StickyNote} 
                label="Visit Notes" 
                value={reservation.visitNotes} 
              />
              <BooleanFieldRow 
                icon={Bell} 
                label="Reminders" 
                value={reservation.remindersEnabled} 
              />
            </div>

            {/* Notes & Special Requests Section */}
            {(reservation.notes || reservation.specialRequests) && (
              <div className="bg-neutral-800/50 rounded-lg p-4 space-y-3">
                <h4 className="text-neutral-400 text-xs font-semibold uppercase tracking-wide">Additional Notes</h4>
                {reservation.notes && (
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-neutral-500 mt-0.5" />
                    <p className="text-white text-sm">{reservation.notes}</p>
                  </div>
                )}
                {reservation.specialRequests && (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5" />
                    <p className="text-amber-400/80 text-sm italic">{reservation.specialRequests}</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Quick Actions - Fixed at bottom */}
      <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900/50">
        <div className="grid grid-cols-2 gap-3">
          {reservation.status === "upcoming" && reservation.tableId && (
            <button 
              onClick={() => onSeatGuest(reservation)}
              className="px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
            >
              Seat Guest
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

  const handleSeatGuest = (reservation: Reservation) => {
    // Update reservation status to seated
    setReservations(prev => 
      prev.map(r => r.id === reservation.id ? { ...r, status: "seated" as const } : r)
    );
    // Update selected reservation state
    setSelectedReservation(prev => prev ? { ...prev, status: "seated" as const } : null);
    
    // Navigate to table order details for the assigned table
    if (reservation.tableId) {
      navigate(`/tableorder/${reservation.tableId}`);
    }
  };

  const handleBackToTables = () => {
    // Navigate back to TableOrder without opening reservations panel
    navigate("/tableorder");
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
      {/* Header - Navigation only */}
      <div className="flex-shrink-0 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-sm">
        <div className="flex items-center px-6 py-3">
          {/* Left: Back to Tables + Reservations Title (navigation cluster) */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToTables}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Tables</span>
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                <CalendarIcon className="w-4 h-4 text-orange-400" />
              </div>
              <h1 className="text-white text-lg font-semibold">Reservations</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Timeline */}
        <div className="w-[420px] border-r border-neutral-800 bg-neutral-900/50 flex flex-col">
          {/* List Header: Date Filter + Status Indicators */}
          <div className="px-4 py-3 border-b border-neutral-800 space-y-3">
            {/* Date Navigation Row */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevDay}
                className="w-7 h-7 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors"
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
                <PopoverContent className="w-auto p-0 bg-neutral-900 border-neutral-700" align="start">
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
                className="w-7 h-7 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </button>
            </div>
            
            {/* Status Indicators Row */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/10">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-blue-400 text-[11px] font-medium">{filteredReservations.length}</span>
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
              <span className="text-neutral-500 text-xs ml-auto uppercase tracking-wide">Timeline</span>
            </div>
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
              onSeatGuest={handleSeatGuest}
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
