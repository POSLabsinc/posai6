import { ChevronLeft, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useThemePresets, themePresets } from "@/contexts/ThemePresetsContext";

// Theme descriptions for the preview section
const themeDescriptions: Record<string, string> = {
  'theme-1': 'Elegant floating panels with glassmorphism effects for a modern POS experience.',
  'theme-2': 'Accordion-style navigation with frosted glass aesthetics.',
  'theme-3': 'Classic sidebar layout for efficient category navigation.',
  'theme-4': 'Dual-tier tabs with glass styling for organized menus.',
  'theme-5': 'Floating tab bar with smooth transitions and clean design.',
  'theme-6': 'Category cards with glass effects for visual hierarchy.',
  'theme-7': 'Stacked 3D cards for an immersive menu experience.',
  'theme-8': 'Pill-shaped drawer with frosted glass styling.',
  'theme-9': 'Dynamic morphing panels for fluid navigation.',
  'theme-10': 'Vertical accordion layout for space-efficient browsing.',
  'theme-11': 'Horizontal tabs across two rows for quick access.',
  'theme-12': 'Grid-based cards for visual menu exploration.',
  'theme-13': 'Expandable grid categories for compact organization.',
  'theme-14': 'Multi-row tabs for extensive category support.',
  'theme-15': 'Compact sidebar designed for food truck operations.',
  'theme-16': 'Collapsible bar menu for streamlined ordering.',
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
        {/* Large Preview of Selected Theme - 600px max width on desktop */}
        {selectedTheme && <div className="mb-6 mx-[120px]">
            <div className="w-full max-w-[600px]">
              <div className="rounded-2xl overflow-hidden mb-3">
                <img src={selectedTheme.preview} alt={selectedTheme.name} className="w-full h-auto rounded-xl object-cover" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">{selectedTheme.name}</h3>
              <p className="text-sm text-neutral-400">{themeDescriptions[selectedTheme.id]}</p>
            </div>
          </div>}

        {/* All Themes Section */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-neutral-400 tracking-wider mb-3">All Themes</h2>
        </div>

        {/* Themes Grid */}
        <div className="bg-neutral-800/60 rounded-2xl p-4">
          <div className="grid grid-cols-3 gap-4">
            {themePresets.map(theme => {
            const isSelected = selectedThemeId === theme.id;
            return <button key={theme.id} onClick={() => setSelectedThemeId(theme.id)} className="text-left">
                  <div className={`relative rounded-xl overflow-hidden transition-all duration-200 ${isSelected ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-neutral-900' : 'hover:opacity-80'}`}>
                    <img src={theme.preview} alt={theme.name} className="w-full aspect-[16/10] object-cover" />
                  {isSelected && <div className="absolute top-2 right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>}
                  </div>
                  <p className="text-sm text-neutral-300 mt-2 truncate">{theme.name}</p>
                </button>;
          })}
          </div>
        </div>
      </div>
    </div>;
};
export default ThemePresetsContent;