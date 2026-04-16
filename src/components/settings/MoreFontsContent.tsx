import { ChevronLeft, Download, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFont, FontFamily, fontCSSMap, MORE_FONTS } from "@/contexts/FontContext";
import { toast } from "sonner";

interface MoreFontsContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const MoreFontsContent = ({ showHeader = true, onBack, onAIClick }: MoreFontsContentProps) => {
  const navigate = useNavigate();
  const { downloadedFonts, downloadFont } = useFont();

  const sansSerif = MORE_FONTS.filter(f => f.category === 'Sans Serif');
  const serif = MORE_FONTS.filter(f => f.category === 'Serif');

  const isDownloaded = (font: FontFamily) => downloadedFonts.includes(font);

  const handleDownload = (font: FontFamily) => {
    if (!isDownloaded(font)) {
      downloadFont(font);
      toast.success(`${font} has been downloaded`);
    }
  };

  const renderFontRow = (font: { name: FontFamily; category: string }, isLast: boolean) => {
    const downloaded = isDownloaded(font.name);
    return (
      <div key={font.name}>
        <button
          onClick={() => handleDownload(font.name)}
          disabled={downloaded}
          className="flex items-center justify-between w-full py-3.5 px-5 active:opacity-70 transition-opacity disabled:opacity-100"
        >
          <span
            className="text-lg font-medium text-foreground"
            style={{ fontFamily: fontCSSMap[font.name] }}
          >
            {font.name}
          </span>
          {downloaded ? (
            <Check className="w-5 h-5 text-white" />
          ) : (
            <Download className="w-5 h-5 text-blue-500" />
          )}
        </button>
        {!isLast && <div className="h-px bg-neutral-700/50 mx-5" />}
      </div>
    );
  };

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
          <h1 className="text-xl font-semibold text-foreground absolute left-1/2 -translate-x-1/2">More Fonts</h1>
        </div>
      )}

      <div className={`${showHeader ? 'pt-0' : 'pt-0'} px-6 pb-28`}>
        <p className="text-sm text-neutral-400 mb-6 px-1">
          Tap on a font to download it. Downloaded fonts will appear in My Fonts.
        </p>

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

export default MoreFontsContent;
