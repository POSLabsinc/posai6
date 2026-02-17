import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useIsMobile } from "@/hooks/use-mobile";

import networkIcon from "@/assets/icons/settings-network.png";
import serverIcon from "@/assets/icons/server.png";

interface NetworkContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onNavigate?: (path: string) => void;
  onAIClick?: () => void;
}

const NetworkContent = ({ showHeader = true, onBack, onNavigate, onAIClick }: NetworkContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {showHeader && (
        <div className="flex items-center justify-center py-4 border-b border-neutral-800/50 relative">
          {onBack && (
            <button
              onClick={onBack}
              className="absolute left-4 w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
          )}
          <h1 className="text-base font-medium text-foreground">Network</h1>
        </div>
      )}

      <div className="pt-6 px-6 pb-28">
        {/* Header Card */}
        <div className={`bg-neutral-800/60 rounded-2xl p-5 mb-4 flex flex-col ${isMobile ? 'items-start' : 'items-center text-center'}`}>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: "#5AB0EE" }}
          >
            <img src={networkIcon} alt="Network" className="w-7 h-7 object-contain" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Network</h1>
          <p className="text-base text-neutral-400 leading-relaxed">
            Enables smooth client–server communication for data exchange.
          </p>
        </div>

        {/* AI Assistant Icon - hidden on mobile (shown in page wrapper) */}
        <div className="hidden md:flex justify-end mb-3 overflow-visible">
          <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />
        </div>

        {/* Server Option */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          <button
            onClick={() => onNavigate?.('/settings/network/servers')}
            className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "#34A885" }}
              >
                <img src={serverIcon} alt="Server" className="w-5 h-5 object-contain" />
              </div>
              <span className="text-foreground text-lg font-medium">Servers</span>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NetworkContent;
