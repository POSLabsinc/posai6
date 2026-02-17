import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Theme preview images
import theme1 from '@/assets/theme-previews/theme-1.png';
import theme2 from '@/assets/theme-previews/theme-2.png';
import theme3 from '@/assets/theme-previews/theme-3.png';
import theme4 from '@/assets/theme-previews/theme-4.png';
import theme5 from '@/assets/theme-previews/theme-5.png';
import theme6 from '@/assets/theme-previews/theme-6.png';
import theme7 from '@/assets/theme-previews/theme-7.png';
import theme8 from '@/assets/theme-previews/theme-8.png';
import theme9 from '@/assets/theme-previews/theme-9.png';
import theme10 from '@/assets/theme-previews/theme-10.png';
import theme11 from '@/assets/theme-previews/theme-11.png';
import theme12 from '@/assets/theme-previews/theme-12.png';
import theme13 from '@/assets/theme-previews/theme-13.png';
import theme14 from '@/assets/theme-previews/theme-14.png';
import theme15 from '@/assets/theme-previews/theme-15.png';
import theme16 from '@/assets/theme-previews/theme-16.png';

export interface ThemePreset {
  id: string;
  name: string;
  preview: string;
}

export const themePresets: ThemePreset[] = [
  { id: 'theme-1', name: 'Floating Panels', preview: theme1 },
  { id: 'theme-2', name: 'Glass Accordion', preview: theme2 },
  { id: 'theme-3', name: 'Sidebar Navigation', preview: theme3 },
  { id: 'theme-4', name: 'Two-Tier Glass Tabs', preview: theme4 },
  { id: 'theme-5', name: 'Floating Tab Bar', preview: theme5 },
  { id: 'theme-6', name: 'Glass Category Cards', preview: theme6 },
  { id: 'theme-7', name: '3D Card Stack', preview: theme7 },
  { id: 'theme-8', name: 'Glass Pill Drawer', preview: theme8 },
  { id: 'theme-9', name: 'Morphing Panel', preview: theme9 },
  { id: 'theme-10', name: 'Vertical Accordion', preview: theme10 },
  { id: 'theme-11', name: 'Two-Row Horizontal Tabs', preview: theme11 },
  { id: 'theme-12', name: 'Card-Based Grid', preview: theme12 },
  { id: 'theme-13', name: 'Expandable Category Grid', preview: theme13 },
  { id: 'theme-14', name: 'Multi-Row Category Tabs', preview: theme14 },
  { id: 'theme-15', name: 'Food Truck Sidebar', preview: theme15 },
  { id: 'theme-16', name: 'Bar Menu Collapsible', preview: theme16 },
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
    return stored || 'theme-5'; // Default to Floating Tab Bar (theme-5)
  });

  const setSelectedThemeId = (id: string) => {
    setSelectedThemeIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const selectedTheme = themePresets.find(t => t.id === selectedThemeId);

  // Sync with localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored !== selectedThemeId) {
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
