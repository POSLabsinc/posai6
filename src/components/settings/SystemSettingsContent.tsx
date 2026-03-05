import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAppearance } from "@/contexts/AppearanceContext";
import SettingsIcon from "@/components/settings/SettingsIcon";

// Import custom icons
import appearanceIcon from "@/assets/icons/appearance.png";
import controlCenterIcon from "@/assets/icons/control-center.png";

interface SettingsOptionProps {
  icon: string;
  iconBgColor: string;
  label: string;
  onClick?: () => void;
  showDivider?: boolean;
}

const SettingsOption = ({
  icon,
  iconBgColor,
  label,
  onClick,
  showDivider = true
}: SettingsOptionProps) => {
  return <div>
    <button onClick={onClick} className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 active:scale-[0.98] transition-all duration-150">
      <div className="flex items-center gap-4">
        <SettingsIcon bgColor={iconBgColor} iconSrc={icon} iconAlt={label} />
        <span className="text-foreground text-lg font-medium">{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-neutral-500" />
    </button>
    {showDivider && <div className="h-px bg-neutral-700/50 mx-4" />}
  </div>;
};

interface SystemSettingsContentProps {
  showHeader?: boolean;
  onNavigate?: (path: string) => void;
  onBack?: () => void;
  onAIClick?: () => void;
}

const SystemSettingsContent = ({
  showHeader = true,
  onNavigate,
  onBack,
  onAIClick
}: SystemSettingsContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { getIconBgColor } = useAppearance();
  const [showMore, setShowMore] = useState(false);
  return <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      <div className="px-6 pb-28 pt-6">
        {/* AI Icon aligned top-right */}
        <div className="hidden md:flex justify-end mb-3 overflow-visible">
          <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />
        </div>

        {/* Description */}
        <div className="mb-4 px-1">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {showMore 
              ? "These settings allow you to manage and personalize your Point of Sale environment while maintaining stable system performance and functionality. Configure essential controls and preferences to ensure smooth daily operations without impacting core system behavior."
              : "These settings allow you to manage and personalize your Point of Sale environment while maintaining stable system performance and functionality."
            }
            <button 
              onClick={() => setShowMore(!showMore)} 
              className="text-blue-400 ml-1 text-sm"
            >
              {showMore ? "Learn less" : "Learn more..."}
            </button>
          </p>
        </div>

        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-1.5">
          <SettingsOption icon={appearanceIcon} iconBgColor="#525252" label="Appearance" onClick={() => onNavigate?.('/settings/system/appearance')} showDivider={false} />
        </div>
        <p className="text-xs text-neutral-500 px-1 mb-4">
          Customize theme, icons, text size, brightness, fonts, and presets.
        </p>

        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-1.5">
          <SettingsOption icon={controlCenterIcon} iconBgColor="#7C3AED" label="Control Center" onClick={() => onNavigate?.('/settings/system/control-center')} showDivider={false} />
        </div>
        <p className="text-xs text-neutral-500 px-1 mb-4">
          Manage app restart, security, display, and operational controls.
        </p>
      </div>
    </div>;
};

export default SystemSettingsContent;
