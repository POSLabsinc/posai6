import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { format, addDays, subDays, isToday, isTomorrow, isYesterday, isSameDay } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Clock, Users, MapPin, Calendar as CalendarIcon, AlertCircle, 
  ChevronLeft, ChevronRight, Phone, FileText, CreditCard, 
  ArrowLeft, Armchair, Mail, Timer, Gift, Building, Globe,
  User, Hash, Utensils, Baby, Accessibility, Bell, StickyNote, MessageSquare,
  ExternalLink, CheckCircle2, XCircle, Map as MapIcon, Grid, X,
  List, ListFilter, ClipboardList, Flag, PauseCircle, PlayCircle, Send,
  Cake, Heart, Wallet
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { mockReservations, type Reservation } from "@/components/ReservationsPanel";
import { EditReservationDialog } from "@/components/EditReservationDialog";
import TableMapPanel from "@/components/TableMapPanel";

// Status configurations
const statusConfig: Record<string, { bg: string; text: string; border: string; label: string; dot: string }> = {
  upcoming: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", label: "Upcoming", dot: "bg-blue-500" },
  seated: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", label: "Seated", dot: "bg-emerald-500" },
  late: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30", label: "Late", dot: "bg-red-500" },
  booked: { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/30", label: "Booked", dot: "bg-teal-500" },
  completed: { bg: "bg-neutral-500/10", text: "text-neutral-400", border: "border-neutral-500/30", label: "Completed", dot: "bg-neutral-500" },
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

// Helper to calculate time context (e.g., "In 30 min", "Overdue", etc.)
const getTimeContext = (reservation: Reservation, selectedDate: Date): { label: string; className: string } | null => {
  const now = new Date();
  
  // Only show time context for today
  if (!isToday(selectedDate)) return null;
  
  // Parse reservation time
  const match = reservation.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return null;
  
  let hour = parseInt(match[1]);
  const min = parseInt(match[2]);
  const isPM = match[3].toUpperCase() === "PM";
  if (isPM && hour !== 12) hour += 12;
  if (!isPM && hour === 12) hour = 0;
  
  const resTime = new Date();
  resTime.setHours(hour, min, 0, 0);
  
  const diffMs = resTime.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  
  if (reservation.status === "seated") {
    // Calculate seated duration
    const seatedMins = Math.abs(diffMins);
    if (seatedMins >= 60) {
      const hours = Math.floor(seatedMins / 60);
      const mins = seatedMins % 60;
      return { label: `Seated ${hours}h ${mins}m`, className: "text-emerald-400" };
    }
    return { label: `Seated ${seatedMins}m`, className: "text-emerald-400" };
  }
  
  if (reservation.status === "late" || diffMins < -15) {
    const overdueMins = Math.abs(diffMins);
    return { label: `Overdue ${overdueMins}m`, className: "text-red-400 font-medium" };
  }
  
  if (diffMins <= 0 && diffMins > -15) {
    return { label: "Running Late", className: "text-amber-400" };
  }
  
  if (diffMins > 0 && diffMins <= 30) {
    return { label: `In ${diffMins} min`, className: "text-blue-400" };
  }
  
  if (diffMins > 30 && diffMins <= 60) {
    return { label: `In ${diffMins} min`, className: "text-neutral-400" };
  }
  
  return null;
};

// Enhanced Reservation Card for Timeline with Host-Focused Signals
const ReservationCard = ({
  reservation,
  isSelected,
  onReservationClick,
  selectedDate,
}: {
  reservation: Reservation;
  isSelected: boolean;
  onReservationClick: (reservation: Reservation) => void;
  selectedDate: Date;
}) => {
  const config = statusConfig[reservation.status] || statusConfig.upcoming;
  const isUnassigned = !reservation.tableId;
  
  // Determine signals with clear hierarchy
  const hasOccasion = !!reservation.occasion;
  const isVIP = reservation.isVIP || reservation.relationshipTags?.includes("VIP");
  const isRegular = reservation.relationshipTags?.includes("Regular") || reservation.relationshipTags?.includes("Friend of Owner");
  const isCorporate = reservation.company || reservation.relationshipTags?.includes("Corporate");
  const hasMessage = !!reservation.guestMessage;
  const hasNotes = !!(reservation.notes || reservation.guestNotes || reservation.visitNotes);
  const hasDeposit = reservation.depositPaid || reservation.depositRequested;
  const timeContext = getTimeContext(reservation, selectedDate);
  
  // Determine the single most important relationship indicator
  const getRelationshipBadge = () => {
    if (isVIP) return { label: "VIP", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
    if (reservation.relationshipTags?.includes("Friend of Owner")) return { label: "Friend of Owner", className: "bg-purple-500/20 text-purple-400 border-purple-500/30" };
    if (isRegular) return { label: "Regular", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
    if (isCorporate) return { label: "Corporate", className: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" };
    return null;
  };
  
  // Get deposit status
  const getDepositStatus = () => {
    if (reservation.depositPaid) return { label: "Deposit Paid", className: "text-emerald-400" };
    if (reservation.depositRequested) return { label: "Deposit Pending", className: "text-amber-400" };
    if (reservation.paymentStatus === "Not paid") return { label: "Not Paid", className: "text-red-400" };
    return null;
  };
  
  const relationshipBadge = getRelationshipBadge();
  const depositStatus = getDepositStatus();
  
  return (
    <div
      onClick={() => onReservationClick(reservation)}
      className={`pl-3 pr-3 py-2.5 rounded-lg border cursor-pointer transition-all hover:bg-white/5 overflow-hidden ${
        isSelected 
          ? "border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/30"
          : reservation.status === "late" 
            ? "border-red-500/40 bg-red-500/5 ring-1 ring-red-500/30" 
            : isUnassigned
              ? "border-amber-500/40 bg-amber-500/5"
              : "border-neutral-700/50 bg-neutral-800/30"
      }`}
    >
      {/* Three Row Layout for Information Hierarchy */}
      <div className="flex flex-col gap-1.5">
        
        {/* Row 1: Primary - Status, Name, Relationship Badge */}
        <div className="flex items-center gap-2">
          {/* Status Dot - color communicates status */}
          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${config.dot} ${
            reservation.status === "late" ? "animate-pulse" : ""
          }`} />
          
          {/* Guest Name - Primary Element */}
          <span className="text-white text-sm font-medium truncate flex-1 min-w-0">
            {reservation.guestName}
          </span>
          
          {/* Single Relationship Badge (Most Important One Only) */}
          {relationshipBadge && (
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex-shrink-0 ${relationshipBadge.className}`}>
              {relationshipBadge.label}
            </span>
          )}
        </div>
        
        {/* Row 2: Time, Party, Table, Time Context */}
        <div className="flex items-center gap-3 pl-4">
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
              <span className="text-amber-400 text-xs font-semibold">Unassigned</span>
            )}
          </div>
          
          {/* Time Context (Spacer + Right Aligned) */}
          {timeContext && (
            <>
              <div className="flex-1" />
              <span className={`text-[10px] font-medium ${timeContext.className}`}>
                {timeContext.label}
              </span>
            </>
          )}
        </div>
        
        {/* Row 3: Signal Icons & Labels (Priority Ordered) */}
        {(hasOccasion || hasMessage || hasDeposit || hasNotes) && (
          <div className="flex items-center gap-2 pl-4 flex-wrap">
            {/* 1. Special Occasion - Elevated Label (not just icon) */}
            {hasOccasion && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-pink-500/15 border border-pink-500/25">
                <Gift className="w-3 h-3 text-pink-400" />
                <span className="text-pink-400 text-[10px] font-semibold">{reservation.occasion}</span>
              </div>
            )}
            
            {/* 2. Guest Message - Highlighted (Guest took time to write) */}
            {hasMessage && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/15 border border-blue-500/25" title={reservation.guestMessage}>
                <FileText className="w-3 h-3 text-blue-400" />
                <span className="text-blue-400 text-[10px] font-medium">Message</span>
              </div>
            )}
            
            {/* 3. Payment/Deposit Status - Explicit Text */}
            {depositStatus && (
              <div className="flex items-center gap-1">
                <CreditCard className={`w-3 h-3 ${
                  reservation.depositPaid ? "text-emerald-400" : 
                  reservation.depositRequested ? "text-amber-400" : "text-red-400"
                }`} />
                <span className={`text-[10px] font-medium ${depositStatus.className}`}>
                  {depositStatus.label}
                </span>
              </div>
            )}
            
            {/* 4. Internal Notes (Lower Priority than Guest Message) */}
            {hasNotes && !hasMessage && (
              <div className="flex items-center gap-1" title="Has notes">
                <StickyNote className="w-3 h-3 text-neutral-500" />
              </div>
            )}
          </div>
        )}
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

// Tabbed Reservation Details Panel (eatOS POS parity)
const ReservationDetailsPanel = ({
  reservation,
  availableTables,
  onAssignTable,
  onSeatGuest,
  onEditReservation,
  onCancelReservation,
  onClose,
}: {
  reservation: Reservation;
  availableTables: { id: string; seats: number }[];
  onAssignTable: (reservationId: string, tableId: string) => void;
  onSeatGuest: (reservation: Reservation) => void;
  onEditReservation: (reservation: Reservation) => void;
  onCancelReservation: (reservation: Reservation) => void;
  onClose: () => void;
}) => {
  const config = statusConfig[reservation.status] || statusConfig.upcoming;
  const [activeTab, setActiveTab] = useState("guest");

  const nameParts = reservation.guestName.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const tabs = [
    { id: "guest", label: "Guest Info" },
    { id: "sitting", label: "Sitting" },
    { id: "payment", label: "Payment" },
    { id: "other", label: "Other" },
  ];

  return (
    <div className="h-full flex flex-col bg-neutral-900">
      {/* Header: Name, Time, Status, Close */}
      <div className="px-6 pt-5 pb-0 border-b border-neutral-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-white text-lg font-semibold">{reservation.guestName}</h2>
            <p className="text-neutral-400 text-sm">
              {reservation.time} • {isToday(reservation.date) ? "Today" : format(reservation.date, "MMM d, yyyy")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} border ${config.border}`}>
              {config.label}
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-neutral-400" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2.5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "text-white border-orange-500"
                  : "text-neutral-500 border-transparent hover:text-neutral-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <ScrollArea className="flex-1">
        <div className="px-6 py-4">
          {activeTab === "guest" && (
            <div className="space-y-0 divide-y divide-neutral-800">
              <FieldRow icon={User} label="Guest Name (First)" value={firstName} />
              <FieldRow icon={User} label="Guest Name (Last)" value={lastName} />
              <FieldRow icon={Mail} label="Email" value={reservation.email} />
              <FieldRow icon={Phone} label="Phone Number" value={reservation.phone} />
              <FieldRow icon={Users} label="Guest Count (Party Size)" value={reservation.partySize ? `${reservation.partySize} guests` : undefined} />
              <FieldRow
                icon={CalendarIcon}
                label="Reservation Date & Time"
                value={`${format(reservation.date, "EEEE, MMMM d, yyyy")} at ${reservation.time}`}
              />
              <FieldRow icon={Timer} label="Duration" value={reservation.duration || "Not specified"} />
              <FieldRow icon={Gift} label="Occasion" value={reservation.occasion} />
              <FieldRow icon={StickyNote} label="Guest Notes" value={reservation.guestNotes || reservation.notes} />
            </div>
          )}

          {activeTab === "sitting" && (
            <div className="space-y-0 divide-y divide-neutral-800">
              <FieldRow icon={Building} label="Floor" value={reservation.floor || "Main"} />
              <FieldRow icon={MapPin} label="Area" value={reservation.area} />
              <FieldRow icon={Armchair} label="Table" value={reservation.tableId ? `Table ${reservation.tableId}` : "Unassigned"} 
                valueClass={reservation.tableId ? "text-white" : "text-amber-400"} />
            </div>
          )}

          {activeTab === "payment" && (
            <div className="space-y-0 divide-y divide-neutral-800">
              <FieldRow
                icon={CreditCard}
                label="Deposit"
                value={
                  reservation.depositRequested
                    ? `$${reservation.depositAmount || 0}`
                    : "No deposit required"
                }
              />
              <FieldRow
                icon={CreditCard}
                label="Status"
                value={
                  reservation.depositPaid
                    ? "Paid"
                    : reservation.depositRequested
                    ? "Pending"
                    : "N/A"
                }
                valueClass={
                  reservation.depositPaid
                    ? "text-emerald-400"
                    : reservation.depositRequested
                    ? "text-amber-400"
                    : "text-neutral-400"
                }
              />
            </div>
          )}

          {activeTab === "other" && (
            <div className="space-y-0 divide-y divide-neutral-800">
              <FieldRow icon={Utensils} label="Service Type" value={reservation.serviceType} />
              <FieldRow icon={Globe} label="Source" value={(reservation as any).source} />
              <FieldRow icon={User} label="Server" value={(reservation as any).server} />
              <FieldRow icon={Hash} label="Reference" value={reservation.confirmationNumber} />
              <FieldRow icon={Utensils} label="Dietary" value={reservation.dietaryRestrictions} />
              <BooleanFieldRow icon={Baby} label="Kids / High Chair" value={reservation.highChairCount ? true : undefined} />
              <BooleanFieldRow icon={Accessibility} label="Accessibility" value={!!reservation.accessibilityRequirements} />
              <FieldRow icon={Bell} label="Reminders" value={(reservation as any).reminders?.join(", ")} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bottom Actions */}
      <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900/50">
        <div className="flex gap-3">
          {reservation.status !== "seated" && reservation.tableId && (
            <button
              onClick={() => onSeatGuest(reservation)}
              className="flex-1 px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
            >
              Seat Guest
            </button>
          )}
          <button
            onClick={() => onEditReservation(reservation)}
            className="flex-1 px-4 py-3 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-medium transition-colors"
          >
            Edit Reservation
          </button>
          <button
            onClick={() => onCancelReservation(reservation)}
            className="flex-1 px-4 py-3 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-red-400 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};


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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [reservationToEdit, setReservationToEdit] = useState<Reservation | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [reservationToCancel, setReservationToCancel] = useState<Reservation | null>(null);
  const [mapViewMode, setMapViewMode] = useState<"floorplan" | "grid">("floorplan");
  
  // Utility bar state
  const [listViewMode, setListViewMode] = useState<"grouped" | "flat">("grouped");
  const [reservationsPaused, setReservationsPaused] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);
  
  // Mock waitlist count (would come from real data)
  const waitlistCount = 3;
  
  const currentHour = getCurrentHour();
  const isTodaySelected = isToday(selectedDate);
  
  // Filter reservations by selected date
  const dateFilteredReservations = useMemo(() => {
    return reservations.filter(r => isSameDay(r.date, selectedDate));
  }, [reservations, selectedDate]);
  
  // Quick filter counts
  const birthdayCount = dateFilteredReservations.filter(r => r.occasion?.toLowerCase().includes("birthday")).length;
  const anniversaryCount = dateFilteredReservations.filter(r => r.occasion?.toLowerCase().includes("anniversary")).length;
  const messageCount = dateFilteredReservations.filter(r => !!r.guestMessage).length;
  const depositPendingCount = dateFilteredReservations.filter(r => r.depositRequested && !r.depositPaid).length;
  
  // Apply quick filter
  const filteredReservations = useMemo(() => {
    if (!activeQuickFilter) return dateFilteredReservations;
    
    switch (activeQuickFilter) {
      case "birthday":
        return dateFilteredReservations.filter(r => r.occasion?.toLowerCase().includes("birthday"));
      case "anniversary":
        return dateFilteredReservations.filter(r => r.occasion?.toLowerCase().includes("anniversary"));
      case "message":
        return dateFilteredReservations.filter(r => !!r.guestMessage);
      case "deposit":
        return dateFilteredReservations.filter(r => r.depositRequested && !r.depositPaid);
      default:
        return dateFilteredReservations;
    }
  }, [dateFilteredReservations, activeQuickFilter]);
  
  // Group by hour for timeline view
  const groupedReservations = groupByHour(filteredReservations);
  const sortedHours = Array.from(groupedReservations.keys()).sort((a, b) => a - b);

  const upcomingCount = dateFilteredReservations.filter(r => r.status === "upcoming").length;
  const lateCount = dateFilteredReservations.filter(r => r.status === "late").length;
  const unassignedCount = dateFilteredReservations.filter(r => !r.tableId).length;

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

  const { toast } = useToast();

  const handleSeatGuest = (reservation: Reservation) => {
    // Update reservation status to seated
    setReservations(prev => 
      prev.map(r => r.id === reservation.id ? { ...r, status: "seated" as const } : r)
    );
    // Update selected reservation state
    setSelectedReservation(prev => prev ? { ...prev, status: "seated" as const } : null);
    
    toast({
      title: "Guest Seated",
      description: `${reservation.guestName} has been seated at Table ${reservation.tableId}`,
    });
    
    // Navigate to table order details for the assigned table
    if (reservation.tableId) {
      navigate(`/tableorder/${reservation.tableId}`);
    }
  };

  const handleBackToTables = () => {
    // Navigate back to TableOrder without opening reservations panel
    navigate("/tableorder");
  };

  const handleEditReservation = (reservation: Reservation) => {
    setReservationToEdit(reservation);
    setEditDialogOpen(true);
  };

  const handleSaveReservation = (updatedReservation: Reservation) => {
    setReservations(prev => 
      prev.map(r => r.id === updatedReservation.id ? updatedReservation : r)
    );
    // Update selected reservation if it's the one being edited
    if (selectedReservation?.id === updatedReservation.id) {
      setSelectedReservation(updatedReservation);
    }
    
    toast({
      title: "Reservation Updated",
      description: `Changes saved for ${updatedReservation.guestName}'s reservation`,
    });
  };

  const handleCancelReservation = (reservation: Reservation) => {
    setReservationToCancel(reservation);
    setCancelDialogOpen(true);
  };

  const confirmCancelReservation = () => {
    if (reservationToCancel) {
      const guestName = reservationToCancel.guestName;
      // Remove the reservation from the list
      setReservations(prev => prev.filter(r => r.id !== reservationToCancel.id));
      // Clear selection if the cancelled reservation was selected
      if (selectedReservation?.id === reservationToCancel.id) {
        setSelectedReservation(null);
      }
      setCancelDialogOpen(false);
      setReservationToCancel(null);
      
      toast({
        title: "Reservation Cancelled",
        description: `${guestName}'s reservation has been cancelled`,
        variant: "destructive",
      });
    }
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
      {/* Header - Navigation + Layout Toggle */}
      <div className="flex-shrink-0 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-3">
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
          
          {/* Right: Layout Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-neutral-800 rounded-lg p-1">
              <button
                onClick={() => setMapViewMode("floorplan")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mapViewMode === "floorplan" 
                    ? "bg-neutral-700 text-white" 
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <MapIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Floor Plan</span>
              </button>
              <button
                onClick={() => setMapViewMode("grid")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mapViewMode === "grid" 
                    ? "bg-neutral-700 text-white" 
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Grid className="w-4 h-4" />
                <span className="hidden sm:inline">Grid</span>
              </button>
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
              <span className="text-neutral-500 text-xs ml-auto uppercase tracking-wide">
                {activeQuickFilter ? activeQuickFilter.charAt(0).toUpperCase() + activeQuickFilter.slice(1) : "Timeline"}
              </span>
            </div>
            
            {/* Utility Bar - Below Status Indicators */}
            <TooltipProvider delayDuration={200}>
              <div className="flex items-center justify-between gap-2 pt-2">
                {/* Left: View Controls + Quick Filters */}
                <div className="flex items-center gap-1">
                  {/* View / Group Toggle */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setListViewMode(listViewMode === "grouped" ? "flat" : "grouped")}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          listViewMode === "grouped" 
                            ? "bg-neutral-800 text-white" 
                            : "bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                        }`}
                      >
                        {listViewMode === "grouped" ? (
                          <ListFilter className="w-4 h-4" />
                        ) : (
                          <List className="w-4 h-4" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-neutral-800 text-white border-neutral-700">
                      <p>{listViewMode === "grouped" ? "Switch to Flat List" : "Switch to Time-Grouped"}</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  {/* Waitlist Access */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="relative w-8 h-8 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 flex items-center justify-center transition-colors group">
                        <ClipboardList className="w-4 h-4 text-neutral-400 group-hover:text-white" />
                        {waitlistCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-[10px] font-bold text-black flex items-center justify-center">
                            {waitlistCount}
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-neutral-800 text-white border-neutral-700">
                      <p>Waitlist ({waitlistCount} guests)</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  {/* Alerts / Flags */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="relative w-8 h-8 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 flex items-center justify-center transition-colors group">
                        <Flag className={`w-4 h-4 ${lateCount > 0 ? "text-red-400" : "text-neutral-400 group-hover:text-white"}`} />
                        {(lateCount > 0 || unassignedCount > 0) && (
                          <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                            lateCount > 0 ? "bg-red-500 text-white" : "bg-amber-500 text-black"
                          }`}>
                            {lateCount + unassignedCount}
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-neutral-800 text-white border-neutral-700">
                      <div className="space-y-1">
                        <p className="font-medium">Alerts</p>
                        {lateCount > 0 && <p className="text-red-400 text-xs">{lateCount} Late guests</p>}
                        {unassignedCount > 0 && <p className="text-amber-400 text-xs">{unassignedCount} Unassigned</p>}
                        {lateCount === 0 && unassignedCount === 0 && <p className="text-neutral-400 text-xs">No alerts</p>}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                  
                  {/* Divider */}
                  <div className="w-px h-5 bg-neutral-700 mx-1" />
                  
                  {/* Quick Filter: Birthday */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        onClick={() => setActiveQuickFilter(activeQuickFilter === "birthday" ? null : "birthday")}
                        className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          activeQuickFilter === "birthday"
                            ? "bg-pink-500/20 text-pink-400"
                            : "bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                        }`}
                      >
                        <Cake className="w-4 h-4" />
                        {birthdayCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-500 text-[10px] font-bold text-white flex items-center justify-center">
                            {birthdayCount}
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-neutral-800 text-white border-neutral-700">
                      <p>Birthdays ({birthdayCount})</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  {/* Quick Filter: Anniversary */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        onClick={() => setActiveQuickFilter(activeQuickFilter === "anniversary" ? null : "anniversary")}
                        className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          activeQuickFilter === "anniversary"
                            ? "bg-rose-500/20 text-rose-400"
                            : "bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                        }`}
                      >
                        <Heart className="w-4 h-4" />
                        {anniversaryCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
                            {anniversaryCount}
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-neutral-800 text-white border-neutral-700">
                      <p>Anniversaries ({anniversaryCount})</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  {/* Quick Filter: Guest Message */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        onClick={() => setActiveQuickFilter(activeQuickFilter === "message" ? null : "message")}
                        className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          activeQuickFilter === "message"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                        }`}
                      >
                        <MessageSquare className="w-4 h-4" />
                        {messageCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-[10px] font-bold text-white flex items-center justify-center">
                            {messageCount}
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-neutral-800 text-white border-neutral-700">
                      <p>Guest Messages ({messageCount})</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  {/* Quick Filter: Deposit Pending */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        onClick={() => setActiveQuickFilter(activeQuickFilter === "deposit" ? null : "deposit")}
                        className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          activeQuickFilter === "deposit"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                        }`}
                      >
                        <Wallet className="w-4 h-4" />
                        {depositPendingCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-[10px] font-bold text-black flex items-center justify-center">
                            {depositPendingCount}
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-neutral-800 text-white border-neutral-700">
                      <p>Deposit Pending ({depositPendingCount})</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                
                {/* Right: Quick Actions + Manager Controls */}
                <div className="flex items-center gap-1">
                  {/* Jump to Floor */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        onClick={() => setSelectedReservation(null)}
                        className="w-8 h-8 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 flex items-center justify-center transition-colors group"
                      >
                        <MapIcon className="w-4 h-4 text-neutral-400 group-hover:text-white" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-neutral-800 text-white border-neutral-700">
                      <p>Jump to Floor Map</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  {/* Guest Communication */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="w-8 h-8 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 flex items-center justify-center transition-colors group">
                        <Send className="w-4 h-4 text-neutral-400 group-hover:text-white" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-neutral-800 text-white border-neutral-700">
                      <p>Message Guests</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  {/* Reservation Control - Pause/Resume */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          setReservationsPaused(!reservationsPaused);
                          toast({
                            title: reservationsPaused ? "Reservations Resumed" : "Reservations Paused",
                            description: reservationsPaused 
                              ? "New reservations are now being accepted" 
                              : "New reservations are temporarily disabled",
                          });
                        }}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          reservationsPaused 
                            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" 
                            : "bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                        }`}
                      >
                        {reservationsPaused ? (
                          <PlayCircle className="w-4 h-4" />
                        ) : (
                          <PauseCircle className="w-4 h-4" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-neutral-800 text-white border-neutral-700">
                      <p>{reservationsPaused ? "Resume Reservations" : "Pause New Reservations"}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              
              {/* Active Filter Indicator + Clear */}
              {activeQuickFilter && (
                <div className="flex items-center justify-between mt-2 px-2 py-1.5 rounded-md bg-neutral-800/50">
                  <span className="text-neutral-300 text-xs">
                    Showing: <span className="font-medium text-white">{activeQuickFilter.charAt(0).toUpperCase() + activeQuickFilter.slice(1)}</span>
                    <span className="text-neutral-500 ml-1">({filteredReservations.length})</span>
                  </span>
                  <button 
                    onClick={() => setActiveQuickFilter(null)}
                    className="text-neutral-400 hover:text-white text-xs flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </button>
                </div>
              )}
              
              {/* Paused Banner */}
              {reservationsPaused && (
                <div className="mt-2 px-3 py-1.5 rounded-md bg-red-500/15 border border-red-500/30 flex items-center justify-center gap-2">
                  <PauseCircle className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-red-400 text-xs font-medium">New reservations paused</span>
                </div>
              )}
            </TooltipProvider>
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
                          selectedDate={selectedDate}
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

        {/* Right Column: Table Map or Reservation Details */}
        <div className="flex-1 bg-neutral-950">
          {selectedReservation ? (
            <ReservationDetailsPanel
              reservation={selectedReservation}
              availableTables={availableTables}
              onAssignTable={handleAssignTable}
              onSeatGuest={handleSeatGuest}
              onEditReservation={handleEditReservation}
              onCancelReservation={handleCancelReservation}
              onClose={() => setSelectedReservation(null)}
            />
          ) : (
            <TableMapPanel 
              viewMode={mapViewMode}
              selectedReservation={selectedReservation}
              onTableSelect={(tableId) => {
                console.log("Table selected:", tableId);
              }}
            />
          )}
        </div>
      </div>

      {/* Edit Reservation Dialog */}
      {reservationToEdit && (
        <EditReservationDialog
          reservation={reservationToEdit}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSave={handleSaveReservation}
          availableTables={availableTables}
        />
      )}

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="bg-neutral-900 border-neutral-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Cancel Reservation?</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              {reservationToCancel && (
                <>
                  Are you sure you want to cancel the reservation for{" "}
                  <span className="font-semibold text-white">{reservationToCancel.guestName}</span>{" "}
                  at <span className="font-semibold text-white">{reservationToCancel.time}</span>?
                  <br /><br />
                  This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700 hover:text-white">
              Keep Reservation
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelReservation}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              Cancel Reservation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FullReservationsView;
