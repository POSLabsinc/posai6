// Comprehensive search index for ALL settings pages, sub-pages and sub-sub options.
// Each entry's `path` is what we navigate() to when the user picks the result.
// `keywords` lets users find a section via related terms (e.g. searching "theme" finds appearance/theme color/theme presets/dark mode).

export interface SettingsSearchEntry {
  id: string;
  label: string;
  // Breadcrumb shown in the result (e.g. "System › Appearance")
  parentPath: string;
  // Where to navigate when selected
  path: string;
  // Top-level group used for the icon color
  group:
    | "account"
    | "system"
    | "payments"
    | "menu"
    | "end-of-day"
    | "guest-book"
    | "workforce"
    | "reports-analytics"
    | "notifications"
    | "hardware"
    | "network"
    | "support";
  keywords?: string[];
}

export const settingsSearchIndex: SettingsSearchEntry[] = [
  // ===== Account =====
  { id: "account", label: "Account", parentPath: "Settings", path: "/settings/account", group: "account", keywords: ["profile", "user"] },
  { id: "account-personal", label: "Personal Information", parentPath: "Account", path: "/settings/account/personal-information", group: "account", keywords: ["name", "email", "phone", "profile"] },
  { id: "account-restaurant", label: "Restaurant Information", parentPath: "Account", path: "/settings/account/restaurant-information", group: "account", keywords: ["business", "store", "company"] },
  { id: "account-security", label: "Security", parentPath: "Account", path: "/settings/account/security", group: "account", keywords: ["password", "pin", "2fa", "login"] },

  // ===== System =====
  { id: "system", label: "System", parentPath: "Settings", path: "/settings/system", group: "system" },
  { id: "system-appearance", label: "Appearance", parentPath: "System", path: "/settings/system/appearance", group: "system", keywords: ["theme", "dark mode", "light mode", "brightness", "text size", "look", "display"] },
  { id: "system-theme-presets", label: "Theme Presets", parentPath: "System › Appearance", path: "/settings/system/theme-presets", group: "system", keywords: ["theme", "color preset", "style", "look"] },
  { id: "system-theme-color", label: "Theme Color", parentPath: "System › Appearance", path: "/settings/system/appearance/theme-color", group: "system", keywords: ["theme", "accent color", "primary color", "brand color"] },
  { id: "system-fonts", label: "Fonts", parentPath: "System", path: "/settings/system/fonts", group: "system", keywords: ["typography", "typeface", "text"] },
  { id: "system-fonts-system", label: "System Fonts", parentPath: "System › Fonts", path: "/settings/system/fonts/system", group: "system", keywords: ["typography", "typeface"] },
  { id: "system-fonts-my", label: "My Fonts", parentPath: "System › Fonts", path: "/settings/system/fonts/my-fonts", group: "system", keywords: ["custom font", "uploaded font", "typography"] },
  { id: "system-fonts-more", label: "More Fonts", parentPath: "System › Fonts", path: "/settings/system/fonts/more", group: "system", keywords: ["google fonts", "browse fonts"] },
  { id: "system-control-center", label: "Control Center", parentPath: "System", path: "/settings/system/control-center", group: "system", keywords: ["features", "toggles", "modules", "shortcuts"] },
  { id: "system-ai", label: "AI Settings", parentPath: "System", path: "/settings/ai-assistant", group: "system", keywords: ["assistant", "artificial intelligence", "automation"] },

  // ===== Payments =====
  { id: "payments", label: "Payments", parentPath: "Settings", path: "/settings/payments", group: "payments" },
  { id: "payments-methods", label: "Payment Methods", parentPath: "Payments", path: "/settings/payments/payment-methods", group: "payments", keywords: ["card", "cash", "wallet", "tender"] },
  { id: "payments-gratuity", label: "Gratuity", parentPath: "Payments", path: "/settings/payments/gratuity", group: "payments", keywords: ["tip", "tipping", "tips"] },
  { id: "payments-taxes", label: "Taxes", parentPath: "Payments", path: "/settings/payments/taxes", group: "payments", keywords: ["tax", "vat", "gst", "sales tax"] },
  { id: "payments-discounts", label: "Discounts", parentPath: "Payments", path: "/settings/payments/discounts", group: "payments", keywords: ["promo", "promotion", "coupon", "deal"] },
  { id: "payments-service-charge", label: "Service Charge", parentPath: "Payments", path: "/settings/payments/service-charge", group: "payments", keywords: ["fee", "surcharge", "auto gratuity"] },
  { id: "payments-cash-management", label: "Cash Management", parentPath: "Payments", path: "/settings/payments/cash-management", group: "payments", keywords: ["drawer", "till", "cash log", "history"] },
  { id: "payments-cash-drawer", label: "Cash Drawer", parentPath: "Payments › Cash Management", path: "/settings/payments/cash-management/details", group: "payments", keywords: ["drawer", "till", "session"] },
  { id: "payments-pay-in-out", label: "Pay In / Pay Out", parentPath: "Payments › Cash Management", path: "/settings/payments/cash-management/pay-in-out", group: "payments", keywords: ["petty cash", "vendor", "payout", "cash in", "cash out"] },
  { id: "payments-checkout", label: "Checkout Options", parentPath: "Payments", path: "/settings/payments/checkout-options", group: "payments", keywords: ["receipt", "signature", "split check", "tip screen"] },

  // ===== Menu =====
  { id: "menu", label: "Menu", parentPath: "Settings", path: "/settings/menu", group: "menu" },
  { id: "menu-menus", label: "Menus", parentPath: "Menu", path: "/settings/menu/menu", group: "menu", keywords: ["menus", "menu list"] },
  { id: "menu-add-menu", label: "Add Menu", parentPath: "Menu › Menus", path: "/settings/menu/menus/add", group: "menu", keywords: ["new menu", "create menu"] },
  { id: "menu-categories", label: "Categories", parentPath: "Menu", path: "/settings/menu/categories", group: "menu", keywords: ["category", "section"] },
  { id: "menu-modifiers", label: "Modifiers", parentPath: "Menu", path: "/settings/menu/modifiers", group: "menu", keywords: ["options", "extras", "variations"] },
  { id: "menu-add-ons", label: "Add-Ons", parentPath: "Menu", path: "/settings/menu/add-ons", group: "menu", keywords: ["addons", "extras", "toppings"] },
  { id: "menu-products", label: "Products", parentPath: "Menu", path: "/settings/menu/products", group: "menu", keywords: ["items", "menu items", "dishes"] },
  { id: "menu-add-product", label: "Add Product", parentPath: "Menu › Products", path: "/settings/menu/products/add", group: "menu", keywords: ["new product", "create product", "new item"] },
  { id: "menu-default-modifiers", label: "Default Modifiers", parentPath: "Menu", path: "/settings/menu/default-modifiers", group: "menu", keywords: ["preset modifiers"] },
  { id: "menu-groups", label: "Groups", parentPath: "Menu", path: "/settings/menu/groups", group: "menu", keywords: ["modifier groups", "option groups"] },
  { id: "menu-timed-pricing", label: "Timed Pricing", parentPath: "Menu", path: "/settings/menu/timed-pricing", group: "menu", keywords: ["happy hour", "scheduled price", "time-based"] },
  { id: "menu-inventory", label: "Inventory", parentPath: "Menu", path: "/settings/menu/inventory", group: "menu", keywords: ["stock", "86", "out of stock"] },

  // ===== End of Day =====
  { id: "end-of-day", label: "End of Day", parentPath: "Settings", path: "/settings/end-of-day", group: "end-of-day", keywords: ["eod", "closing", "close out", "z report"] },

  // ===== Guest Book =====
  { id: "guest-book", label: "Guest Book", parentPath: "Settings", path: "/settings/guest-book", group: "guest-book", keywords: ["customers", "guests", "crm", "loyalty"] },

  // ===== Workforce =====
  { id: "workforce", label: "Workforce", parentPath: "Settings", path: "/settings/workforce", group: "workforce", keywords: ["staff", "team", "employees"] },
  { id: "workforce-employee", label: "Employees", parentPath: "Workforce", path: "/settings/workforce/employee", group: "workforce", keywords: ["staff", "users", "people"] },
  { id: "workforce-add-employee", label: "Add Employee", parentPath: "Workforce › Employees", path: "/settings/workforce/employee/add", group: "workforce", keywords: ["new employee", "hire"] },
  { id: "workforce-shift", label: "Shifts", parentPath: "Workforce", path: "/settings/workforce/shift", group: "workforce", keywords: ["schedule", "rota", "roster"] },
  { id: "workforce-add-shift", label: "Add Shift", parentPath: "Workforce › Shifts", path: "/settings/workforce/shift/add", group: "workforce", keywords: ["new shift", "schedule"] },
  { id: "workforce-schedule-info", label: "Schedule Information", parentPath: "Workforce", path: "/settings/workforce/schedule-information", group: "workforce", keywords: ["schedule", "open shifts"] },

  // ===== Reports & Analytics =====
  { id: "reports-analytics", label: "Reports & Analytics", parentPath: "Settings", path: "/settings/reports", group: "reports-analytics", keywords: ["sales report", "analytics", "stats", "insights"] },

  // ===== Notifications =====
  { id: "notifications", label: "Notifications", parentPath: "Settings", path: "/settings/notifications", group: "notifications", keywords: ["alerts", "push"] },
  { id: "notifications-all", label: "All Notifications", parentPath: "Notifications", path: "/settings/notifications/all", group: "notifications", keywords: ["history", "inbox"] },

  // ===== Hardware =====
  { id: "hardware", label: "Hardware", parentPath: "Settings", path: "/settings/hardware", group: "hardware", keywords: ["devices", "peripherals"] },
  { id: "hardware-details", label: "Hardware Details", parentPath: "Hardware", path: "/settings/hardware/details", group: "hardware" },
  { id: "hardware-printer", label: "Printer", parentPath: "Hardware › Details", path: "/settings/hardware/details/printer", group: "hardware", keywords: ["receipt printer", "kitchen printer", "print"] },
  { id: "hardware-printer-advanced", label: "Printer Advanced", parentPath: "Hardware › Printer", path: "/settings/hardware/details/printer/advanced", group: "hardware", keywords: ["printer settings"] },
  { id: "hardware-printer-pair", label: "Pair Printer", parentPath: "Hardware › Printer", path: "/settings/hardware/details/printer/pair", group: "hardware", keywords: ["connect printer", "bluetooth printer"] },
  { id: "hardware-card-reader", label: "Card Reader", parentPath: "Hardware › Details", path: "/settings/hardware/details/card-reader", group: "hardware", keywords: ["payment terminal", "emv", "chip reader"] },
  { id: "hardware-cash-register", label: "Cash Register", parentPath: "Hardware › Details", path: "/settings/hardware/details/cash-register", group: "hardware", keywords: ["drawer", "till"] },

  // ===== Network =====
  { id: "network", label: "Network", parentPath: "Settings", path: "/settings/network", group: "network", keywords: ["wifi", "internet", "connection"] },
  { id: "network-servers", label: "Server Connection", parentPath: "Network", path: "/settings/network/servers", group: "network", keywords: ["server", "backend", "sync"] },
  { id: "network-ai-integration", label: "AI Integration", parentPath: "Network", path: "/settings/network/ai-integration", group: "network", keywords: ["ai", "openai", "model", "gpt"] },
  { id: "network-ai-instructions", label: "AI Instructions", parentPath: "Network › AI Integration", path: "/settings/network/ai-integration/ai-instructions", group: "network", keywords: ["prompt", "ai rules", "system prompt"] },

  // ===== Support =====
  { id: "support", label: "Support", parentPath: "Settings", path: "/settings/support", group: "support", keywords: ["help"] },
  { id: "support-feedback", label: "Feedback", parentPath: "Support", path: "/settings/support/feedback", group: "support", keywords: ["suggestion", "review"] },
  { id: "support-contact", label: "Contact Support", parentPath: "Support", path: "/settings/support/contact", group: "support", keywords: ["help", "contact us", "email support"] },
  { id: "support-about", label: "About", parentPath: "Support", path: "/settings/support/about", group: "support", keywords: ["version", "info"] },
  { id: "support-privacy", label: "Privacy Policy", parentPath: "Support › About", path: "/settings/support/about/privacy-policy", group: "support", keywords: ["privacy", "data"] },
  { id: "support-legal", label: "Legal Terms", parentPath: "Support › About", path: "/settings/support/about/legal-terms", group: "support", keywords: ["terms", "tos", "agreement"] },
  { id: "support-fraud", label: "Report Fraud", parentPath: "Support › About", path: "/settings/support/about/report-fraud", group: "support", keywords: ["fraud", "abuse", "report"] },
];

// Group → icon background color (matches SettingsNavigation icon colors)
export const groupIconColor: Record<SettingsSearchEntry["group"], string> = {
  account: "#0A84FF",
  system: "#34A885",
  payments: "#4200FF",
  menu: "#F82536",
  "end-of-day": "#7300FF",
  "guest-book": "#F9900E",
  workforce: "#800080",
  "reports-analytics": "#606060",
  notifications: "#ED1C24",
  hardware: "#5E4DD8",
  network: "#5AB0EE",
  support: "#FF0028",
};

export function searchSettings(query: string): SettingsSearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);

  const scored = settingsSearchIndex
    .map((entry) => {
      const haystack = [
        entry.label,
        entry.parentPath,
        ...(entry.keywords || []),
      ]
        .join(" ")
        .toLowerCase();
      // Every token must be present somewhere
      const matchesAll = tokens.every((t) => haystack.includes(t));
      if (!matchesAll) return null;
      // Simple relevance: prefer label matches, then exact word match
      let score = 0;
      const label = entry.label.toLowerCase();
      if (label === q) score += 100;
      if (label.startsWith(q)) score += 40;
      if (label.includes(q)) score += 20;
      tokens.forEach((t) => {
        if (label.includes(t)) score += 10;
        if ((entry.keywords || []).some((k) => k.toLowerCase().includes(t))) score += 4;
      });
      return { entry, score };
    })
    .filter((x): x is { entry: SettingsSearchEntry; score: number } => x !== null)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.entry);

  return scored;
}
