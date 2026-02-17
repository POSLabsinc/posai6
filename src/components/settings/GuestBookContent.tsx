import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, Search, Plus, Phone, Mail, Star, Calendar, UtensilsCrossed, Car, AlertTriangle, ClipboardList, MessageSquare, Tag, Archive, ArrowDownAZ, X, Pencil, Clock, Users, ChevronRight, Info } from "lucide-react";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import guestBookIcon from "@/assets/icons/settings-guest-book.png";

interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  initials: string;
  avatarBg: string;
  loyalty: string;
  since: string;
  birthday: string;
  anniversary: string;
  lastVisit: string;
  avgSpend: string;
  lifetimeSpend: string;
  totalOrders: number;
  avgTip: string;
  loyaltyEarned: number;
  loyaltyRedeemed: number;
  loyaltyAvailable: number;
  loyaltyAmount: string;
  totalVisits: number;
  upcomingVisits: number;
  canceledVisits: number;
  noShows: number;
  allergies: string[];
  tags: string[];
  vehicle: string;
  mostOrdered: string;
  mostOrderedCount: number;
  lastOrdered: string;
  notes: {
    general: string;
    specialRelation: string;
    seatingPreferences: string;
    specialNote: string;
    allergies: string;
  };
}

const mockGuests: Guest[] = [
  {
    id: "1", name: "Lia Thomas", email: "lia.thomas516@reddit.com", phone: "+1 212-450-7890",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    initials: "LT", avatarBg: "#6B7280", loyalty: "RF", since: "", birthday: "", anniversary: "",
    lastVisit: "-- -- --", avgSpend: "$0.00", lifetimeSpend: "$0.00", totalOrders: 0, avgTip: "$0.00",
    loyaltyEarned: 0, loyaltyRedeemed: 0, loyaltyAvailable: 0, loyaltyAmount: "$00.00",
    totalVisits: 0, upcomingVisits: 0, canceledVisits: 0, noShows: 0, allergies: [], tags: [],
    vehicle: "", mostOrdered: "", mostOrderedCount: 0, lastOrdered: "",
    notes: { general: "", specialRelation: "", seatingPreferences: "", specialNote: "", allergies: "" }
  },
  {
    id: "2", name: "Bergnaum", email: "cleorahills@gmail.com", phone: "+1 212-450-7890",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    initials: "BG", avatarBg: "#8B5CF6", loyalty: "Gold", since: "Mar 2023", birthday: "Jun 15", anniversary: "Sep 20",
    lastVisit: "Jan 15, 2024", avgSpend: "$45.00", lifetimeSpend: "$320.00", totalOrders: 7, avgTip: "$8.50",
    loyaltyEarned: 320, loyaltyRedeemed: 50, loyaltyAvailable: 270, loyaltyAmount: "$27.00",
    totalVisits: 7, upcomingVisits: 1, canceledVisits: 0, noShows: 0, allergies: ["Peanuts"], tags: ["VIP"],
    vehicle: "Tesla Model 3", mostOrdered: "Margherita Pizza", mostOrderedCount: 3, lastOrdered: "Grilled Salmon",
    notes: { general: "Prefers quiet seating", specialRelation: "", seatingPreferences: "Window booth", specialNote: "", allergies: "Peanut allergy" }
  },
  {
    id: "3", name: "Wunderlich", email: "wunder@gmail.com", phone: "+1 212-236-7890",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    initials: "WD", avatarBg: "#F59E0B", loyalty: "Silver", since: "Aug 2023", birthday: "Nov 2", anniversary: "",
    lastVisit: "Feb 3, 2024", avgSpend: "$62.00", lifetimeSpend: "$185.00", totalOrders: 3, avgTip: "$12.00",
    loyaltyEarned: 185, loyaltyRedeemed: 0, loyaltyAvailable: 185, loyaltyAmount: "$18.50",
    totalVisits: 3, upcomingVisits: 0, canceledVisits: 1, noShows: 0, allergies: [], tags: ["Regular"],
    vehicle: "", mostOrdered: "Steak Frites", mostOrderedCount: 2, lastOrdered: "Caesar Salad",
    notes: { general: "", specialRelation: "Birthday celebration regular", seatingPreferences: "", specialNote: "", allergies: "" }
  },
  {
    id: "4", name: "Arjun Gerhold", email: "alaskanm@dog.com", phone: "+1 122-456-7890",
    initials: "AG", avatarBg: "#10B981", loyalty: "", since: "", birthday: "", anniversary: "",
    lastVisit: "-- -- --", avgSpend: "$0.00", lifetimeSpend: "$0.00", totalOrders: 0, avgTip: "$0.00",
    loyaltyEarned: 0, loyaltyRedeemed: 0, loyaltyAvailable: 0, loyaltyAmount: "$00.00",
    totalVisits: 0, upcomingVisits: 0, canceledVisits: 0, noShows: 0, allergies: [], tags: [],
    vehicle: "", mostOrdered: "", mostOrderedCount: 0, lastOrdered: "",
    notes: { general: "", specialRelation: "", seatingPreferences: "", specialNote: "", allergies: "" }
  },
  {
    id: "5", name: "Simeon Wilderman", email: "simeon@user.com", phone: "+1 287-456-7890",
    initials: "SW", avatarBg: "#6366F1", loyalty: "Bronze", since: "Oct 2022", birthday: "Apr 8", anniversary: "Dec 25",
    lastVisit: "Dec 20, 2023", avgSpend: "$38.00", lifetimeSpend: "$152.00", totalOrders: 4, avgTip: "$6.00",
    loyaltyEarned: 152, loyaltyRedeemed: 100, loyaltyAvailable: 52, loyaltyAmount: "$5.20",
    totalVisits: 4, upcomingVisits: 0, canceledVisits: 0, noShows: 1, allergies: ["Gluten", "Dairy"], tags: ["Regular"],
    vehicle: "BMW X5", mostOrdered: "Pasta Carbonara", mostOrderedCount: 4, lastOrdered: "Tiramisu",
    notes: { general: "Comes every Friday", specialRelation: "", seatingPreferences: "Bar area", specialNote: "", allergies: "Gluten and dairy free" }
  },
  {
    id: "6", name: "Eden Kautzer", email: "edenka@user.com", phone: "+1 212-456-7090",
    initials: "EK", avatarBg: "#EC4899", loyalty: "", since: "", birthday: "", anniversary: "",
    lastVisit: "-- -- --", avgSpend: "$0.00", lifetimeSpend: "$0.00", totalOrders: 0, avgTip: "$0.00",
    loyaltyEarned: 0, loyaltyRedeemed: 0, loyaltyAvailable: 0, loyaltyAmount: "$00.00",
    totalVisits: 0, upcomingVisits: 0, canceledVisits: 0, noShows: 0, allergies: [], tags: [],
    vehicle: "", mostOrdered: "", mostOrderedCount: 0, lastOrdered: "",
    notes: { general: "", specialRelation: "", seatingPreferences: "", specialNote: "", allergies: "" }
  },
  {
    id: "7", name: "Gino Yost", email: "gyostt@test.com", phone: "+1 222-456-7890",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    initials: "GY", avatarBg: "#F97316", loyalty: "Platinum", since: "Jan 2022", birthday: "Jul 30", anniversary: "Feb 14",
    lastVisit: "Mar 1, 2024", avgSpend: "$55.00", lifetimeSpend: "$440.00", totalOrders: 8, avgTip: "$10.00",
    loyaltyEarned: 440, loyaltyRedeemed: 200, loyaltyAvailable: 240, loyaltyAmount: "$24.00",
    totalVisits: 8, upcomingVisits: 2, canceledVisits: 0, noShows: 0, allergies: ["Shellfish"], tags: ["VIP", "Regular"],
    vehicle: "Mercedes GLE", mostOrdered: "Lobster Risotto", mostOrderedCount: 5, lastOrdered: "Wagyu Steak",
    notes: { general: "High-value customer", specialRelation: "Business partner", seatingPreferences: "Private dining", specialNote: "Always comp dessert", allergies: "Shellfish" }
  },
];

// Tab options
type TabId = "profile" | "reservation" | "payment" | "feedback" | "history";
const tabs: { id: TabId; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "reservation", label: "Reservation" },
  { id: "payment", label: "Payment" },
  { id: "feedback", label: "Feedback" },
  { id: "history", label: "Order History" },
];

const AVAILABLE_TAGS = ["VIP", "Regular", "New", "Frequent", "Catering", "Corporate", "Birthday Club", "Wine Lover"];

const AVAILABLE_ALLERGIES = [
  { name: "Peanuts", bg: "bg-red-900/40", text: "text-red-300" },
  { name: "Tree Nuts", bg: "bg-orange-900/40", text: "text-orange-300" },
  { name: "Dairy", bg: "bg-blue-900/40", text: "text-blue-300" },
  { name: "Gluten", bg: "bg-amber-900/40", text: "text-amber-300" },
  { name: "Shellfish", bg: "bg-pink-900/40", text: "text-pink-300" },
  { name: "Eggs", bg: "bg-yellow-900/40", text: "text-yellow-300" },
  { name: "Soy", bg: "bg-green-900/40", text: "text-green-300" },
  { name: "Fish", bg: "bg-cyan-900/40", text: "text-cyan-300" },
  { name: "Wheat", bg: "bg-lime-900/40", text: "text-lime-300" },
  { name: "Sesame", bg: "bg-violet-900/40", text: "text-violet-300" },
  { name: "Mustard", bg: "bg-emerald-900/40", text: "text-emerald-300" },
  { name: "Celery", bg: "bg-teal-900/40", text: "text-teal-300" },
  { name: "Lupin", bg: "bg-indigo-900/40", text: "text-indigo-300" },
  { name: "Sulfites", bg: "bg-fuchsia-900/40", text: "text-fuchsia-300" },
  { name: "Corn", bg: "bg-rose-900/40", text: "text-rose-300" },
];

const getAllergyStyle = (name: string) => {
  const found = AVAILABLE_ALLERGIES.find(a => a.name.toLowerCase() === name.toLowerCase());
  return found || { name, bg: "bg-red-900/30", text: "text-red-300" };
};

// --- Sub-components ---

const StatItem = ({ value, label }: { value: string | number; label: string }) => (
  <div className="flex flex-col items-center">
    <span className="text-sm font-bold text-foreground">{value}</span>
    <span className="text-[10px] text-neutral-500 mt-0.5 text-center leading-tight">{label}</span>
  </div>
);

// Editable InfoRow
const EditableInfoRow = ({ label, value, placeholder, onSave }: { label: string; value: string; placeholder?: string; onSave: (val: string) => void }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  const commit = () => {
    onSave(draft.trim());
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex justify-between items-center py-2 px-4 gap-2">
        <span className="text-xs text-neutral-500 flex-shrink-0">{label}</span>
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
          placeholder={placeholder || "Enter"}
          className="bg-transparent px-2 py-1 text-sm font-normal text-foreground outline-none w-28 text-right caret-foreground"
        />
      </div>
    );
  }

  return (
    <button onClick={() => setEditing(true)} className="flex justify-between items-center py-3 px-4 w-full text-left hover:bg-neutral-700/20 transition-colors group">
      <span className="text-xs text-neutral-500">{label}</span>
      <span className={`text-sm flex items-center gap-1 ${value ? 'font-medium text-foreground' : 'text-neutral-500'}`}>
        {value || placeholder || "Enter"}
        <Pencil className="w-3 h-3 text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      </span>
    </button>
  );
};

const MetricCell = ({ value, label }: { value: string | number; label: string }) => (
  <div>
    <p className="text-sm font-bold text-foreground">{value}</p>
    <p className="text-[10px] text-neutral-500">{label}</p>
  </div>
);

// Editable NoteRow
const EditableNoteRow = ({ icon, label, value, onSave }: { icon: React.ReactNode; label: string; value: string; onSave: (val: string) => void }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  const commit = () => { onSave(draft.trim()); setEditing(false); };

  return (
    <div className="py-3 border-b border-neutral-700/30 last:border-b-0">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 hover:opacity-100">
            <Pencil className="w-3 h-3 text-neutral-500 hover:text-foreground" />
          </button>
        )}
      </div>
      {editing ? (
        <div className="pl-6">
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
            placeholder="Add notes"
            className="flex-1 w-full bg-transparent px-2 py-1 text-sm font-normal text-foreground outline-none caret-foreground"
          />
        </div>
      ) : (
        <p
          className="text-sm text-neutral-500 pl-6 cursor-pointer hover:text-neutral-300 transition-colors"
          onClick={() => setEditing(true)}
        >
          {value || "Add notes"}
        </p>
      )}
    </div>
  );
};

// --- Reservation Tab ---
interface ReservationEntry {
  id: string;
  date: string;
  month: string;
  title: string;
  timeRange: string;
  partySize: number;
  location: string;
  noShow?: boolean;
}

const mockReservations: ReservationEntry[] = [
  { id: "r1", date: "03", month: "May", title: "Fun Friday With Team", timeRange: "08:00 PM - 10:00 PM", partySize: 8, location: "Roof Top Table 3&4" },
  { id: "r2", date: "28", month: "APR", title: "Birthday Party", timeRange: "08:00 PM - 10:00 PM", partySize: 20, location: "Roof Top Hall" },
  { id: "r3", date: "26", month: "APR", title: "20th Wedding Anniversary", timeRange: "08:00 PM - 10:00 PM", partySize: 20, location: "Roof Top Hall", noShow: true },
];

const ReservationTabContent = ({ guest }: { guest: Guest }) => {
  const [subTab, setSubTab] = useState<"upcoming" | "recent">("recent");

  const summaryCards = [
    { value: "05", label: "Reservations", icon: <Calendar className="w-5 h-5 text-neutral-400" />, trend: "down" as const },
    { value: "02", label: "Upcoming Visits", icon: <Calendar className="w-5 h-5 text-neutral-400" />, trend: "down" as const },
    { value: "01", label: "Cancellations", icon: <Calendar className="w-5 h-5 text-neutral-400" />, trend: null },
    { value: "$560.00", label: "Spent", icon: <UtensilsCrossed className="w-5 h-5 text-neutral-400" />, trend: "up" as const },
  ];

  return (
    <div className="space-y-5">
      {/* Sub-tabs: Upcoming / Recent */}
      <div className="flex items-center justify-center gap-2">
        <div className="flex bg-neutral-800/40 rounded-full p-1">
          <button
            onClick={() => setSubTab("upcoming")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              subTab === "upcoming" ? "bg-foreground text-background" : "text-neutral-400 hover:text-foreground"
            }`}
          >
            Upcoming Visits
          </button>
          <button
            onClick={() => setSubTab("recent")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              subTab === "recent" ? "bg-foreground text-background" : "text-neutral-400 hover:text-foreground"
            }`}
          >
            Recent Visits
          </button>
        </div>
        <button className="w-6 h-6 rounded-full bg-neutral-700/40 flex items-center justify-center">
          <Info className="w-3.5 h-3.5 text-neutral-400" />
        </button>
      </div>

      {/* Summary Section */}
      <div>
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Summary</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {summaryCards.map((card, idx) => (
            <div key={idx} className="bg-neutral-800/40 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-700/40 flex items-center justify-center flex-shrink-0">
                {card.icon}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-foreground">{card.value}</span>
                  {card.trend === "down" && <span className="text-red-400 text-xs">▼</span>}
                  {card.trend === "up" && <span className="text-green-400 text-xs">▲</span>}
                </div>
                <p className="text-[10px] text-neutral-500">{card.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reservation List */}
      <div className="space-y-2">
        {mockReservations.map((res) => (
          <div
            key={res.id}
            className="bg-neutral-800/40 rounded-2xl px-4 py-3.5 flex items-center gap-4 hover:bg-neutral-700/30 transition-colors cursor-pointer"
          >
            {/* Date Block */}
            <div className="flex-shrink-0 flex flex-col items-center w-12 border-r border-neutral-600/50 pr-4">
              <span className="text-lg font-bold text-foreground leading-tight">{res.date}</span>
              <span className="text-[10px] text-neutral-400 uppercase">{res.month}</span>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground mb-0.5 truncate">{res.title}</p>
              <div className="flex items-center gap-2 text-[11px] text-neutral-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {res.timeRange}
                </span>
                <span className="text-neutral-600">|</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" /> {res.partySize} People
                </span>
                <span className="text-neutral-600">|</span>
                <span className="flex items-center gap-1">
                  🪑 {res.location}
                </span>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {res.noShow && (
                <span className="bg-red-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase">
                  No Show
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Guest List Item ---
const GuestListItem = ({ guest, isSelected, onClick }: { guest: Guest; isSelected: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${
      isSelected ? "bg-neutral-700/60" : "hover:bg-neutral-800/40 active:opacity-70"
    }`}
  >
    <Avatar className="w-11 h-11 flex-shrink-0">
      {guest.avatar ? (
        <AvatarImage src={guest.avatar} alt={guest.name} />
      ) : null}
      <AvatarFallback style={{ backgroundColor: guest.avatarBg }} className="text-white text-sm font-medium">
        {guest.initials}
      </AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0 text-left">
      <p className="text-sm font-medium text-foreground truncate">{guest.name}</p>
      <p className="text-xs text-neutral-400 truncate">{guest.email}</p>
      <p className="text-xs text-neutral-500">{guest.phone}</p>
    </div>
  </button>
);

// --- Guest Detail Panel ---
const GuestDetailPanel = ({ guest, onUpdateGuest }: { guest: Guest; onUpdateGuest: (updated: Guest) => void }) => {
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [showAllergyPicker, setShowAllergyPicker] = useState(false);
  const [newAllergyInput, setNewAllergyInput] = useState("");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldDraft, setFieldDraft] = useState("");

  const updateField = useCallback((field: keyof Guest, value: any) => {
    onUpdateGuest({ ...guest, [field]: value });
  }, [guest, onUpdateGuest]);

  const updateNote = useCallback((noteKey: keyof Guest["notes"], value: string) => {
    onUpdateGuest({ ...guest, notes: { ...guest.notes, [noteKey]: value } });
  }, [guest, onUpdateGuest]);

  const addTag = (tag: string) => {
    if (tag && !guest.tags.includes(tag)) {
      updateField("tags", [...guest.tags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    updateField("tags", guest.tags.filter(t => t !== tag));
  };

  const addAllergy = (allergy: string) => {
    if (allergy && !guest.allergies.includes(allergy)) {
      updateField("allergies", [...guest.allergies, allergy]);
    }
  };

  const removeAllergy = (idx: number) => {
    updateField("allergies", guest.allergies.filter((_, i) => i !== idx));
  };

  // Inline text edit helpers
  const startFieldEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setFieldDraft(currentValue);
  };

  const commitFieldEdit = (field: keyof Guest) => {
    updateField(field, fieldDraft.trim());
    setEditingField(null);
  };

  const InlineEdit = ({ field, currentValue, className = "" }: { field: keyof Guest; currentValue: string; className?: string }) => {
    if (editingField === field) {
      return (
        <input
          autoFocus
          value={fieldDraft}
          onChange={e => setFieldDraft(e.target.value)}
          onBlur={() => commitFieldEdit(field)}
          onKeyDown={e => { if (e.key === "Enter") commitFieldEdit(field); if (e.key === "Escape") setEditingField(null); }}
          className="bg-transparent px-2 py-0.5 text-sm font-normal text-foreground outline-none w-full caret-foreground"
        />
      );
    }
    return (
      <span
        onClick={(e) => { e.stopPropagation(); startFieldEdit(field, currentValue); }}
        className={`cursor-pointer hover:text-foreground transition-colors group inline-flex items-center gap-1 ${className}`}
      >
        {currentValue || "—"}
        <Pencil className="w-2.5 h-2.5 text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </span>
    );
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hide px-6 pt-6 pb-28">
      {/* Header: Guest Book default or Guest Details for non-profile tabs */}
      {activeTab === "profile" ? (
        <div className="bg-neutral-800/60 rounded-2xl p-6 mb-6 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#F9900E' }}>
            <img src={guestBookIcon} alt="Guest Book" className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Guest Book</h3>
          <p className="text-sm text-neutral-400 text-center max-w-md">
            Track your guests' dietary needs, allergies, and favorite dishes for a personalized dining experience.
          </p>
        </div>
      ) : (
        <div className="mb-6">
          {/* Title Row: Back + Title centered */}
          <div className="flex items-center relative mb-5">
            <button onClick={() => setActiveTab("profile")} className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center flex-shrink-0">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h2 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-foreground">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
          </div>
          {/* Guest Identity Row */}
          <div className="flex items-center gap-4 px-2">
            <Avatar className="w-12 h-12 flex-shrink-0">
              {guest.avatar ? <AvatarImage src={guest.avatar} alt={guest.name} /> : null}
              <AvatarFallback style={{ backgroundColor: guest.avatarBg }} className="text-white text-base font-semibold">
                {guest.initials}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-lg font-semibold text-foreground flex-shrink-0">{guest.name}</h3>
            {guest.tags.length > 0 && (
              <div className="w-px h-6 bg-neutral-600 flex-shrink-0" />
            )}
            {guest.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {guest.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-neutral-700/80 text-xs text-neutral-200 font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="ml-auto flex items-center gap-2 text-sm text-neutral-400 flex-shrink-0">
              {guest.since && <span>Since - {guest.since}</span>}
              {guest.lastVisit && guest.lastVisit !== "-- -- --" && (
                <>
                  <span className="text-neutral-600">|</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {guest.lastVisit}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-800/40 rounded-full p-1 mb-6 overflow-x-auto scrollbar-hide justify-center">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-foreground text-background"
                : "text-neutral-400 hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <div className="space-y-4">
          {/* Main Profile Card */}
          <div className="bg-neutral-800/40 rounded-2xl overflow-hidden">
            <div className="p-5 flex flex-col sm:flex-row gap-5">
              {/* Left: Avatar + Contact */}
              <div className="flex flex-col items-center gap-2 min-w-[160px]">
                <Avatar className="w-20 h-20">
                  {guest.avatar ? <AvatarImage src={guest.avatar} alt={guest.name} /> : null}
                  <AvatarFallback style={{ backgroundColor: guest.avatarBg }} className="text-white text-xl font-semibold">
                    {guest.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center mt-1 w-full">
                  <div className="flex justify-center">
                    <InlineEdit field="name" currentValue={guest.name} className="text-base font-bold text-foreground" />
                  </div>
                  <div className="flex justify-center mt-0.5">
                    <InlineEdit field="email" currentValue={guest.email} className="text-xs text-neutral-400" />
                  </div>
                  <div className="flex justify-center">
                    <InlineEdit field="phone" currentValue={guest.phone} className="text-xs text-neutral-400" />
                  </div>
                </div>
                {/* Tags */}
                <div className="grid grid-cols-2 gap-1.5 justify-items-center mt-1">
                  {guest.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-full bg-neutral-700/60 text-xs text-neutral-300 flex items-center gap-1">
                      {tag}
                      <button onClick={(e) => { e.stopPropagation(); removeTag(tag); }} className="hover:text-red-400 transition-colors">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
                {/* Tag picker */}
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowTagPicker(prev => !prev); }}
                    className="text-xs text-neutral-400 border border-neutral-600 rounded-full px-3 py-1 hover:bg-neutral-700/40 transition-colors"
                  >
                    <Tag className="w-3 h-3 inline mr-1" />{guest.tags.length > 0 ? "Edit Tags" : "Add Tags"}
                  </button>
                  {showTagPicker && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowTagPicker(false)}>
                      <div className="absolute inset-0 bg-black/60" />
                      <div
                        className="relative z-10 bg-neutral-800 border border-neutral-700 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:w-80 max-h-[80vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                      >
                        {/* Top grab bar */}
                        <div className="flex justify-center pt-3 pb-2 sm:hidden">
                          <div className="w-10 h-1 rounded-full bg-neutral-600" />
                        </div>
                        {/* Header with X */}
                        <div className="flex items-center justify-center relative px-5 pb-3 pt-1 sm:pt-4">
                          <p className="text-sm font-semibold text-foreground text-center">Select Tags</p>
                          <button onClick={() => setShowTagPicker(false)} className="absolute right-5 text-neutral-400 hover:text-foreground transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="h-px bg-neutral-700/50" />
                        <div className="flex flex-wrap gap-2 p-5">
                          {AVAILABLE_TAGS.map(tag => {
                            const isSelected = guest.tags.includes(tag);
                            return (
                              <button
                                key={tag}
                                onClick={() => isSelected ? updateField("tags", guest.tags.filter(t => t !== tag)) : addTag(tag)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                  isSelected
                                    ? "bg-neutral-600 text-foreground ring-1 ring-neutral-400"
                                    : "bg-neutral-700/60 text-neutral-300 opacity-60 hover:opacity-90"
                                }`}
                              >
                                {isSelected ? "✓ " : ""}{tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Stats + Info */}
              <div className="flex-1 flex flex-col gap-3">
                {/* Stats Row */}
                <div className="flex items-center justify-between bg-neutral-900/50 rounded-xl px-4 py-3">
                  <StatItem value={guest.lastVisit} label="Last Visit" />
                  <div className="w-px h-8 bg-neutral-700/40" />
                  <StatItem value={guest.avgSpend} label="Avg Spend" />
                  <div className="w-px h-8 bg-neutral-700/40" />
                  <StatItem value={guest.lifetimeSpend} label="Lifetime Spend" />
                  <div className="w-px h-8 bg-neutral-700/40" />
                  <StatItem value={guest.totalOrders} label="Total Orders" />
                  <div className="w-px h-8 bg-neutral-700/40" />
                  <StatItem value={guest.avgTip} label="Avg Tip" />
                </div>

                {/* Loyalty & Visits Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-neutral-900/50 rounded-xl p-4">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-3 font-medium">Loyalty</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                      <MetricCell value={guest.loyaltyEarned} label="Earned" />
                      <MetricCell value={guest.loyaltyRedeemed} label="Redeemed" />
                      <MetricCell value={guest.loyaltyAvailable} label="Available" />
                      <MetricCell value={guest.loyaltyAmount} label="Amount" />
                    </div>
                  </div>
                  <div className="bg-neutral-900/50 rounded-xl p-4">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-3 font-medium">Visits</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                      <MetricCell value={guest.totalVisits} label="Total" />
                      <MetricCell value={guest.upcomingVisits} label="Upcoming" />
                      <MetricCell value={guest.canceledVisits} label="Canceled" />
                      <MetricCell value={guest.noShows} label="No Shows" />
                    </div>
                  </div>
                </div>

                {/* Info Grid - Editable */}
                <div className="grid grid-cols-2 bg-neutral-900/50 rounded-xl overflow-hidden divide-x divide-neutral-700/30">
                  <div className="divide-y divide-neutral-700/30">
                    <EditableInfoRow label="Loyalty" value={guest.loyalty} placeholder="Enter" onSave={v => updateField("loyalty", v)} />
                    <EditableInfoRow label="Birthday" value={guest.birthday} placeholder="Enter" onSave={v => updateField("birthday", v)} />
                  </div>
                  <div className="divide-y divide-neutral-700/30">
                    <EditableInfoRow label="Since" value={guest.since} placeholder="Enter" onSave={v => updateField("since", v)} />
                    <EditableInfoRow label="Anniversary" value={guest.anniversary} placeholder="Enter" onSave={v => updateField("anniversary", v)} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Most Ordered & Quick Info */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-neutral-800/40 rounded-2xl p-4">
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2 font-medium">Most Ordered</p>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-foreground font-medium">
                  {guest.mostOrdered || "No Orders Yet"}
                </span>
              </div>
              {guest.mostOrderedCount > 0 && (
                <p className="text-[10px] text-neutral-500 mt-1 ml-6">Ordered {guest.mostOrderedCount} times</p>
              )}
            </div>
            <div className="bg-neutral-800/40 rounded-2xl p-4">
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2 font-medium">Last Ordered</p>
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-neutral-500" />
                <span className="text-sm text-neutral-400">
                  {guest.lastOrdered || "No Items"}
                </span>
              </div>
            </div>
            <div className="bg-neutral-800/40 rounded-2xl p-4">
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2 font-medium">Vehicle</p>
              <div className="flex items-center gap-2 cursor-pointer group" onClick={(e) => { e.stopPropagation(); startFieldEdit("vehicle", guest.vehicle); }}>
                <Car className="w-4 h-4 text-neutral-500" />
                {editingField === "vehicle" ? (
                  <input
                    autoFocus
                    value={fieldDraft}
                    onChange={e => setFieldDraft(e.target.value)}
                    onBlur={() => commitFieldEdit("vehicle")}
                    onKeyDown={e => { if (e.key === "Enter") commitFieldEdit("vehicle"); if (e.key === "Escape") setEditingField(null); }}
                    placeholder="Enter vehicle"
                    className="flex-1 bg-transparent px-2 py-0.5 text-sm font-normal text-foreground outline-none caret-foreground"
                  />
                ) : (
                  <span className="text-sm text-neutral-400 flex items-center gap-1">
                    {guest.vehicle || "No Vehicle"}
                    <Pencil className="w-2.5 h-2.5 text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Allergies */}
          <div>
            <h4 className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2 px-1 font-medium">Allergies</h4>
            <div className="bg-neutral-800/40 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 flex-wrap">
                  <AlertTriangle className="w-5 h-5 text-neutral-500 flex-shrink-0" />
                  {guest.allergies.length > 0 ? (
                    guest.allergies.map((a, i) => {
                      const style = getAllergyStyle(a);
                      return (
                        <span key={i} className={`px-2 py-0.5 rounded-full ${style.bg} text-xs ${style.text} flex items-center gap-1`}>
                          {a}
                          <button onClick={(e) => { e.stopPropagation(); removeAllergy(i); }} className="hover:opacity-70">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-sm text-foreground">No Allergies</span>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowAllergyPicker(true); }}
                  className="px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-medium flex-shrink-0"
                >
                  {guest.allergies.length > 0 ? "Edit" : "Add"}
                </button>
              </div>
            </div>
          </div>

          {/* Allergy Picker Modal */}
          {showAllergyPicker && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowAllergyPicker(false)}>
              <div className="absolute inset-0 bg-black/60" />
              <div
                className="relative z-10 bg-neutral-800 border border-neutral-700 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:w-80 max-h-[80vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                {/* Top grab bar */}
                <div className="flex justify-center pt-3 pb-2 sm:hidden">
                  <div className="w-10 h-1 rounded-full bg-neutral-600" />
                </div>
                {/* Header with X */}
                <div className="flex items-center justify-center relative px-5 pb-3 pt-1 sm:pt-4">
                  <p className="text-sm font-semibold text-foreground text-center">Add Allergies</p>
                  <button onClick={() => setShowAllergyPicker(false)} className="absolute right-5 text-neutral-400 hover:text-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="h-px bg-neutral-700/50" />
                <div className="flex flex-wrap gap-2 p-5">
                  {AVAILABLE_ALLERGIES.map(allergy => {
                    const isSelected = guest.allergies.some(a => a.toLowerCase() === allergy.name.toLowerCase());
                    return (
                      <button
                        key={allergy.name}
                        onClick={() => isSelected ? updateField("allergies", guest.allergies.filter(a => a.toLowerCase() !== allergy.name.toLowerCase())) : addAllergy(allergy.name)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          isSelected
                            ? `${allergy.bg} ${allergy.text} ring-1 ring-current`
                            : `${allergy.bg} ${allergy.text} opacity-50 hover:opacity-80`
                        }`}
                      >
                        {isSelected ? "✓ " : ""}{allergy.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Upcoming Visits */}
          <div>
            <h4 className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2 px-1 font-medium">Upcoming Visits</h4>
            <div className="bg-neutral-800/40 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-neutral-500" />
                <span className="text-sm text-foreground">
                  {guest.upcomingVisits > 0 ? `${guest.upcomingVisits} Upcoming Visit${guest.upcomingVisits > 1 ? "s" : ""}` : "No Upcoming Visits"}
                </span>
              </div>
              <button className="px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-medium">Book A Visit</button>
            </div>
          </div>

          {/* Notes - Editable */}
          <div>
            <h4 className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2 px-1 font-medium">Notes</h4>
            <div className="bg-neutral-800/40 rounded-2xl px-4 group">
              <EditableNoteRow icon={<ClipboardList className="w-4 h-4 text-neutral-500" />} label="General" value={guest.notes.general} onSave={v => updateNote("general", v)} />
              <EditableNoteRow icon={<Star className="w-4 h-4 text-neutral-500" />} label="Special Relation" value={guest.notes.specialRelation} onSave={v => updateNote("specialRelation", v)} />
              <EditableNoteRow icon={<MessageSquare className="w-4 h-4 text-neutral-500" />} label="Seating Preferences" value={guest.notes.seatingPreferences} onSave={v => updateNote("seatingPreferences", v)} />
              <EditableNoteRow icon={<ClipboardList className="w-4 h-4 text-neutral-500" />} label="Special Note" value={guest.notes.specialNote} onSave={v => updateNote("specialNote", v)} />
              <EditableNoteRow icon={<AlertTriangle className="w-4 h-4 text-neutral-500" />} label="Allergies" value={guest.notes.allergies} onSave={v => updateNote("allergies", v)} />
            </div>
          </div>

          {/* Recent Orders */}
          <div>
            <h4 className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2 px-1 font-medium">Recent Orders</h4>
            <div className="bg-neutral-800/40 rounded-2xl p-4 flex items-center gap-3">
              <UtensilsCrossed className="w-5 h-5 text-neutral-500" />
              <span className="text-sm text-neutral-400">No Recent Orders to Show</span>
            </div>
          </div>

          {/* Online Reviews */}
          <div>
            <h4 className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2 px-1 font-medium">Online Reviews</h4>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {[
                {
                  platform: "Google",
                  icon: (
                    <svg viewBox="0 0 24 24" className="w-8 h-8">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  ),
                  rating: 5,
                  text: "The food was absolutely delicious and served with great presentation. The staff were friendly and attentive.",
                },
                {
                  platform: "Yelp",
                  icon: (
                    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#FF1A1A">
                      <path d="M12.87 1.8c-.18-.18-.42-.3-.68-.3H9.81c-.53 0-.96.43-.96.96v7.29c0 .53.43.96.96.96h.58c.26 0 .5-.1.68-.29l3.42-3.42c.53-.53.53-1.39 0-1.92L12.87 1.8zM8.5 13.5l-3.42 3.42c-.53.53-.53 1.39 0 1.92l1.62 1.62c.18.18.42.3.68.3h2.38c.53 0 .96-.43.96-.96v-5.34c0-.53-.43-.96-.96-.96h-.58c-.26 0-.5.1-.68.28z"/>
                    </svg>
                  ),
                  rating: 4.5,
                  text: "The service was prompt and attentive, making our evening enjoyable. Highly recommend this gem.",
                },
                {
                  platform: "Foursquare",
                  icon: (
                    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#F94877">
                      <path d="M17.73 2.02H6.27C5.57 2.02 5 2.59 5 3.29v17.42c0 .7.57 1.27 1.27 1.27.28 0 .55-.09.77-.27l4.96-3.97 4.96 3.97c.22.18.49.27.77.27.7 0 1.27-.57 1.27-1.27V3.29c0-.7-.57-1.27-1.27-1.27zM16 8h-3v3c0 .55-.45 1-1 1s-1-.45-1-1V8H8c-.55 0-1-.45-1-1s.45-1 1-1h3V3c0-.55.45-1 1-1s1 .45 1 1v3h3c.55 0 1 .45 1 1s-.45 1-1 1z"/>
                    </svg>
                  ),
                  rating: 4,
                  text: "I highly recommend trying their Japan Chicken. It was bursting with flavor.",
                },
              ].map((review, idx) => (
                <div
                  key={idx}
                  className="min-w-[180px] max-w-[200px] bg-neutral-800/40 rounded-2xl p-4 flex flex-col items-center gap-2 flex-shrink-0"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center">
                    {review.icon}
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < Math.floor(review.rating)
                            ? "text-amber-500 fill-amber-500"
                            : i < review.rating
                            ? "text-amber-500 fill-amber-500/50"
                            : "text-neutral-600"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-neutral-400 text-center leading-relaxed line-clamp-4">
                    {review.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "reservation" && (
        <ReservationTabContent guest={guest} />
      )}

      {activeTab !== "profile" && activeTab !== "reservation" && (
        <div className="bg-neutral-800/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
          <p className="text-neutral-400 text-sm">No {activeTab} data available yet.</p>
        </div>
      )}
    </div>
  );
};

// --- Empty State ---
const EmptyDetailState = () => (
  <div className="h-full flex flex-col items-center justify-center px-6 text-center">
    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#F9900E' }}>
      <img src={guestBookIcon} alt="Guest Book" className="w-7 h-7" />
    </div>
    <h3 className="text-xl font-semibold text-foreground mb-2">Guest Book</h3>
    <p className="text-sm text-neutral-400 max-w-sm">
      Select a guest from the list to view their profile, dining preferences, and visit history.
    </p>
  </div>
);

// --- Main Component ---
interface GuestBookContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const GuestBookContent = ({ showHeader = false, onBack, onAIClick }: GuestBookContentProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [sortAZ, setSortAZ] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [guests, setGuests] = useState<Guest[]>(mockGuests);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const filteredGuests = guests
    .filter(g => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return g.name.toLowerCase().includes(q) || g.email.toLowerCase().includes(q) || g.phone.includes(q);
    })
    .sort((a, b) => sortAZ ? a.name.localeCompare(b.name) : 0);

  const selectedGuest = guests.find(g => g.id === selectedGuestId) || null;

  const handleUpdateGuest = useCallback((updated: Guest) => {
    setGuests(prev => prev.map(g => g.id === updated.id ? updated : g));
  }, []);

  // Mobile: show list or detail
  if (isMobile) {
    if (selectedGuest) {
      return (
        <div className="h-full flex flex-col">
          <div className="px-6 pt-5">
            <button onClick={() => setSelectedGuestId(null)} className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          </div>
          <GuestDetailPanel guest={selectedGuest} onUpdateGuest={handleUpdateGuest} />
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col overflow-hidden">
        {showHeader && onBack && (
          <div className="px-6 pt-5">
            <button onClick={onBack} className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          </div>
        )}
        {/* Header Card */}
        <div className="px-6 pt-4">
          <div className="bg-neutral-800/60 rounded-2xl p-5 mb-4 flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: '#F9900E' }}>
              <img src={guestBookIcon} alt="Guest Book" className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-1">Guest Book</h3>
            <p className="text-sm text-neutral-400 text-center">Track guest preferences and dining history.</p>
          </div>
        </div>
        {/* Search */}
        <div className="px-6 mb-3">
          <div className="bg-neutral-800/40 rounded-full px-4 py-2.5 flex items-center gap-3">
            <Search className="w-4 h-4 text-neutral-500" />
            <input type="text" placeholder="Search guests..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-foreground placeholder:text-neutral-500 outline-none text-sm" />
            <button className="w-7 h-7 rounded-full bg-neutral-700/60 flex items-center justify-center">
              <Plus className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>
        {/* Guest List */}
        <div className="flex-1 overflow-y-auto px-4 pb-28 scrollbar-hide">
          {filteredGuests.map(guest => (
            <GuestListItem key={guest.id} guest={guest} isSelected={false} onClick={() => setSelectedGuestId(guest.id)} />
          ))}
        </div>
      </div>
    );
  }

  // Desktop/Tablet: split layout
  return (
    <div className="h-full flex overflow-hidden">
      {/* Left Panel - Guest List */}
      {!isExpanded && (
        <div className="w-[300px] flex-shrink-0 bg-neutral-900/90 rounded-2xl flex flex-col h-full">
          {showHeader && onBack && (
            <div className="px-4 pt-5 pb-2 flex items-center justify-between overflow-visible" style={{ minHeight: 48 }}>
              <button onClick={onBack} className="w-8 h-8 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity">
                <ChevronLeft className="w-4 h-4 text-foreground" />
              </button>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity">
                  <Plus className="w-4 h-4 text-foreground" />
                </button>
                <button className="w-8 h-8 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity">
                  <Archive className="w-4 h-4 text-foreground" />
                </button>
                <button
                  onClick={() => setSortAZ(prev => !prev)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center active:opacity-70 transition-all ${sortAZ ? 'bg-foreground' : 'bg-neutral-800/60'}`}
                >
                  <ArrowDownAZ className={`w-4 h-4 ${sortAZ ? 'text-background' : 'text-foreground'}`} />
                </button>
              </div>
            </div>
          )}
          {/* Search + AI icon row */}
          <div className="px-4 py-3 flex items-center gap-2 overflow-visible">
            <div className="flex-1 bg-neutral-800/40 rounded-full px-3 py-2 flex items-center gap-2">
              <Search className="w-4 h-4 text-neutral-500" />
              <input type="text" placeholder="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-foreground placeholder:text-neutral-500 outline-none text-sm" />
            </div>
            <div className="overflow-visible flex items-center justify-center flex-shrink-0" style={{ width: 32, height: 32 }}>
              <AnimatedAIIcon size={20} onClick={onAIClick || (() => navigate('/settings/ai'))} />
            </div>
          </div>
          {/* List */}
          <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-hide">
            {filteredGuests.map(guest => (
              <GuestListItem key={guest.id} guest={guest} isSelected={selectedGuestId === guest.id} onClick={() => setSelectedGuestId(guest.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Right Panel - Guest Detail */}
      <div
        className="flex-1 h-full overflow-hidden cursor-pointer"
        onClick={() => {
          if (selectedGuest && !isExpanded) {
            setIsExpanded(true);
          }
        }}
      >
        {isExpanded && (
          <div className="px-6 pt-5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          </div>
        )}
        {selectedGuest ? (
          <GuestDetailPanel guest={selectedGuest} onUpdateGuest={handleUpdateGuest} />
        ) : (
          <EmptyDetailState />
        )}
      </div>
    </div>
  );
};

export default GuestBookContent;
