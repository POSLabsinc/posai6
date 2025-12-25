import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";

// Accent color options
export type AccentColor = "orange" | "blue" | "green" | "purple" | "red" | "teal";

// Font size options
export type FontSize = "small" | "medium" | "large";

// Restaurant presets
export type RestaurantPreset = "custom" | "fine-dining" | "fast-casual" | "coffee-shop" | "bar-grill";

// Theme settings interface
interface ThemeSettings {
  accentColor: AccentColor;
  fontSize: FontSize;
  highContrast: boolean;
  reduceAnimations: boolean;
  restaurantPreset: RestaurantPreset;
}

// Context interface
interface ThemeContextType extends ThemeSettings {
  // Color mode from next-themes
  colorMode: string | undefined;
  setColorMode: (mode: string) => void;
  resolvedColorMode: string | undefined;
  
  // Custom settings
  setAccentColor: (color: AccentColor) => void;
  setFontSize: (size: FontSize) => void;
  setHighContrast: (enabled: boolean) => void;
  setReduceAnimations: (enabled: boolean) => void;
  setRestaurantPreset: (preset: RestaurantPreset) => void;
  
  // Reset
  resetThemeSettings: () => void;
}

const defaultSettings: ThemeSettings = {
  accentColor: "orange",
  fontSize: "medium",
  highContrast: false,
  reduceAnimations: false,
  restaurantPreset: "custom",
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Storage key
const STORAGE_KEY = "restaurant-pos-theme-settings";

// Load settings from localStorage
const loadSettings = (): ThemeSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.warn("Failed to load theme settings:", e);
  }
  return defaultSettings;
};

// Save settings to localStorage
const saveSettings = (settings: ThemeSettings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn("Failed to save theme settings:", e);
  }
};

// Accent color CSS variables
const accentColorValues: Record<AccentColor, { h: number; s: number; l: number }> = {
  orange: { h: 25, s: 95, l: 53 },
  blue: { h: 217, s: 91, l: 60 },
  green: { h: 142, s: 76, l: 36 },
  purple: { h: 270, s: 70, l: 55 },
  red: { h: 0, s: 84, l: 60 },
  teal: { h: 173, s: 80, l: 40 },
};

// Font size CSS values
const fontSizeValues: Record<FontSize, string> = {
  small: "14px",
  medium: "16px",
  large: "18px",
};

// Restaurant preset accent colors
const presetAccentColors: Record<RestaurantPreset, AccentColor> = {
  "custom": "orange",
  "fine-dining": "purple",
  "fast-casual": "red",
  "coffee-shop": "teal",
  "bar-grill": "orange",
};

// Inner provider that uses next-themes
const ThemeContextProvider = ({ children }: { children: React.ReactNode }) => {
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  const [settings, setSettings] = useState<ThemeSettings>(defaultSettings);
  const [mounted, setMounted] = useState(false);

  // Load settings on mount
  useEffect(() => {
    setSettings(loadSettings());
    setMounted(true);
  }, []);

  // Apply CSS variables when settings change
  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;
    
    // Apply accent color
    const accent = accentColorValues[settings.accentColor];
    root.style.setProperty("--accent-h", accent.h.toString());
    root.style.setProperty("--accent-s", `${accent.s}%`);
    root.style.setProperty("--accent-l", `${accent.l}%`);
    root.style.setProperty("--accent-color", `${accent.h} ${accent.s}% ${accent.l}%`);
    
    // Apply font size
    root.style.setProperty("--font-size-base", fontSizeValues[settings.fontSize]);
    
    // Apply high contrast
    if (settings.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }
    
    // Apply reduce animations
    if (settings.reduceAnimations) {
      root.classList.add("reduce-motion");
    } else {
      root.classList.remove("reduce-motion");
    }
    
    // Save settings
    saveSettings(settings);
  }, [settings, mounted]);

  const setAccentColor = useCallback((color: AccentColor) => {
    setSettings(prev => ({ ...prev, accentColor: color, restaurantPreset: "custom" }));
  }, []);

  const setFontSize = useCallback((size: FontSize) => {
    setSettings(prev => ({ ...prev, fontSize: size }));
  }, []);

  const setHighContrast = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, highContrast: enabled }));
  }, []);

  const setReduceAnimations = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, reduceAnimations: enabled }));
  }, []);

  const setRestaurantPreset = useCallback((preset: RestaurantPreset) => {
    const presetAccent = presetAccentColors[preset];
    setSettings(prev => ({ 
      ...prev, 
      restaurantPreset: preset,
      accentColor: preset !== "custom" ? presetAccent : prev.accentColor
    }));
  }, []);

  const resetThemeSettings = useCallback(() => {
    setSettings(defaultSettings);
    setTheme("dark");
    localStorage.removeItem(STORAGE_KEY);
  }, [setTheme]);

  const value: ThemeContextType = {
    ...settings,
    colorMode: theme,
    setColorMode: setTheme,
    resolvedColorMode: resolvedTheme,
    setAccentColor,
    setFontSize,
    setHighContrast,
    setReduceAnimations,
    setRestaurantPreset,
    resetThemeSettings,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Main provider that wraps next-themes
export const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange={false}
    >
      <ThemeContextProvider>{children}</ThemeContextProvider>
    </NextThemesProvider>
  );
};

// Hook to use theme context
export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within an AppThemeProvider");
  }
  return context;
};

// Re-export types
export type { ThemeSettings, ThemeContextType };
