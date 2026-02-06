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
  User, Hash, Utensils, Baby, Accessibility, Bell, StickyNote,
  ExternalLink, CheckCircle2, XCircle, Map as MapIcon, Grid, X
} from "lucide-react";
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

// Compact Reservation Card for Timeline with At-a-Glance Icons
const ReservationCard = ({
  reservation,
  isSelected,
  onReservationClick,
}: {
  reservation: Reservation;
  isSelected: boolean;
  onReservationClick: (reservation: Reservation) => void;
}) => {
  const config = statusConfig[reservation.status] || statusConfig.upcoming;
  const isUnassigned = !reservation.tableId;
  
  // Determine which icons to show
  const hasOccasion = !!reservation.occasion;
  const isVIP = reservation.isVIP || reservation.relationshipTags?.includes("VIP");
  const hasMessage = !!reservation.guestMessage;
  const hasNotes = !!(reservation.notes || reservation.guestNotes || reservation.visitNotes);
  const hasDeposit = reservation.depositPaid || reservation.depositRequested;
  
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
      {/* Two Row Layout */}
      <div className="flex flex-col gap-1.5">
        {/* Row 1: Status, Name, Time, Party, Table */}
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
        
        {/* Row 2: At-a-Glance Icons (only if any exist) */}
        {(hasOccasion || isVIP || hasMessage || hasNotes || hasDeposit) && (
          <div className="flex items-center gap-2 pl-4">
            {/* Occasion Icon */}
            {hasOccasion && (
              <div className="flex items-center gap-1" title={reservation.occasion}>
                <Gift className="w-3 h-3 text-pink-400" />
                <span className="text-pink-400 text-[10px] font-medium">{reservation.occasion}</span>
              </div>
            )}
            
            {/* VIP / Relationship Icon */}
            {isVIP && (
              <div className="flex items-center" title="VIP Guest">
                <span className="text-amber-400 text-sm">⭐</span>
              </div>
            )}
            
            {/* Guest Message Icon */}
            {hasMessage && (
              <div className="flex items-center" title="Guest message">
                <FileText className="w-3 h-3 text-blue-400" />
              </div>
            )}
            
            {/* Notes Icon */}
            {hasNotes && !hasMessage && (
              <div className="flex items-center" title="Has notes">
                <FileText className="w-3 h-3 text-neutral-400" />
              </div>
            )}
            
            {/* Deposit Icon */}
            {hasDeposit && (
              <div className="flex items-center" title={reservation.depositPaid ? `Deposit paid: $${reservation.depositAmount}` : "Deposit requested"}>
                <CreditCard className={`w-3 h-3 ${reservation.depositPaid ? "text-emerald-400" : "text-amber-400"}`} />
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

// OpenTable-Parity Reservation Details Panel
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
  const isVIP = reservation.isVIP || reservation.relationshipTags?.includes("VIP");
  
  return (
    <div className="h-full flex flex-col bg-neutral-900">
      {/* Top Section: Core Info Bar (Time, Party, Duration) */}
      <div className="px-6 pt-4 pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800 text-white text-sm">
            <Clock className="w-4 h-4 text-neutral-400" />
            <span>{reservation.time}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800 text-white text-sm">
            <Users className="w-4 h-4 text-neutral-400" />
            <span>{reservation.partySize}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800 text-white text-sm">
            <Timer className="w-4 h-4 text-neutral-400" />
            <span>{reservation.duration || "2h 00m"}</span>
          </div>
          <div className="ml-auto">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-neutral-400" />
            </button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-5">
          {/* Guest Identity Section */}
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-neutral-600 to-neutral-700 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-semibold">
                {reservation.guestName.charAt(0)}
              </span>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {isVIP && <span className="text-amber-400 text-lg">⭐</span>}
                <h3 className="text-white text-xl font-semibold truncate">
                  {reservation.guestName}
                </h3>
                <button className="p-1 hover:bg-neutral-800 rounded transition-colors">
                  <FileText className="w-4 h-4 text-neutral-500" />
                </button>
              </div>
              
              <div className="flex items-center gap-4 mt-1 text-neutral-400 text-sm">
                {reservation.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{reservation.phone}</span>
                  </div>
                )}
                {reservation.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate">{reservation.email}</span>
                  </div>
                )}
              </div>
              
              {reservation.company && (
                <div className="flex items-center gap-1 mt-1 text-neutral-400 text-sm">
                  <Building className="w-3.5 h-3.5" />
                  <span>{reservation.company}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Side Actions Column (OpenTable style) */}
          <div className="flex gap-6">
            {/* Left: Tags and Notes */}
            <div className="flex-1 space-y-4">
              {/* Tags Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500 text-sm">Tags</span>
                  <button className="p-1 hover:bg-neutral-800 rounded transition-colors">
                    <FileText className="w-3.5 h-3.5 text-neutral-500" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {reservation.tags?.map((tag, i) => (
                    <span 
                      key={i}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        tag.toLowerCase().includes("birthday") || tag.toLowerCase().includes("anniversary")
                          ? "bg-neutral-800 text-white border border-neutral-600"
                          : "bg-neutral-800/50 text-neutral-300 border border-neutral-700"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                  {reservation.dietaryRestrictions && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {reservation.dietaryRestrictions.split(",")[0]}
                    </span>
                  )}
                  {reservation.highChairCount && reservation.highChairCount > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-neutral-800/50 text-neutral-300 border border-neutral-700">
                      High Chair
                    </span>
                  )}
                  <button className="px-3 py-1 rounded-full text-xs font-medium bg-neutral-800/50 text-neutral-500 border border-neutral-700 border-dashed hover:border-neutral-500 transition-colors">
                    + Add a tag...
                  </button>
                </div>
              </div>

              {/* Guest Message (First-Class Display) */}
              {reservation.guestMessage && (
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="text-white text-sm leading-relaxed">
                      {reservation.guestMessage}
                    </p>
                  </div>
                </div>
              )}

              {/* Visit Note */}
              <div className="flex items-start gap-3 py-2 border-b border-neutral-800">
                <FileText className="w-4 h-4 text-neutral-500 mt-0.5" />
                <div className="flex-1">
                  <span className="text-neutral-500 text-xs uppercase tracking-wide">Add a visit note</span>
                  {reservation.visitNotes && (
                    <p className="text-white text-sm mt-1">{reservation.visitNotes}</p>
                  )}
                </div>
              </div>

              {/* General Note */}
              <div className="flex items-start gap-3 py-2 border-b border-neutral-800">
                <FileText className="w-4 h-4 text-neutral-500 mt-0.5" />
                <div className="flex-1">
                  <span className="text-neutral-500 text-xs uppercase tracking-wide">Add a general note</span>
                  {reservation.generalNote && (
                    <p className="text-white text-sm mt-1">{reservation.generalNote}</p>
                  )}
                </div>
              </div>

              {/* Friends / Linked Guests */}
              {reservation.friendsLinkedGuests && (
                <div className="flex items-center gap-2 py-2">
                  <span className="text-amber-400">⭐</span>
                  <span className="text-white text-sm">Friends with {reservation.friendsLinkedGuests}</span>
                </div>
              )}

              {/* Loyalty Tier */}
              {reservation.loyaltyTier && (
                <div className="flex items-center gap-2 py-2 text-sm text-neutral-400">
                  <span>🏆</span>
                  <span>BHG Property Rewards {reservation.visitCount || 1} • {reservation.loyaltyTier} tier</span>
                </div>
              )}
            </div>

            {/* Right: Actions & Status */}
            <div className="w-[200px] space-y-3 flex-shrink-0">
              {/* Status Dropdown */}
              <div className={`px-4 py-2.5 rounded-lg ${config.bg} ${config.text} flex items-center justify-between cursor-pointer hover:opacity-90 transition-opacity`}>
                <span className="font-medium">{config.label}</span>
                <ChevronRight className="w-4 h-4" />
              </div>

              {/* Table Assignment */}
              <div className="px-4 py-2.5 rounded-lg bg-neutral-800 text-white flex items-center gap-2">
                <Armchair className="w-4 h-4 text-neutral-400" />
                <div className="flex-1">
                  {reservation.tableId ? (
                    <span>Table {reservation.tableId}</span>
                  ) : reservation.suggestedTables?.length ? (
                    <span className="text-neutral-400 text-sm">Table {reservation.suggestedTables.join(", ")}<br/><span className="text-xs text-neutral-500">Suggested</span></span>
                  ) : (
                    <span className="text-amber-400">Unassigned</span>
                  )}
                </div>
              </div>

              {/* Deposit Status */}
              {(reservation.depositRequested || reservation.depositPaid) && (
                <div className={`px-4 py-2.5 rounded-lg flex items-center gap-2 ${
                  reservation.depositPaid 
                    ? "bg-emerald-500/10 text-emerald-400" 
                    : "bg-red-500/10 text-red-400"
                }`}>
                  <CreditCard className="w-4 h-4" />
                  <div className="flex-1">
                    <span className={reservation.depositPaid ? "text-emerald-400" : "text-red-400"}>
                      {reservation.depositPaid ? "Paid" : "Not paid"} • ${reservation.depositAmount || 0}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <button className="w-full px-4 py-2.5 rounded-lg bg-neutral-800 text-white text-sm flex items-center gap-2 hover:bg-neutral-700 transition-colors">
                <CreditCard className="w-4 h-4 text-neutral-400" />
                <span>Send Deposit request</span>
              </button>

              <button className="w-full px-4 py-2.5 rounded-lg bg-neutral-800 text-white text-sm flex items-center gap-2 hover:bg-neutral-700 transition-colors">
                <Mail className="w-4 h-4 text-neutral-400" />
                <span>Re-send Booking confirmation</span>
              </button>

              <button className="w-full px-4 py-2.5 rounded-lg bg-neutral-800 text-white text-sm flex items-center gap-2 hover:bg-neutral-700 transition-colors">
                <FileText className="w-4 h-4 text-neutral-400" />
                <span>Message guest</span>
              </button>

              {/* Pre-ordered Items */}
              {reservation.preOrderedItems && reservation.preOrderedItems.length > 0 && (
                <div className="px-4 py-3 rounded-lg bg-neutral-800 text-white">
                  <div className="text-sm mb-2 text-neutral-400">Pre-ordered</div>
                  {reservation.preOrderedItems.map((item, i) => (
                    <div key={i} className="text-sm flex items-center gap-2">
                      <span className="text-neutral-500">{item.quantity} x</span>
                      <span className="text-white">{item.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Special Occasion Tab Icons (OpenTable bottom row) */}
          <div className="flex items-center justify-center gap-4 pt-4 border-t border-neutral-800">
            <button className="p-2 rounded-lg hover:bg-neutral-800 transition-colors" title="General Note">
              <FileText className="w-5 h-5 text-neutral-500" />
            </button>
            <button className={`p-2 rounded-lg hover:bg-neutral-800 transition-colors ${isVIP ? "text-amber-400" : ""}`} title="VIP">
              <span className="text-lg">⭐</span>
            </button>
            <button className={`p-2 rounded-lg hover:bg-neutral-800 transition-colors ${reservation.dietaryRestrictions ? "text-amber-400" : ""}`} title="Dietary">
              <Utensils className="w-5 h-5 text-neutral-500" />
            </button>
            <button className="p-2 rounded-lg hover:bg-neutral-800 transition-colors" title="Mobile">
              <Phone className="w-5 h-5 text-neutral-500" />
            </button>
            <button className={`p-2 rounded-lg hover:bg-neutral-800 transition-colors ${reservation.accessibilityRequirements ? "text-amber-400" : ""}`} title="Accessibility">
              <Accessibility className="w-5 h-5 text-neutral-500" />
            </button>
            <button className="p-2 rounded-lg hover:bg-neutral-800 transition-colors" title="History">
              <Clock className="w-5 h-5 text-neutral-500" />
            </button>
          </div>
        </div>
      </ScrollArea>

      {/* Quick Actions - Fixed at bottom */}
      <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900/50">
        <div className="grid grid-cols-3 gap-3">
          {/* Seat Guest Button - only for eligible reservations */}
          {reservation.status !== "seated" && reservation.tableId && (
            <button 
              onClick={() => onSeatGuest(reservation)}
              className="px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
            >
              Seat Guest
            </button>
          )}
          <button 
            onClick={() => onEditReservation(reservation)}
            className="px-4 py-3 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-medium transition-colors"
          >
            Edit
          </button>
          <button 
            onClick={() => onCancelReservation(reservation)}
            className="px-4 py-3 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-medium transition-colors"
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
