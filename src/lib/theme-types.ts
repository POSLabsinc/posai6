// Theme System Types
// This file defines the structure for the entire theming system

export interface ThemeColors {
  // Core colors
  background: string;
  foreground: string;
  
  // Card colors
  card: string;
  cardForeground: string;
  
  // Popover colors
  popover: string;
  popoverForeground: string;
  
  // Primary colors
  primary: string;
  primaryForeground: string;
  
  // Secondary colors
  secondary: string;
  secondaryForeground: string;
  
  // Muted colors
  muted: string;
  mutedForeground: string;
  
  // Accent colors
  accent: string;
  accentForeground: string;
  
  // Destructive colors
  destructive: string;
  destructiveForeground: string;
  
  // Border and input
  border: string;
  input: string;
  ring: string;
  
  // Header
  header: string;
  headerForeground: string;
  
  // Sidebar
  sidebarBackground: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
  
  // Glass effects
  glassBackground: string;
  glassBorder: string;
  glassBackdropBlur: string;
  
  // Status colors (for POS-specific elements)
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  info: string;
  infoForeground: string;
}

export interface ThemeTypography {
  fontFamily: string;
  fontFamilyMono: string;
  fontSizeBase: string;
  fontSizeSm: string;
  fontSizeLg: string;
  fontSizeXl: string;
  fontWeight: string;
  fontWeightMedium: string;
  fontWeightBold: string;
  lineHeight: string;
  letterSpacing: string;
}

export interface ThemeSpacing {
  radius: string;
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  radiusXl: string;
  radiusFull: string;
}

export interface ThemeEffects {
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
  shadowXl: string;
  glassBlur: string;
  glassSaturation: string;
}

export interface ThemeLayout {
  sidebarPosition: 'left' | 'right';
  sidebarCollapsed: boolean;
  sidebarWidth: string;
  headerVisible: boolean;
  headerHeight: string;
  bottomNavVisible: boolean;
  compactMode: boolean;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  isDark: boolean;
  isSystem: boolean;
  isCustom: boolean;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  effects: ThemeEffects;
  createdAt: string;
  updatedAt: string;
}

export interface LayoutConfig {
  sidebar: ThemeLayout;
  panels: PanelConfig[];
  widgets: WidgetConfig[];
}

export interface PanelConfig {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
  locked: boolean;
  order: number;
}

export interface WidgetConfig {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
  settings: Record<string, unknown>;
}

export interface UserPreferences {
  activeThemeId: string;
  customThemes: Theme[];
  layout: LayoutConfig;
  systemThemeEnabled: boolean;
  systemThemeLightId: string;
  systemThemeDarkId: string;
}

// Default values for creating new themes
export const DEFAULT_TYPOGRAPHY: ThemeTypography = {
  fontFamily: 'Inter, system-ui, sans-serif',
  fontFamilyMono: 'JetBrains Mono, monospace',
  fontSizeBase: '1rem',
  fontSizeSm: '0.875rem',
  fontSizeLg: '1.125rem',
  fontSizeXl: '1.25rem',
  fontWeight: '400',
  fontWeightMedium: '500',
  fontWeightBold: '700',
  lineHeight: '1.5',
  letterSpacing: '0',
};

export const DEFAULT_SPACING: ThemeSpacing = {
  radius: '0.5rem',
  radiusSm: '0.25rem',
  radiusMd: '0.375rem',
  radiusLg: '0.5rem',
  radiusXl: '0.75rem',
  radiusFull: '9999px',
};

export const DEFAULT_EFFECTS: ThemeEffects = {
  shadowSm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  shadowMd: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  shadowLg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  shadowXl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  glassBlur: '20px',
  glassSaturation: '180%',
};

export const DEFAULT_LAYOUT: ThemeLayout = {
  sidebarPosition: 'left',
  sidebarCollapsed: false,
  sidebarWidth: '80px',
  headerVisible: true,
  headerHeight: '64px',
  bottomNavVisible: true,
  compactMode: false,
};
