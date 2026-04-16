import { ChevronLeft, Check, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFont, FontFamily, fontCSSMap } from "@/contexts/FontContext";

interface MyFontsContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const MyFontsContent = ({ showHeader = true, onBack, onAIClick }: MyFontsContentProps) => {
  const navigate = useNavigate();
  const { fontFamily, setFontFamily, downloadedFonts, removeFont } = useFont();

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {showHeader && (
        <div className="flex items-center justify-between py-2 relative overflow-visible px-4">
          {onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          )}
          <h1 className="text-xl font-semibold text-foreground absolute left-1/2 -translate-x-1/2">My Fonts</h1>
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

        {downloadedFonts.length === 0 ? (
          <div className="bg-neutral-800/60 rounded-2xl p-6 text-center">
            <p className="text-neutral-400 text-base">No fonts added yet.</p>
            <p className="text-neutral-500 text-sm mt-1">
              Download fonts from the More Fonts section to see them here.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-sm font-semibold text-neutral-400 tracking-wider mb-3 px-1">Downloaded Fonts</h2>
            <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-6">
              {downloadedFonts.map((font, i) => (
                <div key={font}>
                  <div className="flex items-center justify-between w-full py-3.5 px-5">
                    <button
                      onClick={() => setFontFamily(font)}
                      className="flex-1 text-left active:opacity-70 transition-opacity"
                    >
                      <span
                        className="text-lg font-medium text-foreground"
                        style={{ fontFamily: fontCSSMap[font] }}
                      >
                        {font}
                      </span>
                    </button>
                    <div className="flex items-center gap-3">
                      {fontFamily === font && (
                        <Check className="w-5 h-5 text-white" />
                      )}
                      <button
                        onClick={() => removeFont(font)}
                        className="w-8 h-8 rounded-full flex items-center justify-center active:opacity-70 transition-opacity hover:bg-neutral-700/50"
                      >
                        <Trash2 className="w-4 h-4 text-neutral-400" />
                      </button>
                    </div>
                  </div>
                  {i < downloadedFonts.length - 1 && <div className="h-px bg-neutral-700/50 mx-5" />}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyFontsContent;
