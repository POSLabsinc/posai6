import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Theme, 
  UserPreferences, 
  LayoutConfig, 
  ThemeColors,
  DEFAULT_LAYOUT,
  ThemeLayout
} from '@/lib/theme-types';
import { builtInThemes, darkTheme, lightTheme, getThemeById } from '@/lib/themes';

// Storage keys
const STORAGE_KEY = 'user-preferences';
const THEME_ATTRIBUTE = 'data-theme';

// Default user preferences
const defaultPreferences: UserPreferences = {
  activeThemeId: 'dark',
  customThemes: [],
  layout: {
    sidebar: DEFAULT_LAYOUT,
    panels: [],
    widgets: [],
  },
  systemThemeEnabled: false,
  systemThemeLightId: 'light',
  systemThemeDarkId: 'dark',
};

// Context type
interface ThemeContextType {
  // Current theme
  theme: Theme;
  themes: Theme[];
  
  // Theme actions
  setTheme: (themeId: string) => void;
  addCustomTheme: (theme: Theme) => void;
  updateCustomTheme: (themeId: string, updates: Partial<Theme>) => void;
  deleteCustomTheme: (themeId: string) => void;
  duplicateTheme: (themeId: string, newName: string) => Theme | null;
  
  // System theme
  systemThemeEnabled: boolean;
  setSystemThemeEnabled: (enabled: boolean) => void;
  setSystemThemeMapping: (lightId: string, darkId: string) => void;
  
  // Layout
  layout: LayoutConfig;
  updateLayout: (updates: Partial<LayoutConfig>) => void;
  updateSidebarLayout: (updates: Partial<ThemeLayout>) => void;
  resetLayout: () => void;
  
  // Preferences
  preferences: UserPreferences;
  resetPreferences: () => void;
  exportPreferences: () => string;
  importPreferences: (json: string) => boolean;
  
  // Utilities
  isDark: boolean;
  getContrastColor: (bgColor: string) => string;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// Helper to apply CSS variables from theme
const applyCSSVariables = (theme: Theme) => {
  const root = document.documentElement;
  const colors = theme.colors;
  
  // Apply color variables
  root.style.setProperty('--background', colors.background);
  root.style.setProperty('--foreground', colors.foreground);
  root.style.setProperty('--card', colors.card);
  root.style.setProperty('--card-foreground', colors.cardForeground);
  root.style.setProperty('--popover', colors.popover);
  root.style.setProperty('--popover-foreground', colors.popoverForeground);
  root.style.setProperty('--primary', colors.primary);
  root.style.setProperty('--primary-foreground', colors.primaryForeground);
  root.style.setProperty('--secondary', colors.secondary);
  root.style.setProperty('--secondary-foreground', colors.secondaryForeground);
  root.style.setProperty('--muted', colors.muted);
  root.style.setProperty('--muted-foreground', colors.mutedForeground);
  root.style.setProperty('--accent', colors.accent);
  root.style.setProperty('--accent-foreground', colors.accentForeground);
  root.style.setProperty('--destructive', colors.destructive);
  root.style.setProperty('--destructive-foreground', colors.destructiveForeground);
  root.style.setProperty('--border', colors.border);
  root.style.setProperty('--input', colors.input);
  root.style.setProperty('--ring', colors.ring);
  root.style.setProperty('--header', colors.header);
  root.style.setProperty('--header-foreground', colors.headerForeground);
  root.style.setProperty('--sidebar-background', colors.sidebarBackground);
  root.style.setProperty('--sidebar-foreground', colors.sidebarForeground);
  root.style.setProperty('--sidebar-primary', colors.sidebarPrimary);
  root.style.setProperty('--sidebar-primary-foreground', colors.sidebarPrimaryForeground);
  root.style.setProperty('--sidebar-accent', colors.sidebarAccent);
  root.style.setProperty('--sidebar-accent-foreground', colors.sidebarAccentForeground);
  root.style.setProperty('--sidebar-border', colors.sidebarBorder);
  root.style.setProperty('--sidebar-ring', colors.sidebarRing);
  
  // Glass effect variables
  root.style.setProperty('--glass-background', colors.glassBackground);
  root.style.setProperty('--glass-border', colors.glassBorder);
  root.style.setProperty('--glass-backdrop-blur', colors.glassBackdropBlur);
  
  // Status colors
  root.style.setProperty('--success', colors.success);
  root.style.setProperty('--success-foreground', colors.successForeground);
  root.style.setProperty('--warning', colors.warning);
  root.style.setProperty('--warning-foreground', colors.warningForeground);
  root.style.setProperty('--info', colors.info);
  root.style.setProperty('--info-foreground', colors.infoForeground);
  
  // Typography
  root.style.setProperty('--font-family', theme.typography.fontFamily);
  root.style.setProperty('--font-family-mono', theme.typography.fontFamilyMono);
  root.style.setProperty('--font-size-base', theme.typography.fontSizeBase);
  root.style.setProperty('--font-size-sm', theme.typography.fontSizeSm);
  root.style.setProperty('--font-size-lg', theme.typography.fontSizeLg);
  root.style.setProperty('--font-size-xl', theme.typography.fontSizeXl);
  
  // Spacing
  root.style.setProperty('--radius', theme.spacing.radius);
  root.style.setProperty('--radius-sm', theme.spacing.radiusSm);
  root.style.setProperty('--radius-md', theme.spacing.radiusMd);
  root.style.setProperty('--radius-lg', theme.spacing.radiusLg);
  root.style.setProperty('--radius-xl', theme.spacing.radiusXl);
  
  // Effects
  root.style.setProperty('--shadow-sm', theme.effects.shadowSm);
  root.style.setProperty('--shadow-md', theme.effects.shadowMd);
  root.style.setProperty('--shadow-lg', theme.effects.shadowLg);
  root.style.setProperty('--shadow-xl', theme.effects.shadowXl);
  root.style.setProperty('--glass-blur', theme.effects.glassBlur);
  root.style.setProperty('--glass-saturation', theme.effects.glassSaturation);
  
  // Set theme attribute for any CSS that needs it
  root.setAttribute(THEME_ATTRIBUTE, theme.id);
  
  // Set dark class for Tailwind
  if (theme.isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

// Load preferences from storage
const loadPreferences = (): UserPreferences => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultPreferences, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load theme preferences:', error);
  }
  return defaultPreferences;
};

// Save preferences to storage
const savePreferences = (prefs: UserPreferences) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.error('Failed to save theme preferences:', error);
  }
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
}

export function ThemeProvider({ children, defaultTheme = 'dark' }: ThemeProviderProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const loaded = loadPreferences();
    return {
      ...loaded,
      activeThemeId: loaded.activeThemeId || defaultTheme,
    };
  });
  
  const [systemDark, setSystemDark] = useState(() => 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  
  // Get all themes (built-in + custom)
  const themes = useMemo(
    () => [...builtInThemes, ...preferences.customThemes],
    [preferences.customThemes]
  );
  
  // Determine active theme
  const getActiveTheme = useCallback((): Theme => {
    if (preferences.systemThemeEnabled) {
      const themeId = systemDark 
        ? preferences.systemThemeDarkId 
        : preferences.systemThemeLightId;
      return themes.find(t => t.id === themeId) || darkTheme;
    }
    return themes.find(t => t.id === preferences.activeThemeId) || darkTheme;
  }, [preferences, systemDark, themes]);
  
  const theme = getActiveTheme();
  
  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  // Apply theme whenever it changes
  useEffect(() => {
    applyCSSVariables(theme);
  }, [theme]);
  
  // Save preferences whenever they change
  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);
  
  // Theme actions
  const setTheme = useCallback((themeId: string) => {
    setPreferences(prev => ({
      ...prev,
      activeThemeId: themeId,
      systemThemeEnabled: false,
    }));
  }, []);
  
  const addCustomTheme = useCallback((newTheme: Theme) => {
    setPreferences(prev => ({
      ...prev,
      customThemes: [...prev.customThemes, { ...newTheme, isCustom: true }],
    }));
  }, []);
  
  const updateCustomTheme = useCallback((themeId: string, updates: Partial<Theme>) => {
    setPreferences(prev => ({
      ...prev,
      customThemes: prev.customThemes.map(t => 
        t.id === themeId 
          ? { ...t, ...updates, updatedAt: new Date().toISOString() }
          : t
      ),
    }));
  }, []);
  
  const deleteCustomTheme = useCallback((themeId: string) => {
    setPreferences(prev => ({
      ...prev,
      customThemes: prev.customThemes.filter(t => t.id !== themeId),
      activeThemeId: prev.activeThemeId === themeId ? 'dark' : prev.activeThemeId,
    }));
  }, []);
  
  const duplicateTheme = useCallback((themeId: string, newName: string): Theme | null => {
    const source = themes.find(t => t.id === themeId);
    if (!source) return null;
    
    const newTheme: Theme = {
      ...source,
      id: `custom-${Date.now()}`,
      name: newName,
      author: 'User',
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    addCustomTheme(newTheme);
    return newTheme;
  }, [themes, addCustomTheme]);
  
  // System theme
  const setSystemThemeEnabled = useCallback((enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      systemThemeEnabled: enabled,
    }));
  }, []);
  
  const setSystemThemeMapping = useCallback((lightId: string, darkId: string) => {
    setPreferences(prev => ({
      ...prev,
      systemThemeLightId: lightId,
      systemThemeDarkId: darkId,
    }));
  }, []);
  
  // Layout actions
  const updateLayout = useCallback((updates: Partial<LayoutConfig>) => {
    setPreferences(prev => ({
      ...prev,
      layout: { ...prev.layout, ...updates },
    }));
  }, []);
  
  const updateSidebarLayout = useCallback((updates: Partial<ThemeLayout>) => {
    setPreferences(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        sidebar: { ...prev.layout.sidebar, ...updates },
      },
    }));
  }, []);
  
  const resetLayout = useCallback(() => {
    setPreferences(prev => ({
      ...prev,
      layout: {
        sidebar: DEFAULT_LAYOUT,
        panels: [],
        widgets: [],
      },
    }));
  }, []);
  
  // Preferences actions
  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
    localStorage.removeItem(STORAGE_KEY);
  }, []);
  
  const exportPreferences = useCallback((): string => {
    return JSON.stringify(preferences, null, 2);
  }, [preferences]);
  
  const importPreferences = useCallback((json: string): boolean => {
    try {
      const imported = JSON.parse(json);
      setPreferences({ ...defaultPreferences, ...imported });
      return true;
    } catch {
      return false;
    }
  }, []);
  
  // Utilities
  const getContrastColor = useCallback((bgColor: string): string => {
    // Simple contrast calculation - returns 'light' or 'dark'
    // bgColor expected in HSL format "h s% l%"
    const parts = bgColor.split(' ');
    if (parts.length >= 3) {
      const lightness = parseFloat(parts[2]);
      return lightness > 50 ? 'dark' : 'light';
    }
    return 'light';
  }, []);
  
  const value: ThemeContextType = {
    theme,
    themes,
    setTheme,
    addCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
    duplicateTheme,
    systemThemeEnabled: preferences.systemThemeEnabled,
    setSystemThemeEnabled,
    setSystemThemeMapping,
    layout: preferences.layout,
    updateLayout,
    updateSidebarLayout,
    resetLayout,
    preferences,
    resetPreferences,
    exportPreferences,
    importPreferences,
    isDark: theme.isDark,
    getContrastColor,
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Hook for just the current theme (lighter)
export function useCurrentTheme() {
  const { theme, isDark } = useTheme();
  return { theme, isDark };
}

// Hook for theme switching
export function useThemeSwitcher() {
  const { themes, theme, setTheme, systemThemeEnabled, setSystemThemeEnabled } = useTheme();
  return { themes, currentTheme: theme, setTheme, systemThemeEnabled, setSystemThemeEnabled };
}

// Hook for layout customization
export function useLayoutCustomization() {
  const { layout, updateLayout, updateSidebarLayout, resetLayout } = useTheme();
  return { layout, updateLayout, updateSidebarLayout, resetLayout };
}

// Hook for custom themes
export function useCustomThemes() {
  const { 
    themes, 
    addCustomTheme, 
    updateCustomTheme, 
    deleteCustomTheme, 
    duplicateTheme 
  } = useTheme();
  
  const customThemes = themes.filter(t => t.isCustom);
  const builtInThemesList = themes.filter(t => !t.isCustom);
  
  return {
    customThemes,
    builtInThemes: builtInThemesList,
    addCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
    duplicateTheme,
  };
}
