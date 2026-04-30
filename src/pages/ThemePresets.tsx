import { ChevronLeft, Check, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useThemePresets, themePresets } from "@/contexts/ThemePresetsContext";
import ThemePresetCard from "@/components/settings/ThemePresetCard";
import { toast } from "@/hooks/use-toast";

const downloadThemes = () => {
  const blob = new Blob([JSON.stringify(themePresets, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pos-theme-presets.json";
  a.click();
  URL.revokeObjectURL(url);
};

const ThemePresets = () => {
  const navigate = useNavigate();
  const { selectedThemeId, setSelectedThemeId, selectedTheme } = useThemePresets();

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-800/50 shrink-0 overflow-visible relative" style={{ minHeight: 56 }}>
        <button
          onClick={() => navigate('/settings/system')}
          className="w-8 h-8 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
        >
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>
        <h1 className="text-xl font-semibold text-foreground absolute left-1/2 -translate-x-1/2">Theme Presets</h1>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide overscroll-contain">
        <div className="p-6">
          {/* Large Preview of Selected Theme */}
          {selectedTheme && (
            <div className="mb-6 flex flex-col items-center">
              <div className="w-full max-w-[320px]">
                <div className="bg-neutral-800/60 rounded-2xl p-3 overflow-hidden mb-4">
                  <ThemePresetCard theme={selectedTheme} size="lg" />
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => toast({ title: "Theme applied", description: `${selectedTheme.name} is now active.` })}
                    className="px-6 h-10 rounded-full bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
                  >
                    Apply
                  </button>
                  <button
                    onClick={downloadThemes}
                    className="flex items-center gap-2 px-4 h-10 rounded-full bg-neutral-800/60 text-foreground text-sm font-medium active:opacity-70 transition-opacity"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* All Themes Section */}
          <div className="mb-4">
            <h2 className="text-neutral-400 text-sm font-medium mb-4">All Themes</h2>
          </div>

          {/* Themes Grid */}
          <div className="bg-neutral-800/60 rounded-2xl p-4">
            <div className="grid grid-cols-2 gap-4">
              {themePresets.map((theme) => {
                const isSelected = selectedThemeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedThemeId(theme.id)}
                    className="text-left"
                  >
                    <div className={`relative rounded-xl overflow-hidden transition-all duration-200 ${
                        isSelected
                          ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-neutral-900'
                          : 'hover:opacity-90'
                      }`}>
                      <ThemePresetCard theme={theme} />
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground mt-2 truncate">{theme.name}</p>
                    <p className="text-xs text-neutral-400 mt-0.5 line-clamp-2">{theme.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemePresets;
