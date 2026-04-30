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

interface ThemePresetsContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}
const ThemePresetsContent = ({
  showHeader = true,
  onBack,
  onAIClick
}: ThemePresetsContentProps) => {
  const navigate = useNavigate();
  const {
    selectedThemeId,
    setSelectedThemeId,
    selectedTheme
  } = useThemePresets();
  return <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {/* Header */}
      {showHeader && <div className="flex items-center justify-between pt-0 pb-2 relative overflow-visible px-4">
          {onBack && <button onClick={onBack} className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>}
          <h1 className="text-xl font-semibold text-foreground absolute left-1/2 -translate-x-1/2">Theme Presets</h1>
        </div>}

      {/* Content */}
      <div className="p-6">
        {/* Large Preview of Selected Theme */}
        {selectedTheme && (
          <div className="mb-6 flex flex-col items-center">
            <div className="w-full max-w-[420px]">
              <div className="rounded-2xl overflow-hidden mb-4">
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
                  className="flex items-center gap-2 px-5 h-10 rounded-full bg-surface text-foreground text-sm font-medium hover:bg-surface/80 transition-opacity"
                >
                  <Download className="w-4 h-4" />
                  Download Themes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* All Themes Section */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-neutral-400 tracking-wider mb-1">All Themes</h2>
        </div>

        {/* Themes Grid */}
        <div className="bg-neutral-800/60 rounded-2xl p-4">
          <div className="grid grid-cols-3 gap-4">
            {themePresets.map(theme => {
              const isSelected = selectedThemeId === theme.id;
              return <button key={theme.id} onClick={() => setSelectedThemeId(theme.id)} className="text-left">
                  <div className={`relative rounded-xl overflow-hidden transition-all duration-200 ${isSelected ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-neutral-900' : 'hover:opacity-90'}`}>
                    <ThemePresetCard theme={theme} />
                    {isSelected && <div className="absolute top-2 right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>}
                  </div>
                  <p className="text-sm font-medium text-foreground mt-2 truncate">{theme.name}</p>
                  <p className="text-xs text-neutral-400 mt-0.5 line-clamp-2">{theme.description}</p>
                </button>;
            })}
          </div>
        </div>
      </div>
    </div>;
};
export default ThemePresetsContent;
