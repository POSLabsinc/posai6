/**
 * Alert system: plays sounds and sends browser push notifications
 * for critical POS events.
 */

// ── Sound Engine (Web Audio API) ──────────────────────────────

type AlertLevel = "info" | "warning" | "critical";

interface AlertOptions {
  title: string;
  body: string;
  level?: AlertLevel;
  /** Skip the sound effect */
  silent?: boolean;
  /** Skip the browser notification */
  noPush?: boolean;
}

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(frequency: number, duration: number, type: OscillatorType = "sine", gain = 0.15) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    vol.gain.value = gain;
    vol.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(vol);
    vol.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available
  }
}

/** Two ascending tones – friendly chime */
function playNewOrderSound() {
  playTone(523.25, 0.15, "sine", 0.18); // C5
  setTimeout(() => playTone(659.25, 0.25, "sine", 0.18), 160); // E5
}

/** Descending two-note tone – alert */
function playCancelSound() {
  playTone(440, 0.15, "triangle", 0.16); // A4
  setTimeout(() => playTone(330, 0.25, "triangle", 0.16), 160); // E4
}

/** Three quick beeps – urgent */
function playErrorSound() {
  for (let i = 0; i < 3; i++) {
    setTimeout(() => playTone(880, 0.1, "square", 0.1), i * 140);
  }
}

/** Single soft chime */
function playInfoSound() {
  playTone(587.33, 0.2, "sine", 0.12); // D5
}

function playSoundForLevel(level: AlertLevel) {
  switch (level) {
    case "critical":
      playErrorSound();
      break;
    case "warning":
      playCancelSound();
      break;
    case "info":
    default:
      playInfoSound();
      break;
  }
}

// ── Browser Push Notifications ──────────────────────────────

let permissionGranted = false;

/** Request notification permission (call once on user interaction) */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") {
    permissionGranted = true;
    return true;
  }
  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  permissionGranted = result === "granted";
  return permissionGranted;
}

export function getNotificationPermissionStatus(): NotificationPermission | "unsupported" {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

function sendBrowserNotification(title: string, body: string) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: `pos-${Date.now()}`,
      requireInteraction: false,
    });
  } catch {
    // Notifications not supported in this context
  }
}

// ── Sound Preference Check ──────────────────────────────

function isSoundEnabled(): boolean {
  try {
    // Reads from the same localStorage key used by usePreference hook
    const deviceId = localStorage.getItem("pos_device_id") || "";
    // Quick check: look in user_preferences cache or fallback to true
    const prefKey = `pref_notification_sound_${deviceId}`;
    const cached = localStorage.getItem(prefKey);
    if (cached !== null) return cached === "true";
    return true; // Default to enabled
  } catch {
    return true;
  }
}

/** Cache sound preference locally for fast access from alertService */
export function cacheSoundPreference(enabled: boolean) {
  try {
    const deviceId = localStorage.getItem("pos_device_id") || "";
    localStorage.setItem(`pref_notification_sound_${deviceId}`, String(enabled));
  } catch {}
}

// ── Main Alert Function ──────────────────────────────

export function triggerAlert(options: AlertOptions) {
  const level = options.level ?? "info";

  // Play sound (respects user preference)
  if (!options.silent && isSoundEnabled()) {
    playSoundForLevel(level);
  }

  // Browser notification (only when tab is not focused)
  if (!options.noPush && document.hidden) {
    sendBrowserNotification(options.title, options.body);
  }
}

// ── Pre-built alert helpers ──────────────────────────────

export function alertNewOrder(orderNumber: number | string, customerName: string) {
  if (isSoundEnabled()) playNewOrderSound();
  if (document.hidden) {
    sendBrowserNotification("New Order Received", `Order #${orderNumber} from ${customerName}`);
  }
}

export function alertOrderCancelled(orderNumber: number | string) {
  triggerAlert({
    title: "Order Cancelled",
    body: `Order #${orderNumber} has been cancelled`,
    level: "warning",
  });
}

export function alertOrderStatusChange(orderNumber: number | string, status: string) {
  triggerAlert({
    title: `Order ${status}`,
    body: `Order #${orderNumber} – ${status}`,
    level: "info",
  });
}

export function alertPinUpdated() {
  triggerAlert({
    title: "PIN Updated",
    body: "Manager PIN has been changed",
    level: "warning",
  });
}

export function alertSystemError(message: string) {
  triggerAlert({
    title: "System Error",
    body: message,
    level: "critical",
  });
}
