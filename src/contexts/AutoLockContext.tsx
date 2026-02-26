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

// Routes that should NOT trigger auto-lock (user is already at login/auth)
const EXEMPT_ROUTES = ["/login", "/signup", "/auth"];

export function AutoLockProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsRef = useRef(SettingsManager.getControlCenterSettings());
  const [showLockoutOverlay, setShowLockoutOverlay] = useState(false);

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
      // Lock the app — navigate to login
      navigate("/login", { replace: true });
    }, minutes * 60 * 1000);
  }, [clearTimer, navigate]);

  const resetTimer = useCallback(() => {
    if (!isExempt) {
      startTimer();
    }
  }, [isExempt, startTimer]);

  // Listen for user activity
  useEffect(() => {
    if (isExempt) {
      clearTimer();
      return;
    }

    const handler = () => resetTimer();

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handler, { passive: true });
    });

    // Start initial timer
    startTimer();

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handler);
      });
      clearTimer();
    };
  }, [isExempt, resetTimer, startTimer, clearTimer]);

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

  // Listen for PIN lockout event (10 failed attempts) — show overlay instead of navigating
  useEffect(() => {
    const handlePinLockout = () => {
      clearTimer();
      setShowLockoutOverlay(true);
    };

    window.addEventListener("pin-lockout", handlePinLockout);
    return () => {
      window.removeEventListener("pin-lockout", handlePinLockout);
    };
  }, [clearTimer]);

  const handleUnlock = useCallback(() => {
    resetFailedAttempts();
    setShowLockoutOverlay(false);
    startTimer();
  }, [startTimer]);

  return (
    <AutoLockContext.Provider value={{ resetTimer }}>
      {children}

      {/* POS Locked overlay — shown after 10 failed PIN attempts */}
      {showLockoutOverlay && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-6 w-full max-w-sm px-6">
            {/* Lock icon + title */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-destructive/15 flex items-center justify-center">
                <Lock className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">POS Locked</h1>
              <p className="text-sm text-muted-foreground text-center">
                Too many incorrect PIN attempts.<br />Enter the Manager PIN to unlock.
              </p>
            </div>

            {/* Reuse the existing ManagerPinScreen */}
            <div className="w-full">
              <ManagerPinScreen onSuccess={handleUnlock} />
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
