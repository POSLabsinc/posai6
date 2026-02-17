import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Coffee, LogOut, FlaskConical } from "lucide-react";
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

const Header = () => {
  const navigate = useNavigate();
  useApp();
  const [session, setSession] = useState<SessionData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showClockOut, setShowClockOut] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showExitDemoDialog, setShowExitDemoDialog] = useState(false);

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

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

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

            <span className="hidden md:inline text-sm">Dinner Service (8:00 PM)</span>
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

          <button className="p-0.5 md:p-1 hover:bg-sidebar-accent rounded transition-colors">
            <img src={notificationIcon} alt="Notifications" className="w-4 md:w-5 h-4 md:h-5" />
          </button>

          <img src={wifiIcon} alt="Wifi" className="w-4 md:w-5 h-4 md:h-5" />

          <span className="text-xs md:text-sm font-medium">{formattedTime}</span>
        </div>
      </header>

      <ClockOutOverlay
        isOpen={showClockOut}
        onClose={() => setShowClockOut(false)}
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
