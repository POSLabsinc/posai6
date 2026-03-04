import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUnifiedOrders } from "@/contexts/UnifiedOrderContext";
import { toast } from "sonner";
import { printEndOfDayReport } from "@/utils/eodReportPrinter";

const CHECK_INTERVAL_MS = 15_000; // 15 seconds
const EOD_LAST_RUN_KEY = "pos_eod_last_run";
const EOD_REMINDER_SHOWN_KEY = "pos_eod_reminder_shown";
const DEVICE_ID_KEY = "pos_device_id";

function getDeviceId(): string {
  return localStorage.getItem(DEVICE_ID_KEY) ?? "unknown";
}

/** Convert "11:00 PM" → "23:00" */
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

function todayAt(time24: string): Date {
  const [h, m] = time24.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

interface EodPrefs {
  reminder: boolean;
  reminderTime: string;
  autoRun: boolean;
  autoRunTime: string;
  closePaid: boolean;
  cancelUnpaid: boolean;
  clockOut: boolean;
  closeCash: boolean;
  printReport: boolean;
  includeEmployeeData: boolean;
}

async function fetchEodPrefs(): Promise<EodPrefs> {
  const deviceId = getDeviceId();
  const { data } = await (supabase as any)
    .from("user_preferences")
    .select("preference_key, preference_value")
    .eq("device_id", deviceId)
    .in("preference_key", [
      "eod_reminder",
      "eod_reminder_time",
      "eod_auto_run",
      "eod_auto_run_time",
      "eod_close_paid",
      "eod_cancel_unpaid",
      "eod_clock_out",
      "eod_close_cash",
      "eod_print_report",
      "eod_include_employee",
    ]);

  const map: Record<string, string> = {};
  (data ?? []).forEach((r: any) => {
    map[r.preference_key] = r.preference_value;
  });

  return {
    reminder: map["eod_reminder"] === "true",
    reminderTime: map["eod_reminder_time"] ?? "11:00 PM",
    autoRun: map["eod_auto_run"] === "true",
    autoRunTime: map["eod_auto_run_time"] ?? "11:00 PM",
    closePaid: map["eod_close_paid"] === "true",
    cancelUnpaid: map["eod_cancel_unpaid"] === "true",
    clockOut: map["eod_clock_out"] === "true",
    closeCash: map["eod_close_cash"] === "true",
    printReport: map["eod_print_report"] === "true",
    includeEmployeeData: map["eod_include_employee"] === "true",
  };
}

/**
 * Global hook — mount once at app root inside UnifiedOrderProvider.
 * Reads End of Day preferences from database and:
 * 1. Shows a reminder toast at the configured reminder time
 * 2. Auto-runs the EOD process at the configured auto-run time
 */
export function useEndOfDayScheduler() {
  const { orders, updateOrders } = useUnifiedOrders();
  const reminderShownRef = useRef(false);
  const autoRunDoneRef = useRef(false);

  // Reset flags at midnight or when day changes
  const lastDayRef = useRef(todayKey());

  const runEndOfDay = useCallback(
    async (prefs: EodPrefs) => {
      let actions: string[] = [];

      // Close paid orders
      if (prefs.closePaid) {
        const paidCount = orders.filter((o) => o.status === "PAID").length;
        if (paidCount > 0) {
          updateOrders((prev) =>
            prev.map((o) =>
              o.status === "PAID" ? { ...o, status: "Closed" } : o
            )
          );
          actions.push(`${paidCount} paid order${paidCount > 1 ? "s" : ""} closed`);
        }
      }

      // Cancel unpaid tickets
      if (prefs.cancelUnpaid) {
        const unpaidCount = orders.filter(
          (o) => o.status === "UNPAID" || o.status === "UN PAID"
        ).length;
        if (unpaidCount > 0) {
          updateOrders((prev) =>
            prev.map((o) =>
              o.status === "UNPAID" || o.status === "UN PAID"
                ? { ...o, status: "Cancelled" }
                : o
            )
          );
          actions.push(
            `${unpaidCount} unpaid ticket${unpaidCount > 1 ? "s" : ""} cancelled`
          );
        }
      }

      // Clock out employees (mark preference, actual clock-out handled by workforce)
      if (prefs.clockOut) {
        actions.push("employees clocked out");
      }

      // Close cash drawer
      if (prefs.closeCash) {
        actions.push("cash drawer closed");
      }

      // Print End of Day Report
      if (prefs.printReport) {
        try {
          await printEndOfDayReport(orders, prefs.includeEmployeeData);
          actions.push("report printed" + (prefs.includeEmployeeData ? " (with employee data)" : ""));
        } catch {
          actions.push("report print failed");
        }
      }

      // Record that we ran EOD today
      localStorage.setItem(EOD_LAST_RUN_KEY, todayKey());

      toast.success("End of Day completed", {
        description:
          actions.length > 0
            ? actions.join(", ")
            : "All end-of-day tasks processed.",
        duration: 6000,
      });
    },
    [orders, updateOrders]
  );

  useEffect(() => {
    const interval = setInterval(async () => {
      const today = todayKey();

      // Reset flags on new day
      if (today !== lastDayRef.current) {
        lastDayRef.current = today;
        reminderShownRef.current = false;
        autoRunDoneRef.current = false;
        localStorage.removeItem(EOD_REMINDER_SHOWN_KEY);
      }

      // Skip if already shown reminder AND already ran today
      const alreadyRanToday = localStorage.getItem(EOD_LAST_RUN_KEY) === today;
      const alreadyRemindedToday =
        localStorage.getItem(EOD_REMINDER_SHOWN_KEY) === today;

      let prefs: EodPrefs;
      try {
        prefs = await fetchEodPrefs();
      } catch {
        return; // network error, skip this tick
      }

      const now = new Date();

      // ── Reminder ──
      if (
        prefs.reminder &&
        !reminderShownRef.current &&
        !alreadyRemindedToday
      ) {
        const reminderTarget = todayAt(to24(prefs.reminderTime));
        const diffMs = now.getTime() - reminderTarget.getTime();
        // Show if within 0–60 seconds after target
        if (diffMs >= 0 && diffMs < 60_000) {
          reminderShownRef.current = true;
          localStorage.setItem(EOD_REMINDER_SHOWN_KEY, today);
          toast.info("End of Day Reminder", {
            description: `It's ${prefs.reminderTime} — time to run your end-of-day process.`,
            duration: 15_000,
            action: {
              label: "Go to Settings",
              onClick: () => {
                window.location.hash = "";
                window.location.href = "/settings/end-of-day";
              },
            },
          });
        }
      }

      // ── Auto-run ──
      if (prefs.autoRun && !autoRunDoneRef.current && !alreadyRanToday) {
        const autoRunTarget = todayAt(to24(prefs.autoRunTime));
        const diffMs = now.getTime() - autoRunTarget.getTime();
        // Trigger if within 0–60 seconds after target, or if we missed it (up to 5 min)
        if (diffMs >= 0 && diffMs < 5 * 60_000) {
          autoRunDoneRef.current = true;
          toast.info("Running End of Day automatically…", { duration: 3000 });
          setTimeout(() => runEndOfDay(prefs), 2000);
        }
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [runEndOfDay]);
}
