import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from "react";

// Demo business types
export type DemoBusinessType = "restaurant" | "cafe" | "foodtruck" | null;

// Configuration for each business type
export interface DemoConfig {
  businessType: DemoBusinessType;
  isDemoMode: boolean;
  // Feature flags
  features: {
    tablesEnabled: boolean;
    tableManagement: boolean;
    floorView: boolean;
    dineIn: boolean;
    takeaway: boolean;
    delivery: boolean;
    serverAssignment: boolean;
    tableStatuses: boolean;
    counterOrdering: boolean;
    ticketBasedOrders: boolean;
    orderOSEnabled: boolean;
  };
  // Labels
  labels: {
    orderIdentifier: string; // "Table #" | "Order #" | "Ticket #"
    orderIdentifierShort: string; // "T" | "Order" | "Ticket"
  };
  // Order lifecycle
  orderStatuses: string[];
  // Business type display name
  displayName: string;
}

// Default configurations for each business type
const businessTypeConfigs: Record<string, Omit<DemoConfig, 'isDemoMode' | 'businessType'>> = {
  restaurant: {
    features: {
      tablesEnabled: true,
      tableManagement: true,
      floorView: true,
      dineIn: true,
      takeaway: true,
      delivery: true,
      serverAssignment: true,
      tableStatuses: true,
      counterOrdering: false,
      ticketBasedOrders: false,
      orderOSEnabled: true,
    },
    labels: {
      orderIdentifier: "Table #",
      orderIdentifierShort: "T",
    },
    orderStatuses: ["Ordering", "Ordered", "Being Prepared", "Ready", "Payment", "Paid", "Completed"],
    displayName: "Full Service Restaurant",
  },
  cafe: {
    features: {
      tablesEnabled: false,
      tableManagement: false,
      floorView: false,
      dineIn: false,
      takeaway: true,
      delivery: true,
      serverAssignment: false,
      tableStatuses: false,
      counterOrdering: true,
      ticketBasedOrders: true,
      orderOSEnabled: true,
    },
    labels: {
      orderIdentifier: "Order #",
      orderIdentifierShort: "Order",
    },
    orderStatuses: ["New", "In Progress", "Ready", "Completed"],
    displayName: "Quick Service Café",
  },
  foodtruck: {
    features: {
      tablesEnabled: false,
      tableManagement: false,
      floorView: false,
      dineIn: false,
      takeaway: true,
      delivery: false,
      serverAssignment: false,
      tableStatuses: false,
      counterOrdering: true,
      ticketBasedOrders: true,
      orderOSEnabled: false,
    },
    labels: {
      orderIdentifier: "Ticket #",
      orderIdentifierShort: "Ticket",
    },
    orderStatuses: ["Ordered", "Ready", "Completed"],
    displayName: "Food Truck",
  },
};

// Default config for non-demo mode (full features)
const defaultConfig: DemoConfig = {
  businessType: null,
  isDemoMode: false,
  features: {
    tablesEnabled: true,
    tableManagement: true,
    floorView: true,
    dineIn: true,
    takeaway: true,
    delivery: true,
    serverAssignment: true,
    tableStatuses: true,
    counterOrdering: true,
    ticketBasedOrders: false,
    orderOSEnabled: true,
  },
  labels: {
    orderIdentifier: "Table #",
    orderIdentifierShort: "T",
  },
  orderStatuses: ["Ordering", "Ordered", "Being Prepared", "Ready", "Payment", "Paid", "Completed"],
  displayName: "Restaurant",
};

interface DemoConfigContextType {
  config: DemoConfig;
  setBusinessType: (type: DemoBusinessType) => void;
  resetDemo: () => void;
}

const DemoConfigContext = createContext<DemoConfigContextType | undefined>(undefined);

const DEVICE_SESSION_KEY = "pos_device_session";

export function DemoConfigProvider({ children }: { children: ReactNode }) {
  const [businessType, setBusinessTypeState] = useState<DemoBusinessType>(() => {
    // Initialize from localStorage synchronously
    const deviceSession = localStorage.getItem(DEVICE_SESSION_KEY);
    if (deviceSession) {
      try {
        const parsed = JSON.parse(deviceSession);
        const isDemo = !!parsed.isDemoMode || !!parsed.isDemo;
        const type = parsed.businessType || parsed.demoBusinessType || null;
        if (isDemo && type) {
          return type as DemoBusinessType;
        }
      } catch {
        // Ignore parse errors
      }
    }
    return null;
  });
  
  const [isDemoMode, setIsDemoMode] = useState(() => {
    // Initialize from localStorage synchronously
    const deviceSession = localStorage.getItem(DEVICE_SESSION_KEY);
    if (deviceSession) {
      try {
        const parsed = JSON.parse(deviceSession);
        return !!parsed.isDemoMode || !!parsed.isDemo;
      } catch {
        return false;
      }
    }
    return false;
  });

  const loadDemoConfig = useCallback(() => {
    const deviceSession = localStorage.getItem(DEVICE_SESSION_KEY);
    if (deviceSession) {
      try {
        const parsed = JSON.parse(deviceSession);
        const isDemo = !!parsed.isDemoMode || !!parsed.isDemo;
        const type = parsed.businessType || parsed.demoBusinessType || null;
        
        setIsDemoMode(isDemo);
        if (isDemo && type) {
          setBusinessTypeState(type as DemoBusinessType);
        } else {
          setBusinessTypeState(null);
        }
      } catch {
        setIsDemoMode(false);
        setBusinessTypeState(null);
      }
    } else {
      setIsDemoMode(false);
      setBusinessTypeState(null);
    }
  }, []);

  // Load from localStorage on mount and set up listeners
  useEffect(() => {
    loadDemoConfig();

    // Listen for storage changes (in case of login/logout in another tab)
    window.addEventListener("storage", loadDemoConfig);
    
    // Listen for focus events to catch same-tab navigation
    window.addEventListener("focus", loadDemoConfig);
    
    // Also check periodically for changes (catches same-tab localStorage updates)
    const interval = setInterval(loadDemoConfig, 500);
    
    return () => {
      window.removeEventListener("storage", loadDemoConfig);
      window.removeEventListener("focus", loadDemoConfig);
      clearInterval(interval);
    };
  }, [loadDemoConfig]);

  const config = useMemo((): DemoConfig => {
    if (!isDemoMode || !businessType) {
      return defaultConfig;
    }

    const typeConfig = businessTypeConfigs[businessType];
    if (!typeConfig) {
      return defaultConfig;
    }

    return {
      businessType,
      isDemoMode: true,
      ...typeConfig,
    };
  }, [businessType, isDemoMode]);

  const setBusinessType = (type: DemoBusinessType) => {
    setBusinessTypeState(type);
    if (type) {
      setIsDemoMode(true);
    }
  };

  const resetDemo = () => {
    setBusinessTypeState(null);
    setIsDemoMode(false);
    localStorage.removeItem(DEVICE_SESSION_KEY);
    localStorage.removeItem("pos_session");
  };

  return (
    <DemoConfigContext.Provider value={{ config, setBusinessType, resetDemo }}>
      {children}
    </DemoConfigContext.Provider>
  );
}

export function useDemoConfig() {
  const context = useContext(DemoConfigContext);
  if (context === undefined) {
    throw new Error("useDemoConfig must be used within a DemoConfigProvider");
  }
  return context;
}

// Convenience hook for checking specific features
export function useDemoFeatures() {
  const { config } = useDemoConfig();
  return config.features;
}

// Convenience hook for labels
export function useDemoLabels() {
  const { config } = useDemoConfig();
  return config.labels;
}
