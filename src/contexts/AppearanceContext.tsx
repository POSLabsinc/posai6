import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";

export type IconStyle = 'Default' | 'Dark';
export type IconSize = 'Default' | 'Small' | 'Medium' | 'Large';

// Advanced customization defaults
const DEFAULT_SELECTION_COLOR = '#F97316'; // orange
const DEFAULT_HOVER_COLOR = '#1C1C1C';
const DEFAULT_SPLASH_BG_COLOR = '#131316';
const DEFAULT_TOP_BAR_COLOR = '#212121';
const DEFAULT_SETTINGS_ICON_COLOR = '';  // empty = use per-icon defaults
const DEFAULT_THEME_COLOR = ''; // empty = no theme applied, use individual defaults

// Derive colors from a theme color
function deriveColorsFromTheme(themeHex: string) {
  if (!themeHex || !/^#[0-9A-Fa-f]{6}$/.test(themeHex)) return null;
  const r = parseInt(themeHex.slice(1, 3), 16);
  const g = parseInt(themeHex.slice(3, 5), 16);
  const b = parseInt(themeHex.slice(5, 7), 16);
  // selection = theme color itself
  const selection = themeHex;
  // hover = very dark version (10% lightness mix with black)
  const hoverR = Math.round(r * 0.15);
  const hoverG = Math.round(g * 0.15);
  const hoverB = Math.round(b * 0.15);
  const hover = `#${hoverR.toString(16).padStart(2,'0')}${hoverG.toString(16).padStart(2,'0')}${hoverB.toString(16).padStart(2,'0')}`;
  // splash = dark version
  const splashR = Math.round(r * 0.08);
  const splashG = Math.round(g * 0.08);
  const splashB = Math.round(b * 0.08);
  const splash = `#${splashR.toString(16).padStart(2,'0')}${splashG.toString(16).padStart(2,'0')}${splashB.toString(16).padStart(2,'0')}`;
  // topBar = slightly dark version
  const topR = Math.round(r * 0.2);
  const topG = Math.round(g * 0.2);
  const topB = Math.round(b * 0.2);
  const topBar = `#${topR.toString(16).padStart(2,'0')}${topG.toString(16).padStart(2,'0')}${topB.toString(16).padStart(2,'0')}`;
  // settingsIcon = theme color
  const settingsIcon = themeHex;
  return { selection, hover, splash, topBar, settingsIcon };
}

interface AppearanceContextType {
  iconStyle: IconStyle;
  setIconStyle: (style: IconStyle) => void;
  iconSize: IconSize;
  setIconSize: (size: IconSize) => void;
  getIconBgColor: (defaultColor: string) => string;
  getIconSizeClass: () => string;
  textSize: number;
  setTextSize: (size: number) => void;
  boldText: boolean;
  setBoldText: (bold: boolean) => void;
  brightness: number;
  setBrightness: (brightness: number) => void;
  // Theme color
  themeColor: string;
  setThemeColor: (c: string) => void;
  applyThemeColor: (hex: string) => void;
  // Advanced customization
  selectionColor: string;
  setSelectionColor: (c: string) => void;
  hoverColor: string;
  setHoverColor: (c: string) => void;
  splashBgColor: string;
  setSplashBgColor: (c: string) => void;
  topBarColor: string;
  setTopBarColor: (c: string) => void;
  settingsIconColor: string;
  setSettingsIconColor: (c: string) => void;
  partnerLogoUrl: string;
  setPartnerLogoUrl: (url: string) => void;
  resetAdvancedCustomization: () => void;
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

const SHARED_DEVICE_ID = "shared";
const DARK_ICON_COLOR = '#212121';
const DEFAULT_TEXT_SIZE = 14;
const MIN_TEXT_SIZE = 12;
const MAX_TEXT_SIZE = 30;
const DEFAULT_BRIGHTNESS = 100;
const MIN_BRIGHTNESS = 30;
const MAX_BRIGHTNESS = 100;

// Helper to load a preference from the database
const loadPreference = async (key: string): Promise<string | null> => {
  const { data } = await (supabase as any)
    .from("user_preferences")
    .select("preference_value")
    .eq("device_id", SHARED_DEVICE_ID)
    .eq("preference_key", key)
    .maybeSingle();
  return data?.preference_value ?? null;
};

// Helper to save a preference to the database
const savePreference = async (key: string, value: string) => {
  await (supabase as any)
    .from("user_preferences")
    .upsert(
      { device_id: SHARED_DEVICE_ID, preference_key: key, preference_value: value },
      { onConflict: "device_id,preference_key" }
    );
};

const iconSizeMap: Record<IconSize, string> = {
  Default: 'w-5 h-5',
  Small: 'w-4 h-4',
  Medium: 'w-6 h-6',
  Large: 'w-7 h-7',
};

const iconContainerSizeMap: Record<IconSize, string> = {
  Default: 'w-9 h-9',
  Small: 'w-8 h-8',
  Medium: 'w-10 h-10',
  Large: 'w-12 h-12',
};

// Apply CSS custom properties for advanced customization
const applyCustomColors = (
  selectionColor: string,
  hoverColor: string,
  topBarColor: string
) => {
  const root = document.documentElement;
  if (selectionColor) {
    root.style.setProperty('--custom-selection-color', selectionColor);
  }
  if (hoverColor) {
    root.style.setProperty('--custom-hover-color', hoverColor);
  }
  if (topBarColor) {
    // Convert hex to HSL for the --header variable
    const hsl = hexToHSL(topBarColor);
    if (hsl) {
      root.style.setProperty('--header', hsl);
    }
  }
};

// Convert hex color to HSL string (without hsl() wrapper, just "H S% L%")
function hexToHSL(hex: string): string | null {
  if (!hex || !hex.startsWith('#')) return null;
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export const AppearanceProvider = ({ children }: { children: ReactNode }) => {
  const [iconStyle, setIconStyle] = useState<IconStyle>(() => {
    const saved = localStorage.getItem('iconStyle');
    return (saved as IconStyle) || 'Default';
  });

  const [iconSize, setIconSize] = useState<IconSize>(() => {
    const saved = localStorage.getItem('iconSize');
    return (saved as IconSize) || 'Small';
  });

  const [textSize, setTextSize] = useState<number>(() => {
    const saved = localStorage.getItem('textSize');
    return saved ? parseInt(saved, 10) : DEFAULT_TEXT_SIZE;
  });

  const [boldText, setBoldText] = useState<boolean>(() => {
    const saved = localStorage.getItem('boldText');
    return saved === 'true';
  });

  const [brightness, setBrightnessState] = useState<number>(() => {
    const saved = localStorage.getItem('brightness');
    return saved ? parseInt(saved, 10) : DEFAULT_BRIGHTNESS;
  });

  // Theme color state
  const [themeColor, setThemeColorState] = useState<string>(() =>
    localStorage.getItem('themeColor') || DEFAULT_THEME_COLOR
  );

  // Advanced customization state
  const [selectionColor, setSelectionColorState] = useState<string>(() =>
    localStorage.getItem('selectionColor') || DEFAULT_SELECTION_COLOR
  );
  const [hoverColor, setHoverColorState] = useState<string>(() =>
    localStorage.getItem('hoverColor') || DEFAULT_HOVER_COLOR
  );
  const [splashBgColor, setSplashBgColorState] = useState<string>(() =>
    localStorage.getItem('splashBgColor') || DEFAULT_SPLASH_BG_COLOR
  );
  const [topBarColor, setTopBarColorState] = useState<string>(() =>
    localStorage.getItem('topBarColor') || DEFAULT_TOP_BAR_COLOR
  );
  const [settingsIconColor, setSettingsIconColorState] = useState<string>(() =>
    localStorage.getItem('settingsIconColor') || DEFAULT_SETTINGS_ICON_COLOR
  );
  const [partnerLogoUrl, setPartnerLogoUrlState] = useState<string>(() =>
    localStorage.getItem('partnerLogoUrl') || ''
  );

  // Hydrate from database on mount (overrides localStorage with DB values)
  useEffect(() => {
    const hydrate = async () => {
      const [dbTextSize, dbBoldText, dbBrightness, dbIconStyle, dbIconSize,
             dbSelectionColor, dbHoverColor, dbSplashBg, dbTopBar, dbSettingsIcon, dbPartnerLogo, dbThemeColor] = await Promise.all([
        loadPreference('textSize'),
        loadPreference('boldText'),
        loadPreference('brightness'),
        loadPreference('iconStyle'),
        loadPreference('iconSize'),
        loadPreference('selectionColor'),
        loadPreference('hoverColor'),
        loadPreference('splashBgColor'),
        loadPreference('topBarColor'),
        loadPreference('settingsIconColor'),
        loadPreference('partnerLogoUrl'),
        loadPreference('themeColor'),
      ]);
      if (dbTextSize) {
        const parsed = parseInt(dbTextSize, 10);
        if (!isNaN(parsed)) { setTextSize(parsed); localStorage.setItem('textSize', dbTextSize); }
      }
      if (dbBoldText !== null) {
        setBoldText(dbBoldText === 'true');
        localStorage.setItem('boldText', dbBoldText);
      }
      if (dbBrightness) {
        const parsed = parseInt(dbBrightness, 10);
        if (!isNaN(parsed)) { setBrightnessState(parsed); localStorage.setItem('brightness', dbBrightness); }
      }
      if (dbIconStyle) {
        setIconStyle(dbIconStyle as IconStyle);
        localStorage.setItem('iconStyle', dbIconStyle);
      }
      if (dbIconSize) {
        setIconSize(dbIconSize as IconSize);
        localStorage.setItem('iconSize', dbIconSize);
      }
      if (dbSelectionColor) {
        setSelectionColorState(dbSelectionColor);
        localStorage.setItem('selectionColor', dbSelectionColor);
      }
      if (dbHoverColor) {
        setHoverColorState(dbHoverColor);
        localStorage.setItem('hoverColor', dbHoverColor);
      }
      if (dbSplashBg) {
        setSplashBgColorState(dbSplashBg);
        localStorage.setItem('splashBgColor', dbSplashBg);
      }
      if (dbTopBar) {
        setTopBarColorState(dbTopBar);
        localStorage.setItem('topBarColor', dbTopBar);
      }
      if (dbSettingsIcon) {
        setSettingsIconColorState(dbSettingsIcon);
        localStorage.setItem('settingsIconColor', dbSettingsIcon);
      }
      if (dbPartnerLogo) {
        setPartnerLogoUrlState(dbPartnerLogo);
        localStorage.setItem('partnerLogoUrl', dbPartnerLogo);
      }
      if (dbThemeColor) {
        setThemeColorState(dbThemeColor);
        localStorage.setItem('themeColor', dbThemeColor);
      }
    };
    hydrate();
  }, []);

  useEffect(() => {
    localStorage.setItem('iconStyle', iconStyle);
    savePreference('iconStyle', iconStyle);
  }, [iconStyle]);

  useEffect(() => {
    localStorage.setItem('iconSize', iconSize);
    savePreference('iconSize', iconSize);
  }, [iconSize]);

  useEffect(() => {
    localStorage.setItem('textSize', textSize.toString());
    savePreference('textSize', textSize.toString());
    const scaleFactor = textSize / DEFAULT_TEXT_SIZE;
    document.documentElement.style.fontSize = `${textSize}px`;
    document.documentElement.style.setProperty('--app-font-size', `${textSize}px`);
    document.documentElement.style.setProperty('--app-font-scale', scaleFactor.toString());
  }, [textSize]);

  useEffect(() => {
    localStorage.setItem('boldText', boldText.toString());
    savePreference('boldText', boldText.toString());
    if (boldText) {
      document.documentElement.classList.add('app-bold-text');
    } else {
      document.documentElement.classList.remove('app-bold-text');
    }
  }, [boldText]);

  useEffect(() => {
    localStorage.setItem('brightness', brightness.toString());
    savePreference('brightness', brightness.toString());
    const brightnessValue = brightness / 100;
    document.body.style.filter = `brightness(${brightnessValue})`;
  }, [brightness]);

  // Advanced customization persistence + live application
  const persistAndApply = (key: string, value: string, setter: (v: string) => void) => {
    setter(value);
    localStorage.setItem(key, value);
    savePreference(key, value);
  };

  const setThemeColor = (c: string) => persistAndApply('themeColor', c, setThemeColorState);
  const setSelectionColor = (c: string) => persistAndApply('selectionColor', c, setSelectionColorState);
  const setHoverColor = (c: string) => persistAndApply('hoverColor', c, setHoverColorState);
  const setSplashBgColor = (c: string) => persistAndApply('splashBgColor', c, setSplashBgColorState);
  const setTopBarColor = (c: string) => persistAndApply('topBarColor', c, setTopBarColorState);
  const setSettingsIconColor = (c: string) => persistAndApply('settingsIconColor', c, setSettingsIconColorState);
  const setPartnerLogoUrl = (url: string) => persistAndApply('partnerLogoUrl', url, setPartnerLogoUrlState);

  // Apply theme color - derives all related colors
  const applyThemeColor = (hex: string) => {
    const derived = deriveColorsFromTheme(hex);
    if (derived) {
      setSelectionColor(derived.selection);
      setHoverColor(derived.hover);
      setSplashBgColor(derived.splash);
      setTopBarColor(derived.topBar);
      setSettingsIconColor(derived.settingsIcon);
    }
  };

  // Apply custom colors to CSS variables
  useEffect(() => {
    applyCustomColors(selectionColor, hoverColor, topBarColor);
  }, [selectionColor, hoverColor, topBarColor]);

  const resetAdvancedCustomization = () => {
    setThemeColor(DEFAULT_THEME_COLOR);
    setSelectionColor(DEFAULT_SELECTION_COLOR);
    setHoverColor(DEFAULT_HOVER_COLOR);
    setSplashBgColor(DEFAULT_SPLASH_BG_COLOR);
    setTopBarColor(DEFAULT_TOP_BAR_COLOR);
    setSettingsIconColor(DEFAULT_SETTINGS_ICON_COLOR);
    setPartnerLogoUrl('');
  };

  // Listen for AI-driven settings updates from SettingsManager
  useEffect(() => {
    const handleSettingsUpdate = (event: CustomEvent) => {
      const { type, data } = event.detail || {};
      if (type === 'appearance' && data) {
        if (data.iconStyle !== undefined) setIconStyle(data.iconStyle);
        if (data.iconSize !== undefined) setIconSize(data.iconSize);
        if (data.textSize !== undefined) setTextSize(data.textSize);
        if (data.boldText !== undefined) setBoldText(data.boldText);
        if (data.brightness !== undefined) setBrightness(data.brightness);
        if (data.themeColor !== undefined) {
          setThemeColor(data.themeColor);
          if (data.themeColor) applyThemeColor(data.themeColor);
        }
      }
    };

    window.addEventListener('settings-updated', handleSettingsUpdate as EventListener);
    return () => {
      window.removeEventListener('settings-updated', handleSettingsUpdate as EventListener);
    };
  }, []);

  const setBrightness = (value: number) => {
    const clampedValue = Math.max(MIN_BRIGHTNESS, Math.min(MAX_BRIGHTNESS, value));
    setBrightnessState(clampedValue);
  };
  const getIconBgColor = (defaultColor: string): string => {
    if (settingsIconColor) return settingsIconColor;
    return iconStyle === 'Dark' ? DARK_ICON_COLOR : defaultColor;
  };

  const getIconSizeClass = (): string => {
    return iconSizeMap[iconSize];
  };

  return (
    <AppearanceContext.Provider
      value={{
        iconStyle,
        setIconStyle,
        iconSize,
        setIconSize,
        getIconBgColor,
        getIconSizeClass,
        textSize,
        setTextSize,
        boldText,
        setBoldText,
        brightness,
        setBrightness,
        themeColor,
        setThemeColor,
        applyThemeColor,
        selectionColor,
        setSelectionColor,
        hoverColor,
        setHoverColor,
        splashBgColor,
        setSplashBgColor,
        topBarColor,
        setTopBarColor,
        settingsIconColor,
        setSettingsIconColor,
        partnerLogoUrl,
        setPartnerLogoUrl,
        resetAdvancedCustomization,
      }}
    >
      {children}
    </AppearanceContext.Provider>
  );
};

export const useAppearance = (): AppearanceContextType => {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error('useAppearance must be used within an AppearanceProvider');
  }
  return context;
};

export { iconContainerSizeMap, iconSizeMap, MIN_TEXT_SIZE, MAX_TEXT_SIZE, DEFAULT_TEXT_SIZE, MIN_BRIGHTNESS, MAX_BRIGHTNESS, DEFAULT_BRIGHTNESS, DEFAULT_SELECTION_COLOR, DEFAULT_HOVER_COLOR, DEFAULT_SPLASH_BG_COLOR, DEFAULT_TOP_BAR_COLOR, DEFAULT_SETTINGS_ICON_COLOR, DEFAULT_THEME_COLOR };
