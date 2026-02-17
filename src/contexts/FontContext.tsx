import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type FontFamily = 
  | 'System Default'
  | 'Inter'
  | 'Roboto'
  | 'Open Sans'
  | 'Lato'
  | 'Montserrat'
  | 'Poppins'
  | 'Nunito'
  | 'Raleway'
  | 'Source Sans 3'
  | 'PT Sans'
  | 'Merriweather'
  | 'Playfair Display'
  | 'IBM Plex Sans'
  | 'DM Sans'
  | 'Space Grotesk';

interface FontContextType {
  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;
}

const FontContext = createContext<FontContextType | undefined>(undefined);

const fontCSSMap: Record<FontFamily, string> = {
  'System Default': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  'Inter': '"Inter", sans-serif',
  'Roboto': '"Roboto", sans-serif',
  'Open Sans': '"Open Sans", sans-serif',
  'Lato': '"Lato", sans-serif',
  'Montserrat': '"Montserrat", sans-serif',
  'Poppins': '"Poppins", sans-serif',
  'Nunito': '"Nunito", sans-serif',
  'Raleway': '"Raleway", sans-serif',
  'Source Sans 3': '"Source Sans 3", sans-serif',
  'PT Sans': '"PT Sans", sans-serif',
  'Merriweather': '"Merriweather", serif',
  'Playfair Display': '"Playfair Display", serif',
  'IBM Plex Sans': '"IBM Plex Sans", sans-serif',
  'DM Sans': '"DM Sans", sans-serif',
  'Space Grotesk': '"Space Grotesk", sans-serif',
};

const googleFontUrls: Partial<Record<FontFamily, string>> = {
  'Inter': 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'Roboto': 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
  'Open Sans': 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap',
  'Lato': 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap',
  'Montserrat': 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap',
  'Poppins': 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
  'Nunito': 'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700&display=swap',
  'Raleway': 'https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&display=swap',
  'Source Sans 3': 'https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700&display=swap',
  'PT Sans': 'https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap',
  'Merriweather': 'https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap',
  'Playfair Display': 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap',
  'IBM Plex Sans': 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap',
  'DM Sans': 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap',
  'Space Grotesk': 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap',
};

// Load a Google Font dynamically
const loadGoogleFont = (fontFamily: FontFamily) => {
  const url = googleFontUrls[fontFamily];
  if (!url) return;
  
  const existingLink = document.querySelector(`link[data-font="${fontFamily}"]`);
  if (existingLink) return;
  
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  link.setAttribute('data-font', fontFamily);
  document.head.appendChild(link);
};

export const FontProvider = ({ children }: { children: ReactNode }) => {
  const [fontFamily, setFontFamily] = useState<FontFamily>(() => {
    const saved = localStorage.getItem('fontFamily');
    return (saved as FontFamily) || 'System Default';
  });

  useEffect(() => {
    localStorage.setItem('fontFamily', fontFamily);
    loadGoogleFont(fontFamily);
    document.documentElement.style.fontFamily = fontCSSMap[fontFamily];
  }, [fontFamily]);

  return (
    <FontContext.Provider value={{ fontFamily, setFontFamily }}>
      {children}
    </FontContext.Provider>
  );
};

export const useFont = (): FontContextType => {
  const context = useContext(FontContext);
  if (!context) {
    throw new Error('useFont must be used within a FontProvider');
  }
  return context;
};

export { fontCSSMap };
