// Settings Manager - Centralized access to all settings data
// Used by AI assistant to read and modify settings
import { supabase } from "@/integrations/supabase/client";

// Device ID helper (mirrors usePreference.ts)
const DEVICE_ID_KEY = "pos_device_id";
function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

// Storage keys
const STORAGE_KEYS = {
  GRATUITY: "gratuity-settings",
  DISCOUNTS: "discounts-settings",
  TAXES: "taxes-settings",
  SERVICE_CHARGES: "service-charges-settings",
  APPEARANCE: "appearance-settings",
  MENUS: "menu-items-settings",
  CONTROL_CENTER: "control-center-settings",
  CHECKOUT_OPTIONS: "checkout-options-settings",
  ORDERS: "orders-settings",
};

// All settings keys that should be synced to the database
const ALL_SETTINGS_KEYS = Object.values(STORAGE_KEYS);

// Appearance has individual keys stored separately
const APPEARANCE_INDIVIDUAL_KEYS = ["theme", "iconStyle", "iconSize", "textSize", "boldText", "brightness"];

/**
 * Sync a localStorage settings key to the user_preferences database table.
 * Fire-and-forget — does not block the UI.
 */
function syncToDatabase(preferenceKey: string, value: string) {
  const deviceId = getDeviceId();
  (supabase as any)
    .from("user_preferences")
    .upsert(
      { device_id: deviceId, preference_key: preferenceKey, preference_value: value },
      { onConflict: "device_id,preference_key" }
    )
    .then(() => {
      console.log(`[SettingsManager] Synced "${preferenceKey}" to database`);
    });
}

// Types
export interface GratuitySettings {
  enableTip: boolean;
  showOnReceipt: boolean;
  allowCustom: boolean;
  disableTipOnCFD: boolean;
  presetType: "amount" | "percentage";
  autoClosePaymentMethods: string[];
  tipPresets: string[];
  selectedTipPresets: string[];
}

export interface Discount {
  id: string;
  name: string;
  amount: number;
  type: "Percentage" | "Fixed";
  archived: boolean;
  applicableTo?: string;
  applicableProducts?: string[];
  requiresManagerPin?: boolean;
}

export interface Tax {
  id: string;
  name: string;
  amount: number;
  type: "Exclusive" | "Inclusive";
  archived: boolean;
  applicableTo?: string;
  applicableProducts?: string[];
}

export interface ServiceCharge {
  id: string;
  name: string;
  amount: number;
  type: "Percentage" | "Fixed";
  archived: boolean;
  taxApplicable?: string;
  orderType?: string | string[];
  appliedAs?: string;
  automaticApply?: boolean;
  minSeats?: number;
  requiresManagerPin?: boolean;
  isActive?: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  posEnabled?: boolean;
  popEnabled?: boolean;
  kioskEnabled?: boolean;
  onlineEnabled?: boolean;
}

export interface AppearanceSettings {
  theme: "dark" | "light" | "system";
  iconStyle: "Default" | "Dark";
  iconSize: "Default" | "Small" | "Medium" | "Large";
  textSize: number;
  boldText: boolean;
  brightness: number;
}

export interface ControlCenterSettings {
  restartApp: boolean;
  restartTime: string;
  lastRestartTime: string | null;
  autoLockTimer: string;
  switchToKDS: boolean;
  debugMode: boolean;
  lockAfterFailed: boolean;
  forceClockIn: boolean;
  openRegisterWithoutPIN: boolean;
  hidePerformanceSummary: boolean;
  builtInDisplay: boolean;
  hideBreakButton: boolean;
  hideEmployeeFeedback: boolean;
  hideSeatSelector: boolean;
  resetTablesDaily: boolean;
  businessHoursStart: string;
  businessHoursEnd: string;
}

export interface CheckoutOptionsSettings {
  enableQuickAmounts: boolean;
  splitCheck: boolean;
  enableTips: boolean;
  requireOrderType: boolean;
  requireGuestName: boolean;
  guestNotesEnabled: boolean;
  showSaveButton: boolean;
  autoCloseTicket: boolean;
  qrBillPayment: boolean;
  printReceipt: boolean;
  emailReceipt: boolean;
  smsReceipt: boolean;
  skipTipScreen: boolean;
  skipSignature: boolean;
  signatureThreshold: number;
  enablePaymentSounds: boolean;
  enableHoldFire: boolean;
  showOrderSummary: boolean;
  showItemizedTax: boolean;
}

export interface OrdersSettings {
  orderCreationRules: boolean;
  orderFlow: boolean;
  holdAndRecall: boolean;
  orderSync: boolean;
  orderNotifications: boolean;
}

// Default values
const defaultGratuitySettings: GratuitySettings = {
  enableTip: true,
  showOnReceipt: true,
  allowCustom: true,
  disableTipOnCFD: false,
  presetType: "amount",
  autoClosePaymentMethods: [],
  tipPresets: ["5", "10", "15", "20"],
  selectedTipPresets: ["15", "20"],
};

const defaultDiscounts: Discount[] = [
  { id: "1", name: "Employee Discount", amount: 20, type: "Percentage", archived: false, requiresManagerPin: true, applicableTo: "All Products" },
  { id: "2", name: "Happy Hour", amount: 15, type: "Percentage", archived: false, applicableTo: "Beverages Only", requiresManagerPin: false },
  { id: "3", name: "Senior Discount", amount: 10, type: "Percentage", archived: false, requiresManagerPin: true, applicableTo: "All Products" },
  { id: "4", name: "Military Discount", amount: 15, type: "Percentage", archived: false, requiresManagerPin: true, applicableTo: "All Products" },
];

const defaultTaxes: Tax[] = [
  { id: "1", name: "Sales Tax", amount: 8.25, type: "Exclusive", archived: false },
  { id: "2", name: "Local Tax", amount: 1.5, type: "Exclusive", archived: false },
];

const defaultServiceCharges: ServiceCharge[] = [
  { id: "1", name: "Large Party (6+)", amount: 18, type: "Percentage", archived: false, requiresManagerPin: false, orderType: "Dine-In Only", appliedAs: "Large Table", automaticApply: true, minSeats: 6, taxApplicable: "Taxable" },
  { id: "2", name: "Delivery Fee", amount: 5, type: "Fixed", archived: false, orderType: "Delivery Only", requiresManagerPin: false, appliedAs: "Basic", taxApplicable: "Non-Taxable" },
  { id: "3", name: "Private Event", amount: 20, type: "Percentage", archived: false, requiresManagerPin: true, orderType: "All Orders", appliedAs: "Private Event", taxApplicable: "Taxable" },
];

const defaultMenuItems: MenuItem[] = [
  { id: "1", name: "Lunch Menu", isActive: true, startDate: "2024-01-01", endDate: "2025-12-31", posEnabled: true, kioskEnabled: true, onlineEnabled: true },
  { id: "2", name: "Dinner Menu", isActive: true, startDate: "2024-01-01", endDate: "2025-12-31", posEnabled: true, kioskEnabled: true, onlineEnabled: true },
  { id: "3", name: "Happy Hour Menu", isActive: true, startDate: "2024-01-01", endDate: "2025-12-31", posEnabled: true, kioskEnabled: false, onlineEnabled: false },
  { id: "4", name: "Weekend Brunch", isActive: false, startDate: "2024-01-01", endDate: "2025-12-31", posEnabled: true, kioskEnabled: true, onlineEnabled: true },
];

const defaultControlCenterSettings: ControlCenterSettings = {
  restartApp: false,
  restartTime: "12:00 AM",
  lastRestartTime: null,
  autoLockTimer: "30",
  switchToKDS: false,
  debugMode: false,
  lockAfterFailed: false,
  forceClockIn: false,
  openRegisterWithoutPIN: false,
  hidePerformanceSummary: false,
  builtInDisplay: false,
  hideBreakButton: false,
  hideEmployeeFeedback: false,
  hideSeatSelector: false,
  resetTablesDaily: false,
  businessHoursStart: "6:00 AM",
  businessHoursEnd: "1:00 AM",
};

const defaultCheckoutOptionsSettings: CheckoutOptionsSettings = {
  enableQuickAmounts: true,
  splitCheck: true,
  enableTips: true,
  requireOrderType: true,
  requireGuestName: false,
  guestNotesEnabled: true,
  showSaveButton: true,
  autoCloseTicket: false,
  qrBillPayment: false,
  printReceipt: true,
  emailReceipt: true,
  smsReceipt: false,
  skipTipScreen: false,
  skipSignature: false,
  signatureThreshold: 25,
  enablePaymentSounds: true,
  enableHoldFire: true,
  showOrderSummary: true,
  showItemizedTax: true,
};

const defaultOrdersSettings: OrdersSettings = {
  orderCreationRules: true,
  orderFlow: true,
  holdAndRecall: true,
  orderSync: true,
  orderNotifications: true,
};

// Settings Manager class
export class SettingsManager {
  private static _initialized = false;

  /**
   * Load all settings from the database into localStorage.
   * Should be called once on app startup.
   */
  static async initFromDatabase(): Promise<void> {
    if (this._initialized) return;
    this._initialized = true;

    const deviceId = getDeviceId();
    try {
      const allKeys = [...ALL_SETTINGS_KEYS, ...APPEARANCE_INDIVIDUAL_KEYS];
      const { data, error } = await (supabase as any)
        .from("user_preferences")
        .select("preference_key, preference_value")
        .eq("device_id", deviceId)
        .in("preference_key", allKeys);

      if (error || !data || data.length === 0) {
        console.log("[SettingsManager] No DB settings found, using localStorage/defaults");
        return;
      }

      for (const row of data) {
        const current = localStorage.getItem(row.preference_key);
        // Only overwrite if localStorage doesn't already have a value,
        // or always use DB as source of truth
        localStorage.setItem(row.preference_key, row.preference_value);
      }

      console.log(`[SettingsManager] Loaded ${data.length} settings from database`);

      // Dispatch events so any mounted components re-read
      window.dispatchEvent(new CustomEvent('settings-updated', { detail: { type: 'all', data: null } }));
    } catch (err) {
      console.error("[SettingsManager] Failed to load settings from DB:", err);
    }
  }

  // Gratuity
  static getGratuitySettings(): GratuitySettings {
    const stored = localStorage.getItem(STORAGE_KEYS.GRATUITY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return { ...defaultGratuitySettings, ...parsed };
      } catch {
        return defaultGratuitySettings;
      }
    }
    return defaultGratuitySettings;
  }

  static updateGratuitySettings(updates: Partial<GratuitySettings>): GratuitySettings {
    const current = this.getGratuitySettings();
    const updated = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEYS.GRATUITY, JSON.stringify(updated));
    syncToDatabase(STORAGE_KEYS.GRATUITY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('settings-updated', { detail: { type: 'gratuity', data: updated } }));
    return updated;
  }

  // Discounts
  static getDiscounts(): Discount[] {
    const stored = localStorage.getItem(STORAGE_KEYS.DISCOUNTS);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return defaultDiscounts;
  }

  static getActiveDiscounts(): Discount[] {
    return this.getDiscounts().filter(d => !d.archived);
  }

  static findDiscountByName(name: string): Discount | undefined {
    const lower = name.toLowerCase();
    return this.getDiscounts().find(d => d.name.toLowerCase().includes(lower));
  }

  static addDiscount(discount: Omit<Discount, "id">): Discount {
    const discounts = this.getDiscounts();
    const newDiscount: Discount = { ...discount, id: Date.now().toString() };
    discounts.push(newDiscount);
    localStorage.setItem(STORAGE_KEYS.DISCOUNTS, JSON.stringify(discounts));
    syncToDatabase(STORAGE_KEYS.DISCOUNTS, JSON.stringify(discounts));
  }

  static updateDiscount(id: string, updates: Partial<Discount>): Discount | null {
    const discounts = this.getDiscounts();
    const index = discounts.findIndex(d => d.id === id);
    if (index === -1) return null;
    discounts[index] = { ...discounts[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.DISCOUNTS, JSON.stringify(discounts));
    syncToDatabase(STORAGE_KEYS.DISCOUNTS, JSON.stringify(discounts));
  }

  static archiveDiscount(id: string): boolean {
    const discounts = this.getDiscounts();
    const index = discounts.findIndex(d => d.id === id);
    if (index === -1) return false;
    discounts[index].archived = true;
    localStorage.setItem(STORAGE_KEYS.DISCOUNTS, JSON.stringify(discounts));
    syncToDatabase(STORAGE_KEYS.DISCOUNTS, JSON.stringify(discounts));
  static getTaxes(): Tax[] {
    const stored = localStorage.getItem(STORAGE_KEYS.TAXES);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return defaultTaxes;
  }

  static getActiveTaxes(): Tax[] {
    return this.getTaxes().filter(t => !t.archived);
  }

  static findTaxByName(name: string): Tax | undefined {
    const lower = name.toLowerCase();
    return this.getTaxes().find(t => t.name.toLowerCase().includes(lower));
  }

  static addTax(tax: Omit<Tax, "id">): Tax {
    const taxes = this.getTaxes();
    const newTax: Tax = { ...tax, id: Date.now().toString() };
    taxes.push(newTax);
    localStorage.setItem(STORAGE_KEYS.TAXES, JSON.stringify(taxes));
    syncToDatabase(STORAGE_KEYS.TAXES, JSON.stringify(taxes));
  }

  static updateTax(id: string, updates: Partial<Tax>): Tax | null {
    const taxes = this.getTaxes();
    const index = taxes.findIndex(t => t.id === id);
    if (index === -1) return null;
    taxes[index] = { ...taxes[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.TAXES, JSON.stringify(taxes));
    syncToDatabase(STORAGE_KEYS.TAXES, JSON.stringify(taxes));
  }

  static archiveTax(id: string): boolean {
    const taxes = this.getTaxes();
    const index = taxes.findIndex(t => t.id === id);
    if (index === -1) return false;
    taxes[index].archived = true;
    localStorage.setItem(STORAGE_KEYS.TAXES, JSON.stringify(taxes));
    syncToDatabase(STORAGE_KEYS.TAXES, JSON.stringify(taxes));
  static getServiceCharges(): ServiceCharge[] {
    const stored = localStorage.getItem(STORAGE_KEYS.SERVICE_CHARGES);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return defaultServiceCharges;
  }

  static getActiveServiceCharges(): ServiceCharge[] {
    return this.getServiceCharges().filter(sc => !sc.archived);
  }

  static findServiceChargeByName(name: string): ServiceCharge | undefined {
    const lower = name.toLowerCase();
    return this.getServiceCharges().find(sc => sc.name.toLowerCase().includes(lower));
  }

  static addServiceCharge(charge: Omit<ServiceCharge, "id">): ServiceCharge {
    const charges = this.getServiceCharges();
    const newCharge: ServiceCharge = { ...charge, id: Date.now().toString() };
    charges.push(newCharge);
    localStorage.setItem(STORAGE_KEYS.SERVICE_CHARGES, JSON.stringify(charges));
    syncToDatabase(STORAGE_KEYS.SERVICE_CHARGES, JSON.stringify(charges));
  }

  static updateServiceCharge(id: string, updates: Partial<ServiceCharge>): ServiceCharge | null {
    const charges = this.getServiceCharges();
    const index = charges.findIndex(sc => sc.id === id);
    if (index === -1) return null;
    charges[index] = { ...charges[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.SERVICE_CHARGES, JSON.stringify(charges));
    syncToDatabase(STORAGE_KEYS.SERVICE_CHARGES, JSON.stringify(charges));
  }

  static archiveServiceCharge(id: string): boolean {
    const charges = this.getServiceCharges();
    const index = charges.findIndex(sc => sc.id === id);
    if (index === -1) return false;
    charges[index].archived = true;
    localStorage.setItem(STORAGE_KEYS.SERVICE_CHARGES, JSON.stringify(charges));
    syncToDatabase(STORAGE_KEYS.SERVICE_CHARGES, JSON.stringify(charges));
  static getMenuItems(): MenuItem[] {
    const stored = localStorage.getItem(STORAGE_KEYS.MENUS);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return defaultMenuItems;
  }

  static getActiveMenuItems(): MenuItem[] {
    return this.getMenuItems().filter(m => m.isActive);
  }

  static findMenuByName(name: string): MenuItem | undefined {
    const lower = name.toLowerCase();
    return this.getMenuItems().find(m => m.name.toLowerCase().includes(lower));
  }

  static addMenuItem(item: Omit<MenuItem, "id">): MenuItem {
    const items = this.getMenuItems();
    const newItem: MenuItem = { ...item, id: Date.now().toString() };
    items.push(newItem);
    localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('settings-updated', { detail: { type: 'menus', data: items } }));
    return newItem;
  }

  static updateMenuItem(id: string, updates: Partial<MenuItem>): MenuItem | null {
    const items = this.getMenuItems();
    const index = items.findIndex(m => m.id === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('settings-updated', { detail: { type: 'menus', data: items } }));
    return items[index];
  }

  // Control Center Settings
  static getControlCenterSettings(): ControlCenterSettings {
    const stored = localStorage.getItem(STORAGE_KEYS.CONTROL_CENTER);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return { ...defaultControlCenterSettings, ...parsed };
      } catch {
        return defaultControlCenterSettings;
      }
    }
    // Also check individual localStorage items for backwards compatibility
    const hidePerformanceSummary = localStorage.getItem('hidePerformanceSummary') === 'true';
    return { ...defaultControlCenterSettings, hidePerformanceSummary };
  }

  static updateControlCenterSettings(updates: Partial<ControlCenterSettings>): ControlCenterSettings {
    const current = this.getControlCenterSettings();
    const updated = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEYS.CONTROL_CENTER, JSON.stringify(updated));
    
    // Handle specific settings that have their own storage/events
    if (updates.hidePerformanceSummary !== undefined) {
      localStorage.setItem('hidePerformanceSummary', updates.hidePerformanceSummary.toString());
      window.dispatchEvent(new CustomEvent('performanceSummaryVisibilityChanged', { detail: { hidden: updates.hidePerformanceSummary } }));
    }
    
    window.dispatchEvent(new CustomEvent('settings-updated', { detail: { type: 'controlCenter', data: updated } }));
    return updated;
  }

  // Checkout Options Settings
  static getCheckoutOptionsSettings(): CheckoutOptionsSettings {
    const stored = localStorage.getItem(STORAGE_KEYS.CHECKOUT_OPTIONS);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return { ...defaultCheckoutOptionsSettings, ...parsed };
      } catch {
        return defaultCheckoutOptionsSettings;
      }
    }
    return defaultCheckoutOptionsSettings;
  }

  static updateCheckoutOptionsSettings(updates: Partial<CheckoutOptionsSettings>): CheckoutOptionsSettings {
    const current = this.getCheckoutOptionsSettings();
    const updated = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEYS.CHECKOUT_OPTIONS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('settings-updated', { detail: { type: 'checkoutOptions', data: updated } }));
    return updated;
  }

  // Orders Settings
  static getOrdersSettings(): OrdersSettings {
    const stored = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return { ...defaultOrdersSettings, ...parsed };
      } catch {
        return defaultOrdersSettings;
      }
    }
    return defaultOrdersSettings;
  }

  static updateOrdersSettings(updates: Partial<OrdersSettings>): OrdersSettings {
    const current = this.getOrdersSettings();
    const updated = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('settings-updated', { detail: { type: 'orders', data: updated } }));
    return updated;
  }

  // Appearance Settings
  static getAppearanceSettings(): AppearanceSettings {
    const theme = (localStorage.getItem('theme') as AppearanceSettings['theme']) || 'dark';
    const iconStyle = (localStorage.getItem('iconStyle') as AppearanceSettings['iconStyle']) || 'Default';
    const iconSize = (localStorage.getItem('iconSize') as AppearanceSettings['iconSize']) || 'Small';
    const textSize = parseInt(localStorage.getItem('textSize') || '16', 10);
    const boldText = localStorage.getItem('boldText') === 'true';
    const brightness = parseInt(localStorage.getItem('brightness') || '100', 10);
    
    return { theme, iconStyle, iconSize, textSize, boldText, brightness };
  }

  static updateAppearanceSettings(updates: Partial<AppearanceSettings>): AppearanceSettings {
    const current = this.getAppearanceSettings();
    const updated = { ...current, ...updates };
    
    // Store individual settings for backwards compatibility with AppearanceContext
    if (updates.theme !== undefined) {
      localStorage.setItem('theme', updates.theme);
      window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme: updates.theme } }));
    }
    if (updates.iconStyle !== undefined) {
      localStorage.setItem('iconStyle', updates.iconStyle);
    }
    if (updates.iconSize !== undefined) {
      localStorage.setItem('iconSize', updates.iconSize);
    }
    if (updates.textSize !== undefined) {
      localStorage.setItem('textSize', updates.textSize.toString());
      window.dispatchEvent(new CustomEvent('text-size-change', { detail: { size: updates.textSize } }));
    }
    if (updates.boldText !== undefined) {
      localStorage.setItem('boldText', updates.boldText.toString());
      window.dispatchEvent(new CustomEvent('bold-text-change', { detail: { bold: updates.boldText } }));
    }
    if (updates.brightness !== undefined) {
      localStorage.setItem('brightness', updates.brightness.toString());
      window.dispatchEvent(new CustomEvent('brightness-change', { detail: { brightness: updates.brightness } }));
    }
    
    window.dispatchEvent(new CustomEvent('settings-updated', { detail: { type: 'appearance', data: updated } }));
    return updated;
  }

  // Get all settings summary for AI
  static getAllSettingsSummary(): string {
    const gratuity = this.getGratuitySettings();
    const discounts = this.getActiveDiscounts();
    const taxes = this.getActiveTaxes();
    const serviceCharges = this.getActiveServiceCharges();
    const menus = this.getMenuItems();
    const controlCenter = this.getControlCenterSettings();
    const checkoutOptions = this.getCheckoutOptionsSettings();
    const orders = this.getOrdersSettings();
    const appearance = this.getAppearanceSettings();

    let summary = "## Current Settings Overview\n\n";

    // Gratuity
    summary += "### Gratuity\n";
    summary += `- Tips: ${gratuity.enableTip ? "Enabled" : "Disabled"}\n`;
    summary += `- Show on Receipt: ${gratuity.showOnReceipt ? "Yes" : "No"}\n`;
    summary += `- Custom Gratuity: ${gratuity.allowCustom ? "Allowed" : "Not allowed"}\n`;
    summary += `- Preset Type: ${gratuity.presetType === "percentage" ? "Percentage" : "Fixed Amount"}\n`;
    summary += `- Active Presets: ${gratuity.selectedTipPresets.map(p => gratuity.presetType === "percentage" ? `${p}%` : `$${p}`).join(", ")}\n\n`;

    // Discounts
    summary += "### Discounts\n";
    if (discounts.length === 0) {
      summary += "- No active discounts\n";
    } else {
      discounts.forEach(d => {
        summary += `- **${d.name}**: ${d.type === "Percentage" ? `${d.amount}%` : `$${d.amount}`}`;
        if (d.applicableTo) summary += ` (${d.applicableTo})`;
        if (d.requiresManagerPin) summary += " [PIN Required]";
        summary += "\n";
      });
    }
    summary += "\n";

    // Taxes
    summary += "### Taxes\n";
    if (taxes.length === 0) {
      summary += "- No active taxes\n";
    } else {
      taxes.forEach(t => {
        summary += `- **${t.name}**: ${t.amount}% (${t.type})\n`;
      });
    }
    summary += "\n";

    // Service Charges
    summary += "### Service Charges\n";
    if (serviceCharges.length === 0) {
      summary += "- No active service charges\n";
    } else {
      serviceCharges.forEach(sc => {
        summary += `- **${sc.name}**: ${sc.type === "Percentage" ? `${sc.amount}%` : `$${sc.amount}`}`;
        if (sc.orderType) summary += ` (${Array.isArray(sc.orderType) ? sc.orderType.join(", ") : sc.orderType})`;
        summary += "\n";
      });
    }
    summary += "\n";

    // Menus
    summary += "### Menus\n";
    menus.forEach(m => {
      summary += `- **${m.name}**: ${m.isActive ? "Active" : "Inactive"}`;
      const channels = [];
      if (m.posEnabled) channels.push("POS");
      if (m.kioskEnabled) channels.push("Kiosk");
      if (m.onlineEnabled) channels.push("Online");
      if (channels.length > 0) summary += ` [${channels.join(", ")}]`;
      summary += "\n";
    });
    summary += "\n";

    // Control Center
    summary += "### Control Center\n";
    summary += `- Restart App: ${controlCenter.restartApp ? `Enabled at ${controlCenter.restartTime}` : "Disabled"}\n`;
    summary += `- Auto Lock Timer: ${controlCenter.autoLockTimer === "never" ? "Never" : `${controlCenter.autoLockTimer} minutes`}\n`;
    summary += `- Switch To KDS: ${controlCenter.switchToKDS ? "Enabled" : "Disabled"}\n`;
    summary += `- Debug Mode: ${controlCenter.debugMode ? "Enabled" : "Disabled"}\n`;
    summary += `- Lock After Failed Attempts: ${controlCenter.lockAfterFailed ? "Enabled" : "Disabled"}\n`;
    summary += `- Force Clock-In: ${controlCenter.forceClockIn ? "Enabled" : "Disabled"}\n`;
    summary += `- Open Register Without PIN: ${controlCenter.openRegisterWithoutPIN ? "Enabled" : "Disabled"}\n`;
    summary += `- Hide Performance Summary: ${controlCenter.hidePerformanceSummary ? "Hidden" : "Visible"}\n`;
    summary += `- Built-In Display: ${controlCenter.builtInDisplay ? "Enabled" : "Disabled"}\n\n`;

    // Checkout Options
    summary += "### Checkout Options\n";
    summary += `- Quick Amounts: ${checkoutOptions.enableQuickAmounts ? "Enabled" : "Disabled"}\n`;
    summary += `- Split Check: ${checkoutOptions.splitCheck ? "Enabled" : "Disabled"}\n`;
    summary += `- Tips: ${checkoutOptions.enableTips ? "Enabled" : "Disabled"}\n`;
    summary += `- Require Order Type: ${checkoutOptions.requireOrderType ? "Yes" : "No"}\n`;
    summary += `- Require Guest Name: ${checkoutOptions.requireGuestName ? "Yes" : "No"}\n`;
    summary += `- Guest Notes: ${checkoutOptions.guestNotesEnabled ? "Enabled" : "Disabled"}\n`;
    summary += `- Show Save Button: ${checkoutOptions.showSaveButton ? "Yes" : "No"}\n`;
    summary += `- Auto-close Ticket: ${checkoutOptions.autoCloseTicket ? "Enabled" : "Disabled"}\n`;
    summary += `- QR Bill/Payment: ${checkoutOptions.qrBillPayment ? "Enabled" : "Disabled"}\n`;
    summary += `- Print Receipt: ${checkoutOptions.printReceipt ? "Yes" : "No"}\n`;
    summary += `- Email Receipt: ${checkoutOptions.emailReceipt ? "Yes" : "No"}\n`;
    summary += `- SMS Receipt: ${checkoutOptions.smsReceipt ? "Yes" : "No"}\n`;
    summary += `- Skip Tip Screen: ${checkoutOptions.skipTipScreen ? "Yes" : "No"}\n`;
    summary += `- Skip Signature: ${checkoutOptions.skipSignature ? "Yes" : "No"}\n`;
    summary += `- Signature Threshold: $${checkoutOptions.signatureThreshold}\n`;
    summary += `- Payment Sounds: ${checkoutOptions.enablePaymentSounds ? "Enabled" : "Disabled"}\n`;
    summary += `- Hold & Fire: ${checkoutOptions.enableHoldFire ? "Enabled" : "Disabled"}\n`;
    summary += `- Show Order Summary: ${checkoutOptions.showOrderSummary ? "Yes" : "No"}\n`;
    summary += `- Show Itemized Tax: ${checkoutOptions.showItemizedTax ? "Yes" : "No"}\n\n`;

    // Orders Settings
    summary += "### Orders Settings\n";
    summary += `- Order Creation Rules: ${orders.orderCreationRules ? "Enabled" : "Disabled"}\n`;
    summary += `- Order Flow: ${orders.orderFlow ? "Enabled" : "Disabled"}\n`;
    summary += `- Hold & Recall: ${orders.holdAndRecall ? "Enabled" : "Disabled"}\n`;
    summary += `- Order Sync: ${orders.orderSync ? "Enabled" : "Disabled"}\n`;
    summary += `- Order Notifications: ${orders.orderNotifications ? "Enabled" : "Disabled"}\n\n`;

    // Appearance
    summary += "### Appearance\n";
    summary += `- Theme: ${appearance.theme}\n`;
    summary += `- Icon Style: ${appearance.iconStyle}\n`;
    summary += `- Icon Size: ${appearance.iconSize}\n`;
    summary += `- Text Size: ${appearance.textSize}px\n`;
    summary += `- Bold Text: ${appearance.boldText ? "Enabled" : "Disabled"}\n`;
    summary += `- Brightness: ${appearance.brightness}%\n`;

    return summary;
  }
}

// AI Intent Types - Extended with more capabilities
export type SettingsIntent = 
  // View intents
  | { type: "view_settings"; category?: string }
  | { type: "view_menus" }
  // Gratuity intents
  | { type: "enable_tips" }
  | { type: "disable_tips" }
  | { type: "set_tip_presets"; presets: string[]; presetType?: "amount" | "percentage" }
  | { type: "enable_auto_gratuity"; percentage: number; minPartySize: number }
  | { type: "show_gratuity_on_receipt"; enable: boolean }
  | { type: "allow_custom_gratuity"; enable: boolean }
  // Discount intents
  | { type: "add_discount"; name: string; amount: number; discountType: "Percentage" | "Fixed"; applicableTo?: string; requiresPin?: boolean }
  | { type: "update_discount"; name: string; updates: Partial<Discount> }
  | { type: "archive_discount"; name: string }
  | { type: "set_discount_pin"; name: string; requiresPin: boolean }
  // Tax intents
  | { type: "add_tax"; name: string; amount: number; taxType: "Exclusive" | "Inclusive" }
  | { type: "update_tax"; name: string; newAmount: number }
  | { type: "archive_tax"; name: string }
  | { type: "change_tax_type"; name: string; taxType: "Exclusive" | "Inclusive" }
  // Service charge intents
  | { type: "add_service_charge"; name: string; amount: number; chargeType: "Percentage" | "Fixed"; orderType?: string; automatic?: boolean; minSeats?: number }
  | { type: "update_service_charge"; name: string; updates: Partial<ServiceCharge> }
  | { type: "archive_service_charge"; name: string }
  | { type: "set_delivery_fee"; amount: number }
  // Menu intents
  | { type: "activate_menu"; name: string }
  | { type: "deactivate_menu"; name: string }
  | { type: "add_menu"; name: string; channels?: string[] }
  | { type: "enable_menu_channel"; menuName: string; channel: string }
  | { type: "disable_menu_channel"; menuName: string; channel: string }
  // Appearance intents
  | { type: "set_theme"; theme: "dark" | "light" | "system" }
  | { type: "set_text_size"; size: number }
  | { type: "toggle_bold_text"; enable: boolean }
  | { type: "set_brightness"; brightness: number }
  | { type: "set_icon_style"; style: "Default" | "Dark" }
  | { type: "set_icon_size"; size: "Default" | "Small" | "Medium" | "Large" }
  // Control Center intents
  | { type: "toggle_control_setting"; setting: keyof ControlCenterSettings; enable: boolean }
  | { type: "set_auto_lock_timer"; minutes: string }
  // Checkout Options intents
  | { type: "toggle_checkout_setting"; setting: keyof CheckoutOptionsSettings; enable: boolean }
  | { type: "set_signature_threshold"; amount: number }
  // Orders intents
  | { type: "toggle_orders_setting"; setting: keyof OrdersSettings; enable: boolean }
  // Navigation
  | { type: "navigate"; path: string }
  // Unknown
  | { type: "unknown"; clarification: string };

// Helper: Extract percentage or fixed amount from message
function extractAmount(message: string): { amount: number; type: "Percentage" | "Fixed" } | null {
  const percentageMatch = message.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percentageMatch) {
    return { amount: parseFloat(percentageMatch[1]), type: "Percentage" };
  }
  const fixedMatch = message.match(/\$\s*(\d+(?:\.\d+)?)/);
  if (fixedMatch) {
    return { amount: parseFloat(fixedMatch[1]), type: "Fixed" };
  }
  const plainNumber = message.match(/(\d+(?:\.\d+)?)\s*(?:dollars?|percent)/i);
  if (plainNumber) {
    const isPercent = /percent/i.test(message);
    return { amount: parseFloat(plainNumber[1]), type: isPercent ? "Percentage" : "Fixed" };
  }
  return null;
}

// Helper: Extract name from various patterns
function extractName(message: string, itemType: string): string {
  const patterns = [
    new RegExp(`${itemType}\\s+(?:called|named)\\s+["']?([^"']+?)["']?(?:\\s|$)`, 'i'),
    new RegExp(`["']([^"']+)["']\\s+${itemType}`, 'i'),
    new RegExp(`add\\s+(?:a\\s+)?(?:\\d+%?\\s+)?["']?([^"']+?)["']?\\s+${itemType}`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return "";
}

// Parse user intent from message
export function parseUserIntent(message: string): SettingsIntent {
  const lower = message.toLowerCase();

  // ===== VIEW INTENTS =====
  if (lower.includes("show") || lower.includes("view") || lower.includes("list") || lower.includes("what are") || lower.includes("what's") || lower.includes("current")) {
    if (lower.includes("menu")) return { type: "view_menus" };
    if (lower.includes("discount")) return { type: "view_settings", category: "discounts" };
    if (lower.includes("tax")) return { type: "view_settings", category: "taxes" };
    if (lower.includes("service charge") || lower.includes("delivery fee")) return { type: "view_settings", category: "serviceCharges" };
    if (lower.includes("gratuity") || lower.includes("tip")) return { type: "view_settings", category: "gratuity" };
    if (lower.includes("setting") || lower.includes("all") || lower.includes("everything") || lower.includes("overview")) return { type: "view_settings" };
  }

  // ===== GRATUITY INTENTS =====
  if ((lower.includes("enable") || lower.includes("turn on") || lower.includes("activate")) && (lower.includes("tip") || lower.includes("gratuity"))) {
    if (lower.includes("custom")) {
      return { type: "allow_custom_gratuity", enable: true };
    }
    return { type: "enable_tips" };
  }
  if ((lower.includes("disable") || lower.includes("turn off") || lower.includes("remove") || lower.includes("deactivate")) && (lower.includes("tip") || lower.includes("gratuity"))) {
    if (lower.includes("custom")) {
      return { type: "allow_custom_gratuity", enable: false };
    }
    return { type: "disable_tips" };
  }
  if (lower.includes("receipt") && (lower.includes("tip") || lower.includes("gratuity"))) {
    const show = lower.includes("show") || lower.includes("display") || lower.includes("enable");
    return { type: "show_gratuity_on_receipt", enable: show };
  }

  // Auto gratuity
  if ((lower.includes("auto") && lower.includes("gratuit")) || (lower.includes("large") && lower.includes("part")) || lower.includes("party of")) {
    const percentageMatch = lower.match(/(\d+)\s*%/);
    const partySizeMatch = lower.match(/(\d+)\s*(?:people|guests|party|parties|\+|or more)/);
    return {
      type: "enable_auto_gratuity",
      percentage: percentageMatch ? parseInt(percentageMatch[1]) : 18,
      minPartySize: partySizeMatch ? parseInt(partySizeMatch[1]) : 6,
    };
  }

  // ===== DISCOUNT INTENTS =====
  if (lower.includes("discount")) {
    // Archive/remove discount
    if (lower.includes("archive") || lower.includes("remove") || lower.includes("delete")) {
      const name = extractName(message, "discount") || 
        lower.replace(/archive|remove|delete|the|discount/gi, "").trim();
      if (name) {
        return { type: "archive_discount", name };
      }
    }

    // Update discount - change amount
    if (lower.includes("change") || lower.includes("update") || lower.includes("set") || lower.includes("modify")) {
      const amountInfo = extractAmount(lower);
      // Try to find discount name
      const discounts = SettingsManager.getActiveDiscounts();
      for (const d of discounts) {
        if (lower.includes(d.name.toLowerCase())) {
          if (amountInfo) {
            return { type: "update_discount", name: d.name, updates: { amount: amountInfo.amount, type: amountInfo.type } };
          }
        }
      }
    }

    // Require/remove PIN for discount
    if (lower.includes("pin") || lower.includes("manager")) {
      const requirePin = lower.includes("require") || lower.includes("add") || lower.includes("enable");
      const discounts = SettingsManager.getActiveDiscounts();
      for (const d of discounts) {
        if (lower.includes(d.name.toLowerCase())) {
          return { type: "set_discount_pin", name: d.name, requiresPin: requirePin };
        }
      }
    }

    // Add new discount
    if (lower.includes("add") || lower.includes("create") || lower.includes("new")) {
      const amountInfo = extractAmount(lower);
      let name = extractName(message, "discount");
      
      // Fallback: try common patterns
      if (!name) {
        const patterns = [
          /add\s+(?:a\s+)?(?:\d+%?\s+)?(\w+(?:\s+\w+)?)\s+discount/i,
          /(\w+(?:\s+\w+)?)\s+discount/i,
        ];
        for (const p of patterns) {
          const m = message.match(p);
          if (m && m[1] && !["a", "the", "new"].includes(m[1].toLowerCase())) {
            name = m[1];
            break;
          }
        }
      }

      if (amountInfo) {
        const requiresPin = lower.includes("pin") || lower.includes("manager");
        let applicableTo = "All Products";
        if (lower.includes("beverage") || lower.includes("drink")) applicableTo = "Beverages Only";
        if (lower.includes("food") || lower.includes("entree")) applicableTo = "Food Only";
        
        return { 
          type: "add_discount", 
          name: name || "New Discount", 
          amount: amountInfo.amount, 
          discountType: amountInfo.type,
          applicableTo,
          requiresPin,
        };
      }
    }
  }

  // ===== TAX INTENTS =====
  if (lower.includes("tax")) {
    // Archive/remove tax
    if (lower.includes("archive") || lower.includes("remove") || lower.includes("delete")) {
      const taxes = SettingsManager.getActiveTaxes();
      for (const t of taxes) {
        if (lower.includes(t.name.toLowerCase())) {
          return { type: "archive_tax", name: t.name };
        }
      }
    }

    // Change tax rate
    if (lower.includes("change") || lower.includes("update") || lower.includes("set") || lower.includes("modify") || lower.includes("to")) {
      const amountInfo = extractAmount(lower);
      const taxes = SettingsManager.getActiveTaxes();
      for (const t of taxes) {
        if (lower.includes(t.name.toLowerCase())) {
          if (amountInfo) {
            return { type: "update_tax", name: t.name, newAmount: amountInfo.amount };
          }
        }
      }
      // Generic "change tax rate to X%"
      if (amountInfo && (lower.includes("rate") || lower.includes("sales tax"))) {
        return { type: "update_tax", name: "Sales Tax", newAmount: amountInfo.amount };
      }
    }

    // Change tax type
    if (lower.includes("inclusive") || lower.includes("exclusive")) {
      const taxType = lower.includes("inclusive") ? "Inclusive" : "Exclusive";
      const taxes = SettingsManager.getActiveTaxes();
      for (const t of taxes) {
        if (lower.includes(t.name.toLowerCase())) {
          return { type: "change_tax_type", name: t.name, taxType };
        }
      }
    }

    // Add new tax
    if (lower.includes("add") || lower.includes("create") || lower.includes("new")) {
      const amountInfo = extractAmount(lower);
      const name = extractName(message, "tax") || "New Tax";
      const taxType = lower.includes("inclusive") ? "Inclusive" : "Exclusive";
      if (amountInfo) {
        return { type: "add_tax", name, amount: amountInfo.amount, taxType };
      }
    }
  }

  // ===== SERVICE CHARGE INTENTS =====
  if (lower.includes("service charge") || lower.includes("delivery fee") || lower.includes("delivery charge")) {
    // Update delivery fee specifically
    if (lower.includes("delivery")) {
      const amountInfo = extractAmount(lower);
      if (amountInfo) {
        return { type: "set_delivery_fee", amount: amountInfo.amount };
      }
    }

    // Archive service charge
    if (lower.includes("archive") || lower.includes("remove") || lower.includes("delete")) {
      const charges = SettingsManager.getActiveServiceCharges();
      for (const sc of charges) {
        if (lower.includes(sc.name.toLowerCase())) {
          return { type: "archive_service_charge", name: sc.name };
        }
      }
    }

    // Update service charge
    if (lower.includes("change") || lower.includes("update") || lower.includes("set") || lower.includes("modify")) {
      const amountInfo = extractAmount(lower);
      const charges = SettingsManager.getActiveServiceCharges();
      for (const sc of charges) {
        if (lower.includes(sc.name.toLowerCase())) {
          if (amountInfo) {
            return { type: "update_service_charge", name: sc.name, updates: { amount: amountInfo.amount, type: amountInfo.type } };
          }
        }
      }
    }

    // Add new service charge
    if (lower.includes("add") || lower.includes("create") || lower.includes("new")) {
      const amountInfo = extractAmount(lower);
      const name = extractName(message, "service charge") || extractName(message, "charge") || "New Service Charge";
      
      let orderType = "All Orders";
      if (lower.includes("dine-in") || lower.includes("dine in")) orderType = "Dine-In Only";
      if (lower.includes("delivery")) orderType = "Delivery Only";
      if (lower.includes("takeout") || lower.includes("take out") || lower.includes("pickup")) orderType = "Takeout Only";
      
      const automatic = lower.includes("auto");
      const minSeatsMatch = lower.match(/(\d+)\s*(?:people|guests|seats|\+)/);
      
      if (amountInfo) {
        return { 
          type: "add_service_charge", 
          name: name || "New Service Charge", 
          amount: amountInfo.amount, 
          chargeType: amountInfo.type,
          orderType,
          automatic,
          minSeats: minSeatsMatch ? parseInt(minSeatsMatch[1]) : undefined,
        };
      }
    }
  }

  // ===== MENU INTENTS =====
  if (lower.includes("menu")) {
    const menus = SettingsManager.getMenuItems();
    
    // Activate/deactivate menu
    if (lower.includes("activate") || lower.includes("enable") || lower.includes("turn on")) {
      for (const m of menus) {
        if (lower.includes(m.name.toLowerCase())) {
          return { type: "activate_menu", name: m.name };
        }
      }
    }
    if (lower.includes("deactivate") || lower.includes("disable") || lower.includes("turn off")) {
      for (const m of menus) {
        if (lower.includes(m.name.toLowerCase())) {
          return { type: "deactivate_menu", name: m.name };
        }
      }
    }

    // Enable/disable channels
    const channels = ["pos", "kiosk", "online"];
    for (const channel of channels) {
      if (lower.includes(channel)) {
        const enable = lower.includes("enable") || lower.includes("add") || lower.includes("turn on");
        for (const m of menus) {
          if (lower.includes(m.name.toLowerCase())) {
            if (enable) {
              return { type: "enable_menu_channel", menuName: m.name, channel };
            } else {
              return { type: "disable_menu_channel", menuName: m.name, channel };
            }
          }
        }
      }
    }

    // Add new menu
    if (lower.includes("add") || lower.includes("create") || lower.includes("new")) {
      const name = extractName(message, "menu") || "New Menu";
      const channels: string[] = [];
      if (lower.includes("pos") || lower.includes("all")) channels.push("pos");
      if (lower.includes("kiosk") || lower.includes("all")) channels.push("kiosk");
      if (lower.includes("online") || lower.includes("all")) channels.push("online");
      return { type: "add_menu", name, channels: channels.length > 0 ? channels : ["pos", "kiosk", "online"] };
    }
  }

  // ===== APPEARANCE INTENTS =====
  if (lower.includes("dark mode") || lower.includes("dark theme")) {
    return { type: "set_theme", theme: "dark" };
  }
  if (lower.includes("light mode") || lower.includes("light theme")) {
    return { type: "set_theme", theme: "light" };
  }
  if (lower.includes("system theme") || lower.includes("auto theme")) {
    return { type: "set_theme", theme: "system" };
  }
  if (lower.includes("text size") || lower.includes("font size")) {
    if (lower.includes("small") || lower.includes("smaller")) return { type: "set_text_size", size: 14 };
    if (lower.includes("large") || lower.includes("larger") || lower.includes("big")) return { type: "set_text_size", size: 20 };
    const sizeMatch = lower.match(/(\d+)\s*(?:px|pixels?)?/);
    if (sizeMatch) return { type: "set_text_size", size: parseInt(sizeMatch[1]) };
    return { type: "set_text_size", size: 16 };
  }
  if (lower.includes("bold")) {
    const enable = lower.includes("enable") || lower.includes("turn on") || lower.includes("make");
    return { type: "toggle_bold_text", enable };
  }
  
  // Brightness
  if (lower.includes("brightness")) {
    const match = lower.match(/(\d+)\s*%?/);
    if (match) {
      return { type: "set_brightness", brightness: parseInt(match[1]) };
    }
    if (lower.includes("increase") || lower.includes("brighter") || lower.includes("higher")) {
      return { type: "set_brightness", brightness: 100 };
    }
    if (lower.includes("decrease") || lower.includes("dimmer") || lower.includes("lower")) {
      return { type: "set_brightness", brightness: 50 };
    }
  }

  // Icon style
  if (lower.includes("icon style") || lower.includes("icon color")) {
    if (lower.includes("dark")) return { type: "set_icon_style", style: "Dark" };
    return { type: "set_icon_style", style: "Default" };
  }

  // Icon size
  if (lower.includes("icon size")) {
    if (lower.includes("small")) return { type: "set_icon_size", size: "Small" };
    if (lower.includes("large")) return { type: "set_icon_size", size: "Large" };
    if (lower.includes("medium")) return { type: "set_icon_size", size: "Medium" };
    return { type: "set_icon_size", size: "Default" };
  }

  // ===== CONTROL CENTER INTENTS =====
  const controlCenterSettings: Record<string, keyof ControlCenterSettings> = {
    "kds": "switchToKDS",
    "kitchen display": "switchToKDS",
    "debug mode": "debugMode",
    "debug": "debugMode",
    "lock after failed": "lockAfterFailed",
    "failed attempts": "lockAfterFailed",
    "force clock": "forceClockIn",
    "clock-in": "forceClockIn",
    "clock in": "forceClockIn",
    "register without pin": "openRegisterWithoutPIN",
    "open register": "openRegisterWithoutPIN",
    "performance summary": "hidePerformanceSummary",
    "hide performance": "hidePerformanceSummary",
    "built-in display": "builtInDisplay",
    "customer display": "builtInDisplay",
    "cfd": "builtInDisplay",
    "restart app": "restartApp",
  };

  for (const [phrase, setting] of Object.entries(controlCenterSettings)) {
    if (lower.includes(phrase)) {
      const enable = lower.includes("enable") || lower.includes("turn on") || lower.includes("activate") || lower.includes("show");
      const disable = lower.includes("disable") || lower.includes("turn off") || lower.includes("deactivate") || lower.includes("hide");
      if (enable || disable) {
        // Special handling for "hide performance summary" - hide means enable the setting
        const actualEnable = setting === "hidePerformanceSummary" 
          ? (lower.includes("hide") || disable) 
          : enable;
        return { type: "toggle_control_setting", setting, enable: actualEnable };
      }
    }
  }

  // Auto lock timer
  if (lower.includes("auto lock") || lower.includes("lock timer")) {
    const minuteMatch = lower.match(/(\d+)\s*(?:minute|min)/);
    if (minuteMatch) {
      return { type: "set_auto_lock_timer", minutes: minuteMatch[1] };
    }
    if (lower.includes("never")) {
      return { type: "set_auto_lock_timer", minutes: "never" };
    }
  }

  // ===== CHECKOUT OPTIONS INTENTS =====
  const checkoutSettings: Record<string, keyof CheckoutOptionsSettings> = {
    "quick amount": "enableQuickAmounts",
    "split check": "splitCheck",
    "require order type": "requireOrderType",
    "order type": "requireOrderType",
    "require guest name": "requireGuestName",
    "guest name": "requireGuestName",
    "guest notes": "guestNotesEnabled",
    "save button": "showSaveButton",
    "auto-close ticket": "autoCloseTicket",
    "auto close ticket": "autoCloseTicket",
    "qr bill": "qrBillPayment",
    "qr payment": "qrBillPayment",
    "print receipt": "printReceipt",
    "email receipt": "emailReceipt",
    "sms receipt": "smsReceipt",
    "skip tip screen": "skipTipScreen",
    "skip signature": "skipSignature",
    "payment sounds": "enablePaymentSounds",
    "payment sound": "enablePaymentSounds",
    "hold and fire": "enableHoldFire",
    "hold & fire": "enableHoldFire",
    "order summary": "showOrderSummary",
    "itemized tax": "showItemizedTax",
  };

  for (const [phrase, setting] of Object.entries(checkoutSettings)) {
    if (lower.includes(phrase)) {
      const enable = lower.includes("enable") || lower.includes("turn on") || lower.includes("show") || lower.includes("require");
      const disable = lower.includes("disable") || lower.includes("turn off") || lower.includes("hide") || lower.includes("remove");
      if (enable || disable) {
        return { type: "toggle_checkout_setting", setting, enable };
      }
    }
  }

  // Signature threshold
  if (lower.includes("signature threshold")) {
    const match = lower.match(/\$?\s*(\d+(?:\.\d+)?)/);
    if (match) {
      return { type: "set_signature_threshold", amount: parseFloat(match[1]) };
    }
  }

  // ===== ORDERS SETTINGS INTENTS =====
  const ordersSettings: Record<string, keyof OrdersSettings> = {
    "order creation rules": "orderCreationRules",
    "creation rules": "orderCreationRules",
    "order flow": "orderFlow",
    "hold and recall": "holdAndRecall",
    "hold & recall": "holdAndRecall",
    "order sync": "orderSync",
    "order notifications": "orderNotifications",
    "order notification": "orderNotifications",
  };

  for (const [phrase, setting] of Object.entries(ordersSettings)) {
    if (lower.includes(phrase)) {
      const enable = lower.includes("enable") || lower.includes("turn on") || lower.includes("activate");
      const disable = lower.includes("disable") || lower.includes("turn off") || lower.includes("deactivate");
      if (enable || disable) {
        return { type: "toggle_orders_setting", setting, enable };
      }
    }
  }

  // ===== NAVIGATION INTENTS =====
  if (lower.includes("go to") || lower.includes("open") || lower.includes("navigate") || lower.includes("take me")) {
    if (lower.includes("payment")) return { type: "navigate", path: "/settings/payments" };
    if (lower.includes("gratuity") || lower.includes("tip")) return { type: "navigate", path: "/settings/payments/gratuity" };
    if (lower.includes("discount")) return { type: "navigate", path: "/settings/payments/discounts" };
    if (lower.includes("tax")) return { type: "navigate", path: "/settings/payments/taxes" };
    if (lower.includes("service charge")) return { type: "navigate", path: "/settings/payments/service-charge" };
    if (lower.includes("appearance") || lower.includes("theme")) return { type: "navigate", path: "/settings/system/appearance" };
    if (lower.includes("control center")) return { type: "navigate", path: "/settings/system/control-center" };
    if (lower.includes("system")) return { type: "navigate", path: "/settings/system" };
    if (lower.includes("menu")) return { type: "navigate", path: "/settings/menu" };
    if (lower.includes("checkout")) return { type: "navigate", path: "/settings/payments/checkout-options" };
    if (lower.includes("cash")) return { type: "navigate", path: "/settings/payments/cash-management" };
    if (lower.includes("orders") || lower.includes("order setting")) return { type: "navigate", path: "/settings/orders" };
  }

  return { 
    type: "unknown", 
    clarification: `I can help you with many settings! Try asking me to:\n\n**Gratuity & Tips**\n• Enable or disable tips\n• Set auto-gratuity for large parties\n\n**Discounts & Taxes**\n• Add a 15% student discount\n• Update Sales Tax to 9%\n\n**Control Center**\n• Enable debug mode\n• Turn on KDS mode\n• Set auto lock timer to 5 minutes\n• Hide performance summary\n\n**Checkout Options**\n• Enable split check\n• Turn on payment sounds\n• Set signature threshold to $50\n• Enable QR bill payment\n\n**Orders**\n• Enable order notifications\n• Turn off order sync\n\n**Appearance**\n• Switch to dark/light mode\n• Change text size\n• Set brightness to 80%` 
  };
}

// Execute intent and return result
export function executeIntent(intent: SettingsIntent): { success: boolean; message: string; data?: any; pendingAction?: any } {
  switch (intent.type) {
    // ===== VIEW INTENTS =====
    case "view_settings": {
      if (intent.category === "discounts") {
        const discounts = SettingsManager.getActiveDiscounts();
        if (discounts.length === 0) {
          return { success: true, message: "You don't have any active discounts configured." };
        }
        let msg = "Here are your active discounts:\n\n";
        discounts.forEach(d => {
          msg += `• **${d.name}** — ${d.type === "Percentage" ? `${d.amount}%` : `$${d.amount}`}`;
          if (d.applicableTo) msg += ` (${d.applicableTo})`;
          if (d.requiresManagerPin) msg += " 🔐";
          msg += "\n";
        });
        return { success: true, message: msg, data: discounts };
      }
      if (intent.category === "taxes") {
        const taxes = SettingsManager.getActiveTaxes();
        if (taxes.length === 0) {
          return { success: true, message: "You don't have any active taxes configured." };
        }
        let msg = "Here are your active taxes:\n\n";
        taxes.forEach(t => {
          msg += `• **${t.name}** — ${t.amount}% (${t.type})\n`;
        });
        return { success: true, message: msg, data: taxes };
      }
      if (intent.category === "serviceCharges") {
        const charges = SettingsManager.getActiveServiceCharges();
        if (charges.length === 0) {
          return { success: true, message: "You don't have any active service charges configured." };
        }
        let msg = "Here are your active service charges:\n\n";
        charges.forEach(sc => {
          msg += `• **${sc.name}** — ${sc.type === "Percentage" ? `${sc.amount}%` : `$${sc.amount}`}`;
          if (sc.orderType) msg += ` (${Array.isArray(sc.orderType) ? sc.orderType.join(", ") : sc.orderType})`;
          if (sc.automaticApply) msg += " ⚡";
          msg += "\n";
        });
        return { success: true, message: msg, data: charges };
      }
      if (intent.category === "gratuity") {
        const gratuity = SettingsManager.getGratuitySettings();
        let msg = "Here are your gratuity settings:\n\n";
        msg += `• Tips: **${gratuity.enableTip ? "Enabled ✓" : "Disabled"}**\n`;
        msg += `• Show on Receipt: ${gratuity.showOnReceipt ? "Yes" : "No"}\n`;
        msg += `• Custom Gratuity: ${gratuity.allowCustom ? "Allowed" : "Not allowed"}\n`;
        msg += `• Preset Type: ${gratuity.presetType === "percentage" ? "Percentage" : "Fixed Amount"}\n`;
        msg += `• Active Presets: ${gratuity.selectedTipPresets.map(p => gratuity.presetType === "percentage" ? `${p}%` : `$${p}`).join(", ")}\n`;
        return { success: true, message: msg, data: gratuity };
      }
      return { success: true, message: SettingsManager.getAllSettingsSummary() };
    }

    case "view_menus": {
      const menus = SettingsManager.getMenuItems();
      if (menus.length === 0) {
        return { success: true, message: "You don't have any menus configured." };
      }
      let msg = "Here are your menus:\n\n";
      menus.forEach(m => {
        const status = m.isActive ? "✓ Active" : "○ Inactive";
        msg += `• **${m.name}** — ${status}\n`;
        const channels = [];
        if (m.posEnabled) channels.push("POS");
        if (m.kioskEnabled) channels.push("Kiosk");
        if (m.onlineEnabled) channels.push("Online");
        if (channels.length > 0) msg += `  Channels: ${channels.join(", ")}\n`;
      });
      return { success: true, message: msg, data: menus };
    }

    // ===== GRATUITY INTENTS =====
    case "enable_tips": {
      const current = SettingsManager.getGratuitySettings();
      if (current.enableTip) {
        return { success: true, message: "Tips are already enabled! Customers will see the tip selection screen during checkout." };
      }
      return {
        success: true,
        message: "I'll enable tips for you. Customers will see the tip selection screen during checkout.",
        pendingAction: {
          id: Date.now().toString(),
          setting: "Tips",
          path: "Payments → Gratuity → Enable Tip",
          currentValue: "Disabled",
          newValue: "Enabled",
          action: () => SettingsManager.updateGratuitySettings({ enableTip: true }),
        },
      };
    }

    case "disable_tips": {
      const current = SettingsManager.getGratuitySettings();
      if (!current.enableTip) {
        return { success: true, message: "Tips are already disabled." };
      }
      return {
        success: true,
        message: "I'll disable tips. Customers won't see the tip selection screen during checkout.",
        pendingAction: {
          id: Date.now().toString(),
          setting: "Tips",
          path: "Payments → Gratuity → Enable Tip",
          currentValue: "Enabled",
          newValue: "Disabled",
          action: () => SettingsManager.updateGratuitySettings({ enableTip: false }),
        },
      };
    }

    case "show_gratuity_on_receipt": {
      const current = SettingsManager.getGratuitySettings();
      return {
        success: true,
        message: `I'll ${intent.enable ? "show" : "hide"} gratuity on receipts.`,
        pendingAction: {
          id: Date.now().toString(),
          setting: "Show Gratuity on Receipt",
          path: "Payments → Gratuity → Display Options",
          currentValue: current.showOnReceipt ? "Shown" : "Hidden",
          newValue: intent.enable ? "Shown" : "Hidden",
          action: () => SettingsManager.updateGratuitySettings({ showOnReceipt: intent.enable }),
        },
      };
    }

    case "allow_custom_gratuity": {
      const current = SettingsManager.getGratuitySettings();
      return {
        success: true,
        message: `I'll ${intent.enable ? "allow" : "disable"} custom gratuity amounts.`,
        pendingAction: {
          id: Date.now().toString(),
          setting: "Custom Gratuity",
          path: "Payments → Gratuity → Display Options",
          currentValue: current.allowCustom ? "Allowed" : "Not allowed",
          newValue: intent.enable ? "Allowed" : "Not allowed",
          action: () => SettingsManager.updateGratuitySettings({ allowCustom: intent.enable }),
        },
      };
    }

    case "enable_auto_gratuity": {
      const { percentage, minPartySize } = intent;
      const charges = SettingsManager.getServiceCharges();
      const existing = charges.find(c => c.name.toLowerCase().includes("large party") && !c.archived);
      
      if (existing) {
        return {
          success: true,
          message: `I'll update your auto-gratuity to ${percentage}% for parties of ${minPartySize}+.`,
          pendingAction: {
            id: Date.now().toString(),
            setting: "Auto Gratuity",
            path: "Payments → Service Charge → Large Party",
            currentValue: `${existing.amount}% for ${existing.minSeats || 6}+ guests`,
            newValue: `${percentage}% for ${minPartySize}+ guests`,
            action: () => SettingsManager.updateServiceCharge(existing.id, { amount: percentage, minSeats: minPartySize }),
          },
        };
      } else {
        return {
          success: true,
          message: `I'll create an automatic ${percentage}% gratuity for parties of ${minPartySize}+.`,
          pendingAction: {
            id: Date.now().toString(),
            setting: "Auto Gratuity",
            path: "Payments → Service Charge",
            currentValue: "Not configured",
            newValue: `${percentage}% for ${minPartySize}+ guests`,
            action: () => SettingsManager.addServiceCharge({
              name: `Large Party (${minPartySize}+)`,
              amount: percentage,
              type: "Percentage",
              archived: false,
              orderType: "Dine-In Only",
              appliedAs: "Large Table",
              automaticApply: true,
              minSeats: minPartySize,
              taxApplicable: "Taxable",
            }),
          },
        };
      }
    }

    // ===== DISCOUNT INTENTS =====
    case "add_discount": {
      const { name, amount, discountType, applicableTo, requiresPin } = intent;
      return {
        success: true,
        message: `I'll add a new ${discountType === "Percentage" ? `${amount}%` : `$${amount}`} discount called "${name}".${requiresPin ? " Manager PIN will be required." : ""}`,
        pendingAction: {
          id: Date.now().toString(),
          setting: "New Discount",
          path: "Payments → Discounts",
          currentValue: "N/A",
          newValue: `${name}: ${discountType === "Percentage" ? `${amount}%` : `$${amount}`}`,
          action: () => SettingsManager.addDiscount({
            name,
            amount,
            type: discountType,
            archived: false,
            applicableTo: applicableTo || "All Products",
            requiresManagerPin: requiresPin || false,
          }),
        },
      };
    }

    case "update_discount": {
      const { name, updates } = intent;
      const discount = SettingsManager.findDiscountByName(name);
      if (!discount) {
        return { success: false, message: `I couldn't find a discount called "${name}". Would you like me to show you the current discounts?` };
      }
      const newValue = updates.amount 
        ? `${updates.type || discount.type === "Percentage" ? `${updates.amount}%` : `$${updates.amount}`}`
        : JSON.stringify(updates);
      return {
        success: true,
        message: `I'll update "${discount.name}" to ${newValue}.`,
        pendingAction: {
          id: Date.now().toString(),
          setting: discount.name,
          path: "Payments → Discounts",
          currentValue: `${discount.type === "Percentage" ? `${discount.amount}%` : `$${discount.amount}`}`,
          newValue,
          action: () => SettingsManager.updateDiscount(discount.id, updates),
        },
      };
    }

    case "archive_discount": {
      const { name } = intent;
      const discount = SettingsManager.findDiscountByName(name);
      if (!discount) {
        return { success: false, message: `I couldn't find a discount called "${name}". Would you like me to show you the current discounts?` };
      }
      return {
        success: true,
        message: `I'll archive the "${discount.name}" discount.`,
        pendingAction: {
          id: Date.now().toString(),
          setting: discount.name,
          path: "Payments → Discounts",
          currentValue: "Active",
          newValue: "Archived",
          action: () => SettingsManager.archiveDiscount(discount.id),
        },
      };
    }

    case "set_discount_pin": {
      const { name, requiresPin } = intent;
      const discount = SettingsManager.findDiscountByName(name);
      if (!discount) {
        return { success: false, message: `I couldn't find a discount called "${name}".` };
      }
      return {
        success: true,
        message: `I'll ${requiresPin ? "require" : "remove"} manager PIN for "${discount.name}".`,
        pendingAction: {
          id: Date.now().toString(),
          setting: discount.name,
          path: "Payments → Discounts",
          currentValue: discount.requiresManagerPin ? "PIN Required" : "No PIN",
          newValue: requiresPin ? "PIN Required" : "No PIN",
          action: () => SettingsManager.updateDiscount(discount.id, { requiresManagerPin: requiresPin }),
        },
      };
    }

    // ===== TAX INTENTS =====
    case "add_tax": {
      const { name, amount, taxType } = intent;
      return {
        success: true,
        message: `I'll add a new ${amount}% ${taxType.toLowerCase()} tax called "${name}".`,
        pendingAction: {
          id: Date.now().toString(),
          setting: "New Tax",
          path: "Payments → Taxes",
          currentValue: "N/A",
          newValue: `${name}: ${amount}% (${taxType})`,
          action: () => SettingsManager.addTax({
            name,
            amount,
            type: taxType,
            archived: false,
          }),
        },
      };
    }

    case "update_tax": {
      const { name, newAmount } = intent;
      const tax = SettingsManager.findTaxByName(name);
      if (!tax) {
        return { success: false, message: `I couldn't find a tax called "${name}". Would you like me to show you the current taxes?` };
      }
      return {
        success: true,
        message: `I'll update "${tax.name}" from ${tax.amount}% to ${newAmount}%.`,
        pendingAction: {
          id: Date.now().toString(),
          setting: tax.name,
          path: "Payments → Taxes",
          currentValue: `${tax.amount}%`,
          newValue: `${newAmount}%`,
          action: () => SettingsManager.updateTax(tax.id, { amount: newAmount }),
        },
      };
    }

    case "archive_tax": {
      const { name } = intent;
      const tax = SettingsManager.findTaxByName(name);
      if (!tax) {
        return { success: false, message: `I couldn't find a tax called "${name}".` };
      }
      return {
        success: true,
        message: `I'll archive the "${tax.name}" tax.`,
        pendingAction: {
          id: Date.now().toString(),
          setting: tax.name,
          path: "Payments → Taxes",
          currentValue: "Active",
          newValue: "Archived",
          action: () => SettingsManager.archiveTax(tax.id),
        },
      };
    }

    case "change_tax_type": {
      const { name, taxType } = intent;
      const tax = SettingsManager.findTaxByName(name);
      if (!tax) {
        return { success: false, message: `I couldn't find a tax called "${name}".` };
      }
      return {
        success: true,
        message: `I'll change "${tax.name}" from ${tax.type} to ${taxType}.`,
        pendingAction: {
          id: Date.now().toString(),
          setting: tax.name,
          path: "Payments → Taxes",
          currentValue: tax.type,
          newValue: taxType,
          action: () => SettingsManager.updateTax(tax.id, { type: taxType }),
        },
      };
    }

    // ===== SERVICE CHARGE INTENTS =====
    case "add_service_charge": {
      const { name, amount, chargeType, orderType, automatic, minSeats } = intent;
      let description = `${chargeType === "Percentage" ? `${amount}%` : `$${amount}`}`;
      if (orderType && orderType !== "All Orders") description += ` for ${orderType}`;
      if (automatic && minSeats) description += ` (auto for ${minSeats}+ guests)`;
      
      return {
        success: true,
        message: `I'll add a new ${description} service charge called "${name}".`,
        pendingAction: {
          id: Date.now().toString(),
          setting: "New Service Charge",
          path: "Payments → Service Charge",
          currentValue: "N/A",
          newValue: `${name}: ${description}`,
          action: () => SettingsManager.addServiceCharge({
            name,
            amount,
            type: chargeType,
            archived: false,
            orderType: orderType || "All Orders",
            automaticApply: automatic || false,
            minSeats,
            taxApplicable: "Taxable",
          }),
        },
      };
    }

    case "update_service_charge": {
      const { name, updates } = intent;
      const charge = SettingsManager.findServiceChargeByName(name);
      if (!charge) {
        return { success: false, message: `I couldn't find a service charge called "${name}".` };
      }
      const newValue = updates.amount 
        ? `${updates.type === "Percentage" || charge.type === "Percentage" ? `${updates.amount}%` : `$${updates.amount}`}`
        : JSON.stringify(updates);
      return {
        success: true,
        message: `I'll update "${charge.name}" to ${newValue}.`,
        pendingAction: {
          id: Date.now().toString(),
          setting: charge.name,
          path: "Payments → Service Charge",
          currentValue: `${charge.type === "Percentage" ? `${charge.amount}%` : `$${charge.amount}`}`,
          newValue,
          action: () => SettingsManager.updateServiceCharge(charge.id, updates),
        },
      };
    }

    case "archive_service_charge": {
      const { name } = intent;
      const charge = SettingsManager.findServiceChargeByName(name);
      if (!charge) {
        return { success: false, message: `I couldn't find a service charge called "${name}".` };
      }
      return {
        success: true,
        message: `I'll archive the "${charge.name}" service charge.`,
        pendingAction: {
          id: Date.now().toString(),
          setting: charge.name,
          path: "Payments → Service Charge",
          currentValue: "Active",
          newValue: "Archived",
          action: () => SettingsManager.archiveServiceCharge(charge.id),
        },
      };
    }

    case "set_delivery_fee": {
      const { amount } = intent;
      const existing = SettingsManager.findServiceChargeByName("delivery");
      if (existing) {
        return {
          success: true,
          message: `I'll update the delivery fee from $${existing.amount} to $${amount}.`,
          pendingAction: {
            id: Date.now().toString(),
            setting: "Delivery Fee",
            path: "Payments → Service Charge",
            currentValue: `$${existing.amount}`,
            newValue: `$${amount}`,
            action: () => SettingsManager.updateServiceCharge(existing.id, { amount, type: "Fixed" }),
          },
        };
      } else {
        return {
          success: true,
          message: `I'll create a new $${amount} delivery fee.`,
          pendingAction: {
            id: Date.now().toString(),
            setting: "Delivery Fee",
            path: "Payments → Service Charge",
            currentValue: "Not configured",
            newValue: `$${amount}`,
            action: () => SettingsManager.addServiceCharge({
              name: "Delivery Fee",
              amount,
              type: "Fixed",
              archived: false,
              orderType: "Delivery Only",
              taxApplicable: "Non-Taxable",
            }),
          },
        };
      }
    }

    // ===== MENU INTENTS =====
    case "activate_menu": {
      const { name } = intent;
      const menu = SettingsManager.findMenuByName(name);
      if (!menu) {
        return { success: false, message: `I couldn't find a menu called "${name}". Would you like me to show you the available menus?` };
      }
      if (menu.isActive) {
        return { success: true, message: `"${menu.name}" is already active!` };
      }
      return {
        success: true,
        message: `I'll activate the "${menu.name}" menu.`,
        pendingAction: {
          id: Date.now().toString(),
          setting: menu.name,
          path: "Menu → Menu Items",
          currentValue: "Inactive",
          newValue: "Active",
          action: () => SettingsManager.updateMenuItem(menu.id, { isActive: true }),
        },
      };
    }

    case "deactivate_menu": {
      const { name } = intent;
      const menu = SettingsManager.findMenuByName(name);
      if (!menu) {
        return { success: false, message: `I couldn't find a menu called "${name}".` };
      }
      if (!menu.isActive) {
        return { success: true, message: `"${menu.name}" is already inactive.` };
      }
      return {
        success: true,
        message: `I'll deactivate the "${menu.name}" menu.`,
        pendingAction: {
          id: Date.now().toString(),
          setting: menu.name,
          path: "Menu → Menu Items",
          currentValue: "Active",
          newValue: "Inactive",
          action: () => SettingsManager.updateMenuItem(menu.id, { isActive: false }),
        },
      };
    }

    case "add_menu": {
      const { name, channels } = intent;
      return {
        success: true,
        message: `I'll create a new menu called "${name}"${channels?.length ? ` for ${channels.join(", ").toUpperCase()}` : ""}.`,
        pendingAction: {
          id: Date.now().toString(),
          setting: "New Menu",
          path: "Menu → Menu Items",
          currentValue: "N/A",
          newValue: name,
          action: () => SettingsManager.addMenuItem({
            name,
            isActive: true,
            posEnabled: channels?.includes("pos") ?? true,
            kioskEnabled: channels?.includes("kiosk") ?? true,
            onlineEnabled: channels?.includes("online") ?? true,
          }),
        },
      };
    }

    case "enable_menu_channel": {
      const { menuName, channel } = intent;
      const menu = SettingsManager.findMenuByName(menuName);
      if (!menu) {
        return { success: false, message: `I couldn't find a menu called "${menuName}".` };
      }
      const channelKey = channel === "pos" ? "posEnabled" : channel === "kiosk" ? "kioskEnabled" : "onlineEnabled";
      const channelLabel = channel.toUpperCase();
      return {
        success: true,
        message: `I'll enable ${channelLabel} for "${menu.name}".`,
        pendingAction: {
          id: Date.now().toString(),
          setting: `${menu.name} - ${channelLabel}`,
          path: "Menu → Menu Items",
          currentValue: "Disabled",
          newValue: "Enabled",
          action: () => SettingsManager.updateMenuItem(menu.id, { [channelKey]: true }),
        },
      };
    }

    case "disable_menu_channel": {
      const { menuName, channel } = intent;
      const menu = SettingsManager.findMenuByName(menuName);
      if (!menu) {
        return { success: false, message: `I couldn't find a menu called "${menuName}".` };
      }
      const channelKey = channel === "pos" ? "posEnabled" : channel === "kiosk" ? "kioskEnabled" : "onlineEnabled";
      const channelLabel = channel.toUpperCase();
      return {
        success: true,
        message: `I'll disable ${channelLabel} for "${menu.name}".`,
        pendingAction: {
          id: Date.now().toString(),
          setting: `${menu.name} - ${channelLabel}`,
          path: "Menu → Menu Items",
          currentValue: "Enabled",
          newValue: "Disabled",
          action: () => SettingsManager.updateMenuItem(menu.id, { [channelKey]: false }),
        },
      };
    }

    // ===== APPEARANCE INTENTS =====
    case "set_theme": {
      const { theme } = intent;
      return {
        success: true,
        message: `I'll switch to ${theme} mode for you.`,
        pendingAction: {
          id: Date.now().toString(),
          setting: "Theme Mode",
          path: "System → Appearance → Theme",
          currentValue: "Current theme",
          newValue: theme.charAt(0).toUpperCase() + theme.slice(1),
          action: () => {
            window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme } }));
          },
        },
      };
    }

    case "set_text_size": {
      const sizeLabels: Record<number, string> = { 14: "Small", 16: "Medium", 20: "Large" };
      const sizeLabel = sizeLabels[intent.size] || `${intent.size}px`;
      return {
        success: true,
        message: `I'll set the text size to ${sizeLabel}.`,
        pendingAction: {
          id: Date.now().toString(),
          setting: "Text Size",
          path: "System → Appearance",
          currentValue: "Current size",
          newValue: sizeLabel,
          action: () => {
            SettingsManager.updateAppearanceSettings({ textSize: intent.size });
          },
        },
      };
    }

    case "toggle_bold_text": {
      return {
        success: true,
        message: `I'll ${intent.enable ? "enable" : "disable"} bold text.`,
        pendingAction: {
          id: Date.now().toString(),
          setting: "Bold Text",
          path: "System → Appearance",
          currentValue: intent.enable ? "Normal" : "Bold",
          newValue: intent.enable ? "Bold" : "Normal",
          action: () => {
            SettingsManager.updateAppearanceSettings({ boldText: intent.enable });
          },
        },
      };
    }

    case "set_brightness": {
      return {
        success: true,
        message: `I'll set the brightness to ${intent.brightness}%.`,
        pendingAction: {
          id: Date.now().toString(),
          setting: "Brightness",
          path: "System → Appearance",
          currentValue: "Current brightness",
          newValue: `${intent.brightness}%`,
          action: () => {
            SettingsManager.updateAppearanceSettings({ brightness: intent.brightness });
          },
        },
      };
    }

    case "set_icon_style": {
      return {
        success: true,
        message: `I'll set the icon style to ${intent.style}.`,
        pendingAction: {
          id: Date.now().toString(),
          setting: "Icon Style",
          path: "System → Appearance",
          currentValue: "Current style",
          newValue: intent.style,
          action: () => {
            SettingsManager.updateAppearanceSettings({ iconStyle: intent.style });
          },
        },
      };
    }

    case "set_icon_size": {
      return {
        success: true,
        message: `I'll set the icon size to ${intent.size}.`,
        pendingAction: {
          id: Date.now().toString(),
          setting: "Icon Size",
          path: "System → Appearance",
          currentValue: "Current size",
          newValue: intent.size,
          action: () => {
            SettingsManager.updateAppearanceSettings({ iconSize: intent.size });
          },
        },
      };
    }

    // ===== CONTROL CENTER INTENTS =====
    case "toggle_control_setting": {
      const settingLabels: Record<keyof ControlCenterSettings, string> = {
        restartApp: "Restart App",
        restartTime: "Restart Time",
        lastRestartTime: "Last Restart Time",
        autoLockTimer: "Auto Lock Timer",
        switchToKDS: "Switch To KDS",
        debugMode: "Debug Mode",
        lockAfterFailed: "Lock After Failed Attempts",
        forceClockIn: "Force Clock-In",
        openRegisterWithoutPIN: "Open Register Without PIN",
        hidePerformanceSummary: "Hide Performance Summary",
        builtInDisplay: "Built-In Display",
        hideBreakButton: "Hide Break Button",
        hideEmployeeFeedback: "Hide Employee Feedback",
        hideSeatSelector: "Hide Seat Selector",
        resetTablesDaily: "Reset Tables Daily",
        businessHoursStart: "Business Hours Start",
        businessHoursEnd: "Business Hours End",
      };
      const label = settingLabels[intent.setting] || intent.setting;
      return {
        success: true,
        message: `I'll ${intent.enable ? "enable" : "disable"} ${label}.`,
        pendingAction: {
          id: Date.now().toString(),
          setting: label,
          path: "System → Control Center",
          currentValue: intent.enable ? "Disabled" : "Enabled",
          newValue: intent.enable ? "Enabled" : "Disabled",
          action: () => {
            SettingsManager.updateControlCenterSettings({ [intent.setting]: intent.enable });
          },
        },
      };
    }

    case "set_auto_lock_timer": {
      const labels: Record<string, string> = {
        "1": "1 Minute", "2": "2 Minutes", "5": "5 Minutes", "10": "10 Minutes",
        "15": "15 Minutes", "30": "30 Minutes", "never": "Never"
      };
      const label = labels[intent.minutes] || `${intent.minutes} minutes`;
      return {
        success: true,
        message: `I'll set the auto lock timer to ${label}.`,
        pendingAction: {
          id: Date.now().toString(),
          setting: "Auto Lock Timer",
          path: "System → Control Center",
          currentValue: "Current setting",
          newValue: label,
          action: () => {
            SettingsManager.updateControlCenterSettings({ autoLockTimer: intent.minutes });
          },
        },
      };
    }

    // ===== CHECKOUT OPTIONS INTENTS =====
    case "toggle_checkout_setting": {
      const settingLabels: Record<keyof CheckoutOptionsSettings, string> = {
        enableQuickAmounts: "Quick Amounts",
        splitCheck: "Split Check",
        enableTips: "Tips",
        requireOrderType: "Require Order Type",
        requireGuestName: "Require Guest Name",
        guestNotesEnabled: "Guest Notes",
        showSaveButton: "Show Save Button",
        autoCloseTicket: "Auto-close Ticket",
        qrBillPayment: "QR Bill/Payment",
        printReceipt: "Print Receipt",
        emailReceipt: "Email Receipt",
        smsReceipt: "SMS Receipt",
        skipTipScreen: "Skip Tip Screen",
        skipSignature: "Skip Signature",
        signatureThreshold: "Signature Threshold",
        enablePaymentSounds: "Payment Sounds",
        enableHoldFire: "Hold & Fire",
        showOrderSummary: "Show Order Summary",
        showItemizedTax: "Show Itemized Tax",
      };
      const label = settingLabels[intent.setting] || String(intent.setting);
      return {
        success: true,
        message: `I'll ${intent.enable ? "enable" : "disable"} ${label}.`,
        pendingAction: {
          id: Date.now().toString(),
          setting: label,
          path: "Payments → Checkout Options",
          currentValue: intent.enable ? "Disabled" : "Enabled",
          newValue: intent.enable ? "Enabled" : "Disabled",
          action: () => {
            SettingsManager.updateCheckoutOptionsSettings({ [intent.setting]: intent.enable } as Partial<CheckoutOptionsSettings>);
          },
        },
      };
    }

    case "set_signature_threshold": {
      return {
        success: true,
        message: `I'll set the signature threshold to $${intent.amount}.`,
        pendingAction: {
          id: Date.now().toString(),
          setting: "Signature Threshold",
          path: "Payments → Checkout Options",
          currentValue: "Current threshold",
          newValue: `$${intent.amount}`,
          action: () => {
            SettingsManager.updateCheckoutOptionsSettings({ signatureThreshold: intent.amount });
          },
        },
      };
    }

    // ===== ORDERS SETTINGS INTENTS =====
    case "toggle_orders_setting": {
      const settingLabels: Record<keyof OrdersSettings, string> = {
        orderCreationRules: "Order Creation Rules",
        orderFlow: "Order Flow",
        holdAndRecall: "Hold & Recall",
        orderSync: "Order Sync",
        orderNotifications: "Order Notifications",
      };
      const label = settingLabels[intent.setting] || intent.setting;
      return {
        success: true,
        message: `I'll ${intent.enable ? "enable" : "disable"} ${label}.`,
        pendingAction: {
          id: Date.now().toString(),
          setting: label,
          path: "Orders → Settings",
          currentValue: intent.enable ? "Disabled" : "Enabled",
          newValue: intent.enable ? "Enabled" : "Disabled",
          action: () => {
            SettingsManager.updateOrdersSettings({ [intent.setting]: intent.enable });
          },
        },
      };
    }

    // ===== NAVIGATION =====
    case "navigate": {
      return {
        success: true,
        message: `I'll take you to that settings screen.`,
        data: { navigateTo: intent.path },
      };
    }

    case "unknown": {
      return { success: false, message: intent.clarification };
    }

    default:
      return { success: false, message: "I'm not sure how to handle that request. Could you try rephrasing it?" };
  }
}
