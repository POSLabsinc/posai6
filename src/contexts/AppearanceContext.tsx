import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";

export type IconStyle = 'Default' | 'Dark';
export type IconSize = 'Default' | 'Small' | 'Medium' | 'Large';

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
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

const DARK_ICON_COLOR = '#212121';
const DEFAULT_TEXT_SIZE = 14; // Default font size in pixels
const MIN_TEXT_SIZE = 12;
const MAX_TEXT_SIZE = 30;
const DEFAULT_BRIGHTNESS = 100; // Default brightness percentage (100 = normal)
const MIN_BRIGHTNESS = 30;
const MAX_BRIGHTNESS = 100;

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

  useEffect(() => {
    localStorage.setItem('iconStyle', iconStyle);
  }, [iconStyle]);

  useEffect(() => {
    localStorage.setItem('iconSize', iconSize);
  }, [iconSize]);

  useEffect(() => {
    localStorage.setItem('textSize', textSize.toString());
    // Apply text size globally by setting the root font-size on html element
    // This affects all rem-based Tailwind sizing since rem is based on html font-size
    const scaleFactor = textSize / DEFAULT_TEXT_SIZE;
    document.documentElement.style.fontSize = `${textSize}px`;
    // Also set CSS variable for components that use it directly
    document.documentElement.style.setProperty('--app-font-size', `${textSize}px`);
    document.documentElement.style.setProperty('--app-font-scale', scaleFactor.toString());
  }, [textSize]);

  useEffect(() => {
    localStorage.setItem('boldText', boldText.toString());
    // Apply bold text globally
    if (boldText) {
      document.documentElement.classList.add('app-bold-text');
    } else {
      document.documentElement.classList.remove('app-bold-text');
    }
  }, [boldText]);

  useEffect(() => {
    localStorage.setItem('brightness', brightness.toString());
    // Apply brightness globally via CSS filter on body
    const brightnessValue = brightness / 100;
    document.body.style.filter = `brightness(${brightnessValue})`;
  }, [brightness]);

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
      }
    };

    window.addEventListener('settings-updated', handleSettingsUpdate as EventListener);
    return () => {
      window.removeEventListener('settings-updated', handleSettingsUpdate as EventListener);
    };
  }, []);

  const setBrightness = (value: number) => {
    // Clamp value between min and max
    const clampedValue = Math.max(MIN_BRIGHTNESS, Math.min(MAX_BRIGHTNESS, value));
    setBrightnessState(clampedValue);
  };
  const getIconBgColor = (defaultColor: string): string => {
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

export { iconContainerSizeMap, iconSizeMap, MIN_TEXT_SIZE, MAX_TEXT_SIZE, DEFAULT_TEXT_SIZE, MIN_BRIGHTNESS, MAX_BRIGHTNESS, DEFAULT_BRIGHTNESS };
