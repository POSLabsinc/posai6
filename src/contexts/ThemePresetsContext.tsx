import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { ThemeStyle } from '@/components/settings/ThemePresetCard';

export interface ThemePreset extends ThemeStyle {}

export const themePresets: ThemePreset[] = [
  {
    id: 'theme-aurora',
    name: 'POS Glass',
    description: 'Floating glassmorphism panels with a vibrant violet to teal gradient halo.',
    variant: 'aurora',
    bg: 'radial-gradient(circle at 20% 20%, #2a1a4d 0%, #0f0f1f 60%)',
    surface: 'rgba(255,255,255,0.08)',
    accent: '#A78BFA',
    accent2: '#22D3EE',
    text: '#F5F3FF',
    muted: 'rgba(255,255,255,0.18)',
  },
  {
    id: 'theme-midnight',
    name: 'Midnight Operator',
    description: 'High contrast sidebar layout tuned for low-light, fast-paced kitchens.',
    variant: 'midnight',
    bg: '#0B0B10',
    surface: '#1A1A24',
    accent: '#F97316',
    accent2: '#FACC15',
    text: '#FFFFFF',
    muted: '#2D2D3A',
  },
  {
    id: 'theme-sunset',
    name: 'Sunset Bistro',
    description: 'Warm coral and amber palette with rounded pill tabs for casual dining.',
    variant: 'sunset',
    bg: 'linear-gradient(160deg, #2A1410 0%, #1A0E0C 100%)',
    surface: '#3A1F1A',
    accent: '#FB7185',
    accent2: '#F59E0B',
    text: '#FFE4E1',
    muted: '#4A2A24',
  },
  {
    id: 'theme-forest',
    name: 'Forest Calm',
    description: 'Earthy green accordion stack designed for wellness and farm-to-table venues.',
    variant: 'forest',
    bg: '#0F1A14',
    surface: '#1B2A22',
    accent: '#34D399',
    accent2: '#84CC16',
    text: '#ECFDF5',
    muted: '#2A3D32',
  },
  {
    id: 'theme-royal',
    name: 'Royal Velvet',
    description: 'Deep indigo with stacked 3D cards for an upscale, immersive ordering feel.',
    variant: 'royal',
    bg: 'linear-gradient(135deg, #1E1B4B 0%, #0F0E2C 100%)',
    surface: '#2E2A6B',
    accent: '#C4B5FD',
    accent2: '#F0ABFC',
    text: '#FFFFFF',
    muted: '#3A3680',
  },
  {
    id: 'theme-crimson',
    name: 'Crimson Express',
    description: 'Bold red pill drawer with grid tiles for high-volume quick service flow.',
    variant: 'crimson',
    bg: '#140A0A',
    surface: '#241313',
    accent: '#EF4444',
    accent2: '#F97316',
    text: '#FEE2E2',
    muted: '#3A1E1E',
  },
  {
    id: 'theme-mono',
    name: 'Mono Minimal',
    description: 'Stripped down monochrome list view focused on text clarity and speed.',
    variant: 'mono',
    bg: '#000000',
    surface: '#0F0F0F',
    accent: '#FFFFFF',
    accent2: '#A3A3A3',
    text: '#FFFFFF',
    muted: '#262626',
  },
  {
    id: 'theme-ocean',
    name: 'Ocean Breeze',
    description: 'Cool cyan two-tier tabs for breezy, beachside menu navigation.',
    variant: 'ocean',
    bg: 'linear-gradient(180deg, #0C1E2E 0%, #061520 100%)',
    surface: '#13334A',
    accent: '#38BDF8',
    accent2: '#14B8A6',
    text: '#E0F2FE',
    muted: '#1E4258',
  },
  {
    id: 'theme-candy',
    name: 'Candy Pop',
    description: 'Playful magenta and lime grid built for cafés, dessert bars and kiosks.',
    variant: 'candy',
    bg: '#1A0A1F',
    surface: '#2A1232',
    accent: '#EC4899',
    accent2: '#A3E635',
    text: '#FDF4FF',
    muted: '#3D1B47',
  },
  {
    id: 'theme-platinum',
    name: 'Platinum Light',
    description: 'Clean light mode with subtle slate accents for daytime retail counters.',
    variant: 'platinum',
    bg: '#F4F5F7',
    surface: '#FFFFFF',
    accent: '#0F172A',
    accent2: '#64748B',
    text: '#0F172A',
    muted: '#E2E8F0',
  },
];

interface ThemePresetsContextType {
  selectedThemeId: string;
  setSelectedThemeId: (id: string) => void;
  selectedTheme: ThemePreset | undefined;
}

const ThemePresetsContext = createContext<ThemePresetsContextType | undefined>(undefined);

const STORAGE_KEY = 'pos-theme-preset';

export const ThemePresetsProvider = ({ children }: { children: ReactNode }) => {
  const [selectedThemeId, setSelectedThemeIdState] = useState<string>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    // Migrate legacy ids to the new default
    const valid = themePresets.some(t => t.id === stored);
    return valid ? (stored as string) : 'theme-aurora';
  });

  const setSelectedThemeId = (id: string) => {
    setSelectedThemeIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const selectedTheme = themePresets.find(t => t.id === selectedThemeId);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored !== selectedThemeId && themePresets.some(t => t.id === stored)) {
      setSelectedThemeIdState(stored);
    }
  }, []);

  return (
    <ThemePresetsContext.Provider value={{ selectedThemeId, setSelectedThemeId, selectedTheme }}>
      {children}
    </ThemePresetsContext.Provider>
  );
};

export const useThemePresets = () => {
  const context = useContext(ThemePresetsContext);
  if (!context) {
    throw new Error('useThemePresets must be used within a ThemePresetsProvider');
  }
  return context;
};
