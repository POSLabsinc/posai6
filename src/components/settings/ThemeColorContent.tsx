import { useState } from "react";
import { ChevronLeft, Check, RotateCcw, Palette } from "lucide-react";
import { useAppearance, DEFAULT_SELECTION_COLOR, DEFAULT_HOVER_COLOR, DEFAULT_SPLASH_BG_COLOR, DEFAULT_TOP_BAR_COLOR, DEFAULT_SETTINGS_ICON_COLOR } from "@/contexts/AppearanceContext";
import { toast } from "@/hooks/use-toast";

const PRESET_COLORS = [
  { label: "Orange", hex: "#F97316" },
  { label: "Blue", hex: "#3B82F6" },
  { label: "Green", hex: "#22C55E" },
  { label: "Purple", hex: "#8B5CF6" },
  { label: "Red", hex: "#EF4444" },
  { label: "Pink", hex: "#EC4899" },
  { label: "Teal", hex: "#14B8A6" },
  { label: "Amber", hex: "#F59E0B" },
  { label: "Indigo", hex: "#6366F1" },
  { label: "Cyan", hex: "#06B6D4" },
  { label: "Rose", hex: "#F43F5E" },
  { label: "Emerald", hex: "#10B981" },
];

interface ThemeColorContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

export default function ThemeColorContent({ showHeader = true, onBack }: ThemeColorContentProps) {
  const {
    themeColor, setThemeColor, applyThemeColor,
    selectionColor, hoverColor, splashBgColor, topBarColor, settingsIconColor,
    setSelectionColor, setHoverColor, setSplashBgColor, setTopBarColor, setSettingsIconColor,
    resetAdvancedCustomization,
  } = useAppearance();

  const [customPickerColor, setCustomPickerColor] = useState(themeColor || "#F97316");

  const handlePresetSelect = (hex: string) => {
    setThemeColor(hex);
    applyThemeColor(hex);
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

  const derivedColors = [
    { label: "Selection Color", value: selectionColor, description: "Active tabs, selected rows" },
    { label: "Hover Color", value: hoverColor, description: "Buttons, list rows, menus" },
    { label: "Top Bar Background", value: topBarColor, description: "Header bar across screens" },
    { label: "Splash Screen", value: splashBgColor, description: "App launch screen" },
    { label: "Settings Icon Color", value: settingsIconColor || "Per-icon default", description: "Icon background tint" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 pt-4 pb-8 max-w-2xl mx-auto">
        {showHeader && (
          <div className="flex items-center justify-between mb-8 relative" style={{ minHeight: 40 }}>
            <button
              type="button"
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity z-10"
            >
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <h1 className="text-base font-medium text-foreground absolute left-1/2 -translate-x-1/2">Theme Color</h1>
          </div>
        )}

        {/* Current Theme Indicator */}
        {themeColor && (
          <div className="bg-neutral-800/60 rounded-2xl p-4 mb-6 flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl border-2 border-neutral-600"
              style={{ backgroundColor: themeColor }}
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Active Theme</p>
              <p className="text-xs text-neutral-400 font-mono uppercase">{themeColor}</p>
            </div>
            <Check className="w-5 h-5 text-emerald-400" />
          </div>
        )}

        {/* Preset Colors */}
        <div className="mb-6">
          <p className="text-xs font-medium text-neutral-500 mb-3 px-1 uppercase tracking-wider">Preset Colors</p>
          <div className="bg-neutral-800/60 rounded-2xl p-4">
            <div className="grid grid-cols-6 gap-3">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.hex}
                  onClick={() => handlePresetSelect(preset.hex)}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div
                    className={`w-10 h-10 rounded-xl border-2 transition-all ${
                      themeColor === preset.hex
                        ? "border-white scale-110 shadow-lg"
                        : "border-neutral-600 hover:border-neutral-400 hover:scale-105"
                    }`}
                    style={{ backgroundColor: preset.hex }}
                  >
                    {themeColor === preset.hex && (
                      <div className="w-full h-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white drop-shadow" />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-400 group-hover:text-neutral-300">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Color */}
        <div className="mb-6">
          <p className="text-xs font-medium text-neutral-500 mb-3 px-1 uppercase tracking-wider">Custom Color</p>
          <div className="bg-neutral-800/60 rounded-2xl p-4">
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-neutral-600 cursor-pointer flex-shrink-0">
                <input
                  type="color"
                  value={customPickerColor}
                  onChange={(e) => handleCustomColor(e.target.value)}
                  className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                />
                <div className="w-full h-full" style={{ backgroundColor: customPickerColor }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1">Pick a color</p>
                <input
                  type="text"
                  value={customPickerColor}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (!val.startsWith('#')) val = '#' + val;
                    handleCustomColor(val);
                  }}
                  maxLength={7}
                  className="w-[100px] text-xs bg-neutral-700/50 border border-neutral-600 rounded-lg px-2 py-1.5 text-foreground font-mono text-center uppercase"
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

        {/* Derived Colors */}
        <div className="mb-6">
          <p className="text-xs font-medium text-neutral-500 mb-3 px-1 uppercase tracking-wider">Derived Colors</p>
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
            {derivedColors.map((item, idx) => (
              <div key={item.label}>
                <div className="flex items-center justify-between py-3 px-5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-neutral-500">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div
                      className="w-8 h-8 rounded-lg border-2 border-neutral-600"
                      style={{ backgroundColor: item.value.startsWith('#') ? item.value : '#000000' }}
                    />
                    <span className="text-xs text-neutral-400 font-mono uppercase w-[70px] text-center">
                      {item.value.startsWith('#') ? item.value : 'Default'}
                    </span>
                  </div>
                </div>
                {idx < derivedColors.length - 1 && <div className="h-px bg-neutral-700/50 mx-5" />}
              </div>
            ))}
          </div>
          <p className="text-xs text-neutral-500 mt-2 px-1">
            These colors are derived from your theme. You can override them individually in Advanced Customization.
          </p>
        </div>

        {/* Preview */}
        <div className="mb-6">
          <p className="text-xs font-medium text-neutral-500 mb-3 px-1 uppercase tracking-wider">Preview</p>
          <div className="bg-neutral-800/60 rounded-2xl p-4">
            <div
              className="h-10 rounded-xl flex items-center px-4 mb-3 transition-colors duration-200"
              style={{ backgroundColor: topBarColor }}
            >
              <div className="w-6 h-6 rounded-full bg-white/20" />
              <div className="flex-1 flex justify-center">
                <div className="w-20 h-3 rounded bg-white/30" />
              </div>
              <div className="w-6 h-6 rounded-full bg-white/20" />
            </div>
            <div className="flex gap-2 mb-3">
              <div
                className="flex-1 h-9 rounded-xl flex items-center justify-center text-xs text-white font-medium transition-colors duration-200"
                style={{ backgroundColor: selectionColor }}
              >
                Selected
              </div>
              <div
                className="flex-1 h-9 rounded-xl flex items-center justify-center text-xs text-neutral-300 font-medium border border-neutral-600 transition-colors duration-200"
                style={{ backgroundColor: hoverColor }}
              >
                Hover
              </div>
              <div className="flex-1 h-9 rounded-xl flex items-center justify-center text-xs text-neutral-500 font-medium bg-neutral-700/30">
                Default
              </div>
            </div>
            <div
              className="h-16 rounded-xl flex items-center justify-center transition-colors duration-200"
              style={{ backgroundColor: splashBgColor }}
            >
              <div className="w-14 h-7 rounded bg-white/10" />
            </div>
          </div>
        </div>

        {/* Use Default Theme */}
        <button
          onClick={handleResetDefault}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-neutral-800/60 hover:bg-neutral-700/60 text-sm font-medium text-foreground transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Use Default Theme
        </button>
      </div>
    </div>
  );
}
