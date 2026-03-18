import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, Search, Plus, Phone, Mail, Star, Calendar, UtensilsCrossed, Car, AlertTriangle, ClipboardList, MessageSquare, Tag, Archive, ArrowDownAZ, X, Pencil, Clock, Users, ChevronRight, Info } from "lucide-react";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import guestBookIcon from "@/assets/icons/settings-guest-book.png";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAppearance } from "@/contexts/AppearanceContext";
import PaymentTabContent from "@/components/settings/PaymentTabContent";
import FeedbackTabContent from "@/components/settings/FeedbackTabContent";
import OrderHistoryTabContent from "@/components/settings/OrderHistoryTabContent";
import AddGuestForm from "@/components/AddGuestForm";

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

// Map DB row to Guest interface
const mapDbGuest = (row: any, stats?: any): Guest => ({
  id: row.id,
  name: row.name,
  email: row.email || "",
  phone: row.phone || "",
  avatar: row.avatar_url || undefined,
  initials: row.initials || row.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2),
  avatarBg: row.avatar_bg || "#6B7280",
  loyalty: row.loyalty || "",
  since: row.since || "",
  birthday: row.birthday || "",
  anniversary: row.anniversary || "",
  vehicle: row.vehicle || "",
  allergies: row.allergies || [],
  tags: row.tags || [],
  lastVisit: stats?.lastVisit || "-- -- --",
  avgSpend: stats?.avgSpend || "$0.00",
  lifetimeSpend: stats?.lifetimeSpend || "$0.00",
  totalOrders: stats?.totalOrders || 0,
  avgTip: stats?.avgTip || "$0.00",
  loyaltyEarned: 0,
  loyaltyRedeemed: 0,
  loyaltyAvailable: 0,
  loyaltyAmount: "$00.00",
  totalVisits: stats?.totalVisits || 0,
  upcomingVisits: stats?.upcomingVisits || 0,
  canceledVisits: stats?.canceledVisits || 0,
  noShows: stats?.noShows || 0,
  mostOrdered: stats?.mostOrdered || "",
  mostOrderedCount: stats?.mostOrderedCount || 0,
  lastOrdered: stats?.lastOrdered || "",
  notes: {
    general: row.notes_general || "",
    specialRelation: row.notes_special_relation || "",
    seatingPreferences: row.notes_seating_preferences || "",
    specialNote: row.notes_special_note || "",
    allergies: row.notes_allergies || "",
  },
});

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
  { name: "Peanuts", bg: "bg-red-500/10 dark:bg-red-900/40", text: "text-red-600 dark:text-red-300" },
  { name: "Tree Nuts", bg: "bg-orange-500/10 dark:bg-orange-900/40", text: "text-orange-600 dark:text-orange-300" },
  { name: "Dairy", bg: "bg-blue-500/10 dark:bg-blue-900/40", text: "text-blue-600 dark:text-blue-300" },
  { name: "Gluten", bg: "bg-amber-500/10 dark:bg-amber-900/40", text: "text-amber-600 dark:text-amber-300" },
  { name: "Shellfish", bg: "bg-pink-500/10 dark:bg-pink-900/40", text: "text-pink-600 dark:text-pink-300" },
  { name: "Eggs", bg: "bg-yellow-500/10 dark:bg-yellow-900/40", text: "text-yellow-600 dark:text-yellow-300" },
  { name: "Soy", bg: "bg-green-500/10 dark:bg-green-900/40", text: "text-green-600 dark:text-green-300" },
  { name: "Fish", bg: "bg-cyan-500/10 dark:bg-cyan-900/40", text: "text-cyan-600 dark:text-cyan-300" },
  { name: "Wheat", bg: "bg-lime-500/10 dark:bg-lime-900/40", text: "text-lime-600 dark:text-lime-300" },
  { name: "Sesame", bg: "bg-violet-500/10 dark:bg-violet-900/40", text: "text-violet-600 dark:text-violet-300" },
  { name: "Mustard", bg: "bg-emerald-500/10 dark:bg-emerald-900/40", text: "text-emerald-600 dark:text-emerald-300" },
  { name: "Celery", bg: "bg-teal-500/10 dark:bg-teal-900/40", text: "text-teal-600 dark:text-teal-300" },
  { name: "Lupin", bg: "bg-indigo-500/10 dark:bg-indigo-900/40", text: "text-indigo-600 dark:text-indigo-300" },
  { name: "Sulfites", bg: "bg-fuchsia-500/10 dark:bg-fuchsia-900/40", text: "text-fuchsia-600 dark:text-fuchsia-300" },
  { name: "Corn", bg: "bg-rose-500/10 dark:bg-rose-900/40", text: "text-rose-600 dark:text-rose-300" },
];

const getAllergyStyle = (name: string) => {
  const found = AVAILABLE_ALLERGIES.find(a => a.name.toLowerCase() === name.toLowerCase());
  return found || { name, bg: "bg-red-500/10 dark:bg-red-900/30", text: "text-red-600 dark:text-red-300" };
};

// --- Recent Orders Sub-component ---
const RecentOrdersSection = ({ guestId }: { guestId: string }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("orders")
        .select("id, order_number, created_at, total, order_items(item_name, quantity)")
        .eq("guest_id", guestId)
        .order("created_at", { ascending: false })
        .limit(3);
      setOrders(data || []);
      setLoading(false);
    };
    fetchOrders();
  }, [guestId]);

  if (loading) {
    return (
      <div>
        <h4 className="text-[10px] text-neutral-500 tracking-widest mb-2 px-1 font-medium">Recent Orders</h4>
        <div className="bg-neutral-800/40 rounded-2xl p-4 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div>
        <h4 className="text-[10px] text-neutral-500 tracking-widest mb-2 px-1 font-medium">Recent Orders</h4>
        <div className="bg-neutral-800/40 rounded-2xl p-4 flex items-center gap-3">
          <UtensilsCrossed className="w-5 h-5 text-neutral-500" />
          <span className="text-sm text-neutral-400">No Recent Orders to Show</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-[10px] text-neutral-500 tracking-widest mb-2 px-1 font-medium">Recent Orders</h4>
      <div className="space-y-2">
        {orders.map((o: any) => {
          const items = (o.order_items || []).map((i: any) => `${i.quantity}x ${i.item_name}`).join(", ");
          let dateStr = "";
          try { dateStr = format(new Date(o.created_at), "MMM d, yyyy"); } catch { dateStr = ""; }
          return (
            <div key={o.id} className="bg-neutral-800/40 rounded-2xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <UtensilsCrossed className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{items || `Order #${o.order_number}`}</p>
                  <p className="text-[10px] text-neutral-500">{dateStr}</p>
                </div>
              </div>
              <span className="text-sm font-medium text-foreground flex-shrink-0">${Number(o.total).toFixed(2)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Online Reviews Sub-component ---
const reviewPlatformIcons: Record<string, React.ReactNode> = {
  google: (
    <svg viewBox="0 0 24 24" className="w-8 h-8">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  ),
  yelp: (
    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#FF1A1A">
      <path d="M12.87 1.8c-.18-.18-.42-.3-.68-.3H9.81c-.53 0-.96.43-.96.96v7.29c0 .53.43.96.96.96h.58c.26 0 .5-.1.68-.29l3.42-3.42c.53-.53.53-1.39 0-1.92L12.87 1.8z"/>
    </svg>
  ),
  eatos: <span className="text-xs font-bold text-neutral-300">eatOS</span>,
  orderos: <span className="text-xs font-bold text-neutral-300">OrderOS</span>,
  zagat: <span className="text-red-500 font-bold text-sm">ZAGAT</span>,
};

const OnlineReviewsSection = ({ guestId }: { guestId: string }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("guest_feedback")
        .select("id, feedback_date, sentiment, comment, platform")
        .eq("guest_id", guestId)
        .order("feedback_date", { ascending: false })
        .limit(5);
      setReviews(data || []);
      setLoading(false);
    };
    fetchReviews();
  }, [guestId]);

  if (loading) {
    return (
      <div>
        <h4 className="text-[10px] text-neutral-500 tracking-widest mb-2 px-1 font-medium">Online Reviews</h4>
        <div className="bg-neutral-800/40 rounded-2xl p-4 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div>
        <h4 className="text-[10px] text-neutral-500 tracking-widest mb-2 px-1 font-medium">Online Reviews</h4>
        <div className="bg-neutral-800/40 rounded-2xl p-4 flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-neutral-500" />
          <span className="text-sm text-neutral-400">No Reviews Yet</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-[10px] text-neutral-500 tracking-widest mb-2 px-1 font-medium">Online Reviews</h4>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {reviews.map((r: any) => {
          const rating = r.sentiment === "positive" ? 5 : r.sentiment === "neutral" ? 3 : 2;
          const icon = reviewPlatformIcons[r.platform] || <span className="text-xs text-neutral-400 capitalize">{r.platform}</span>;
          return (
            <div key={r.id} className="min-w-[180px] max-w-[200px] bg-neutral-800/40 rounded-2xl p-4 flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center">{icon}</div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? "text-amber-500 fill-amber-500" : "text-neutral-600"}`} />
                ))}
              </div>
              <p className="text-xs text-neutral-400 text-center leading-relaxed line-clamp-4">{r.comment}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
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
const ReservationTabContent = ({ guest }: { guest: Guest }) => {
  const [subTab, setSubTab] = useState<"upcoming" | "recent">("recent");
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('reservations')
        .select('*')
        .eq('guest_id', guest.id)
        .order('reservation_date', { ascending: false });

      if (!error && data) {
        setReservations(data);
      }
      setLoading(false);
    };
    fetchReservations();

    // Realtime subscription
    const channel = supabase
      .channel(`reservations-${guest.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
        fetchReservations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [guest.id]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingReservations = reservations.filter(r => new Date(r.reservation_date) >= today && !r.no_show && r.status !== 'completed');
  const recentReservations = reservations.filter(r => new Date(r.reservation_date) < today || r.no_show || r.status === 'completed');
  const displayedReservations = subTab === "upcoming" ? upcomingReservations : recentReservations;

  const totalReservations = reservations.length;
  const upcomingCount = upcomingReservations.length;
  const cancellations = reservations.filter(r => r.status === 'cancelled' || r.no_show).length;
  const totalSpent = reservations.reduce((sum, r) => sum + Number(r.total_spent || 0), 0);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return {
      day: String(d.getDate()).padStart(2, '0'),
      month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
    };
  };

  const summaryCards = [
    { value: String(totalReservations).padStart(2, '0'), label: "Reservations", icon: <Calendar className="w-5 h-5 text-neutral-400" />, trend: null },
    { value: String(upcomingCount).padStart(2, '0'), label: "Upcoming Visits", icon: <Calendar className="w-5 h-5 text-neutral-400" />, trend: null },
    { value: String(cancellations).padStart(2, '0'), label: "Cancellations", icon: <Calendar className="w-5 h-5 text-neutral-400" />, trend: null },
    { value: `$${totalSpent.toFixed(2)}`, label: "Spent", icon: <UtensilsCrossed className="w-5 h-5 text-neutral-400" />, trend: totalSpent > 0 ? "up" as const : null },
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
        <Popover>
          <PopoverTrigger asChild>
            <button className="w-6 h-6 rounded-full bg-neutral-700/40 flex items-center justify-center">
              <Info className="w-3.5 h-3.5 text-neutral-400" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="end" className="w-auto max-w-[220px] bg-neutral-800/95 backdrop-blur-xl border-neutral-700/50 rounded-xl p-3 space-y-2">
            <div className="flex items-start gap-2">
              <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
              <p className="text-[11px] text-neutral-300 leading-snug">Blue represents official events or gatherings.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1.5 w-2 h-2 rounded-full bg-pink-500 flex-shrink-0" />
              <p className="text-[11px] text-neutral-300 leading-snug">Pink signifies engagement, anniversary, and dates.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1.5 w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0" />
              <p className="text-[11px] text-neutral-300 leading-snug">Yellow signifies fun/celebration, birthday, Christmas, New Year.</p>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Summary Section */}
      <div>
        <p className="text-xs font-medium text-neutral-500 tracking-wider mb-3">Summary</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {summaryCards.map((card, idx) => (
            <div key={idx} className="bg-neutral-800/40 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-700/40 flex items-center justify-center flex-shrink-0">
                {card.icon}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-foreground">{card.value}</span>
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
        {loading ? (
          <div className="text-center py-8 text-neutral-500 text-sm">Loading reservations...</div>
        ) : displayedReservations.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 text-sm">
            No {subTab === "upcoming" ? "upcoming" : "recent"} reservations found.
          </div>
        ) : (
          displayedReservations.map((res) => {
            const { day, month } = formatDate(res.reservation_date);
            const timeRange = res.end_time ? `${res.start_time} - ${res.end_time}` : res.start_time;
            
            const colorMap: Record<string, string> = {
              blue: 'border-blue-500',
              pink: 'border-pink-500',
              yellow: 'border-yellow-500',
            };
            const borderColor = colorMap[res.color_category] || 'border-blue-500';

            const handleColorChange = async (color: string) => {
              await (supabase as any)
                .from('reservations')
                .update({ color_category: color })
                .eq('id', res.id);
            };

            return (
              <div
                key={res.id}
                className={`bg-neutral-800/40 rounded-2xl px-4 py-3.5 flex items-center gap-4 hover:bg-neutral-700/30 transition-colors cursor-pointer border-l-[3px] ${borderColor}`}
              >
                {/* Color Picker Dots */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {(['blue', 'pink', 'yellow'] as const).map(color => (
                    <button
                      key={color}
                      onClick={(e) => { e.stopPropagation(); handleColorChange(color); }}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        color === 'blue' ? 'bg-blue-500' : color === 'pink' ? 'bg-pink-500' : 'bg-yellow-500'
                      } ${res.color_category === color ? 'ring-2 ring-white/40 scale-110' : 'opacity-40 hover:opacity-80'}`}
                    />
                  ))}
                </div>

                {/* Date Block */}
                <div className="flex-shrink-0 flex flex-col items-center w-12 border-r border-neutral-600/50 pr-4">
                  <span className="text-lg font-bold text-foreground leading-tight">{day}</span>
                  <span className="text-[10px] text-neutral-400 uppercase">{month}</span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground mb-0.5 truncate">{res.title || 'Reservation'}</p>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {timeRange}
                    </span>
                    <span className="text-neutral-600">|</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {res.party_size} People
                    </span>
                    {res.location && (
                      <>
                        <span className="text-neutral-600">|</span>
                        <span className="flex items-center gap-1">
                          🪑 {res.location}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {res.no_show && (
                    <span className="bg-red-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase">
                      No Show
                    </span>
                  )}
                  {res.status === 'completed' && !res.no_show && (
                    <span className="bg-green-600/20 text-green-400 text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase">
                      Completed
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-neutral-500" />
                </div>
              </div>
            );
          })
        )}
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
const GuestDetailPanel = ({ guest, onUpdateGuest, onCollapse }: { guest: Guest; onUpdateGuest: (updated: Guest) => void; onCollapse?: () => void }) => {
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [showTagPicker, setShowTagPicker] = useState(false);
  const { getIconBgColor } = useAppearance();
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
    <div className="h-full overflow-y-auto scrollbar-hide px-6 pt-0 pb-28">
      {/* Header: Guest Book default or Guest Details for non-profile tabs */}
      {activeTab === "profile" ? (
        <div className="mb-6">
          {onCollapse && (
            <div className="mb-4">
              <button onClick={onCollapse} className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center flex-shrink-0">
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
            </div>
          )}
          <div className="bg-neutral-800/60 rounded-2xl p-5 flex flex-col items-start">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: getIconBgColor('#F9900E') }}>
            <img src={guestBookIcon} alt="Guest Book" className="w-7 h-7 object-contain" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Guest Book</h3>
          <p className="text-base text-neutral-400 leading-relaxed w-full">
            Your complete guest management hub. Track dietary needs, allergies, favorite dishes, visit history, and spending patterns to deliver a truly personalized dining experience every time.
          </p>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          {/* Title Row: Back + Title centered */}
          <div className="flex items-center relative mb-5">
            <button onClick={() => setActiveTab("profile")} className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center flex-shrink-0">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h2 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-foreground flex items-center gap-2">
              {tabs.find(t => t.id === activeTab)?.label}
              {activeTab === "history" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-6 h-6 rounded-full bg-neutral-700/60 border border-neutral-600/50 flex items-center justify-center hover:bg-neutral-600/60 transition-colors">
                      <Info className="w-3.5 h-3.5 text-neutral-300" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="bottom" align="center" className="w-auto max-w-[240px] bg-neutral-800/95 backdrop-blur-xl border-neutral-700/50 rounded-xl p-3 space-y-2">
                    {[
                      { color: "bg-blue-500", label: "Blue signifies Restaurant order" },
                      { color: "bg-green-500", label: "Green for Takeout" },
                      { color: "bg-orange-500", label: "Orange for Delivery" },
                      { color: "bg-red-500", label: "Red for Drive Thru" },
                      { color: "bg-purple-500", label: "Purple for Banquet" },
                      { color: "bg-yellow-400", label: "Yellow for Online Ordering" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${item.color} flex-shrink-0`} />
                        <span className="text-xs text-neutral-300">{item.label}</span>
                      </div>
                    ))}
                  </PopoverContent>
                </Popover>
              )}
            </h2>
          </div>
          {/* Guest Profile Bar - Single Row */}
          <div className="bg-neutral-800/40 rounded-2xl px-5 py-4 flex items-center gap-4">
            {/* Avatar */}
            <Avatar className="w-11 h-11 flex-shrink-0">
              {guest.avatar ? <AvatarImage src={guest.avatar} alt={guest.name} /> : null}
              <AvatarFallback style={{ backgroundColor: guest.avatarBg }} className="text-white text-sm font-semibold">
                {guest.initials}
              </AvatarFallback>
            </Avatar>

            {/* Name + Contact */}
            <div className="flex flex-col min-w-0 flex-shrink-0">
              <h3 className="text-sm font-semibold text-foreground leading-tight">{guest.name}</h3>
              <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-0.5">
                {guest.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-neutral-500" /> {guest.email}
                  </span>
                )}
                {guest.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-neutral-500" /> {guest.phone}
                  </span>
                )}
                {guest.vehicle && (
                  <span className="flex items-center gap-1">
                    <Car className="w-3 h-3 text-neutral-500" /> {guest.vehicle}
                  </span>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-neutral-700/50 flex-shrink-0" />

            {/* Tags & Badges */}
            <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
              {guest.loyalty && (
                <span className="px-2.5 py-0.5 rounded-full bg-neutral-700/80 text-[11px] text-foreground font-medium">
                  {guest.loyalty}
                </span>
              )}
              {guest.tags.map(tag => (
                <span key={tag} className="px-2.5 py-0.5 rounded-full bg-neutral-700/80 text-[11px] text-foreground font-medium">
                  {tag}
                </span>
              ))}
              {guest.allergies.map(a => {
                const style = getAllergyStyle(a);
                return (
                  <span key={a} className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${style.bg} ${style.text}`}>
                    {a}
                  </span>
                );
              })}
              {guest.since && (
                <span className="px-2.5 py-0.5 rounded-full bg-neutral-700/50 text-[11px] text-neutral-400">
                  Since {guest.since}
                </span>
              )}
              {guest.lastVisit && guest.lastVisit !== "-- -- --" && (
                <span className="px-2.5 py-0.5 rounded-full bg-neutral-700/50 text-[11px] text-neutral-400 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> {guest.lastVisit}
                </span>
              )}
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-neutral-700/50 flex-shrink-0" />

            {/* Stats */}
            <div className="flex items-center flex-shrink-0">
              <div className="text-center px-4">
                <p className="text-sm font-bold text-foreground leading-tight">{guest.totalVisits}</p>
                <p className="text-[9px] text-neutral-500 uppercase tracking-wide">Visits</p>
              </div>
              <div className="h-7 w-px bg-neutral-700/40" />
              <div className="text-center px-4">
                <p className="text-sm font-bold text-foreground leading-tight">{guest.avgSpend}</p>
                <p className="text-[9px] text-neutral-500 uppercase tracking-wide">Avg</p>
              </div>
              <div className="h-7 w-px bg-neutral-700/40" />
              <div className="text-center px-4">
                <p className="text-sm font-bold text-foreground leading-tight">{guest.noShows}</p>
                <p className="text-[9px] text-neutral-500 uppercase tracking-wide">No Show</p>
              </div>
              <div className="h-7 w-px bg-neutral-700/40" />
              <div className="text-center px-4">
                <p className="text-sm font-bold text-foreground leading-tight">{guest.lifetimeSpend}</p>
                <p className="text-[9px] text-neutral-500 uppercase tracking-wide">Lifetime</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex gap-1 bg-neutral-800/40 rounded-full p-1 overflow-x-auto scrollbar-hide">
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
                    <p className="text-[10px] text-neutral-500 tracking-widest mb-3 font-medium">Loyalty</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                      <MetricCell value={guest.loyaltyEarned} label="Earned" />
                      <MetricCell value={guest.loyaltyRedeemed} label="Redeemed" />
                      <MetricCell value={guest.loyaltyAvailable} label="Available" />
                      <MetricCell value={guest.loyaltyAmount} label="Amount" />
                    </div>
                  </div>
                  <div className="bg-neutral-900/50 rounded-xl p-4">
                    <p className="text-[10px] text-neutral-500 tracking-widest mb-3 font-medium">Visits</p>
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
              <p className="text-[10px] text-neutral-500 tracking-widest mb-2 font-medium">Most Ordered</p>
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
              <p className="text-[10px] text-neutral-500 tracking-widest mb-2 font-medium">Last Ordered</p>
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-neutral-500" />
                <span className="text-sm text-neutral-400">
                  {guest.lastOrdered || "No Items"}
                </span>
              </div>
            </div>
            <div className="bg-neutral-800/40 rounded-2xl p-4">
              <p className="text-[10px] text-neutral-500 tracking-widest mb-2 font-medium">Vehicle</p>
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
            <h4 className="text-[10px] text-neutral-500 tracking-widest mb-2 px-1 font-medium">Allergies</h4>
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
            <h4 className="text-[10px] text-neutral-500 tracking-widest mb-2 px-1 font-medium">Upcoming Visits</h4>
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
            <h4 className="text-[10px] text-neutral-500 tracking-widest mb-2 px-1 font-medium">Notes</h4>
            <div className="bg-neutral-800/40 rounded-2xl px-4 group">
              <EditableNoteRow icon={<ClipboardList className="w-4 h-4 text-neutral-500" />} label="General" value={guest.notes.general} onSave={v => updateNote("general", v)} />
              <EditableNoteRow icon={<Star className="w-4 h-4 text-neutral-500" />} label="Special Relation" value={guest.notes.specialRelation} onSave={v => updateNote("specialRelation", v)} />
              <EditableNoteRow icon={<MessageSquare className="w-4 h-4 text-neutral-500" />} label="Seating Preferences" value={guest.notes.seatingPreferences} onSave={v => updateNote("seatingPreferences", v)} />
              <EditableNoteRow icon={<ClipboardList className="w-4 h-4 text-neutral-500" />} label="Special Note" value={guest.notes.specialNote} onSave={v => updateNote("specialNote", v)} />
              <EditableNoteRow icon={<AlertTriangle className="w-4 h-4 text-neutral-500" />} label="Allergies" value={guest.notes.allergies} onSave={v => updateNote("allergies", v)} />
            </div>
          </div>

          {/* Recent Orders - Live Data */}
          <RecentOrdersSection guestId={guest.id} />

          {/* Online Reviews - Live Data */}
          <OnlineReviewsSection guestId={guest.id} />
        </div>
      )}

      {activeTab === "reservation" && (
        <ReservationTabContent guest={guest} />
      )}

      {activeTab === "payment" && (
        <PaymentTabContent guest={guest} />
      )}

      {activeTab === "feedback" && (
        <FeedbackTabContent guest={guest} />
      )}

      {activeTab === "history" && (
        <OrderHistoryTabContent guest={guest} />
      )}
    </div>
  );
};

// --- Empty State ---
const EmptyDetailState = () => {
  const { getIconBgColor } = useAppearance();
  return (
  <div className="h-full flex flex-col items-center justify-center px-6 text-center">
    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: getIconBgColor('#F9900E') }}>
      <img src={guestBookIcon} alt="Guest Book" className="w-7 h-7" />
    </div>
    <h3 className="text-xl font-semibold text-foreground mb-2">Guest Book</h3>
    <p className="text-sm text-neutral-400 max-w-sm">
      Select a guest from the list to view their profile, dining preferences, and visit history.
    </p>
  </div>
  );
};

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
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { getIconBgColor } = useAppearance();

  // Fetch guests from DB and compute stats
  const fetchGuests = useCallback(async () => {
    setLoading(true);
    const { data: guestRows } = await (supabase as any).from("guests").select("*").eq("is_archived", false).order("name");
    if (!guestRows) { setLoading(false); return; }

    // Fetch all orders, reservations, and loyalty points for stats
    const guestIds = guestRows.map(g => g.id);
    const [ordersRes, reservationsRes, loyaltyRes] = await Promise.all([
      (supabase as any).from("orders").select("guest_id, total, tip_amount, created_at, order_items(item_name, quantity)").in("guest_id", guestIds),
      (supabase as any).from("reservations").select("guest_id, reservation_date, status, no_show").in("guest_id", guestIds),
      (supabase as any).from("loyalty_points").select("guest_id, points, type").in("guest_id", guestIds),
    ]);
    const allOrders = ordersRes.data || [];
    const allReservations = reservationsRes.data || [];
    const allLoyalty = loyaltyRes.data || [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mapped = guestRows.map(row => {
      const orders = allOrders.filter(o => o.guest_id === row.id);
      const reservations = allReservations.filter(r => r.guest_id === row.id);
      const loyaltyTxns = allLoyalty.filter(l => l.guest_id === row.id);

      const totalOrders = orders.length;
      const lifetimeSpend = orders.reduce((s, o) => s + Number(o.total), 0);
      const totalTips = orders.reduce((s, o) => s + Number(o.tip_amount), 0);
      const avgSpend = totalOrders > 0 ? lifetimeSpend / totalOrders : 0;
      const avgTip = totalOrders > 0 ? totalTips / totalOrders : 0;
      const lastOrder = orders.length > 0 ? orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] : null;
      const lastVisitDate = lastOrder ? new Date(lastOrder.created_at) : null;

      // Most ordered item
      const itemCounts: Record<string, number> = {};
      orders.forEach(o => (o.order_items || []).forEach((i: any) => {
        itemCounts[i.item_name] = (itemCounts[i.item_name] || 0) + Number(i.quantity);
      }));
      const mostOrderedEntry = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0];

      // Last ordered item
      const lastOrderItems = lastOrder?.order_items || [];
      const lastOrderedItem = lastOrderItems.length > 0 ? lastOrderItems[0].item_name : "";

      // Reservation stats
      const totalVisits = reservations.filter(r => r.status === 'completed' || new Date(r.reservation_date) < today).length + totalOrders;
      const upcomingVisits = reservations.filter(r => new Date(r.reservation_date) >= today && r.status !== 'cancelled' && !r.no_show).length;
      const canceledVisits = reservations.filter(r => r.status === 'cancelled').length;
      const noShows = reservations.filter(r => r.no_show).length;

      // Loyalty stats
      const loyaltyEarned = loyaltyTxns.filter(l => l.type === 'earned').reduce((s, l) => s + Number(l.points), 0);
      const loyaltyRedeemed = loyaltyTxns.filter(l => l.type === 'redeemed').reduce((s, l) => s + Math.abs(Number(l.points)), 0);
      const loyaltyAvailable = Number(row.loyalty_points_balance || 0);

      const guest = mapDbGuest(row, {
        lastVisit: lastVisitDate ? lastVisitDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-- -- --",
        avgSpend: `$${avgSpend.toFixed(2)}`,
        lifetimeSpend: `$${lifetimeSpend.toFixed(2)}`,
        totalOrders,
        avgTip: `$${avgTip.toFixed(2)}`,
        totalVisits,
        upcomingVisits,
        canceledVisits,
        noShows,
        mostOrdered: mostOrderedEntry ? mostOrderedEntry[0] : "",
        mostOrderedCount: mostOrderedEntry ? mostOrderedEntry[1] : 0,
        lastOrdered: lastOrderedItem,
      });
      guest.loyaltyEarned = loyaltyEarned;
      guest.loyaltyRedeemed = loyaltyRedeemed;
      guest.loyaltyAvailable = loyaltyAvailable;
      guest.loyaltyAmount = `$${(loyaltyAvailable * 0.01).toFixed(2)}`;
      return guest;
    });

    setGuests(mapped);
    // Auto-select first guest if none selected
    if (mapped.length > 0 && !selectedGuestId) {
      setSelectedGuestId(mapped[0].id);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchGuests(); }, [fetchGuests]);

  const filteredGuests = guests
    .filter(g => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return g.name.toLowerCase().includes(q) || g.email.toLowerCase().includes(q) || g.phone.includes(q);
    })
    .sort((a, b) => sortAZ ? a.name.localeCompare(b.name) : 0);

  const selectedGuest = guests.find(g => g.id === selectedGuestId) || null;

  const handleUpdateGuest = useCallback(async (updated: Guest) => {
    // Update local state immediately
    setGuests(prev => prev.map(g => g.id === updated.id ? updated : g));
    // Persist to DB
    await (supabase as any).from("guests").update({
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      avatar_url: updated.avatar || null,
      initials: updated.initials,
      avatar_bg: updated.avatarBg,
      loyalty: updated.loyalty,
      since: updated.since,
      birthday: updated.birthday,
      anniversary: updated.anniversary,
      vehicle: updated.vehicle,
      allergies: updated.allergies,
      tags: updated.tags,
      notes_general: updated.notes.general,
      notes_special_relation: updated.notes.specialRelation,
      notes_seating_preferences: updated.notes.seatingPreferences,
      notes_special_note: updated.notes.specialNote,
      notes_allergies: updated.notes.allergies,
    }).eq("id", updated.id);
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
      <div className="h-full flex flex-col overflow-hidden relative">
        {showHeader && onBack && (
          <div className="px-6 pt-5">
            <button onClick={onBack} className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          </div>
        )}
        {/* Header Card */}
        <div className="px-6 pt-4">
          <div className="bg-neutral-800/60 rounded-2xl p-5 mb-4 flex flex-col items-start">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: getIconBgColor('#F9900E') }}>
              <img src={guestBookIcon} alt="Guest Book" className="w-7 h-7 object-contain" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Guest Book</h3>
            <p className="text-base text-neutral-400 leading-relaxed w-full">
              Your complete guest management hub. Track dietary needs, allergies, favorite dishes, visit history, and spending patterns to deliver a truly personalized dining experience every time.
            </p>
          </div>
        </div>
        {/* Search */}
        <div className="px-6 mb-3">
          <div className="bg-neutral-800/40 rounded-full px-4 py-2.5 flex items-center gap-3">
            <Search className="w-4 h-4 text-neutral-500" />
            <input type="text" placeholder="Search guests..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-foreground placeholder:text-neutral-500 outline-none text-sm" />
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
          <div className="px-4 pt-5 pb-2 flex items-center justify-between overflow-visible" style={{ minHeight: 48 }}>
            {onBack ? (
              <button onClick={onBack} className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity">
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
            ) : (
              <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity">
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <button onClick={() => setShowAddGuest(true)} className="w-8 h-8 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity">
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
          {/* Search + AI icon row */}
          <div className="px-4 flex items-center gap-2 overflow-visible py-3">
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
        {selectedGuest ? (
          <GuestDetailPanel guest={selectedGuest} onUpdateGuest={handleUpdateGuest} onCollapse={isExpanded ? () => setIsExpanded(false) : undefined} />
        ) : (
          <EmptyDetailState />
        )}
      </div>
      {/* Add Guest Full Screen - within app content area */}
      {showAddGuest && (
        <div className="absolute inset-0 z-40 bg-background flex flex-col">
          <div className="relative flex items-center h-14 px-4 border-b border-border">
            <button
              onClick={() => setShowAddGuest(false)}
              className="absolute left-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h2 className="w-full text-center text-base font-semibold text-foreground">Add Guest</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <AddGuestForm
              onClose={() => setShowAddGuest(false)}
              onSave={handleAddGuestSave}
              hideHeader={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestBookContent;
