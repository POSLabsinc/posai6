import { useState } from "react";
import { ChevronLeft, Check, RotateCcw, Palette, Save, Trash2 } from "lucide-react";
import { useAppearance, DEFAULT_SELECTION_COLOR, DEFAULT_HOVER_COLOR, DEFAULT_SPLASH_BG_COLOR, DEFAULT_TOP_BAR_COLOR, DEFAULT_SETTINGS_ICON_COLOR } from "@/contexts/AppearanceContext";
import { toast } from "@/hooks/use-toast";

const PRESET_COLORS = [
  "#F97316", "#FF6B35", "#E85D04", "#EF4444", "#F43F5E", "#DC2626",
  "#FF0040", "#EC4899", "#D946EF", "#A855F7", "#8B5CF6", "#7C3AED",
  "#6366F1", "#4F46E5", "#3B82F6", "#2563EB", "#0EA5E9", "#06B6D4",
  "#14B8A6", "#10B981", "#22C55E", "#84CC16", "#F59E0B", "#FBBF24",
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
  } catch {
    return [];
  }
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
    resetAdvancedCustomization,
  } = useAppearance();

  const [customPickerColor, setCustomPickerColor] = useState(themeColor || "#F97316");
  const [savedThemes, setSavedThemes] = useState<SavedTheme[]>(getSavedThemes);
  const [saveName, setSaveName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);

  const handlePresetSelect = (hex: string) => {
    setThemeColor(hex);
    applyThemeColor(hex);
    setCustomPickerColor(hex);
    toast({ title: "Theme applied", description: `Theme color set to ${hex}` });
  };

  const handleCustomColor = (hex: string) => {
    setCustomPickerColor(hex);
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      setThemeColor(hex);
      applyThemeColor(hex);
    }
  };

  const handleResetDefault = () => {
    setThemeColor('');
    resetAdvancedCustomization();
    toast({ title: "Default theme restored", description: "All colors reset to defaults." });
  };

  const handleSaveTheme = () => {
    if (!themeColor) {
      toast({ title: "No theme to save", description: "Please select a theme color first.", variant: "destructive" });
      return;
    }
    const name = saveName.trim() || `Theme ${savedThemes.length + 1}`;
    const newTheme: SavedTheme = {
      id: crypto.randomUUID(),
      name,
      themeColor,
      savedAt: new Date().toISOString(),
    };
    const updated = [...savedThemes, newTheme];
    saveSavedThemes(updated);
    setSavedThemes(updated);
    setSaveName("");
    setShowSaveInput(false);
    toast({ title: "Theme saved", description: `"${name}" has been saved.` });
  };

  const handleLoadTheme = (theme: SavedTheme) => {
    setThemeColor(theme.themeColor);
    applyThemeColor(theme.themeColor);
    setCustomPickerColor(theme.themeColor);
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

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {/* Header - center-aligned title with back arrow, matching Appearance screen */}
      <div className="flex items-center justify-between pt-0 pb-2 relative overflow-visible px-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-surface flex items-center justify-center active:opacity-70 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
        <h1 className="text-base font-medium text-foreground absolute left-1/2 -translate-x-1/2">Theme Color</h1>
      </div>

      <div className="px-6 pb-28 space-y-5">
        {/* Active Theme Indicator */}
        {themeColor && (
          <div className="bg-neutral-800/60 rounded-2xl p-4 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl border-2 border-neutral-600"
              style={{ backgroundColor: themeColor }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Active Theme</p>
              <p className="text-[11px] text-neutral-400 font-mono uppercase">{themeColor}</p>
            </div>
            <Check className="w-4 h-4 text-emerald-400" />
          </div>
        )}

        {/* Preset Colors */}
        <div>
          <p className="text-xs font-medium text-neutral-500 mb-2 px-1 uppercase tracking-wider">Preset Colors</p>
          <div className="bg-neutral-800/60 rounded-2xl p-3">
            <div className="grid grid-cols-8 gap-2">
              {PRESET_COLORS.map((hex) => (
                <button
                  key={hex}
                  onClick={() => handlePresetSelect(hex)}
                  className="aspect-square rounded-lg border-2 transition-all relative"
                  style={{
                    backgroundColor: hex,
                    borderColor: themeColor === hex ? '#ffffff' : 'transparent',
                    transform: themeColor === hex ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  {themeColor === hex && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white drop-shadow" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Color */}
        <div>
          <p className="text-xs font-medium text-neutral-500 mb-2 px-1 uppercase tracking-wider">Custom Color</p>
          <div className="bg-neutral-800/60 rounded-2xl p-4">
            <div className="flex items-center gap-4">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-neutral-600 cursor-pointer flex-shrink-0">
                <input
                  type="color"
                  value={customPickerColor}
                  onChange={(e) => handleCustomColor(e.target.value)}
                  className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                />
                <div className="w-full h-full" style={{ backgroundColor: customPickerColor }} />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={customPickerColor}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (!val.startsWith('#')) val = '#' + val;
                    handleCustomColor(val);
                  }}
                  maxLength={7}
                  className="w-[90px] text-xs bg-neutral-700/50 border border-neutral-600 rounded-lg px-2 py-1.5 text-foreground font-mono text-center uppercase"
                  placeholder="#000000"
                />
              </div>
              <button
                onClick={() => handlePresetSelect(customPickerColor)}
                className="px-4 py-2 rounded-xl bg-neutral-700/50 hover:bg-neutral-600/50 text-sm text-foreground font-medium transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Derived Colors - clickable with color pickers */}
        <div>
          <p className="text-xs font-medium text-neutral-500 mb-2 px-1 uppercase tracking-wider">Derived Colors</p>
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
                      <div
                        className="w-full h-full"
                        style={{ backgroundColor: item.value.startsWith('#') ? item.value : '#000000' }}
                      />
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
          <p className="text-xs font-medium text-neutral-500 mb-2 px-1 uppercase tracking-wider">Saved Themes</p>

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
                <button
                  onClick={handleSaveTheme}
                  className="px-4 py-2 rounded-xl bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => { setShowSaveInput(false); setSaveName(""); }}
                  className="px-3 py-2 rounded-xl bg-neutral-700/50 text-sm text-neutral-400 hover:text-foreground transition-colors"
                >
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
                    <button
                      onClick={() => handleLoadTheme(theme)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <div
                        className="w-7 h-7 rounded-lg border border-neutral-600 flex-shrink-0"
                        style={{ backgroundColor: theme.themeColor }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{theme.name}</p>
                        <p className="text-[11px] text-neutral-500 font-mono uppercase">{theme.themeColor}</p>
                      </div>
                    </button>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {themeColor === theme.themeColor && (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <button
                        onClick={() => handleDeleteTheme(theme.id)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-neutral-700/50 transition-colors"
                      >
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

        {/* Action Buttons - side by side */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDefault}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-neutral-800/60 hover:bg-neutral-700/60 text-sm font-medium text-foreground transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Use Default Theme
          </button>
          <button
            onClick={() => setShowSaveInput(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            Save Current Theme
          </button>
        </div>
      </div>
    </div>
  );
}
