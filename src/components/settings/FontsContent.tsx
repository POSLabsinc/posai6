import { ChevronLeft, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useFont, FontFamily, fontCSSMap } from "@/contexts/FontContext";

const FONT_OPTIONS: { name: FontFamily; category: string }[] = [
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

interface FontsContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const FontsContent = ({ showHeader = true, onBack, onAIClick }: FontsContentProps) => {
  const navigate = useNavigate();
  const { fontFamily, setFontFamily } = useFont();

  // Group fonts by category
  const sansSerif = FONT_OPTIONS.filter(f => f.category === 'Sans Serif' || f.category === 'System');
  const serif = FONT_OPTIONS.filter(f => f.category === 'Serif');

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
          <Check className="w-5 h-5 text-blue-500" />
        )}
      </button>
      {!isLast && <div className="h-px bg-neutral-700/50 mx-5" />}
    </div>
  );

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {showHeader && (
        <div className="flex items-center justify-between py-4 relative overflow-visible px-4">
          {onBack && (
            <button
              onClick={onBack}
              className="w-8 h-8 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
          )}
          <h1 className="text-base font-medium text-foreground absolute left-1/2 -translate-x-1/2">Fonts</h1>
          <div className="overflow-visible flex items-center justify-center" style={{ width: 32, height: 32 }}>
            <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />
          </div>
        </div>
      )}

      <div className="pt-6 px-6 pb-28">
        {/* Preview */}
        <div className="bg-neutral-800/60 rounded-2xl p-5 mb-6">
          <p
            className="text-lg text-foreground leading-relaxed"
            style={{ fontFamily: fontCSSMap[fontFamily] }}
          >
            The quick brown fox jumps over the lazy dog. 0123456789
          </p>
          <p className="text-sm text-neutral-500 mt-2">
            Current: <span className="text-neutral-300">{fontFamily}</span>
          </p>
        </div>

        {/* Sans Serif */}
        <h2 className="text-base font-medium text-neutral-500 mb-3 px-1">Sans Serif</h2>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-6">
          {sansSerif.map((font, i) => renderFontRow(font, i === sansSerif.length - 1))}
        </div>

        {/* Serif */}
        <h2 className="text-base font-medium text-neutral-500 mb-3 px-1">Serif</h2>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-6">
          {serif.map((font, i) => renderFontRow(font, i === serif.length - 1))}
        </div>
      </div>
    </div>
  );
};

export default FontsContent;
