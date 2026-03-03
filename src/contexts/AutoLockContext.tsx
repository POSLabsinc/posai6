import { createContext, useContext, useEffect, useRef, useCallback, useState, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SettingsManager } from "@/lib/settingsManager";
import { resetFailedAttempts } from "@/lib/pinAttemptTracker";

interface AutoLockContextType {
  resetTimer: () => void;
}

const AutoLockContext = createContext<AutoLockContextType>({ resetTimer: () => {} });

const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "touchstart", "scroll", "click"];

// Routes that should NOT trigger auto-lock
const EXEMPT_ROUTES = ["/login", "/signup", "/auth"];

export function AutoLockProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    if (settings.autoLockTimer === "never") return;

    const minutes = parseInt(settings.autoLockTimer, 10);
    if (isNaN(minutes) || minutes <= 0) return;

    timerRef.current = setTimeout(() => {
      // Navigate to the existing login/clock-in screen
      navigate("/login", { replace: true, state: { fromAutoLock: true } });
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

  // Listen for PIN lockout event (10 failed attempts)
  useEffect(() => {
    const handlePinLockout = () => {
      clearTimer();
      resetFailedAttempts();
      navigate("/login", { replace: true });
    };

    window.addEventListener("pin-lockout", handlePinLockout);
    return () => {
      window.removeEventListener("pin-lockout", handlePinLockout);
    };
  }, [clearTimer, navigate]);

  return (
    <AutoLockContext.Provider value={{ resetTimer }}>
      {children}
    </AutoLockContext.Provider>
  );
}

export function useAutoLock() {
  return useContext(AutoLockContext);
}
