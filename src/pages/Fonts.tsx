import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Fonts = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 pt-4 pb-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8 overflow-visible relative" style={{ minHeight: 40 }}>
          <button
            onClick={() => navigate('/settings/system/appearance')}
            className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity z-10"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground absolute left-1/2 -translate-x-1/2">Fonts</h1>
        </div>

        {/* System Fonts & My Fonts */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-1.5">
          <button
            onClick={() => navigate('/settings/system/fonts/system')}
            className="flex items-center justify-between w-full py-3.5 px-5 active:opacity-70 transition-opacity"
          >
            <span className="text-lg font-medium text-foreground">System Fonts</span>
            <ChevronRight className="w-5 h-5 text-neutral-500" />
          </button>
          <div className="h-px bg-neutral-700/50 mx-5" />
          <button
            onClick={() => navigate('/settings/system/fonts/my-fonts')}
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
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-1.5">
          <button
            onClick={() => navigate('/settings/system/fonts/more')}
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

export default Fonts;
