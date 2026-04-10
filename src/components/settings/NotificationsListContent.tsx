import { useState, useMemo } from "react";
import { ChevronLeft, Download, Loader2, CheckCheck, Search, Mic, CloudSun, ClipboardList, Megaphone, RefreshCw, Users, Sparkles, ShoppingCart, XCircle, Lock, AlertTriangle, CheckCircle, Package, Truck, ChefHat } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import eatosProfile from "@/assets/icons/eatos-profile.png";

import filterListIcon from "@/assets/icons/filter-list.png";
import filterClipboardIcon from "@/assets/icons/filter-clipboard.png";
import filterMegaphoneIcon from "@/assets/icons/filter-megaphone.png";

import filterTeamIcon from "@/assets/icons/filter-team.png";
import { useNotifications, type NotificationItem, type NotificationGroup } from "@/hooks/useNotifications";
import { useWeatherNotification } from "@/hooks/useWeatherNotification";

type FilterType = "all" | "system" | "announcements" | "updates" | "team" | "weather" | "ai";

// Category-based icon and color mapping for notification avatars
const getCategoryIcon = (notification: NotificationItem): { icon?: any; bg: string; color: string; useEatosProfile?: boolean } => {
  if (notification.category === "weather") {
    return { icon: CloudSun, bg: "bg-sky-500/15", color: "text-sky-500" };
  }
  const t = notification.title.toLowerCase();
  // Kitchen reply notifications
  if (t.includes("kitchen reply")) {
    return { icon: ChefHat, bg: "bg-orange-500/15", color: "text-orange-500" };
  }
  if (notification.category === "weather") {
    return { icon: CloudSun, bg: "bg-sky-500/15", color: "text-sky-500" };
  }
  if (t.includes("team")) {
    return { icon: Users, bg: "bg-violet-500/15", color: "text-violet-500" };
  }
  // Order-related notifications
  if (t.includes("new order") || t.includes("order received")) {
    return { icon: ShoppingCart, bg: "bg-emerald-500/15", color: "text-emerald-500" };
  }
  if (t.includes("cancel")) {
    return { icon: XCircle, bg: "bg-red-500/15", color: "text-red-500" };
  }
  // Order status change notifications
  if (t.includes("accepted") || t.includes("preparing")) {
    return { icon: CheckCircle, bg: "bg-emerald-500/15", color: "text-emerald-500" };
  }
  if (t.includes("ready")) {
    return { icon: Package, bg: "bg-amber-500/15", color: "text-amber-500" };
  }
  if (t.includes("delivered") || t.includes("completed")) {
    return { icon: Truck, bg: "bg-teal-500/15", color: "text-teal-500" };
  }
  if (t.includes("delivery")) {
    return { icon: Truck, bg: "bg-indigo-500/15", color: "text-indigo-500" };
  }
  // PIN update notifications
  if (t.includes("pin")) {
    return { icon: Lock, bg: "bg-blue-500/15", color: "text-blue-500" };
  }
  // System error notifications
  if (t.includes("error") || t.includes("fail")) {
    return { icon: AlertTriangle, bg: "bg-red-500/15", color: "text-red-500" };
  }
  // UI updates or notifications from eatOS use the eatos profile image
  if (t.includes("ui") || t.includes("update") || notification.has_update) {
    return { useEatosProfile: true, bg: "", color: "" };
  }
  if (t.includes("feature") || t.includes("new") || t.includes("announcement")) {
    return { useEatosProfile: true, bg: "", color: "" };
  }
  if (t.includes("fix") || t.includes("bug") || t.includes("patch")) {
    return { icon: ClipboardList, bg: "bg-orange-500/15", color: "text-orange-500" };
  }
  // Default: system/general
  return { icon: Sparkles, bg: "bg-primary/10", color: "text-primary" };
};

const NotificationAvatar = ({ notification, size = "sm" }: { notification: NotificationItem; size?: "sm" | "lg" }) => {
  const { icon: Icon, bg, color, useEatosProfile } = getCategoryIcon(notification);
  const dims = size === "lg" ? "w-11 h-11" : "w-9 h-9";
  const iconSize = size === "lg" ? "w-6 h-6" : "w-4.5 h-4.5";

  return (
    <div className={`${dims} rounded-full overflow-hidden shrink-0 ${size === "sm" ? "mt-0.5" : ""}`}>
      {useEatosProfile ? (
        <img src={eatosProfile} alt="eatOS" className="w-full h-full object-cover" />
      ) : (
        <div className={`w-full h-full ${bg} flex items-center justify-center`}>
          {Icon && <Icon className={`${iconSize} ${color}`} />}
        </div>
      )}
    </div>
  );
};

interface FilterDef {
  value: FilterType;
  icon: string;
  badge?: number;
  isAI?: boolean;
  isWeather?: boolean;
}

interface NotificationsListContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const NotificationsListContent = ({ showHeader = true, onBack, onAIClick }: NotificationsListContentProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { groups, totalUnread, loading, error, markAsRead, markAllAsRead, notifications } = useNotifications();
  useWeatherNotification();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // Compute badge counts per filter category
  const badgeCounts = useMemo(() => {
    const counts = { all: 0, system: 0, announcements: 0, updates: 0, team: 0, weather: 0, ai: 0 };
    notifications.forEach(n => {
      if (!n.is_read) {
        counts.all++;
        if (n.category === "weather") { counts.weather++; return; }
        const titleLower = n.title.toLowerCase();
        if (titleLower.includes("update") || titleLower.includes("fix")) counts.system++;
        if (titleLower.includes("feature") || titleLower.includes("new")) counts.announcements++;
        if (n.has_update) counts.updates++;
        if (titleLower.includes("team")) counts.team++;
      }
    });
    return counts;
  }, [notifications]);

  const filterDefs: FilterDef[] = [
    { value: "all", icon: filterListIcon, badge: badgeCounts.all || undefined },
    { value: "system", icon: filterClipboardIcon, badge: badgeCounts.system || undefined },
    { value: "announcements", icon: filterMegaphoneIcon, badge: badgeCounts.announcements || undefined },
    { value: "weather", icon: "", badge: badgeCounts.weather || undefined, isWeather: true },
    { value: "team", icon: filterTeamIcon, badge: badgeCounts.team || undefined },
  ];

  // Filter and search notifications
  const filteredGroups = useMemo(() => {
    let filtered = notifications;

    if (activeFilter === "system") {
      filtered = filtered.filter(n => {
        const t = n.title.toLowerCase();
        return t.includes("update") || t.includes("fix");
      });
    } else if (activeFilter === "announcements") {
      filtered = filtered.filter(n => {
        const t = n.title.toLowerCase();
        return t.includes("feature") || t.includes("new");
      });
    } else if (activeFilter === "updates") {
      filtered = filtered.filter(n => n.has_update);
    } else if (activeFilter === "team") {
      filtered = filtered.filter(n => n.title.toLowerCase().includes("team"));
    } else if (activeFilter === "weather") {
      filtered = filtered.filter(n => n.category === "weather");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.preview.toLowerCase().includes(q) ||
        n.headline.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q)
      );
    }

    const groupMap = new Map<string, NotificationGroup>();
    const result: NotificationGroup[] = [];
    filtered.forEach(n => {
      if (!groupMap.has(n.version)) {
        const group: NotificationGroup = { version: n.version, date: n.version_date, notifications: [], unreadCount: 0 };
        groupMap.set(n.version, group);
        result.push(group);
      }
      const group = groupMap.get(n.version)!;
      group.notifications.push(n);
      if (!n.is_read) group.unreadCount++;
    });
    return result;
  }, [notifications, activeFilter, searchQuery]);

  const effectiveSelectedId = selectedId || (filteredGroups[0]?.notifications[0]?.id ?? null);
  const selectedNotification = notifications.find((n) => n.id === effectiveSelectedId);

  const handleSelect = (notification: NotificationItem) => {
    if (!notification.is_read) markAsRead(notification.id);

    // Kitchen/order-related notifications: navigate to Tickets with order selected
    const title = notification.title.toLowerCase();
    const isKitchenOrOrder = title.includes("kitchen reply") || title.includes("new order") || title.includes("order received") || title.includes("order cancelled") || title.includes("instruction");
    if (isKitchenOrOrder) {
      const orderMatch = notification.title.match(/Order\s*#(\d+)/i) || notification.preview.match(/Order\s*#(\d+)/i) || notification.body.match(/Order\s*#(\d+)/i);
      if (orderMatch) {
        const isKitchenReply = title.includes("kitchen reply");
        navigate(`/tickets?orderNumber=${orderMatch[1]}${isKitchenReply ? "&openChat=true" : ""}`);
        return;
      }
    }

    if (isMobile) {
      navigate(`/settings/notifications/detail/${notification.id}`);
    } else {
      setSelectedId(notification.id);
    }
  };

  // Shared search bar component
  const searchBar = (
    <div className="flex items-center gap-2 px-4 shrink-0">
      <div className="flex-1 bg-neutral-800/40 rounded-full px-4 py-2.5 flex items-center gap-3">
        <Search className="w-4 h-4 text-neutral-500 shrink-0" />
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-foreground placeholder:text-neutral-500 outline-none text-sm"
        />
        <Mic className="w-4 h-4 text-neutral-500 shrink-0" />
      </div>
        )}
        {searchBar}
        {iconFilterRow}
        {totalUnread > 0 && (
          <div className="px-4 pb-2 shrink-0">
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 text-xs text-primary active:opacity-70 transition-opacity"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all as read ({totalUnread})</span>
            </button>
          </div>
        )}
        {notificationsList}
      </div>
    );
  }

  // Desktop: full-screen, left panel has header/search/filters, right panel has detail
  return (
    <div className="h-full flex overflow-hidden">
      {/* Left panel */}
      <div className="w-[420px] h-full overflow-hidden flex flex-col bg-[#ededed99] dark:bg-[#26262699] rounded-2xl">
        {/* "< Settings" header */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 shrink-0">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1 active:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Search bar */}
        {searchBar}

        {/* Icon filter row */}
        {iconFilterRow}

        {/* Notifications list */}
        {notificationsList}
      </div>

      {/* Right panel - detail */}
      <div className="flex-1 h-full overflow-y-auto scrollbar-hide">
        {detailPanel}
      </div>
    </div>
  );
};

export const NotificationDetailView = ({ notification }: { notification: NotificationItem }) => {
  const isWeather = notification.category === "weather";

  return (
    <div className="h-full flex flex-col px-8 pt-6 pb-10 max-w-3xl">
      {/* Header card */}
      <div className="flex items-start gap-4 mb-6">
        <NotificationAvatar notification={notification} size="lg" />
        <div className="flex-1 min-w-0">
          <h1 className="text-[1.15rem] font-bold text-foreground leading-snug tracking-tight">{notification.headline}</h1>
          <p className="text-xs text-muted-foreground/70 mt-1 font-medium">{notification.version_date} · {notification.time}</p>
        </div>
      </div>

      {/* Software Update Button */}
      {notification.has_update && !isWeather && (
        <div className="mb-6">
          <button className="w-full bg-card border border-border rounded-2xl py-3.5 px-6 flex items-center justify-center gap-3 active:scale-[0.98] transition-transform">
            <span className="text-foreground font-semibold text-sm">Software Update</span>
            <Download className="w-4 h-4 text-foreground" />
          </button>
        </div>
      )}

      {/* Message body */}
      <div
        className="rounded-2xl p-5 mb-5"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p className="text-foreground/90 text-[13px] leading-[1.7] whitespace-pre-wrap">{notification.body}</p>
      </div>

      {/* Bullet Points */}
      {notification.bullets && notification.bullets.length > 0 && (
        <div
          className="rounded-2xl p-5 mb-5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <ul className="space-y-3">
            {notification.bullets.map((bullet, i) => (
              <li key={i} className="text-[13px] text-foreground/90 leading-relaxed flex gap-2.5">
                <span className="text-muted-foreground/50 mt-0.5 shrink-0 text-[10px]">●</span>
                <span>
                  <strong className="text-foreground font-semibold">{bullet.label}</strong>{" "}
                  <span className="text-foreground/70">{bullet.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      {notification.footer && (
        <p className="text-muted-foreground/60 text-xs leading-relaxed mt-auto pt-4">{notification.footer}</p>
      )}
    </div>
  );
};

export default NotificationsListContent;
