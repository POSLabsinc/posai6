import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import networkIcon from "@/assets/icons/settings-network.png";
import serverIcon from "@/assets/icons/server.png";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAppearance } from "@/contexts/AppearanceContext";
import SettingsIcon from "@/components/settings/SettingsIcon";

interface NetworkContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onNavigate?: (path: string) => void;
  onAIClick?: () => void;
}

const NetworkContent = ({ showHeader = true, onBack, onNavigate, onAIClick }: NetworkContentProps) => {
  const isMobile = useIsMobile();
  const { getIconBgColor } = useAppearance();
  const navigate = useNavigate();
  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {showHeader && (
        <div className="flex items-center py-4 relative md:hidden px-4">
          {onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          )}
        </div>
      )}

      <div className={`${showHeader ? 'pt-0' : 'pt-0'} px-6 pb-28`}>
        <div className="bg-neutral-800/60 rounded-2xl p-5 mb-4 flex flex-col items-start">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: getIconBgColor("#5AB0EE") }}
          >
            <img src={networkIcon} alt="Network" className="w-7 h-7 object-contain" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Network</h1>
          <p className="text-base text-neutral-400 leading-relaxed w-full">
            Enables smooth client–server communication for data exchange.
          </p>
        </div>


        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-4">
          <button
            onClick={() => onNavigate?.('/settings/network/servers')}
            className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-4">
              <SettingsIcon bgColor="#34A885" iconSrc={serverIcon} iconAlt="Server" />
              <span className="text-foreground text-lg font-medium">Servers</span>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
        <p className="text-sm text-neutral-400 leading-relaxed px-1 mb-6">
          Manage server connections, configure endpoints, and monitor server health and performance.
        </p>
      </div>
    </div>
  );
};

export default NetworkContent;
