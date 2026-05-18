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

// Returns '#000000' or '#FFFFFF' depending on which has better contrast on the given hex
function getContrastText(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#FFFFFF';
  // Relative luminance per WCAG
  const toLin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const L = 0.2126 * toLin(rgb.r) + 0.7152 * toLin(rgb.g) + 0.0722 * toLin(rgb.b);
  return L > 0.5 ? '#000000' : '#FFFFFF';
}

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

const MAX_SAVED_THEMES = 5;

const MATCHED_PREVIEW_PANEL_HEIGHT = 'lg:h-[470px]';

function getSavedThemes(): SavedTheme[] {
  try {
    const stored = localStorage.getItem(SAVED_THEMES_KEY);
    const parsed: SavedTheme[] = stored ? JSON.parse(stored) : [];
    // Enforce max of 5 saved themes (newest first)
    return parsed.slice(0, MAX_SAVED_THEMES);
  } catch { return []; }
}

function saveSavedThemes(themes: SavedTheme[]) {
  const trimmed = themes.slice(0, MAX_SAVED_THEMES);
  localStorage.setItem(SAVED_THEMES_KEY, JSON.stringify(trimmed));
}

interface ThemeColorContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

/**
 * Mini POS preview mirroring the live New Order screen 1:1, tinted by the
 * picker's accent color. Render-only: does NOT mutate global theme state.
 */
function ThemePreviewMini({ accent }: { accent: string }) {
  const bg = '#0f0f10';
  const headerBg = '#1a1a1a';
  const sidebarBg = '#141416';
  const mainBg = '#131316';
  const cartBg = '#141416';
  const cardBg = '#1f2937';
  const divider = '#27272a';
  const textOnDark = '#ffffff';
  const mutedOnDark = '#a1a1aa';
  const subPillBorder = '#3f3f46';
  const onAccent = getContrastText(accent);

  // Category pill stroke colors, mirroring the live New Order screen.
  // First (active) pill uses the live accent so the preview reacts to the picker.
  const catColors = [
    accent,    // Starters (active, filled)
    '#f97316', // Mains
    '#22d3ee', // Sides
    '#eab308', // Desserts
    '#22c55e', // Drinks
    '#d946ef', // Specials
    '#e5e7eb', // Platters
    '#3b82f6', // Combos
  ];

  const Pill = ({ color, filled = false, w, h = 6 }: { color: string; filled?: boolean; w: number; h?: number }) => (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 999,
        background: filled ? color : 'transparent',
        border: `0.6px solid ${color}`,
        flexShrink: 0,
      }}
    />
  );

  return (
    <div
      className="w-full h-full min-h-0 rounded-xl overflow-hidden border border-neutral-700 relative"
      style={{ background: bg }}
    >
      <div
        className="absolute top-1 right-1 z-10 rounded-md px-1.5 py-0.5 text-[8px] font-bold leading-none"
        style={{ background: accent, color: onAccent }}
      >
        Aa
      </div>
      <div className="w-full h-full flex flex-col" style={{ fontSize: 0 }}>
        {/* ===== Top header bar ===== */}
        <div
          className="flex items-center justify-between px-[3px]"
          style={{ background: headerBg, height: '9%', minHeight: 10 }}
        >
          <div className="flex items-center gap-[2px]">
            <div style={{ width: 3, height: 3, background: mutedOnDark, borderRadius: 0.5 }} />
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3f3f46' }} />
            <div style={{ width: 14, height: 2, background: textOnDark, borderRadius: 0.5 }} />
            <div style={{ width: 8, height: 3, background: 'transparent', border: `0.5px solid ${mutedOnDark}`, borderRadius: 1 }} />
            <div style={{ width: 18, height: 2, background: mutedOnDark, borderRadius: 0.5, marginLeft: 2 }} />
          </div>
          <div className="flex items-center gap-[2px]">
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: i === 4 ? accent : '#3f3f46' }} />
            ))}
            <div style={{ width: 8, height: 2, background: textOnDark, borderRadius: 0.5, marginLeft: 1 }} />
          </div>
        </div>

        {/* ===== Body ===== */}
        <div className="flex-1 flex min-w-0 min-h-0">
          {/* Left sidebar */}
          <div
            className="flex flex-col items-center justify-between py-[3px]"
            style={{ background: sidebarBg, width: '5%', minWidth: 12 }}
          >
            <div className="flex flex-col items-center gap-[3px]">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: i === 2 ? 1.5 : 1,
                    background: i === 3 ? accent : '#3f3f46',
                    border: i === 3 ? `0.5px solid ${accent}` : 'none',
                    opacity: i === 3 ? 1 : 0.7,
                  }}
                />
              ))}
            </div>
            <div style={{ width: 6, height: 4, borderRadius: '50%', background: '#3f3f46' }} />
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col min-w-0" style={{ background: mainBg }}>
            {/* Category pills row */}
            <div className="flex items-center gap-[2px] px-[3px] pt-[3px]">
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#27272a', flexShrink: 0 }} />
              {catColors.map((color, i) => (
                <Pill key={i} color={color} filled={i === 0} w={i === 0 ? 16 : 13} h={6} />
              ))}
              <div style={{ flex: 1 }} />
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#27272a', flexShrink: 0 }} />
            </div>

            {/* Sub-category row */}
            <div className="flex items-center gap-[2px] px-[3px] pt-[2px]">
              <div style={{ width: 6, flexShrink: 0 }} />
              <Pill color={accent} w={11} h={5} />
              <Pill color={subPillBorder} w={12} h={5} />
            </div>

            <div style={{ height: 0.5, background: divider, margin: '3px 4px 0' }} />

            {/* Product grid */}
            <div className="flex-1 px-[3px] pt-[2px] overflow-hidden">
              <div className="grid gap-[2px]" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                {[...Array(13)].map((_, i) => {
                  const hasBadge = i === 1 || i === 5;
                  return (
                    <div
                      key={i}
                      className="flex items-center"
                      style={{
                        background: cardBg,
                        border: '0.5px solid transparent',
                        height: 10,
                        borderRadius: 2,
                        padding: '0 1px 0 2px',
                        gap: 1,
                      }}
                    >
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <div style={{ height: 1.5, background: '#d4d4d8', borderRadius: 0.5, width: '80%' }} />
                        {i % 3 === 0 && (
                          <div style={{ height: 1.5, background: '#d4d4d8', borderRadius: 0.5, width: '45%' }} />
                        )}
                      </div>
                      {hasBadge && (
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: accent, flexShrink: 0 }} />
                      )}
                      <div style={{ width: 7, height: 1.5, background: '#d4d4d8', borderRadius: 0.5, flexShrink: 0 }} />
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          background: accent,
                          borderRadius: 1.5,
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <div style={{ position: 'relative', width: 4, height: 4 }}>
                          <div style={{ position: 'absolute', left: 0, top: '45%', width: '100%', height: 0.8, background: onAccent, borderRadius: 0.5 }} />
                          <div style={{ position: 'absolute', top: 0, left: '45%', width: 0.8, height: '100%', background: onAccent, borderRadius: 0.5 }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right cart panel */}
          <div
            className="flex flex-col"
            style={{ background: cartBg, width: '26%', borderLeft: `0.5px solid ${divider}` }}
          >
            <div className="flex items-center justify-between px-[2px] pt-[3px]">
              <div style={{ width: 14, height: 2, background: mutedOnDark, borderRadius: 0.5 }} />
              <div style={{ width: 12, height: 2, background: mutedOnDark, borderRadius: 0.5 }} />
            </div>

            <div className="flex gap-[1px] px-[2px] mt-[2px]">
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ flex: 1, height: 4, background: '#1f1f23', borderRadius: 1 }} />
              ))}
              <div style={{ width: 3, height: 4, background: '#1f1f23', borderRadius: 1 }} />
            </div>

            <div className="flex items-center justify-between px-[2px] mt-[3px]">
              <div style={{ width: 14, height: 4, background: '#1f1f23', borderRadius: 1 }} />
              <div style={{ width: 12, height: 2, background: mutedOnDark, borderRadius: 0.5 }} />
            </div>

            <div style={{ height: 0.5, background: divider, margin: '3px 2px 0' }} />

            <div className="flex-1 flex flex-col items-center justify-center gap-[3px]">
              <div style={{ width: 14, height: 10, background: 'transparent', border: `0.7px solid ${mutedOnDark}`, borderRadius: 1.5 }} />
              <div style={{ width: 26, height: 2, background: mutedOnDark, borderRadius: 0.5 }} />
            </div>

            {/* Bottom accent bar (totals/CTA) */}
            <div className="px-[2px] pb-[2px]">
              <div style={{ height: 4, background: accent, borderRadius: 1, width: '100%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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

  // Commit the previewed color (and contrast-aware text color) to the entire application
  const handleApply = useCallback(() => {
    const hex = pickerColor;
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return;
    const onAccent = getContrastText(hex);
    setThemeColor(hex);
    applyThemeColor(hex);
    // Expose contrast text color globally so primary surfaces can pick it up
    try {
      document.documentElement.style.setProperty('--theme-on-primary', onAccent);
    } catch {}
    handleSaveTheme(hex);
    toast({ title: "Theme applied", description: `Theme color set to ${hex.toUpperCase()} with ${onAccent === '#FFFFFF' ? 'light' : 'dark'} text.` });
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
    // Keep only the last 5 saved themes (newest first)
    const updated = [newTheme, ...existing].slice(0, 5);
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
        {/* Color Picker - Preview (left) + Picker & codes (right) */}
        <div>
          <h2 className={sectionTitleClassName}>Color Picker</h2>
          <div className="bg-neutral-800/60 rounded-2xl p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
              {/* LEFT: Preview screen + Apply Theme */}
              <div className={`flex flex-col justify-end gap-4 w-full ${MATCHED_PREVIEW_PANEL_HEIGHT}`}>
                <div className="bg-neutral-700/40 rounded-xl p-3 flex-1 min-h-0 flex flex-col">
                  <p className="text-[11px] text-neutral-400 uppercase font-medium tracking-wider mb-2 text-center">Preview Screen</p>
                  <div className="flex-1 min-h-0">
                    <ThemePreviewMini accent={pickerColor} />
                  </div>
                </div>
                <button
                  onClick={handleApply}
                  disabled={(themeColor || '#F97316').toUpperCase() === pickerColor.toUpperCase()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: pickerColor, color: getContrastText(pickerColor) }}
                >
                  <Check className="w-3.5 h-3.5" />
                  Apply Theme
                </button>
              </div>

              {/* RIGHT: Color picker + Current/Preview + HEX/RGB/CMYK */}
              <div className={`flex flex-col justify-end gap-4 w-full ${MATCHED_PREVIEW_PANEL_HEIGHT}`}>
                <div className="theme-color-picker theme-color-picker-wide">
                  <HexColorPicker color={pickerColor} onChange={handlePickerChange} />
                </div>

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

                {/* HEX / RGB / CMYK */}
                <div className="bg-neutral-700/40 rounded-xl p-3 flex items-stretch">
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

                  <div className="flex-[1.4] min-w-0 px-2">
                    <p className="text-[11px] text-neutral-400 uppercase font-medium tracking-wider mb-1.5 text-center">RGB</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['r', 'g', 'b'] as const).map((ch) => (
                        <input
                          key={ch}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={3}
                          value={rgbInput[ch]}
                          onChange={(e) => handleRgbChange(ch, e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full text-sm bg-neutral-700/50 border border-neutral-600 rounded-md px-1 py-1.5 text-foreground font-mono text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          aria-label={ch.toUpperCase()}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="w-px bg-neutral-600/60 mx-1 self-stretch" />

                  <div className="flex-[1.8] min-w-0 px-2">
                    <p className="text-[11px] text-neutral-400 uppercase font-medium tracking-wider mb-1.5 text-center">CMYK</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['c', 'm', 'y', 'k'] as const).map((ch) => (
                        <input
                          key={ch}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={3}
                          value={cmykInput[ch]}
                          onChange={(e) => handleCmykChange(ch, e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full text-sm bg-neutral-700/50 border border-neutral-600 rounded-md px-1 py-1.5 text-foreground font-mono text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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

      </div>
    </div>
  );
}