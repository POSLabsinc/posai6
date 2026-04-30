import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, Check, RotateCcw, Trash2, Palette, Monitor, Moon, Droplets, Sparkles, Paintbrush, Pipette } from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { useAppearance, DEFAULT_SELECTION_COLOR, DEFAULT_HOVER_COLOR, DEFAULT_SPLASH_BG_COLOR, DEFAULT_TOP_BAR_COLOR, DEFAULT_SETTINGS_ICON_COLOR, type IconStyle } from "@/contexts/AppearanceContext";
import { toast } from "@/hooks/use-toast";

// --- Color format conversion utilities ---
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9A-Fa-f]{6})$/.exec(hex);
  if (!m) return null;
  return { r: parseInt(m[1].slice(0, 2), 16), g: parseInt(m[1].slice(2, 4), 16), b: parseInt(m[1].slice(4, 6), 16) };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`.toUpperCase();
}

function rgbToCmyk(r: number, g: number, b: number): { c: number; m: number; y: number; k: number } {
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const k = 1 - Math.max(rr, gg, bb);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: Math.round(((1 - rr - k) / (1 - k)) * 100),
    m: Math.round(((1 - gg - k) / (1 - k)) * 100),
    y: Math.round(((1 - bb - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

function cmykToRgb(c: number, m: number, y: number, k: number): { r: number; g: number; b: number } {
  const cc = c / 100, mm = m / 100, yy = y / 100, kk = k / 100;
  return {
    r: Math.round(255 * (1 - cc) * (1 - kk)),
    g: Math.round(255 * (1 - mm) * (1 - kk)),
    b: Math.round(255 * (1 - yy) * (1 - kk)),
  };
}

type ColorMode = 'hex' | 'rgb' | 'cmyk';

// --- Icon style definitions ---
const ICON_STYLES: { id: IconStyle; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'Default', label: 'Default', icon: <Monitor className="w-5 h-5" />, description: 'Colorful system defaults' },
  { id: 'Color', label: 'Color', icon: <Paintbrush className="w-5 h-5" />, description: 'Primary theme color' },
  { id: 'Dark', label: 'Dark', icon: <Moon className="w-5 h-5" />, description: 'Dark monochrome style' },
  { id: 'Clear', label: 'Clear', icon: <Droplets className="w-5 h-5" />, description: 'Transparent backgrounds' },
  { id: 'Tinted', label: 'Tinted', icon: <Sparkles className="w-5 h-5" />, description: 'Theme-tinted backgrounds' },
];

interface SavedTheme {
  id: string;
  name: string;
  themeColor: string;
  savedAt: string;
}

const SAVED_THEMES_KEY = 'pos-saved-themes';

function getSavedThemes(): SavedTheme[] {
  try {
    const stored = localStorage.getItem(SAVED_THEMES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveSavedThemes(themes: SavedTheme[]) {
  localStorage.setItem(SAVED_THEMES_KEY, JSON.stringify(themes));
}

interface ThemeColorContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

export default function ThemeColorContent({ showHeader = false, onBack, onAIClick }: ThemeColorContentProps) {
  const {
    themeColor, setThemeColor, applyThemeColor,
    selectionColor, setSelectionColor,
    hoverColor, setHoverColor,
    splashBgColor, setSplashBgColor,
    topBarColor, setTopBarColor,
    settingsIconColor, setSettingsIconColor,
    iconStyle, setIconStyle,
    resetAdvancedCustomization,
  } = useAppearance();

  const [pickerColor, setPickerColor] = useState(themeColor || "#F97316");
  const [colorMode, setColorMode] = useState<ColorMode>('hex');
  const [hexInput, setHexInput] = useState(themeColor || "#F97316");
  const [rgbInput, setRgbInput] = useState(() => {
    const rgb = hexToRgb(themeColor || "#F97316");
    return rgb || { r: 249, g: 115, b: 22 };
  });
  const [cmykInput, setCmykInput] = useState(() => {
    const rgb = hexToRgb(themeColor || "#F97316");
    return rgb ? rgbToCmyk(rgb.r, rgb.g, rgb.b) : { c: 0, m: 54, y: 91, k: 2 };
  });
  const [savedThemes, setSavedThemes] = useState<SavedTheme[]>(getSavedThemes);

  // Sync all formats when a color is applied
  const syncAllFormats = useCallback((hex: string) => {
    setPickerColor(hex);
    setHexInput(hex.toUpperCase());
    const rgb = hexToRgb(hex);
    if (rgb) {
      setRgbInput(rgb);
      setCmykInput(rgbToCmyk(rgb.r, rgb.g, rgb.b));
    }
  }, []);

  // Preview-only: updates local state without applying to the app
  const previewColor = useCallback((hex: string) => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return;
    syncAllFormats(hex);
  }, [syncAllFormats]);

  // Commit the previewed color to the entire application
  const handleApply = useCallback(() => {
    const hex = pickerColor;
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return;
    setThemeColor(hex);
    applyThemeColor(hex);
    handleSaveTheme(hex);
    toast({ title: "Theme applied", description: `Theme color set to ${hex.toUpperCase()}.` });
  }, [pickerColor, setThemeColor, applyThemeColor]);

  const handlePickerChange = (hex: string) => {
    previewColor(hex);
  };

  const handleHexChange = (val: string) => {
    let v = val.toUpperCase();
    if (!v.startsWith('#')) v = '#' + v;
    setHexInput(v);
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) previewColor(v);
  };

  const handleRgbChange = (channel: 'r' | 'g' | 'b', val: string) => {
    const n = Math.max(0, Math.min(255, parseInt(val) || 0));
    const updated = { ...rgbInput, [channel]: n };
    setRgbInput(updated);
    const hex = rgbToHex(updated.r, updated.g, updated.b);
    previewColor(hex);
  };

  const handleCmykChange = (channel: 'c' | 'm' | 'y' | 'k', val: string) => {
    const n = Math.max(0, Math.min(100, parseInt(val) || 0));
    const updated = { ...cmykInput, [channel]: n };
    setCmykInput(updated);
    const rgb = cmykToRgb(updated.c, updated.m, updated.y, updated.k);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    previewColor(hex);
  };

  const handleResetDefault = () => {
    setThemeColor('');
    resetAdvancedCustomization();
    syncAllFormats('#F97316');
    toast({ title: "Default theme restored", description: "All colors reset to defaults." });
  };

  const handleSaveTheme = useCallback((hex: string) => {
    if (!hex) return;
    // Avoid duplicates of the same color
    const existing = getSavedThemes();
    if (existing.some(t => t.themeColor.toUpperCase() === hex.toUpperCase())) return;
    const name = `Theme ${existing.length + 1}`;
    const newTheme: SavedTheme = { id: crypto.randomUUID(), name, themeColor: hex, savedAt: new Date().toISOString() };
    const updated = [...existing, newTheme];
    saveSavedThemes(updated);
    setSavedThemes(updated);
  }, []);

  const handleLoadTheme = (theme: SavedTheme) => {
    previewColor(theme.themeColor);
    toast({ title: "Theme previewed", description: `"${theme.name}" loaded. Tap Apply to set it.` });
  };

  const handleDeleteTheme = (id: string) => {
    const updated = savedThemes.filter(t => t.id !== id);
    saveSavedThemes(updated);
    setSavedThemes(updated);
    toast({ title: "Theme deleted" });
  };

  const handleDerivedColorChange = (key: string, hex: string) => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return;
    switch (key) {
      case 'selection': setSelectionColor(hex); break;
      case 'hover': setHoverColor(hex); break;
      case 'topBar': setTopBarColor(hex); break;
      case 'splash': setSplashBgColor(hex); break;
      case 'settingsIcon': setSettingsIconColor(hex); break;
    }
  };

  const derivedColors = [
    { key: "selection", label: "Selection Color", value: selectionColor, description: "Active tabs, selected rows" },
    { key: "hover", label: "Hover Color", value: hoverColor, description: "Buttons, list rows, menus" },
    { key: "topBar", label: "Top Bar Background", value: topBarColor, description: "Header bar across screens" },
    { key: "splash", label: "Splash Screen", value: splashBgColor, description: "App launch screen" },
    { key: "settingsIcon", label: "Settings Icon Color", value: settingsIconColor || "Per-icon default", description: "Icon background tint" },
  ];

  const colorModes: { id: ColorMode; label: string }[] = [
    { id: 'hex', label: 'HEX' },
    { id: 'rgb', label: 'RGB' },
    { id: 'cmyk', label: 'CMYK' },
  ];

  const sectionTitleClassName = "text-base font-medium text-neutral-500 mb-2 px-1";

  // Auto-save current theme when leaving the screen (back button or unmount)
  useEffect(() => {
    return () => {
      if (themeColor) handleSaveTheme(themeColor);
    };
  }, [themeColor, handleSaveTheme]);

  const handleBack = () => {
    if (themeColor) handleSaveTheme(themeColor);
    onBack?.();
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {/* Header */}
      <div className="flex items-center justify-between pt-0 pb-2 relative overflow-visible px-4">
        {onBack && (
          <button type="button" onClick={handleBack} className="w-10 h-10 rounded-full bg-surface flex items-center justify-center active:opacity-70 transition-opacity">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
        <h1 className="text-xl font-semibold text-foreground absolute left-1/2 -translate-x-1/2">Theme Color</h1>
      </div>

      <div className="px-4 md:px-6 pb-28 space-y-5">
        {/* Color Picker - 2 column layout */}
        <div>
          <h2 className={sectionTitleClassName}>Color Picker</h2>
          <div className="bg-neutral-800/60 rounded-2xl p-4">
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
              {/* Left: Color Picker (30%) - reduced height */}
              <div className="theme-color-picker theme-color-picker-compact lg:col-span-3">
                <HexColorPicker color={pickerColor} onChange={handlePickerChange} />
              </div>

              {/* Right: Active Theme + Color codes (70%) */}
              <div className="flex flex-col gap-3 lg:col-span-7">
                {/* Current vs Preview */}
                <div className="bg-neutral-700/40 rounded-xl p-3 flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg border-2 border-neutral-600 flex-shrink-0" style={{ backgroundColor: themeColor || '#F97316' }} />
                    <div className="min-w-0">
                      <p className="text-[11px] text-neutral-400 uppercase tracking-wider">Current</p>
                      <p className="text-[11px] text-neutral-300 font-mono uppercase truncate">{themeColor || '#F97316'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg border-2 border-primary flex-shrink-0" style={{ backgroundColor: pickerColor }} />
                    <div className="min-w-0">
                      <p className="text-[11px] text-primary uppercase tracking-wider font-medium">Preview</p>
                      <p className="text-[11px] text-foreground font-mono uppercase truncate">{pickerColor}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const anyWin = window as any;
                      if (anyWin.EyeDropper) {
                        try {
                          const ed = new anyWin.EyeDropper();
                          const res = await ed.open();
                          if (res?.sRGBHex) previewColor(res.sRGBHex.toUpperCase());
                        } catch {}
                      }
                    }}
                    className="w-9 h-9 rounded-lg bg-neutral-700/60 flex items-center justify-center text-neutral-300 hover:text-foreground transition-colors flex-shrink-0"
                    title="Pick color from screen"
                  >
                    <Pipette className="w-4 h-4" />
                  </button>
                </div>

                {/* HEX / RGB / CMYK in a single row with dividers */}
                <div className="bg-neutral-700/40 rounded-xl p-3 flex items-stretch">
                  {/* HEX */}
                  <div className="flex-1 min-w-0 px-2">
                    <p className="text-[11px] text-neutral-400 uppercase font-medium tracking-wider mb-1.5 text-center">Hex</p>
                    <input
                      type="text"
                      value={hexInput.replace('#', '')}
                      onChange={(e) => handleHexChange(e.target.value)}
                      maxLength={6}
                      className="w-full text-sm bg-neutral-700/50 border border-neutral-600 rounded-md px-2 py-1.5 text-foreground font-mono uppercase text-center"
                      placeholder="000000"
                    />
                  </div>

                  <div className="w-px bg-neutral-600/60 mx-1 self-stretch" />

                  {/* RGB */}
                  <div className="flex-[1.4] min-w-0 px-2">
                    <p className="text-[11px] text-neutral-400 uppercase font-medium tracking-wider mb-1.5 text-center">RGB</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['r', 'g', 'b'] as const).map((ch) => (
                        <input
                          key={ch}
                          type="number"
                          min={0}
                          max={255}
                          value={rgbInput[ch]}
                          onChange={(e) => handleRgbChange(ch, e.target.value)}
                          className="w-full text-sm bg-neutral-700/50 border border-neutral-600 rounded-md px-1 py-1.5 text-foreground font-mono text-center"
                          aria-label={ch.toUpperCase()}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="w-px bg-neutral-600/60 mx-1 self-stretch" />

                  {/* CMYK */}
                  <div className="flex-[1.8] min-w-0 px-2">
                    <p className="text-[11px] text-neutral-400 uppercase font-medium tracking-wider mb-1.5 text-center">CMYK</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['c', 'm', 'y', 'k'] as const).map((ch) => (
                        <input
                          key={ch}
                          type="number"
                          min={0}
                          max={100}
                          value={cmykInput[ch]}
                          onChange={(e) => handleCmykChange(ch, e.target.value)}
                          className="w-full text-sm bg-neutral-700/50 border border-neutral-600 rounded-md px-1 py-1.5 text-foreground font-mono text-center"
                          aria-label={ch.toUpperCase()}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Derived Colors */}
        <div>
          <h2 className={sectionTitleClassName}>Derived Colors</h2>
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
            {derivedColors.map((item, idx) => (
              <div key={item.key}>
                <div className="flex items-center justify-between py-2.5 px-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-[11px] text-neutral-500">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-neutral-600 cursor-pointer">
                      <input
                        type="color"
                        value={item.value.startsWith('#') ? item.value : '#000000'}
                        onChange={(e) => handleDerivedColorChange(item.key, e.target.value)}
                        className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                      />
                      <div className="w-full h-full" style={{ backgroundColor: item.value.startsWith('#') ? item.value : '#000000' }} />
                    </div>
                    <span className="text-[11px] text-neutral-400 font-mono uppercase w-[65px] text-center">
                      {item.value.startsWith('#') ? item.value : 'Default'}
                    </span>
                  </div>
                </div>
                {idx < derivedColors.length - 1 && <div className="h-px bg-neutral-700/50 mx-4" />}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1.5 px-1">
            Colors derived from your theme. Click any swatch to customize individually.
          </p>
        </div>

        {/* Saved Themes */}
        <div>
          <h2 className={sectionTitleClassName}>Saved Themes</h2>

          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
            {savedThemes.length === 0 ? (
              <div className="py-6 flex flex-col items-center gap-1.5">
                <Palette className="w-5 h-5 text-neutral-600" />
                <p className="text-[11px] text-neutral-500">No saved themes yet</p>
              </div>
            ) : (
              savedThemes.map((theme, idx) => (
                <div key={theme.id}>
                  <div className="flex items-center justify-between py-2.5 px-4">
                    <button onClick={() => handleLoadTheme(theme)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                      <div className="w-7 h-7 rounded-lg border border-neutral-600 flex-shrink-0" style={{ backgroundColor: theme.themeColor }} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{theme.name}</p>
                        <p className="text-[11px] text-neutral-500 font-mono uppercase">{theme.themeColor}</p>
                      </div>
                    </button>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {themeColor === theme.themeColor && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      <button onClick={() => handleDeleteTheme(theme.id)} className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-neutral-700/50 transition-colors">
                        <Trash2 className="w-3 h-3 text-neutral-500 hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                  {idx < savedThemes.length - 1 && <div className="h-px bg-neutral-700/50 mx-4" />}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button onClick={handleResetDefault} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-neutral-800/60 hover:bg-neutral-700/60 text-sm font-medium text-foreground transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
            Use Default Theme
          </button>
          <button
            onClick={handleApply}
            disabled={(themeColor || '#F97316').toUpperCase() === pickerColor.toUpperCase()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: pickerColor }}
          >
            <Check className="w-3.5 h-3.5" />
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}