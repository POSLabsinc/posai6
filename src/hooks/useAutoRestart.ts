import { useEffect, useRef, useCallback } from "react";
import { SettingsManager } from "@/lib/settingsManager";
import { toast } from "sonner";

const RESTART_LOG_KEY = "pos_restart_log";
const WARNING_MINUTES = 1;
const CHECK_INTERVAL_MS = 15_000; // 15s

/** Parse "HH:MM" (24h) into today's Date at that time */
function todayAt(time24: string): Date {
  const [h, m] = time24.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

/** Convert stored 12h string to 24h */
function to24(time12: string): string {
  const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return "00:00";
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const p = match[3].toUpperCase();
  if (p === "AM" && h === 12) h = 0;
  else if (p === "PM" && h !== 12) h += 12;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function logRestart(reason: string) {
  const logs = JSON.parse(localStorage.getItem(RESTART_LOG_KEY) || "[]");
  logs.push({ time: new Date().toISOString(), reason });
  // Keep last 50 entries
  if (logs.length > 50) logs.splice(0, logs.length - 50);
  localStorage.setItem(RESTART_LOG_KEY, JSON.stringify(logs));
}

/**
 * Global hook — mount once at app root.
 * Reads restart config from SettingsManager (localStorage-persisted).
 * Handles: scheduled restart, 1-min warning toast, payment deferral,
 * missed-restart on launch, and event logging.
 */
export function useAutoRestart() {
  const warningShownRef = useRef(false);
  const postponedUntilRef = useRef<number | null>(null);
  const deferredRef = useRef(false);

  const isPaymentInProgress = useCallback((): boolean => {
    return localStorage.getItem("pos_payment_in_progress") === "true";
  }, []);

  const doRestart = useCallback(() => {
    const settings = SettingsManager.getControlCenterSettings();
    // Record last restart
    SettingsManager.updateControlCenterSettings({ lastRestartTime: new Date().toISOString() });
    logRestart("scheduled");

    // Use the real restart method from AppContext stored globally
    localStorage.removeItem("pos_session");
    window.location.reload();
  }, []);

  // Check for missed restart on mount
  useEffect(() => {
    const settings = SettingsManager.getControlCenterSettings();
    if (!settings.restartApp) return;

    const time24 = to24(settings.restartTime);
    const scheduledToday = todayAt(time24);
    const now = new Date();

    // If the scheduled time already passed today and no restart happened today
    if (now > scheduledToday) {
      const lastRestart = settings.lastRestartTime ? new Date(settings.lastRestartTime) : null;
      const isSameDay = lastRestart && lastRestart.toDateString() === now.toDateString();
      if (!isSameDay) {
        // Missed restart — trigger immediately unless payment in progress
        if (!isPaymentInProgress()) {
          toast.info("Missed scheduled restart — restarting now…");
          setTimeout(doRestart, 2000);
        } else {
          deferredRef.current = true;
          toast.warning("Restart was scheduled but deferred — a payment is in progress.");
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Main scheduler loop
  useEffect(() => {
    const interval = setInterval(() => {
      const settings = SettingsManager.getControlCenterSettings();
      if (!settings.restartApp) {
        warningShownRef.current = false;
        return;
      }

      const time24 = to24(settings.restartTime);
      const target = todayAt(time24);
      const now = new Date();
      const diffMs = target.getTime() - now.getTime();
      const diffMin = diffMs / 60_000;

      // Already passed for today — check if already restarted
      if (diffMs < -60_000) {
        warningShownRef.current = false;
        return;
      }

      // Check if postponed
      if (postponedUntilRef.current && now.getTime() < postponedUntilRef.current) return;

      // 1-minute warning
      if (diffMin <= WARNING_MINUTES && diffMin > 0 && !warningShownRef.current) {
        warningShownRef.current = true;
        toast("App will restart in 1 minute", {
          duration: 55_000,
          action: {
            label: "Postpone 15 min",
            onClick: () => {
              postponedUntilRef.current = Date.now() + 15 * 60_000;
              toast.info("Restart postponed by 15 minutes.");
              logRestart("postponed-15min");
            },
          },
        });
      }

      // Trigger restart (within 30s window of target)
      if (Math.abs(diffMs) <= 30_000) {
        if (isPaymentInProgress()) {
          if (!deferredRef.current) {
            deferredRef.current = true;
            toast.warning("Restart deferred — payment in progress. Will retry after completion.");
            logRestart("deferred-payment");
          }
          return;
        }
        doRestart();
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [doRestart, isPaymentInProgress]);

  // Listen for payment completion to retry deferred restart
  useEffect(() => {
    const handler = () => {
      if (deferredRef.current) {
        deferredRef.current = false;
        toast.info("Payment completed — restarting now…");
        setTimeout(doRestart, 2000);
      }
    };
    window.addEventListener("pos-payment-complete", handler);
    return () => window.removeEventListener("pos-payment-complete", handler);
  }, [doRestart]);
}
