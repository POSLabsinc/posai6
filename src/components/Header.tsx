import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Coffee, LogOut, FlaskConical, ChefHat, ShoppingBag, Bell as BellIcon } from "lucide-react";
import dinnerIcon from "@/assets/icons/dinner.png";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import localHostIcon from "@/assets/icons/local-host.png";
import refreshIcon from "@/assets/icons/refresh.png";
import notificationIcon from "@/assets/icons/notification.png";
import wifiIcon from "@/assets/icons/wifi.png";
import supportIcon from "@/assets/icons/support.png";
import switchUserIcon from "@/assets/icons/switch-user.png";
import { useApp } from "@/contexts/AppContext";
import { ClockOutOverlay } from "@/components/ClockOutOverlay";
import AppleAlertDialog from "@/components/AppleAlertDialog";
import { supabase } from "@/integrations/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SessionData {
  employeeId: string;
  employeeName: string;
  employeeRole?: string;
  loginTime: string;
  onBreak?: boolean;
}

interface DeviceSession {
  isDemoMode?: boolean;
  isDemo?: boolean;
  demoBusinessType?: string;
  businessType?: string;
}

const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const Header = () => {
  const navigate = useNavigate();
  useApp();
  const [session, setSession] = useState<SessionData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showClockOut, setShowClockOut] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showExitDemoDialog, setShowExitDemoDialog] = useState(false);
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const [recentNotifs, setRecentNotifs] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load session from localStorage
    const loadSession = () => {
      const savedSession = localStorage.getItem("pos_session");
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession);
          setSession(parsed);
          setIsOnBreak(!!parsed.onBreak);
        } catch {
          setSession(null);
          setIsOnBreak(false);
        }
      } else {
        setSession(null);
        setIsOnBreak(false);
      }

      // Check for demo mode
      const deviceSession = localStorage.getItem("pos_device_session");
      if (deviceSession) {
        try {
          const parsed: DeviceSession = JSON.parse(deviceSession);
          setIsDemoMode(!!parsed.isDemoMode || !!parsed.isDemo);
        } catch {
          setIsDemoMode(false);
        }
      } else {
        setIsDemoMode(false);
      }
    };

    loadSession();

    // Poll for session changes (e.g., break status updates)
    const sessionTimer = setInterval(loadSession, 2000);

    return () => clearInterval(sessionTimer);
  }, []);

  // Fetch recent notifications
  useEffect(() => {
    const fetchNotifs = async () => {
      const { data } = await (supabase as any)
        .from("notifications")
        .select("id, title, preview, created_at, is_read, category")
        .order("created_at", { ascending: false })
        .limit(3);
      if (data) {
        setRecentNotifs(data);
        setUnreadCount(data.filter((n: any) => !n.is_read).length);
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close popover on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifPopover(false);
      }
    };
    if (showNotifPopover) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotifPopover]);



  const handleClockOut = () => {
    // Just close the overlay - ClockOutOverlay resets to PIN screen internally
    setShowClockOut(false);
  };

  const handleExitDemo = () => {
    // Clear all demo/session data
    localStorage.removeItem("pos_device_session");
    localStorage.removeItem("pos_session");
    setShowExitDemoDialog(false);
    // Navigate to login/device setup
    navigate("/login");
  };

  const employeeName = session?.employeeName || "Guest";
  const employeeRole = session?.employeeRole || "Server";
  const initials = getInitials(employeeName);
  const formattedTime = currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <header className="flex items-center justify-between px-2 md:px-4 py-1.5 md:py-2 bg-header text-header-foreground h-10 md:h-12 flex-shrink-0">
        {/* Left Section */}
        <div className="flex items-center gap-1.5 md:gap-3">
          <button
            onClick={() => setShowClockOut(true)}
            className="p-0.5 md:p-1 hover:bg-sidebar-accent rounded transition-colors"
          >
            <img src={switchUserIcon} alt="Clock Out" className="w-4 md:w-5 h-4 md:h-5" />
          </button>

          <div className="flex items-center gap-1 md:gap-2 bg-white/10 pl-0 pr-2 md:pr-3 rounded-full">
            <Avatar className="w-6 md:w-8 h-6 md:h-8 border-0">
              <AvatarImage src="" alt={employeeName} />
              <AvatarFallback className="text-xs bg-sidebar-accent text-sidebar-foreground">{initials}</AvatarFallback>
            </Avatar>

            <span className="font-medium text-xs md:text-sm">{employeeName}</span>
            <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 bg-primary/20 text-primary-foreground rounded-full font-medium uppercase tracking-wide">{employeeRole}</span>

            {/* On Break Status Badge */}
            {isOnBreak && (
              <span className="flex items-center gap-1 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 bg-orange-500/20 text-orange-300 rounded-full font-medium animate-pulse">
                <Coffee className="w-3 h-3" />
                <span className="hidden md:inline">On Break</span>
              </span>
            )}

            <div className="hidden md:block w-px h-4 bg-sidebar-foreground/30 mx-1" />

            <img src={dinnerIcon} alt="Dinner" className="hidden md:block w-4 h-4" />

            <span className="hidden md:inline text-sm">Dinner Service (9:00 PM)</span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Demo Mode Indicator */}
          {isDemoMode && (
            <div className="flex items-center gap-1.5 md:gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 px-2 md:px-3 py-1 md:py-1.5 bg-amber-500/15 border border-amber-500/40 rounded-full cursor-default demo-mode-badge">
                    <FlaskConical className="w-3.5 md:w-4 h-3.5 md:h-4 text-amber-400" />
                    <span className="text-[10px] md:text-xs font-semibold text-amber-300 uppercase tracking-wide">
                      Demo Mode
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-sidebar border-sidebar-border text-sidebar-foreground"
                >
                  <p className="text-xs">Sample data only — no real transactions</p>
                </TooltipContent>
              </Tooltip>

              <button
                onClick={() => setShowExitDemoDialog(true)}
                className="flex items-center gap-1 px-2 md:px-2.5 py-1 md:py-1.5 text-[10px] md:text-xs font-medium text-amber-300 hover:text-amber-200 hover:bg-amber-500/20 rounded-full transition-colors"
              >
                <LogOut className="w-3 md:w-3.5 h-3 md:h-3.5" />
                <span className="hidden sm:inline">Exit Demo</span>
              </button>
            </div>
          )}

          <button className="relative p-0.5 md:p-1 hover:bg-sidebar-accent rounded transition-colors">
            <img src={localHostIcon} alt="Local Host" className="w-4 md:w-5 h-4 md:h-5" />
            <span className="absolute -top-0.5 md:-top-1 -right-0.5 md:-right-1 w-2 md:w-2.5 h-2 md:h-2.5 bg-amber-500 rounded-full border border-sidebar" />
          </button>

          <button className="hidden md:block p-1 hover:bg-sidebar-accent rounded transition-colors">
            <img src={refreshIcon} alt="Refresh" className="w-5 h-5" />
          </button>

          <button className="hidden md:block p-1.5 bg-sidebar-accent rounded-md hover:bg-sidebar-accent/80 transition-colors">
            <img src={supportIcon} alt="Support" className="w-5 h-5" />
          </button>

          {/* Notification Bell with Popover */}
          <div className="relative" ref={notifRef}>
            <button
              className="p-0.5 md:p-1 hover:bg-sidebar-accent rounded transition-colors relative"
              onClick={() => setShowNotifPopover((v) => !v)}
            >
              <img src={notificationIcon} alt="Notifications" className="w-4 md:w-5 h-4 md:h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] rounded-full bg-[#ED1C24] text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifPopover && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-[#1C1C1E] border border-white/10 rounded-2xl shadow-2xl z-[999] overflow-hidden">
                {/* Header - clickable to go to all notifications */}
                <button
                  onClick={() => {
                    setShowNotifPopover(false);
                    navigate("/settings/notifications/all");
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 border-b border-white/10 hover:bg-white/5 transition-colors"
                >
                  <span className="text-sm font-semibold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="min-w-[20px] h-5 rounded-full bg-[#ED1C24] text-white text-[10px] font-bold flex items-center justify-center px-1.5">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification list */}
                <div className="max-h-64 overflow-y-auto">
                  {recentNotifs.length === 0 ? (
                    <div className="px-4 py-6 text-center text-neutral-500 text-xs">
                      No notifications yet
                    </div>
                  ) : (
                    recentNotifs.map((n) => {
                      const icon = n.category === "team" || n.title?.includes("Kitchen")
                        ? <ChefHat className="w-4 h-4 text-orange-400" />
                        : n.title?.includes("Order")
                        ? <ShoppingBag className="w-4 h-4 text-blue-400" />
                        : <BellIcon className="w-4 h-4 text-neutral-400" />;
                      const timeAgo = getTimeAgo(n.created_at);
                      return (
                        <button
                          key={n.id}
                          onClick={() => {
                             setShowNotifPopover(false);
                             const title = (n.title || "").toLowerCase();
                             const isKitchenOrOrder = title.includes("kitchen reply") || title.includes("new order") || title.includes("order received") || title.includes("order cancelled") || title.includes("instruction");
                             if (isKitchenOrOrder) {
                               const orderMatch = (n.title || "").match(/Order\s*#(\d+)/i) || (n.preview || "").match(/Order\s*#(\d+)/i);
                               if (orderMatch) {
                                 navigate(`/tickets?orderNumber=${orderMatch[1]}`);
                                 return;
                               }
                             }
                             navigate("/settings/notifications/all");
                           }
                          className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left ${!n.is_read ? "bg-white/[0.03]" : ""}`}
                        >
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                            {icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium ${!n.is_read ? "text-white" : "text-neutral-300"}`} style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              {n.title}
                            </p>
                            <p className="text-[11px] text-neutral-500 mt-0.5" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{n.preview}</p>
                          </div>
                          <span className="text-[10px] text-neutral-600 shrink-0 mt-0.5">{timeAgo}</span>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* View More */}
                {recentNotifs.length > 0 && (
                  <button
                    onClick={() => {
                      setShowNotifPopover(false);
                      navigate("/settings/notifications/all");
                    }}
                    className="w-full px-4 py-2.5 border-t border-white/10 text-center text-xs font-medium text-blue-400 hover:bg-white/5 transition-colors"
                  >
                    View More
                  </button>
                )}
              </div>
            )}
          </div>

          <img src={wifiIcon} alt="Wifi" className="w-4 md:w-5 h-4 md:h-5" />

          <span className="text-xs md:text-sm font-medium">{formattedTime}</span>
        </div>
      </header>

      <ClockOutOverlay
        isOpen={showClockOut}
        onClose={() => {
          setShowClockOut(false);
        }}
        onClockOut={handleClockOut}
      />

      {/* Exit Demo Confirmation Dialog */}
      <AppleAlertDialog
        open={showExitDemoDialog}
        onOpenChange={setShowExitDemoDialog}
        title="Exit Demo Mode?"
        description="You'll return to device setup or sign-in to activate a real account."
        confirmText="Exit Demo"
        cancelText="Cancel"
        onConfirm={handleExitDemo}
      />
    </>
  );
};

export default Header;
