import { useState, useMemo } from "react";
import { ChevronLeft, Download, Loader2, CheckCheck, Search, Mic, CloudSun, ClipboardList, Megaphone, RefreshCw, Users, Sparkles, ShoppingCart, XCircle, Lock, AlertTriangle, CheckCircle, Package, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
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
    if (isMobile) {
      if (!notification.is_read) markAsRead(notification.id);
      navigate(`/settings/notifications/detail/${notification.id}`);
    } else {
      setSelectedId(notification.id);
      if (!notification.is_read) markAsRead(notification.id);
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
      <div className="overflow-visible flex items-center justify-center flex-shrink-0" style={{ width: 32, height: 32 }}>
        <AnimatedAIIcon size={20} onClick={onAIClick || (() => navigate('/settings/ai'))} />
      </div>
    </div>
  );

  // Icon filter row
  const iconFilterRow = (
    <div className="flex items-center justify-start gap-3 px-4 py-2 shrink-0">
      {filterDefs.map(f => (
        <button
          key={f.value}
          onClick={() => setActiveFilter(f.value)}
          className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
            activeFilter === f.value
              ? "ring-2 ring-primary bg-card"
              : "bg-card/60 hover:bg-card"
          }`}
        >
          {f.isWeather ? (
            <CloudSun className="w-5 h-5 opacity-70 text-muted-foreground" />
          ) : (
            <img src={f.icon} alt={f.value} className="w-5 h-5 opacity-70" />
          )}
          {f.badge && f.badge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-[#ED1C24] text-white text-[10px] font-bold flex items-center justify-center px-1">
              {f.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );

  // Notification list items
  const notificationsList = (
    <>
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}
      {error && (
        <div className="px-4 py-6 text-center">
          <p className="text-destructive text-sm">Failed to load notifications</p>
        </div>
      )}
      {!loading && !error && (
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-28">
          {filteredGroups.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground text-sm">
                {searchQuery || activeFilter !== "all" ? "No matching notifications" : "No notifications yet"}
              </p>
            </div>
          )}
          {filteredGroups.map((group) => (
            <div key={group.version} className="mb-4">
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {group.version} ({group.date})
                </p>
                {group.unreadCount > 0 && (
                  <span className="text-[10px] font-bold text-primary">{group.unreadCount} new</span>
                )}
              </div>
              <div className="bg-card rounded-2xl overflow-hidden">
                {group.notifications.map((notification, idx) => (
                  <div key={notification.id}>
                    {idx > 0 && <div className="h-px bg-border mx-4" />}
                    <button
                      onClick={() => handleSelect(notification)}
                      className={`w-full flex items-start gap-3 py-3.5 px-4 text-left active:opacity-70 transition-all ${
                        effectiveSelectedId === notification.id && !isMobile
                          ? "bg-primary/10 border-l-2 border-primary"
                          : ""
                      }`}
                    >
                      <NotificationAvatar notification={notification} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm truncate ${!notification.is_read ? 'text-foreground font-bold' : 'text-foreground font-semibold'}`}>
                            {notification.title}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            {!notification.is_read && (
                              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                            )}
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{notification.time}</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.preview}</p>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const detailPanel = selectedNotification ? (
    <NotificationDetailView notification={selectedNotification} />
  ) : (
    <div className="h-full flex items-center justify-center">
      <p className="text-muted-foreground text-sm">Select a notification to view details</p>
    </div>
  );

  // Mobile layout
  if (isMobile) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {showHeader && (
          <div className="flex items-center justify-between pt-4 pb-2 px-4 shrink-0 relative">
            {onBack && (
              <button
                onClick={onBack}
                className="w-10 h-10 rounded-full bg-card flex items-center justify-center active:opacity-70 transition-opacity"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
            )}
            <h1 className="text-base font-medium text-foreground absolute left-1/2 -translate-x-1/2">Notifications</h1>
            <div style={{ width: 32, height: 32 }} />
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
    <div className="p-0 px-6 pb-28 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <NotificationAvatar notification={notification} size="lg" />
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground leading-tight">{notification.headline}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{notification.version_date} · {notification.time}</p>
        </div>
      </div>

      {/* Software Update Button - only for update notifications */}
      {notification.has_update && !isWeather && (
        <div className="mb-5">
          <button className="w-full bg-card border border-border rounded-2xl py-3.5 px-6 flex items-center justify-center gap-3 active:opacity-70 transition-opacity">
            <span className="text-foreground font-semibold text-sm">Software Update</span>
            <Download className="w-4 h-4 text-foreground" />
          </button>
        </div>
      )}

      {/* Body */}
      <p className="text-foreground text-sm leading-relaxed mb-4">{notification.body}</p>

      {/* Bullet Points */}
      {notification.bullets && notification.bullets.length > 0 && (
        <ul className="space-y-2 mb-5">
          {notification.bullets.map((bullet, i) => (
            <li key={i} className="text-sm text-foreground leading-relaxed flex gap-2">
              <span className="text-muted-foreground mt-1.5 shrink-0">•</span>
              <span>
                <strong>{bullet.label}</strong> {bullet.text}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Footer */}
      {notification.footer && (
        <p className="text-muted-foreground text-xs leading-relaxed">{notification.footer}</p>
      )}
    </div>
  );
};

export default NotificationsListContent;
