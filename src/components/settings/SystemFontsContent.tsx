import { ChevronLeft, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFont, FontFamily, fontCSSMap, SYSTEM_FONTS } from "@/contexts/FontContext";

interface SystemFontsContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const SystemFontsContent = ({ showHeader = true, onBack, onAIClick }: SystemFontsContentProps) => {
  const navigate = useNavigate();
  const { fontFamily, setFontFamily } = useFont();

  const sansSerif = SYSTEM_FONTS.filter(f => f.category === 'Sans Serif' || f.category === 'System');
  const serif = SYSTEM_FONTS.filter(f => f.category === 'Serif');

  const renderFontRow = (font: { name: FontFamily; category: string }, isLast: boolean) => (
    <div key={font.name}>
      <button
        onClick={() => setFontFamily(font.name)}
        className="flex items-center justify-between w-full py-3.5 px-5 active:opacity-70 transition-opacity"
      >
        <span
          className="text-lg font-medium text-foreground"
          style={{ fontFamily: fontCSSMap[font.name] }}
        >
          {font.name}
        </span>
        {fontFamily === font.name && (
          <Check className="w-5 h-5 text-white" />
        )}
      </button>
      {!isLast && <div className="h-px bg-neutral-700/50 mx-5" />}
    </div>
  );

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {showHeader && (
        <div className="flex items-center justify-between pt-0 pb-2 relative overflow-visible px-4">
          {onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          )}
          <h1 className="text-xl font-semibold text-foreground absolute left-1/2 -translate-x-1/2">System Fonts</h1>
        </div>
      )}

      <div className={`${showHeader ? 'pt-0' : 'pt-0'} px-6 pb-28`}>
        {/* Preview */}
        <div className="bg-neutral-800/60 rounded-2xl p-5 mb-6">
          <p className="text-lg text-foreground leading-relaxed" style={{ fontFamily: fontCSSMap[fontFamily] }}>
            The quick brown fox jumps over the lazy dog. 0123456789
          </p>
          <p className="text-sm text-neutral-500 mt-2">
            Current: <span className="text-neutral-300">{fontFamily}</span>
          </p>
        </div>

        <h2 className="text-sm font-semibold text-neutral-400 tracking-wider mb-3 px-1">Sans Serif</h2>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-6">
          {sansSerif.map((font, i) => renderFontRow(font, i === sansSerif.length - 1))}
        </div>

        <h2 className="text-sm font-semibold text-neutral-400 tracking-wider mb-3 px-1">Serif</h2>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-6">
          {serif.map((font, i) => renderFontRow(font, i === serif.length - 1))}
        </div>
      </div>
    </div>
  );
};

export default SystemFontsContent;
