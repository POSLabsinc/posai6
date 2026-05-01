import { useState, useMemo } from "react";
import { ChevronLeft, Download, Loader2, CheckCheck, Search, Mic, CloudSun, ClipboardList, Megaphone, RefreshCw, Users, Sparkles, ShoppingCart, XCircle, Lock, AlertTriangle, CheckCircle, Package, Truck, ChefHat } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import eatosProfile from "@/assets/icons/eatos-profile.png";

import filterListIcon from "@/assets/icons/filter-list.png";
import filterClipboardIcon from "@/assets/icons/filter-clipboard.png";
import filterMegaphoneIcon from "@/assets/icons/filter-megaphone.png";

import filterTeamIcon from "@/assets/icons/filter-team.png";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useNotifications, type NotificationItem, type NotificationGroup } from "@/hooks/useNotifications";
import { useWeatherNotification } from "@/hooks/useWeatherNotification";
import { useNotificationRolePermissions } from "@/hooks/useNotificationRolePermissions";
import { SalesInsightDetailView } from "@/components/settings/SalesInsightDetailView";
import LiveSalesDashboard from "@/components/dashboards/LiveSalesDashboard";
import InventoryDashboard from "@/components/dashboards/InventoryDashboard";
import ProfitDashboard from "@/components/dashboards/ProfitDashboard";
import ForecastingDashboard from "@/components/dashboards/ForecastingDashboard";
import { CommodityPriceInsightView } from "@/components/settings/CommodityPriceInsightView";
import { UpsellingInsightView } from "@/components/settings/UpsellingInsightView";
import { detectCommodity } from "@/components/settings/commodityData";
import { WeatherInsightView } from "@/components/settings/WeatherInsightView";

type FilterType = "all" | "system" | "announcements" | "updates" | "team" | "weather" | "ai";

// Category-based icon and color mapping for notification avatars
const getCategoryIcon = (notification: NotificationItem): { icon?: any; bg: string; color: string; useEatosProfile?: boolean; useAIIcon?: boolean } => {
  if (notification.category === "weather") {
    return { icon: CloudSun, bg: "bg-sky-500/15", color: "text-sky-500" };
  }
  if (notification.category === "ai") {
    return { useAIIcon: true, bg: "", color: "" };
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
  const { icon: Icon, bg, color, useEatosProfile, useAIIcon } = getCategoryIcon(notification);
  const dims = size === "lg" ? "w-11 h-11" : "w-9 h-9";
  const iconSize = size === "lg" ? "w-6 h-6" : "w-4.5 h-4.5";
  const aiIconSize = size === "lg" ? 28 : 22;

  return (
    <div className={`${dims} rounded-full overflow-hidden shrink-0 flex items-center justify-center ${size === "sm" ? "mt-0.5" : ""}`}>
      {useAIIcon ? (
        <AnimatedAIIcon size={aiIconSize} />
      ) : useEatosProfile ? (
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
  const { groups, totalUnread: rawTotalUnread, loading, error, markAsRead, markAllAsRead, notifications: rawNotifications } = useNotifications();
  useWeatherNotification();
  const roleFilter = useNotificationRolePermissions();

  // Synthetic "Live Sales Dashboard" notification (manager-only, AI category).
  // Lives only in memory; opens the LiveSalesDashboard in the detail panel.
  const liveSalesNotification: NotificationItem = useMemo(() => ({
    id: "live-sales-dashboard",
    title: "Live Sales Dashboard",
    preview: "Real-time sales, revenue, and AI insights with anomaly detection.",
    version: "Live",
    version_date: "Today",
    time: "Now",
    headline: "Live Sales & Revenue Dashboard",
    body: "Real-time metrics, trends, and AI analysis.",
    bullets: [],
    footer: null,
    has_update: false,
    is_read: true,
    created_at: new Date().toISOString(),
    category: "ai",
  }), []);

  // Synthetic "Inventory Management" notification (manager + cook).
  // Classified by text ("inventory", "stock") so role permissions still apply.
  const inventoryNotification: NotificationItem = useMemo(() => ({
    id: "inventory-dashboard",
    title: "Live Inventory & Stock Alerts",
    preview: "Real-time stock levels, smart replenishment and depletion forecasts.",
    version: "Live",
    version_date: "Today",
    time: "Now",
    headline: "AI Inventory Management",
    body: "Stock levels, alerts, replenishment, and predictive forecasting.",
    bullets: [],
    footer: null,
    has_update: false,
    is_read: true,
    created_at: new Date(Date.now() - 1000).toISOString(),
    category: "ai",
  }), []);

  // Synthetic "Profit Monitoring" notification (manager-focused).
  const profitNotification: NotificationItem = useMemo(() => ({
    id: "profit-dashboard",
    title: "Real-Time Profit Monitoring",
    preview: "Live gross/net profit, shift & location breakdown with AI-flagged anomalies.",
    version: "Live",
    version_date: "Today",
    time: "Now",
    headline: "Profit Margin Below Target",
    body: "AI flagged anomalies on dinner shift refunds and labor ratio.",
    bullets: [],
    footer: null,
    has_update: false,
    is_read: true,
    created_at: new Date(Date.now() - 2000).toISOString(),
    category: "ai",
  }), []);

  // Apply role-based visibility before any other filtering. Re-runs when role/perms change.
  const notifications = useMemo(
    () => [liveSalesNotification, inventoryNotification, profitNotification, ...rawNotifications.filter((n) => roleFilter.isAllowed(n))],
    [rawNotifications, roleFilter.role, roleFilter.permissions, liveSalesNotification, inventoryNotification, profitNotification]
  );

  const totalUnread = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);
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
            <h1 className="text-xl font-semibold text-foreground absolute left-1/2 -translate-x-1/2">Notifications</h1>
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

  // Weather notification: full-chat weather experience
  if (isWeather) {
    return <WeatherInsightView notification={notification} />;
  }

  // Live Sales Dashboard: render full real-time dashboard with AI panel
  if (notification.id === "live-sales-dashboard") {
    return (
      <div className="h-full w-full overflow-hidden">
        <LiveSalesDashboard />
      </div>
    );
  }

  // Inventory Dashboard: AI-driven inventory management
  if (notification.id === "inventory-dashboard") {
    return (
      <div className="h-full w-full overflow-hidden">
        <InventoryDashboard />
      </div>
    );
  }

  // Profit Dashboard: real-time profit monitoring with AI anomaly detection
  if (notification.id === "profit-dashboard") {
    return (
      <div className="h-full w-full overflow-hidden">
        <ProfitDashboard />
      </div>
    );
  }


  // Sales-pace AI insight: render the rich analytics + chat experience
  const titleLower = (notification.title || "").toLowerCase();
  const headlineLower = (notification.headline || "").toLowerCase();
  const isSalesInsight =
    notification.category === "ai" &&
    (titleLower.includes("sales pace") ||
      titleLower.includes("sales") ||
      headlineLower.includes("sales pace") ||
      headlineLower.includes("sales"));
  if (isSalesInsight) {
    return <SalesInsightDetailView notification={notification} />;
  }

  // Upselling AI insight
  const isUpsellInsight =
    notification.category === "ai" &&
    (titleLower.includes("upsell") || titleLower.includes("upselling") ||
      headlineLower.includes("upsell") || titleLower.includes("promote") ||
      titleLower.includes("combo"));
  if (isUpsellInsight) {
    return <UpsellingInsightView notification={notification} />;
  }

  // Commodity price AI insight (onion, tomato, chicken, beef, milk, eggs, generic price)
  if (notification.category === "ai") {
    const commodity = detectCommodity(notification);
    if (commodity) {
      return <CommodityPriceInsightView notification={notification} data={commodity} />;
    }
  }

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
