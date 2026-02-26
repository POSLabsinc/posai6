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
  | 'Space Grotesk'
  | 'Oswald'
  | 'Quicksand'
  | 'Cabin'
  | 'Josefin Sans'
  | 'Libre Baskerville'
  | 'Crimson Text'
  | 'Bitter'
  | 'Karla'
  | 'Work Sans'
  | 'Fira Sans';

export interface FontOption {
  name: FontFamily;
  category: 'System' | 'Sans Serif' | 'Serif';
}

export const SYSTEM_FONTS: FontOption[] = [
  { name: 'System Default', category: 'System' },
  { name: 'Inter', category: 'Sans Serif' },
  { name: 'Roboto', category: 'Sans Serif' },
  { name: 'Open Sans', category: 'Sans Serif' },
  { name: 'Lato', category: 'Sans Serif' },
  { name: 'Montserrat', category: 'Sans Serif' },
  { name: 'Poppins', category: 'Sans Serif' },
  { name: 'Nunito', category: 'Sans Serif' },
  { name: 'Raleway', category: 'Sans Serif' },
  { name: 'DM Sans', category: 'Sans Serif' },
  { name: 'Space Grotesk', category: 'Sans Serif' },
  { name: 'Source Sans 3', category: 'Sans Serif' },
  { name: 'PT Sans', category: 'Sans Serif' },
  { name: 'IBM Plex Sans', category: 'Sans Serif' },
  { name: 'Merriweather', category: 'Serif' },
  { name: 'Playfair Display', category: 'Serif' },
];

export const MORE_FONTS: FontOption[] = [
  { name: 'Oswald', category: 'Sans Serif' },
  { name: 'Quicksand', category: 'Sans Serif' },
  { name: 'Cabin', category: 'Sans Serif' },
  { name: 'Josefin Sans', category: 'Sans Serif' },
  { name: 'Karla', category: 'Sans Serif' },
  { name: 'Work Sans', category: 'Sans Serif' },
  { name: 'Fira Sans', category: 'Sans Serif' },
  { name: 'Libre Baskerville', category: 'Serif' },
  { name: 'Crimson Text', category: 'Serif' },
  { name: 'Bitter', category: 'Serif' },
];

interface FontContextType {
  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;
  downloadedFonts: FontFamily[];
  downloadFont: (font: FontFamily) => void;
  removeFont: (font: FontFamily) => void;
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
  'Oswald': '"Oswald", sans-serif',
  'Quicksand': '"Quicksand", sans-serif',
  'Cabin': '"Cabin", sans-serif',
  'Josefin Sans': '"Josefin Sans", sans-serif',
  'Libre Baskerville': '"Libre Baskerville", serif',
  'Crimson Text': '"Crimson Text", serif',
  'Bitter': '"Bitter", serif',
  'Karla': '"Karla", sans-serif',
  'Work Sans': '"Work Sans", sans-serif',
  'Fira Sans': '"Fira Sans", sans-serif',
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
  'Oswald': 'https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&display=swap',
  'Quicksand': 'https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap',
  'Cabin': 'https://fonts.googleapis.com/css2?family=Cabin:wght@400;500;600;700&display=swap',
  'Josefin Sans': 'https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;500;600;700&display=swap',
  'Libre Baskerville': 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap',
  'Crimson Text': 'https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&display=swap',
  'Bitter': 'https://fonts.googleapis.com/css2?family=Bitter:wght@300;400;500;600;700&display=swap',
  'Karla': 'https://fonts.googleapis.com/css2?family=Karla:wght@300;400;500;600;700&display=swap',
  'Work Sans': 'https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700&display=swap',
  'Fira Sans': 'https://fonts.googleapis.com/css2?family=Fira+Sans:wght@300;400;500;600;700&display=swap',
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

  const [downloadedFonts, setDownloadedFonts] = useState<FontFamily[]>(() => {
    const saved = localStorage.getItem('downloadedFonts');
    return saved ? JSON.parse(saved) : [];
  });

  const downloadFont = (font: FontFamily) => {
    loadGoogleFont(font);
    setDownloadedFonts((prev) => {
      const updated = [...prev, font];
      localStorage.setItem('downloadedFonts', JSON.stringify(updated));
      return updated;
    });
  };

  const removeFont = (font: FontFamily) => {
    if (fontFamily === font) {
      setFontFamily('System Default');
    }
    setDownloadedFonts((prev) => {
      const updated = prev.filter((f) => f !== font);
      localStorage.setItem('downloadedFonts', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    localStorage.setItem('fontFamily', fontFamily);
    loadGoogleFont(fontFamily);
    document.documentElement.style.fontFamily = fontCSSMap[fontFamily];
  }, [fontFamily]);

  useEffect(() => {
    downloadedFonts.forEach((font) => loadGoogleFont(font));
  }, [downloadedFonts]);

  return (
    <FontContext.Provider value={{ fontFamily, setFontFamily, downloadedFonts, downloadFont, removeFont }}>
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
