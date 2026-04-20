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
  const [saveName, setSaveName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);

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

  const applyColor = useCallback((hex: string) => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return;
    setThemeColor(hex);
    applyThemeColor(hex);
    syncAllFormats(hex);
  }, [setThemeColor, applyThemeColor, syncAllFormats]);

  const handlePickerChange = (hex: string) => {
    applyColor(hex);
  };

  const handleHexChange = (val: string) => {
    let v = val.toUpperCase();
    if (!v.startsWith('#')) v = '#' + v;
    setHexInput(v);
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) applyColor(v);
  };

  const handleRgbChange = (channel: 'r' | 'g' | 'b', val: string) => {
    const n = Math.max(0, Math.min(255, parseInt(val) || 0));
    const updated = { ...rgbInput, [channel]: n };
    setRgbInput(updated);
    const hex = rgbToHex(updated.r, updated.g, updated.b);
    applyColor(hex);
  };

  const handleCmykChange = (channel: 'c' | 'm' | 'y' | 'k', val: string) => {
    const n = Math.max(0, Math.min(100, parseInt(val) || 0));
    const updated = { ...cmykInput, [channel]: n };
    setCmykInput(updated);
    const rgb = cmykToRgb(updated.c, updated.m, updated.y, updated.k);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    applyColor(hex);
  };

  const handleResetDefault = () => {
    setThemeColor('');
    resetAdvancedCustomization();
    syncAllFormats('#F97316');
    toast({ title: "Default theme restored", description: "All colors reset to defaults." });
  };

  const handleSaveTheme = () => {
    if (!themeColor) {
      toast({ title: "No theme to save", description: "Please select a theme color first.", variant: "destructive" });
      return;
    }
    const name = saveName.trim() || `Theme ${savedThemes.length + 1}`;
    const newTheme: SavedTheme = { id: crypto.randomUUID(), name, themeColor, savedAt: new Date().toISOString() };
    const updated = [...savedThemes, newTheme];
    saveSavedThemes(updated);
    setSavedThemes(updated);
    setSaveName("");
    setShowSaveInput(false);
    toast({ title: "Theme saved", description: `"${name}" has been saved.` });
  };

  const handleLoadTheme = (theme: SavedTheme) => {
    applyColor(theme.themeColor);
    toast({ title: "Theme loaded", description: `"${theme.name}" applied.` });
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

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {/* Header */}
      <div className="flex items-center justify-between pt-0 pb-2 relative overflow-visible px-4">
        {onBack && (
          <button type="button" onClick={onBack} className="w-10 h-10 rounded-full bg-surface flex items-center justify-center active:opacity-70 transition-opacity">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
        <h1 className="text-xl font-semibold text-foreground absolute left-1/2 -translate-x-1/2">Theme Color</h1>
      </div>

      <div className="px-6 pb-28 space-y-5">
        {/* Active Theme Indicator */}
        {themeColor && (
          <div className="bg-neutral-800/60 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border-2 border-neutral-600" style={{ backgroundColor: themeColor }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Active Theme</p>
              <p className="text-[11px] text-neutral-400 font-mono uppercase">{themeColor}</p>
            </div>
            <Check className="w-4 h-4 text-emerald-400" />
          </div>
        )}

        {/* Compact Color Picker */}
        <div>
          <p className="text-xs font-medium text-neutral-500 mb-1 px-1 uppercase tracking-wider">Color Picker</p>
          <div className="bg-neutral-800/60 rounded-2xl p-4 space-y-3">
            {/* Compact gradient picker + hue slider */}
            <div className="theme-color-picker">
              <HexColorPicker color={pickerColor} onChange={handlePickerChange} />
            </div>

            {/* Eyedropper + swatch + hue gradient row (visual only) */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={async () => {
                  const anyWin = window as any;
                  if (anyWin.EyeDropper) {
                    try {
                      const ed = new anyWin.EyeDropper();
                      const res = await ed.open();
                      if (res?.sRGBHex) applyColor(res.sRGBHex.toUpperCase());
                    } catch {}
                  }
                }}
                className="w-8 h-8 rounded-lg bg-neutral-700/60 flex items-center justify-center text-neutral-300 hover:text-foreground transition-colors flex-shrink-0"
                title="Pick color from screen"
              >
                <Pipette className="w-4 h-4" />
              </button>
              <div className="w-8 h-8 rounded-full border border-neutral-600 flex-shrink-0" style={{ backgroundColor: pickerColor }} />
            </div>

            {/* HEX / RGB / CMYK in a single row */}
            <div className="grid grid-cols-8 gap-2">
              {/* HEX (2 cols) */}
              <div className="col-span-2">
                <input
                  type="text"
                  value={hexInput.replace('#', '')}
                  onChange={(e) => handleHexChange(e.target.value)}
                  maxLength={6}
                  className="w-full text-xs bg-neutral-700/50 border border-neutral-600 rounded-md px-2 py-1.5 text-foreground font-mono uppercase text-center"
                  placeholder="000000"
                />
                <p className="text-[9px] text-neutral-500 uppercase font-medium mt-1 text-center tracking-wider">HEX</p>
              </div>
              {/* RGB (3 cols) */}
              {(['r', 'g', 'b'] as const).map((ch) => (
                <div key={ch} className="col-span-1">
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={rgbInput[ch]}
                    onChange={(e) => handleRgbChange(ch, e.target.value)}
                    className="w-full text-xs bg-neutral-700/50 border border-neutral-600 rounded-md px-1 py-1.5 text-foreground font-mono text-center"
                  />
                  <p className="text-[9px] text-neutral-500 uppercase font-medium mt-1 text-center tracking-wider">{ch}</p>
                </div>
              ))}
              {/* CMYK (could overflow on small) */}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(['c', 'm', 'y', 'k'] as const).map((ch) => (
                <div key={ch}>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={cmykInput[ch]}
                    onChange={(e) => handleCmykChange(ch, e.target.value)}
                    className="w-full text-xs bg-neutral-700/50 border border-neutral-600 rounded-md px-1 py-1.5 text-foreground font-mono text-center"
                  />
                  <p className="text-[9px] text-neutral-500 uppercase font-medium mt-1 text-center tracking-wider">{ch}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>

        {/* Derived Colors */}
        <div>
          <p className="text-xs font-medium text-neutral-500 mb-1 px-1 uppercase tracking-wider">Derived Colors</p>
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
          <p className="text-xs font-medium text-neutral-500 mb-1 px-1 uppercase tracking-wider">Saved Themes</p>

          {showSaveInput && (
            <div className="bg-neutral-800/60 rounded-2xl p-4 mb-3">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Theme name (optional)"
                  className="flex-1 text-sm bg-neutral-700/50 border border-neutral-600 rounded-xl px-3 py-2 text-foreground placeholder:text-neutral-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTheme()}
                />
                <button onClick={handleSaveTheme} className="px-4 py-2 rounded-xl bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors">
                  Save
                </button>
                <button onClick={() => { setShowSaveInput(false); setSaveName(""); }} className="px-3 py-2 rounded-xl bg-neutral-700/50 text-sm text-neutral-400 hover:text-foreground transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

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
        <div className="flex items-center">
          <button onClick={handleResetDefault} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-neutral-800/60 hover:bg-neutral-700/60 text-sm font-medium text-foreground transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
            Use Default Theme
          </button>
        </div>
      </div>
    </div>
  );
}