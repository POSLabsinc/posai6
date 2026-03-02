import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { ChevronDown } from "lucide-react";
import { SidebarPositionProvider, useSidebarPosition } from "@/contexts/SidebarPositionContext";
import { DraggableSidebar } from "@/components/DraggableSidebar";
import { SidebarDropZones } from "@/components/SidebarDropZone";
import { ClockInOverlay } from "@/components/ClockInOverlay";
import FloatingBugReport from "@/components/FloatingBugReport";
import FloatingInstabug from "@/components/FloatingInstabug";

interface LayoutProps {
  children: React.ReactNode;
}

function LayoutContent({ children }: LayoutProps) {
  const location = useLocation();
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);
  const [headerTouchStart, setHeaderTouchStart] = useState<number | null>(null);
  const { position } = useSidebarPosition();

  // Determine if ClockInOverlay should show (device trusted but no employee clocked in)
  const isAuthRoute = location.pathname === "/login" || location.pathname === "/signup" || location.pathname === "/clock-in";
  const [showClockInOverlay, setShowClockInOverlay] = useState(false);
  const isAuthRouteRef = useRef(isAuthRoute);
  isAuthRouteRef.current = isAuthRoute;
  const userDismissedRef = useRef(false);

  const checkClockInState = useCallback(() => {
    if (isAuthRouteRef.current) {
      setShowClockInOverlay(false);
      return;
    }
    if (userDismissedRef.current) return;
    const deviceSession = localStorage.getItem("pos_device_session");
    const posSession = localStorage.getItem("pos_session");
    setShowClockInOverlay(!!deviceSession && !posSession);
  }, []);

  useEffect(() => {
    checkClockInState();
  }, [location.pathname, isAuthRoute, checkClockInState]);

  // Listen for pos_session changes (e.g., after clock-out removes the session)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "pos_device_session") {
        userDismissedRef.current = false;
      }
      if (e.key === "pos_session" || e.key === "pos_device_session") {
        checkClockInState();
      }
    };
    // Listen for custom event dispatched within the same tab
    const handleSessionChange = () => {
      // If a session now exists (employee clocked in via ClockOutOverlay),
      // reset the dismissed flag so the PIN pad can appear after clock-out.
      const posSession = localStorage.getItem("pos_session");
      if (posSession) {
        userDismissedRef.current = false;
      }
      checkClockInState();
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("pos_session_changed", handleSessionChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("pos_session_changed", handleSessionChange);
    };
  }, [checkClockInState]);

  const handleClockInClose = () => {
    // Re-check session after overlay interaction
    const posSession = localStorage.getItem("pos_session");
    if (posSession) {
      userDismissedRef.current = false;
      setShowClockInOverlay(false);
    }
  };

  const handleEnterPOS = () => {
    userDismissedRef.current = true;
    setShowClockInOverlay(false);
  };

  const handleHeaderTouchStart = (e: React.TouchEvent) => {
    setHeaderTouchStart(e.touches[0].clientY);
  };

  const handleHeaderTouchEnd = (e: React.TouchEvent) => {
    if (headerTouchStart === null) return;
    const diff = e.changedTouches[0].clientY - headerTouchStart;
    if (diff < -30) {
      setIsHeaderVisible(false);
    }
    setHeaderTouchStart(null);
  };

  const isHorizontal = position === 'top' || position === 'bottom';

  return (
    <div 
      className="h-screen flex flex-col w-full overflow-hidden bg-background" 
    >
      {/* Drop zones for drag and drop */}
      <SidebarDropZones />

      {/* Mobile backdrop to dismiss header when tapping outside */}
      {isHeaderVisible && (
        <div 
          className="fixed inset-0 z-10 md:hidden" 
          onClick={() => setIsHeaderVisible(false)} 
        />
      )}

      {/* Header - Hidden by default on mobile, shown when toggled */}
      <div 
        className={`${isHeaderVisible ? 'block' : 'hidden'} md:block flex-shrink-0 relative z-20`} 
        onTouchStart={handleHeaderTouchStart} 
        onTouchEnd={handleHeaderTouchEnd}
      >
        <Header />
      </div>
      
      {/* Mobile Header Toggle - Only shown when header is hidden */}
      {!isHeaderVisible && (
        <button 
          onClick={() => setIsHeaderVisible(true)} 
          className="md:hidden mx-auto bg-surface-elevated hover:bg-surface px-8 py-px rounded-b-md transition-colors relative z-20"
        >
          <ChevronDown className="w-2.5 h-2.5 text-muted-foreground" />
        </button>
      )}

      {/* Top sidebar position */}
      {position === 'top' && (
        <div className="hidden md:block flex-shrink-0">
          <DraggableSidebar />
        </div>
      )}

      {/* Main content area */}
      <div className={`flex flex-1 min-h-0 overflow-hidden ${isHorizontal ? 'flex-col' : 'flex-row'}`}>
        {/* Left sidebar position */}
        {position === 'left' && (
          <div className="hidden md:block flex-shrink-0">
            <DraggableSidebar />
          </div>
        )}

        <main className="flex-1 overflow-y-auto bg-background px-3 md:px-0">
          {children}
        </main>

        {/* Right sidebar position */}
        {position === 'right' && (
          <div className="hidden md:block flex-shrink-0">
            <DraggableSidebar />
          </div>
        )}
      </div>

      {/* Bottom sidebar position */}
      {position === 'bottom' && (
        <div className="hidden md:block flex-shrink-0">
          <DraggableSidebar />
        </div>
      )}

      {/* Bottom Navigation - Mobile only */}
      <BottomNavigation />

      {/* Clock In Overlay - shows when device is trusted but no employee clocked in */}
      <ClockInOverlay
        isOpen={showClockInOverlay}
        onClose={handleClockInClose}
        onEnterPOS={handleEnterPOS}
      />

      {/* Feedback tools - shown when enabled in Settings → Support → Feedback */}
      <FloatingBugReport />
      <FloatingInstabug />
    </div>
  );
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarPositionProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarPositionProvider>
  );
}