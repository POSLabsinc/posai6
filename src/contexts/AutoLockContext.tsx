import { createContext, useContext, useEffect, useRef, useCallback, useState, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SettingsManager } from "@/lib/settingsManager";
import { resetFailedAttempts } from "@/lib/pinAttemptTracker";
import { Lock } from "lucide-react";
import ManagerPinScreen from "@/components/ManagerPinScreen";

interface AutoLockContextType {
  resetTimer: () => void;
}

const AutoLockContext = createContext<AutoLockContextType>({ resetTimer: () => {} });

const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "touchstart", "scroll", "click"];

// Routes that should NOT trigger auto-lock
const EXEMPT_ROUTES = ["/login", "/signup", "/auth"];

function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, "0");

  const dateStr = time.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col items-center gap-1 mb-6">
      <span className="text-6xl font-light text-foreground tracking-tight">
        {displayHours}:{displayMinutes}
      </span>
      <span className="text-lg text-muted-foreground font-medium">{ampm}</span>
      <span className="text-sm text-muted-foreground mt-1">{dateStr}</span>
    </div>
  );
}

export function AutoLockProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsRef = useRef(SettingsManager.getControlCenterSettings());
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState<"timer" | "pin-lockout">("timer");

  const isExempt = EXEMPT_ROUTES.some((r) => location.pathname.startsWith(r));

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    const settings = SettingsManager.getControlCenterSettings();
    settingsRef.current = settings;

    if (settings.autoLockTimer === "never") return;

    const minutes = parseInt(settings.autoLockTimer, 10);
    if (isNaN(minutes) || minutes <= 0) return;

    timerRef.current = setTimeout(() => {
      setLockReason("timer");
      setIsLocked(true);
    }, minutes * 60 * 1000);
  }, [clearTimer]);

  const resetTimer = useCallback(() => {
    if (!isExempt) {
      startTimer();
    }
  }, [isExempt, startTimer]);

  // Listen for user activity
  useEffect(() => {
    if (isExempt || isLocked) {
      clearTimer();
      return;
    }

    const handler = () => resetTimer();

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handler, { passive: true });
    });

    startTimer();

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handler);
      });
      clearTimer();
    };
  }, [isExempt, isLocked, resetTimer, startTimer, clearTimer]);

  // Listen for settings changes
  useEffect(() => {
    const handleSettingsUpdate = (event: CustomEvent) => {
      const { type } = event.detail || {};
      if (type === "controlCenter") {
        resetTimer();
      }
    };

    window.addEventListener("settings-updated", handleSettingsUpdate as EventListener);
    return () => {
      window.removeEventListener("settings-updated", handleSettingsUpdate as EventListener);
    };
  }, [resetTimer]);

  // Listen for PIN lockout event (10 failed attempts)
  useEffect(() => {
    const handlePinLockout = () => {
      clearTimer();
      setLockReason("pin-lockout");
      setIsLocked(true);
    };

    window.addEventListener("pin-lockout", handlePinLockout);
    return () => {
      window.removeEventListener("pin-lockout", handlePinLockout);
    };
  }, [clearTimer]);

  const handleUnlock = useCallback(() => {
    resetFailedAttempts();
    setIsLocked(false);
    startTimer();
  }, [startTimer]);

  return (
    <AutoLockContext.Provider value={{ resetTimer }}>
      {children}

      {/* Lock screen overlay */}
      {isLocked && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4 w-full max-w-sm px-6">
            {/* Live Clock */}
            <LiveClock />

            {/* Lock icon + message */}
            {lockReason === "pin-lockout" && (
              <div className="flex flex-col items-center gap-2 mb-2">
                <div className="w-14 h-14 rounded-full bg-destructive/15 flex items-center justify-center">
                  <Lock className="w-7 h-7 text-destructive" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Too many incorrect PIN attempts
                </p>
              </div>
            )}

            {lockReason === "timer" && (
              <p className="text-sm text-muted-foreground text-center mb-2">
                Enter PIN to unlock
              </p>
            )}

            {/* PIN Screen */}
            <div className="w-full">
              <ManagerPinScreen
                onSuccess={handleUnlock}
              />
            </div>
          </div>
        </div>
      )}
    </AutoLockContext.Provider>
  );
}

export function useAutoLock() {
  return useContext(AutoLockContext);
}
