// Centralized PIN management for the POS application
// Stores and validates PINs via localStorage, syncs with active session

const PIN_STORAGE_KEY = "pos_user_pins";

// Default employee PIN mapping (fallback if no custom PIN set)
const DEFAULT_PINS: Record<string, string> = {
  "1234": "manager", // Default manager PIN
};

/**
 * Get the current manager/auth PIN.
 * If user has updated their PIN via Settings, returns the updated one.
 * Otherwise returns the default "1234".
 */
export function getManagerPin(): string {
  try {
    const stored = localStorage.getItem(PIN_STORAGE_KEY);
    if (stored) {
      const pins = JSON.parse(stored);
      if (pins.managerPin) return pins.managerPin;
    }
  } catch {}
  return "1234";
}

/**
 * Update the manager/auth PIN. Takes effect immediately.
 * Dispatches a custom event so any listening components can react.
 */
export function updateManagerPin(newPin: string): void {
  try {
    const stored = localStorage.getItem(PIN_STORAGE_KEY);
    const pins = stored ? JSON.parse(stored) : {};
    pins.managerPin = newPin;
    localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(pins));
    
    // Dispatch event for real-time sync
    window.dispatchEvent(new CustomEvent("pin-updated", { detail: { type: "manager", pin: newPin } }));
  } catch (error) {
    console.error("Failed to update PIN:", error);
  }
}

/**
 * Validate a PIN against the current manager PIN.
 */
export function validateManagerPin(pin: string): boolean {
  return pin === getManagerPin();
}

/**
 * Validate the user's current PIN (used in Change PIN flow step 1).
 */
export function validateCurrentPin(pin: string): boolean {
  return pin === getManagerPin();
}
