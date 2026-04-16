import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FontsContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
  onNavigate?: (path: string) => void;
}

const FontsContent = ({ showHeader = true, onBack, onAIClick, onNavigate }: FontsContentProps) => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
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
          <h1 className="text-xl font-semibold text-foreground absolute left-1/2 -translate-x-1/2">Fonts</h1>
        </div>
      )}

      <div className={`${showHeader ? 'pt-0' : 'pt-0'} px-6 pb-28`}>
        {/* System Fonts & My Fonts */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-1.5">
          <button
            onClick={() => handleNavigate('/settings/system/fonts/system')}
            className="flex items-center justify-between w-full py-3.5 px-5 active:opacity-70 transition-opacity"
          >
            <span className="text-lg font-medium text-foreground">System Fonts</span>
            <ChevronRight className="w-5 h-5 text-neutral-500" />
          </button>
          <div className="h-px bg-neutral-700/50 mx-5" />
          <button
            onClick={() => handleNavigate('/settings/system/fonts/my-fonts')}
            className="flex items-center justify-between w-full py-3.5 px-5 active:opacity-70 transition-opacity"
          >
            <span className="text-lg font-medium text-foreground">My Fonts</span>
            <ChevronRight className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
        <p className="text-xs text-neutral-500 mb-6 px-1">
          View fonts that come pre-installed to use with your device, as well as fonts you have added.
        </p>

        {/* More Fonts */}
        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-1.5">
          <button
            onClick={() => handleNavigate('/settings/system/fonts/more')}
            className="flex items-center justify-between w-full py-3.5 px-5 active:opacity-70 transition-opacity"
          >
            <span className="text-lg font-medium text-foreground">More Fonts</span>
            <ChevronRight className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
        <p className="text-xs text-neutral-500 px-1">
          View additional fonts available to install.
        </p>
      </div>
    </div>
  );
};

export default FontsContent;
