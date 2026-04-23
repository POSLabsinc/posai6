import { createContext, useContext, useEffect, useRef, useCallback, useState, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { SettingsManager } from "@/lib/settingsManager";
import { resetFailedAttempts } from "@/lib/pinAttemptTracker";
import { ClockOutOverlay } from "@/components/ClockOutOverlay";

interface AutoLockContextType {
  resetTimer: () => void;
}

const AutoLockContext = createContext<AutoLockContextType>({ resetTimer: () => {} });

const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "touchstart", "scroll", "click"];

// Routes that should NOT trigger auto-lock
const EXEMPT_ROUTES = ["/login", "/signup", "/auth"];

export function AutoLockProvider({ children }: { children: ReactNode }) {
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

      {/* Lock screen — shows the Clock In / Clock Out PIN interface */}
      <ClockOutOverlay
        isOpen={isLocked}
        onClose={handleUnlock}
        onClockOut={handleUnlock}
      />
    </AutoLockContext.Provider>
  );
}

export function useAutoLock() {
  return useContext(AutoLockContext);
}
