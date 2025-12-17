// Pre-built Themes
// All colors use HSL format for easy manipulation

import { 
  Theme, 
  ThemeColors, 
  DEFAULT_TYPOGRAPHY, 
  DEFAULT_SPACING, 
  DEFAULT_EFFECTS 
} from './theme-types';

// Helper to create a theme with defaults
const createTheme = (
  id: string,
  name: string,
  description: string,
  isDark: boolean,
  colors: ThemeColors,
  overrides?: Partial<Theme>
): Theme => ({
  id,
  name,
  description,
  author: 'System',
  version: '1.0.0',
  isDark,
  isSystem: false,
  isCustom: false,
  colors,
  typography: DEFAULT_TYPOGRAPHY,
  spacing: DEFAULT_SPACING,
  effects: DEFAULT_EFFECTS,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// ============================================
// LIGHT THEMES
// ============================================

const lightColors: ThemeColors = {
  background: '0 0% 100%',
  foreground: '222.2 84% 4.9%',
  card: '0 0% 100%',
  cardForeground: '222.2 84% 4.9%',
  popover: '0 0% 100%',
  popoverForeground: '222.2 84% 4.9%',
  primary: '25 95% 53%', // Orange accent
  primaryForeground: '0 0% 100%',
  secondary: '210 40% 96.1%',
  secondaryForeground: '222.2 47.4% 11.2%',
  muted: '210 40% 96.1%',
  mutedForeground: '215.4 16.3% 46.9%',
  accent: '210 40% 96.1%',
  accentForeground: '222.2 47.4% 11.2%',
  destructive: '0 84.2% 60.2%',
  destructiveForeground: '0 0% 100%',
  border: '214.3 31.8% 91.4%',
  input: '214.3 31.8% 91.4%',
  ring: '25 95% 53%',
  header: '0 0% 98%',
  headerForeground: '222.2 84% 4.9%',
  sidebarBackground: '0 0% 98%',
  sidebarForeground: '240 5.3% 26.1%',
  sidebarPrimary: '25 95% 53%',
  sidebarPrimaryForeground: '0 0% 100%',
  sidebarAccent: '240 4.8% 95.9%',
  sidebarAccentForeground: '240 5.9% 10%',
  sidebarBorder: '220 13% 91%',
  sidebarRing: '25 95% 53%',
  glassBackground: '0 0% 100% / 0.7',
  glassBorder: '0 0% 0% / 0.1',
  glassBackdropBlur: '20px',
  success: '142 76% 36%',
  successForeground: '0 0% 100%',
  warning: '38 92% 50%',
  warningForeground: '0 0% 100%',
  info: '199 89% 48%',
  infoForeground: '0 0% 100%',
};

export const lightTheme = createTheme(
  'light',
  'Light',
  'Clean and bright light theme',
  false,
  lightColors
);

// ============================================
// DARK THEMES
// ============================================

const darkColors: ThemeColors = {
  background: '0 0% 3.9%',
  foreground: '0 0% 98%',
  card: '0 0% 7%',
  cardForeground: '0 0% 98%',
  popover: '0 0% 7%',
  popoverForeground: '0 0% 98%',
  primary: '25 95% 53%', // Orange accent
  primaryForeground: '0 0% 100%',
  secondary: '0 0% 14.9%',
  secondaryForeground: '0 0% 98%',
  muted: '0 0% 14.9%',
  mutedForeground: '0 0% 63.9%',
  accent: '0 0% 14.9%',
  accentForeground: '0 0% 98%',
  destructive: '0 62.8% 30.6%',
  destructiveForeground: '0 0% 98%',
  border: '0 0% 14.9%',
  input: '0 0% 14.9%',
  ring: '25 95% 53%',
  header: '0 0% 7%',
  headerForeground: '0 0% 98%',
  sidebarBackground: '0 0% 3.9%',
  sidebarForeground: '0 0% 98%',
  sidebarPrimary: '25 95% 53%',
  sidebarPrimaryForeground: '0 0% 100%',
  sidebarAccent: '0 0% 14.9%',
  sidebarAccentForeground: '0 0% 98%',
  sidebarBorder: '0 0% 14.9%',
  sidebarRing: '25 95% 53%',
  glassBackground: '0 0% 100% / 0.08',
  glassBorder: '0 0% 100% / 0.15',
  glassBackdropBlur: '20px',
  success: '142 76% 36%',
  successForeground: '0 0% 100%',
  warning: '38 92% 50%',
  warningForeground: '0 0% 100%',
  info: '199 89% 48%',
  infoForeground: '0 0% 100%',
};

export const darkTheme = createTheme(
  'dark',
  'Dark',
  'Modern dark theme with orange accents',
  true,
  darkColors
);

// ============================================
// MIDNIGHT THEME (Deep blue dark)
// ============================================

const midnightColors: ThemeColors = {
  background: '222 47% 5%',
  foreground: '210 40% 98%',
  card: '222 47% 8%',
  cardForeground: '210 40% 98%',
  popover: '222 47% 8%',
  popoverForeground: '210 40% 98%',
  primary: '217 91% 60%', // Blue accent
  primaryForeground: '0 0% 100%',
  secondary: '222 47% 14%',
  secondaryForeground: '210 40% 98%',
  muted: '222 47% 14%',
  mutedForeground: '215 20% 65%',
  accent: '222 47% 14%',
  accentForeground: '210 40% 98%',
  destructive: '0 62.8% 30.6%',
  destructiveForeground: '210 40% 98%',
  border: '222 47% 18%',
  input: '222 47% 18%',
  ring: '217 91% 60%',
  header: '222 47% 8%',
  headerForeground: '210 40% 98%',
  sidebarBackground: '222 47% 5%',
  sidebarForeground: '210 40% 98%',
  sidebarPrimary: '217 91% 60%',
  sidebarPrimaryForeground: '0 0% 100%',
  sidebarAccent: '222 47% 14%',
  sidebarAccentForeground: '210 40% 98%',
  sidebarBorder: '222 47% 18%',
  sidebarRing: '217 91% 60%',
  glassBackground: '217 91% 60% / 0.1',
  glassBorder: '0 0% 100% / 0.12',
  glassBackdropBlur: '24px',
  success: '142 76% 36%',
  successForeground: '0 0% 100%',
  warning: '38 92% 50%',
  warningForeground: '0 0% 100%',
  info: '199 89% 48%',
  infoForeground: '0 0% 100%',
};

export const midnightTheme = createTheme(
  'midnight',
  'Midnight',
  'Deep blue night theme',
  true,
  midnightColors
);

// ============================================
// OCEAN THEME (Teal/Cyan)
// ============================================

const oceanColors: ThemeColors = {
  background: '183 30% 6%',
  foreground: '180 20% 95%',
  card: '183 30% 10%',
  cardForeground: '180 20% 95%',
  popover: '183 30% 10%',
  popoverForeground: '180 20% 95%',
  primary: '174 72% 46%', // Teal accent
  primaryForeground: '0 0% 100%',
  secondary: '183 30% 16%',
  secondaryForeground: '180 20% 95%',
  muted: '183 30% 16%',
  mutedForeground: '180 15% 60%',
  accent: '174 72% 46%',
  accentForeground: '0 0% 100%',
  destructive: '0 62.8% 30.6%',
  destructiveForeground: '180 20% 95%',
  border: '183 30% 20%',
  input: '183 30% 20%',
  ring: '174 72% 46%',
  header: '183 30% 10%',
  headerForeground: '180 20% 95%',
  sidebarBackground: '183 30% 6%',
  sidebarForeground: '180 20% 95%',
  sidebarPrimary: '174 72% 46%',
  sidebarPrimaryForeground: '0 0% 100%',
  sidebarAccent: '183 30% 16%',
  sidebarAccentForeground: '180 20% 95%',
  sidebarBorder: '183 30% 20%',
  sidebarRing: '174 72% 46%',
  glassBackground: '174 72% 46% / 0.1',
  glassBorder: '0 0% 100% / 0.1',
  glassBackdropBlur: '20px',
  success: '142 76% 36%',
  successForeground: '0 0% 100%',
  warning: '38 92% 50%',
  warningForeground: '0 0% 100%',
  info: '199 89% 48%',
  infoForeground: '0 0% 100%',
};

export const oceanTheme = createTheme(
  'ocean',
  'Ocean',
  'Deep ocean teal theme',
  true,
  oceanColors
);

// ============================================
// FOREST THEME (Green)
// ============================================

const forestColors: ThemeColors = {
  background: '150 30% 5%',
  foreground: '140 20% 95%',
  card: '150 30% 9%',
  cardForeground: '140 20% 95%',
  popover: '150 30% 9%',
  popoverForeground: '140 20% 95%',
  primary: '142 71% 45%', // Green accent
  primaryForeground: '0 0% 100%',
  secondary: '150 30% 15%',
  secondaryForeground: '140 20% 95%',
  muted: '150 30% 15%',
  mutedForeground: '140 15% 60%',
  accent: '142 71% 45%',
  accentForeground: '0 0% 100%',
  destructive: '0 62.8% 30.6%',
  destructiveForeground: '140 20% 95%',
  border: '150 30% 18%',
  input: '150 30% 18%',
  ring: '142 71% 45%',
  header: '150 30% 9%',
  headerForeground: '140 20% 95%',
  sidebarBackground: '150 30% 5%',
  sidebarForeground: '140 20% 95%',
  sidebarPrimary: '142 71% 45%',
  sidebarPrimaryForeground: '0 0% 100%',
  sidebarAccent: '150 30% 15%',
  sidebarAccentForeground: '140 20% 95%',
  sidebarBorder: '150 30% 18%',
  sidebarRing: '142 71% 45%',
  glassBackground: '142 71% 45% / 0.1',
  glassBorder: '0 0% 100% / 0.1',
  glassBackdropBlur: '20px',
  success: '142 76% 36%',
  successForeground: '0 0% 100%',
  warning: '38 92% 50%',
  warningForeground: '0 0% 100%',
  info: '199 89% 48%',
  infoForeground: '0 0% 100%',
};

export const forestTheme = createTheme(
  'forest',
  'Forest',
  'Natural green forest theme',
  true,
  forestColors
);

// ============================================
// SUNSET THEME (Warm orange/pink)
// ============================================

const sunsetColors: ThemeColors = {
  background: '20 30% 6%',
  foreground: '30 20% 95%',
  card: '20 30% 10%',
  cardForeground: '30 20% 95%',
  popover: '20 30% 10%',
  popoverForeground: '30 20% 95%',
  primary: '25 95% 53%', // Orange accent
  primaryForeground: '0 0% 100%',
  secondary: '20 30% 16%',
  secondaryForeground: '30 20% 95%',
  muted: '20 30% 16%',
  mutedForeground: '30 15% 60%',
  accent: '340 82% 52%', // Pink accent
  accentForeground: '0 0% 100%',
  destructive: '0 62.8% 30.6%',
  destructiveForeground: '30 20% 95%',
  border: '20 30% 20%',
  input: '20 30% 20%',
  ring: '25 95% 53%',
  header: '20 30% 10%',
  headerForeground: '30 20% 95%',
  sidebarBackground: '20 30% 6%',
  sidebarForeground: '30 20% 95%',
  sidebarPrimary: '25 95% 53%',
  sidebarPrimaryForeground: '0 0% 100%',
  sidebarAccent: '20 30% 16%',
  sidebarAccentForeground: '30 20% 95%',
  sidebarBorder: '20 30% 20%',
  sidebarRing: '25 95% 53%',
  glassBackground: '25 95% 53% / 0.1',
  glassBorder: '0 0% 100% / 0.12',
  glassBackdropBlur: '20px',
  success: '142 76% 36%',
  successForeground: '0 0% 100%',
  warning: '38 92% 50%',
  warningForeground: '0 0% 100%',
  info: '199 89% 48%',
  infoForeground: '0 0% 100%',
};

export const sunsetTheme = createTheme(
  'sunset',
  'Sunset',
  'Warm sunset orange and pink theme',
  true,
  sunsetColors
);

// ============================================
// LAVENDER THEME (Purple/Violet light)
// ============================================

const lavenderColors: ThemeColors = {
  background: '270 30% 98%',
  foreground: '270 50% 15%',
  card: '270 30% 100%',
  cardForeground: '270 50% 15%',
  popover: '270 30% 100%',
  popoverForeground: '270 50% 15%',
  primary: '262 83% 58%', // Purple accent
  primaryForeground: '0 0% 100%',
  secondary: '270 30% 94%',
  secondaryForeground: '270 50% 15%',
  muted: '270 30% 94%',
  mutedForeground: '270 20% 50%',
  accent: '262 83% 58%',
  accentForeground: '0 0% 100%',
  destructive: '0 84.2% 60.2%',
  destructiveForeground: '0 0% 100%',
  border: '270 30% 88%',
  input: '270 30% 88%',
  ring: '262 83% 58%',
  header: '270 30% 96%',
  headerForeground: '270 50% 15%',
  sidebarBackground: '270 30% 98%',
  sidebarForeground: '270 50% 15%',
  sidebarPrimary: '262 83% 58%',
  sidebarPrimaryForeground: '0 0% 100%',
  sidebarAccent: '270 30% 92%',
  sidebarAccentForeground: '270 50% 15%',
  sidebarBorder: '270 30% 88%',
  sidebarRing: '262 83% 58%',
  glassBackground: '262 83% 58% / 0.08',
  glassBorder: '270 50% 15% / 0.1',
  glassBackdropBlur: '20px',
  success: '142 76% 36%',
  successForeground: '0 0% 100%',
  warning: '38 92% 50%',
  warningForeground: '0 0% 100%',
  info: '199 89% 48%',
  infoForeground: '0 0% 100%',
};

export const lavenderTheme = createTheme(
  'lavender',
  'Lavender',
  'Soft purple lavender light theme',
  false,
  lavenderColors
);

// ============================================
// ROSE THEME (Pink light)
// ============================================

const roseColors: ThemeColors = {
  background: '350 30% 98%',
  foreground: '350 50% 15%',
  card: '350 30% 100%',
  cardForeground: '350 50% 15%',
  popover: '350 30% 100%',
  popoverForeground: '350 50% 15%',
  primary: '340 82% 52%', // Rose/Pink accent
  primaryForeground: '0 0% 100%',
  secondary: '350 30% 94%',
  secondaryForeground: '350 50% 15%',
  muted: '350 30% 94%',
  mutedForeground: '350 20% 50%',
  accent: '340 82% 52%',
  accentForeground: '0 0% 100%',
  destructive: '0 84.2% 60.2%',
  destructiveForeground: '0 0% 100%',
  border: '350 30% 88%',
  input: '350 30% 88%',
  ring: '340 82% 52%',
  header: '350 30% 96%',
  headerForeground: '350 50% 15%',
  sidebarBackground: '350 30% 98%',
  sidebarForeground: '350 50% 15%',
  sidebarPrimary: '340 82% 52%',
  sidebarPrimaryForeground: '0 0% 100%',
  sidebarAccent: '350 30% 92%',
  sidebarAccentForeground: '350 50% 15%',
  sidebarBorder: '350 30% 88%',
  sidebarRing: '340 82% 52%',
  glassBackground: '340 82% 52% / 0.08',
  glassBorder: '350 50% 15% / 0.1',
  glassBackdropBlur: '20px',
  success: '142 76% 36%',
  successForeground: '0 0% 100%',
  warning: '38 92% 50%',
  warningForeground: '0 0% 100%',
  info: '199 89% 48%',
  infoForeground: '0 0% 100%',
};

export const roseTheme = createTheme(
  'rose',
  'Rose',
  'Soft pink rose light theme',
  false,
  roseColors
);

// ============================================
// NORD THEME (Arctic, bluish gray)
// ============================================

const nordColors: ThemeColors = {
  background: '220 16% 14%',
  foreground: '218 27% 92%',
  card: '220 16% 18%',
  cardForeground: '218 27% 92%',
  popover: '220 16% 18%',
  popoverForeground: '218 27% 92%',
  primary: '193 43% 67%', // Nord frost blue
  primaryForeground: '220 16% 14%',
  secondary: '220 16% 24%',
  secondaryForeground: '218 27% 92%',
  muted: '220 16% 24%',
  mutedForeground: '218 20% 60%',
  accent: '179 25% 65%', // Nord teal
  accentForeground: '220 16% 14%',
  destructive: '354 42% 56%',
  destructiveForeground: '218 27% 92%',
  border: '220 16% 28%',
  input: '220 16% 28%',
  ring: '193 43% 67%',
  header: '220 16% 18%',
  headerForeground: '218 27% 92%',
  sidebarBackground: '220 16% 14%',
  sidebarForeground: '218 27% 92%',
  sidebarPrimary: '193 43% 67%',
  sidebarPrimaryForeground: '220 16% 14%',
  sidebarAccent: '220 16% 24%',
  sidebarAccentForeground: '218 27% 92%',
  sidebarBorder: '220 16% 28%',
  sidebarRing: '193 43% 67%',
  glassBackground: '193 43% 67% / 0.1',
  glassBorder: '0 0% 100% / 0.1',
  glassBackdropBlur: '20px',
  success: '92 28% 65%', // Nord green
  successForeground: '220 16% 14%',
  warning: '40 71% 73%', // Nord yellow
  warningForeground: '220 16% 14%',
  info: '193 43% 67%',
  infoForeground: '220 16% 14%',
};

export const nordTheme = createTheme(
  'nord',
  'Nord',
  'Arctic, bluish gray inspired by Nord palette',
  true,
  nordColors
);

// ============================================
// DRACULA THEME (Popular dark theme)
// ============================================

const draculaColors: ThemeColors = {
  background: '231 15% 18%',
  foreground: '60 30% 96%',
  card: '232 14% 21%',
  cardForeground: '60 30% 96%',
  popover: '232 14% 21%',
  popoverForeground: '60 30% 96%',
  primary: '265 89% 78%', // Dracula purple
  primaryForeground: '231 15% 18%',
  secondary: '232 14% 26%',
  secondaryForeground: '60 30% 96%',
  muted: '232 14% 26%',
  mutedForeground: '60 20% 70%',
  accent: '135 94% 65%', // Dracula green
  accentForeground: '231 15% 18%',
  destructive: '0 100% 67%', // Dracula red
  destructiveForeground: '60 30% 96%',
  border: '232 14% 30%',
  input: '232 14% 30%',
  ring: '265 89% 78%',
  header: '232 14% 21%',
  headerForeground: '60 30% 96%',
  sidebarBackground: '231 15% 18%',
  sidebarForeground: '60 30% 96%',
  sidebarPrimary: '265 89% 78%',
  sidebarPrimaryForeground: '231 15% 18%',
  sidebarAccent: '232 14% 26%',
  sidebarAccentForeground: '60 30% 96%',
  sidebarBorder: '232 14% 30%',
  sidebarRing: '265 89% 78%',
  glassBackground: '265 89% 78% / 0.1',
  glassBorder: '0 0% 100% / 0.1',
  glassBackdropBlur: '20px',
  success: '135 94% 65%', // Dracula green
  successForeground: '231 15% 18%',
  warning: '65 92% 76%', // Dracula yellow
  warningForeground: '231 15% 18%',
  info: '191 97% 77%', // Dracula cyan
  infoForeground: '231 15% 18%',
};

export const draculaTheme = createTheme(
  'dracula',
  'Dracula',
  'Popular dark theme with purple accents',
  true,
  draculaColors
);

// ============================================
// HIGH CONTRAST THEME (Accessibility)
// ============================================

const highContrastColors: ThemeColors = {
  background: '0 0% 0%',
  foreground: '0 0% 100%',
  card: '0 0% 5%',
  cardForeground: '0 0% 100%',
  popover: '0 0% 5%',
  popoverForeground: '0 0% 100%',
  primary: '60 100% 50%', // Bright yellow
  primaryForeground: '0 0% 0%',
  secondary: '0 0% 15%',
  secondaryForeground: '0 0% 100%',
  muted: '0 0% 15%',
  mutedForeground: '0 0% 75%',
  accent: '180 100% 50%', // Cyan
  accentForeground: '0 0% 0%',
  destructive: '0 100% 50%',
  destructiveForeground: '0 0% 100%',
  border: '0 0% 40%',
  input: '0 0% 20%',
  ring: '60 100% 50%',
  header: '0 0% 5%',
  headerForeground: '0 0% 100%',
  sidebarBackground: '0 0% 0%',
  sidebarForeground: '0 0% 100%',
  sidebarPrimary: '60 100% 50%',
  sidebarPrimaryForeground: '0 0% 0%',
  sidebarAccent: '0 0% 20%',
  sidebarAccentForeground: '0 0% 100%',
  sidebarBorder: '0 0% 40%',
  sidebarRing: '60 100% 50%',
  glassBackground: '0 0% 100% / 0.15',
  glassBorder: '0 0% 100% / 0.4',
  glassBackdropBlur: '0px',
  success: '120 100% 40%',
  successForeground: '0 0% 100%',
  warning: '45 100% 50%',
  warningForeground: '0 0% 0%',
  info: '210 100% 60%',
  infoForeground: '0 0% 100%',
};

export const highContrastTheme = createTheme(
  'high-contrast',
  'High Contrast',
  'High contrast theme for accessibility',
  true,
  highContrastColors
);

// ============================================
// ALL BUILT-IN THEMES
// ============================================

export const builtInThemes: Theme[] = [
  lightTheme,
  darkTheme,
  midnightTheme,
  oceanTheme,
  forestTheme,
  sunsetTheme,
  lavenderTheme,
  roseTheme,
  nordTheme,
  draculaTheme,
  highContrastTheme,
];

// Helper to get theme by ID
export const getThemeById = (id: string): Theme | undefined => {
  return builtInThemes.find(theme => theme.id === id);
};

// Helper to create a custom theme based on existing
export const createCustomTheme = (
  baseTheme: Theme,
  overrides: Partial<ThemeColors>,
  name: string,
  description: string
): Theme => {
  return {
    ...baseTheme,
    id: `custom-${Date.now()}`,
    name,
    description,
    author: 'User',
    isCustom: true,
    colors: {
      ...baseTheme.colors,
      ...overrides,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

// Helper to get themes by type
export const getLightThemes = (): Theme[] => builtInThemes.filter(t => !t.isDark);
export const getDarkThemes = (): Theme[] => builtInThemes.filter(t => t.isDark);
