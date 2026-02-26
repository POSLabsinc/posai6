// Global PIN failed attempt tracker
// Locks the app after 10 consecutive failed PIN entries (when enabled in settings)

import { SettingsManager } from "@/lib/settingsManager";

const MAX_ATTEMPTS = 10;
const STORAGE_KEY = "pos_pin_failed_attempts";

/** Get current failed attempt count */
export function getFailedCount(): number {
  try {
    return parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
  } catch {
    return 0;
  }
}

/** Set failed attempt count */
function setFailedCount(count: number): void {
  localStorage.setItem(STORAGE_KEY, String(count));
}

/**
 * Record a failed PIN attempt. Returns true if the app should lock (10th failure reached).
 * Only counts if "Lock After Failed Attempts" is enabled in settings.
 */
export function recordFailedAttempt(): boolean {
  const settings = SettingsManager.getControlCenterSettings();
  if (!settings.lockAfterFailed) return false;

  const count = getFailedCount() + 1;
  setFailedCount(count);

  if (count >= MAX_ATTEMPTS) {
    // Dispatch a custom event so the AutoLockContext (or any listener) can navigate
    window.dispatchEvent(new CustomEvent("pin-lockout"));
    return true;
  }
  return false;
}

/**
 * Reset the failed attempt counter (call on successful PIN entry).
 */
export function resetFailedAttempts(): void {
  setFailedCount(0);
}

/**
 * Check if currently locked out.
 */
export function isLockedOut(): boolean {
  const settings = SettingsManager.getControlCenterSettings();
  if (!settings.lockAfterFailed) return false;
  return getFailedCount() >= MAX_ATTEMPTS;
}
