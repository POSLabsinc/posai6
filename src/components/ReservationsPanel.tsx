import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { format, addDays, subDays, isToday, isTomorrow, isYesterday, isSameDay } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Clock, Users, MapPin, Calendar as CalendarIcon, AlertCircle, ChevronLeft, ChevronRight, Phone, FileText, CreditCard, ArrowLeft, Armchair, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type Reservation = {
  id: string;
  // Guest Info
  guestName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  partySize: number;
  time: string;
  date: Date;
  duration?: string;
  occasion?: string;
  guestNotes?: string;
  // Sitting
  floor?: string;
  area?: string;
  tableId: string | null;
  // Payment
  depositPaid?: boolean;
  depositAmount?: number;
  paymentStatus?: string;
  // Other
  status: "upcoming" | "seated" | "late";
  serviceType?: string;
  reservationSource?: string;
  assignedServer?: string;
  externalReference?: string;
  confirmationNumber?: string;
  dietaryRestrictions?: string;
  highChairCount?: number;
  kidsCount?: number;
  accessibilityRequirements?: string;
  visitNotes?: string;
  remindersEnabled?: boolean;
  notes?: string;
  specialRequests?: string;
};

// Helper to get dates
const today = new Date();
const yesterday = subDays(today, 1);
const tomorrow = addDays(today, 1);
const dayAfterTomorrow = addDays(today, 2);
const twoDaysAgo = subDays(today, 2);

// Mock reservations data with dates - includes ALL old POS fields
export const mockReservations: Reservation[] = [
  // Today's reservations
  { 
    id: "R1", 
    guestName: "Johnson Family", 
    firstName: "Robert",
    lastName: "Johnson",
    time: "6:30 PM", 
    partySize: 4, 
    tableId: "T4", 
    status: "upcoming", 
    phone: "(415) 555-1234", 
    email: "johnson@email.com", 
    notes: "Birthday celebration", 
    date: today, 
    depositPaid: true, 
    depositAmount: 50,
    duration: "2 hours",
    occasion: "Birthday",
    floor: "Main Floor",
    area: "Dining Room",
    serviceType: "Dine-In",
    reservationSource: "OpenTable",
    assignedServer: "Jessica M.",
    confirmationNumber: "OT-2024-78901",
    dietaryRestrictions: "Gluten-free (1 guest)",
    highChairCount: 0,
    kidsCount: 1,
    remindersEnabled: true,
    guestNotes: "VIP customer - 5th visit this month",
    paymentStatus: "Deposit Received"
  },
  { 
    id: "R2", 
    guestName: "Maria Rodriguez", 
    firstName: "Maria",
    lastName: "Rodriguez",
    time: "7:00 PM", 
    partySize: 2, 
    tableId: null, 
    status: "upcoming", 
    phone: "(415) 555-2345", 
    notes: "Anniversary dinner", 
    email: "maria.r@email.com", 
    date: today, 
    specialRequests: "Quiet table, window seat",
    duration: "1.5 hours",
    occasion: "Anniversary",
    serviceType: "Dine-In",
    reservationSource: "Phone",
    confirmationNumber: "PH-2024-12345",
    accessibilityRequirements: "Wheelchair accessible seating",
    remindersEnabled: true,
    visitNotes: "Celebrating 10 year anniversary"
  },
  { 
    id: "R3", 
    guestName: "Corporate Event - TechCo", 
    firstName: "James",
    lastName: "Wilson",
    time: "7:30 PM", 
    partySize: 8, 
    tableId: "T1", 
    status: "upcoming", 
    phone: "(415) 555-9999", 
    notes: "Corporate dinner, separate checks", 
    date: today, 
    depositPaid: true, 
    depositAmount: 200,
    duration: "3 hours",
    floor: "Main Floor",
    area: "Private Room",
    serviceType: "Private Event",
    reservationSource: "Direct Booking",
    assignedServer: "Michael T.",
    externalReference: "CORP-TECHCO-2024",
    confirmationNumber: "DB-2024-99887",
    dietaryRestrictions: "2 Vegetarian, 1 Vegan",
    remindersEnabled: true,
    paymentStatus: "Partial Payment"
  },
  { 
    id: "R4", 
    guestName: "David Chen", 
    firstName: "David",
    lastName: "Chen",
    time: "5:30 PM", 
    partySize: 3, 
    tableId: "T6", 
    status: "late", 
    phone: "(415) 555-3456", 
    date: today,
    duration: "1.5 hours",
    floor: "Main Floor",
    area: "Bar Area",
    serviceType: "Dine-In",
    reservationSource: "Yelp",
    confirmationNumber: "YP-2024-33445"
  },
  { 
    id: "R5", 
    guestName: "Sarah Miller", 
    firstName: "Sarah",
    lastName: "Miller",
    time: "6:00 PM", 
    partySize: 2, 
    tableId: "T3", 
    status: "seated", 
    phone: "(415) 555-4567", 
    date: today,
    duration: "2 hours",
    floor: "Main Floor",
    area: "Patio",
    serviceType: "Dine-In",
    reservationSource: "Walk-In",
    assignedServer: "Amanda K."
  },
  { 
    id: "R6", 
    guestName: "Williams Party", 
    firstName: "Thomas",
    lastName: "Williams",
    time: "8:00 PM", 
    partySize: 6, 
    tableId: "T2", 
    status: "upcoming", 
    date: today, 
    notes: "Large group",
    duration: "2.5 hours",
    floor: "Upper Floor",
    area: "Lounge",
    serviceType: "Dine-In",
    reservationSource: "OpenTable",
    confirmationNumber: "OT-2024-55667",
    kidsCount: 2,
    highChairCount: 1
  },
  { 
    id: "R7", 
    guestName: "Emily Davis", 
    firstName: "Emily",
    lastName: "Davis",
    time: "8:30 PM", 
    partySize: 2, 
    tableId: null, 
    status: "upcoming", 
    notes: "Window seat preferred", 
    date: today,
    duration: "1.5 hours",
    serviceType: "Dine-In",
    reservationSource: "Website"
  },
  
  // Tomorrow's reservations
  { 
    id: "R8", 
    guestName: "Thompson Wedding", 
    firstName: "Jennifer",
    lastName: "Thompson",
    time: "5:00 PM", 
    partySize: 12, 
    tableId: "T1", 
    status: "upcoming", 
    notes: "Rehearsal dinner", 
    date: tomorrow, 
    depositPaid: true, 
    depositAmount: 500, 
    specialRequests: "Champagne toast, private room",
    duration: "4 hours",
    occasion: "Wedding Rehearsal",
    floor: "Upper Floor",
    area: "Private Dining",
    serviceType: "Private Event",
    reservationSource: "Direct Booking",
    assignedServer: "Jessica M.",
    externalReference: "WED-THOMPSON-2024",
    confirmationNumber: "DB-2024-11223",
    dietaryRestrictions: "3 Vegetarian, 1 Nut Allergy",
    remindersEnabled: true,
    paymentStatus: "Fully Paid",
    visitNotes: "Bride's family - coordinate with kitchen for surprise dessert"
  },
  { id: "R9", guestName: "Mike & Lisa", firstName: "Mike", lastName: "Johnson", time: "6:30 PM", partySize: 2, tableId: "T3", status: "upcoming", phone: "(415) 555-7890", date: tomorrow, duration: "2 hours", serviceType: "Dine-In", reservationSource: "OpenTable" },
  { id: "R10", guestName: "Birthday - Alex", firstName: "Alex", lastName: "Brown", time: "7:00 PM", partySize: 6, tableId: null, status: "upcoming", notes: "Surprise party, need cake", date: tomorrow, occasion: "Birthday", duration: "2.5 hours", serviceType: "Dine-In", reservationSource: "Phone", kidsCount: 3 },
  { id: "R11", guestName: "Patel Family", firstName: "Raj", lastName: "Patel", time: "7:30 PM", partySize: 5, tableId: "T5", status: "upcoming", date: tomorrow, duration: "2 hours", serviceType: "Dine-In", reservationSource: "Website", dietaryRestrictions: "Vegetarian (all guests)" },
  { id: "R12", guestName: "Business Dinner", firstName: "Catherine", lastName: "Lee", time: "8:00 PM", partySize: 4, tableId: "T2", status: "upcoming", notes: "Private room preferred", date: tomorrow, duration: "2 hours", serviceType: "Business Dinner", reservationSource: "Direct Booking", assignedServer: "Michael T." },
  
  // Day after tomorrow
  { id: "R13", guestName: "Garcia Anniversary", firstName: "Carlos", lastName: "Garcia", time: "6:00 PM", partySize: 2, tableId: "T4", status: "upcoming", notes: "25th anniversary", date: dayAfterTomorrow, occasion: "Anniversary", duration: "2.5 hours", serviceType: "Dine-In", reservationSource: "Phone", depositPaid: true, depositAmount: 100 },
  { id: "R14", guestName: "Tech Startup Lunch", firstName: "Steve", lastName: "Morris", time: "12:00 PM", partySize: 8, tableId: null, status: "upcoming", date: dayAfterTomorrow, duration: "1.5 hours", serviceType: "Business Lunch", reservationSource: "OpenTable" },
  { id: "R15", guestName: "Retirement Party", firstName: "William", lastName: "Baker", time: "7:00 PM", partySize: 15, tableId: "T1", status: "upcoming", notes: "Large group, decorations", date: dayAfterTomorrow, depositPaid: true, depositAmount: 300, occasion: "Retirement", duration: "3 hours", floor: "Upper Floor", area: "Private Dining", serviceType: "Private Event", reservationSource: "Direct Booking" },
  
  // Yesterday (historical)
  { id: "R16", guestName: "Smith Reunion", firstName: "John", lastName: "Smith", time: "6:00 PM", partySize: 10, tableId: "T1", status: "seated", date: yesterday, duration: "3 hours", serviceType: "Private Event" },
  { id: "R17", guestName: "Date Night - Couple", firstName: "Amanda", lastName: "White", time: "7:30 PM", partySize: 2, tableId: "T3", status: "seated", date: yesterday, duration: "2 hours", serviceType: "Dine-In" },
  { id: "R18", guestName: "Late Guest", firstName: "Richard", lastName: "Moore", time: "8:00 PM", partySize: 4, tableId: "T5", status: "late", date: yesterday, duration: "1.5 hours", serviceType: "Dine-In" },
  
  // Two days ago
  { id: "R19", guestName: "Book Club", firstName: "Patricia", lastName: "Taylor", time: "5:30 PM", partySize: 6, tableId: "T2", status: "seated", date: twoDaysAgo, duration: "2 hours", serviceType: "Group Event" },
  { id: "R20", guestName: "Wine Tasting Group", firstName: "Daniel", lastName: "Anderson", time: "7:00 PM", partySize: 8, tableId: "T1", status: "seated", date: twoDaysAgo, duration: "2.5 hours", serviceType: "Wine Tasting Event" },
];

interface ReservationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  reservations: Reservation[];
  onReservationClick: (reservation: Reservation) => void;
  onAssignTable: (reservationId: string, tableId: string) => void;
  availableTables: { id: string; seats: number }[];
  initialDate?: Date;
  initialReservationId?: string;
}

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

// Reservation Details Component
const ReservationDetails = ({
  reservation,
  onBack,
  onAssignTable,
  availableTables,
}: {
  reservation: Reservation;
  onBack: () => void;
  onAssignTable: (reservationId: string, tableId: string) => void;
  availableTables: { id: string; seats: number }[];
}) => {
  const config = statusConfig[reservation.status];
  const isUnassigned = !reservation.tableId;

  return (
    <div className="flex flex-col h-full">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-neutral-400" />
        </button>
        <div className="flex-1">
          <h3 className="text-white font-semibold">{reservation.guestName}</h3>
          <p className="text-neutral-500 text-xs">{reservation.time} • {getDateLabel(reservation.date)}</p>
        </div>
        <Badge 
          variant="outline" 
          className={`${config.bg} ${config.text} border-0 text-xs`}
        >
          {config.label}
        </Badge>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Guest Info Section */}
          <div className="space-y-3">
            <h4 className="text-neutral-400 text-xs font-semibold uppercase tracking-wide">Guest Information</h4>
            <div className="bg-neutral-800/50 rounded-lg p-3 space-y-3">
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
            <div className="bg-neutral-800/50 rounded-lg p-3">
              {reservation.tableId ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Armchair className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Table {reservation.tableId}</p>
                    <p className="text-neutral-500 text-xs">Assigned</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-amber-400">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Unassigned – Tap a table to assign</span>
                  </div>
                  {availableTables.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-700">
                      {availableTables.map((table) => (
                        <button
                          key={table.id}
                          onClick={() => onAssignTable(reservation.id, table.id)}
                          className="px-3 py-1.5 rounded-lg bg-neutral-700 hover:bg-amber-500 text-white text-sm font-medium transition-colors"
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
            <div className="bg-neutral-800/50 rounded-lg p-3">
              {reservation.depositPaid ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span className="text-white text-sm">Deposit Paid</span>
                  </div>
                  <span className="text-emerald-400 font-semibold">${reservation.depositAmount}</span>
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
              <div className="bg-neutral-800/50 rounded-lg p-3 space-y-2">
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
            <div className="grid grid-cols-2 gap-2">
              {reservation.status === "upcoming" && reservation.tableId && (
                <button className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors">
                  Seat Guest
                </button>
              )}
              {reservation.status === "late" && (
                <button className="px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors">
                  Call Guest
                </button>
              )}
              <button className="px-4 py-2.5 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-medium transition-colors">
                Edit Reservation
              </button>
              <button className="px-4 py-2.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-medium transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

// Compact Reservation Card for Timeline
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
      className={`pl-3 pr-4 py-2 rounded-lg border cursor-pointer transition-all hover:bg-white/5 overflow-hidden ${
        reservation.status === "late" 
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
  initialDate,
  initialReservationId,
}: ReservationsPanelProps) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(() => initialDate || new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(() => {
    if (initialReservationId) {
      return reservations.find(r => r.id === initialReservationId) || null;
    }
    return null;
  });
  const currentHour = getCurrentHour();
  const isTodaySelected = isToday(selectedDate);

  // Update state if initial values change (coming back from full view)
  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate]);

  useEffect(() => {
    if (initialReservationId) {
      const res = reservations.find(r => r.id === initialReservationId);
      if (res) {
        setSelectedReservation(res);
        onReservationClick(res);
      }
    }
  }, [initialReservationId, reservations, onReservationClick]);
  
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
    // Navigate to full reservations view with this reservation selected
    navigate("/reservations", {
      state: {
        selectedDate: reservation.date.toISOString(),
        selectedReservationId: reservation.id,
      }
    });
  };

  const handleBackToTimeline = () => {
    setSelectedReservation(null);
  };

  // Reset selection when panel closes
  const handleClose = () => {
    setSelectedReservation(null);
    onClose();
  };

  // Navigate to full reservations view with state preservation
  const handleExpandToFullView = () => {
    navigate("/reservations", {
      state: {
        selectedDate: selectedDate.toISOString(),
        selectedReservationId: selectedReservation?.id,
      }
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent 
        side="right" 
        hideCloseButton
        className="w-[400px] sm:w-[420px] bg-neutral-900 border-neutral-800 p-0"
      >
        {selectedReservation ? (
          // Reservation Details View
          <ReservationDetails
            reservation={selectedReservation}
            onBack={handleBackToTimeline}
            onAssignTable={(resId, tableId) => {
              onAssignTable(resId, tableId);
              setSelectedReservation(prev => prev ? { ...prev, tableId } : null);
            }}
            availableTables={availableTables}
          />
        ) : (
          // Timeline View
          <>
            <SheetHeader className="px-4 pt-4 pb-3 border-b border-neutral-800">
              {/* Title Row with Expand Button - TOP */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4 text-orange-400" />
                </div>
                <div className="flex-1">
                  <SheetTitle className="text-white text-base font-semibold">Reservations</SheetTitle>
                  <p className="text-neutral-500 text-xs">{filteredReservations.length} {isTodaySelected ? "today" : "on this date"}</p>
                </div>
                {/* Expand to Full View Button */}
                <button
                  onClick={handleExpandToFullView}
                  className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors"
                  title="Open full view"
                >
                  <Maximize2 className="w-4 h-4 text-neutral-400" />
                </button>
              </div>
              
              {/* Date Navigation Row - Below Title */}
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

              {/* Quick Stats - Below Date Filter */}
              <div className="flex items-center gap-2">
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
              <div className="pl-3 pr-6 py-3 space-y-3">
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
                            onReservationClick={handleReservationSelect}
                            onAssignTable={onAssignTable}
                            availableTables={availableTables}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
                
                {filteredReservations.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CalendarIcon className="w-10 h-10 text-neutral-700 mb-3" />
                    <h4 className="text-neutral-400 font-medium text-sm">No Reservations</h4>
                    <p className="text-neutral-600 text-xs mt-1">{getDateLabel(selectedDate)}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ReservationsPanel;
