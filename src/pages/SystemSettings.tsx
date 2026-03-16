import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useAppearance } from "@/contexts/AppearanceContext";
import SettingsIcon from "@/components/settings/SettingsIcon";

// Import custom icons
import systemIcon from "@/assets/icons/settings-system.png";
import appearanceIcon from "@/assets/icons/appearance.png";
import controlCenterIcon from "@/assets/icons/control-center.png";
import aiIntegrationIcon from "@/assets/icons/ai-integration.png";

interface SettingsOptionProps {
  icon: string;
  iconBgColor: string;
  label: string;
  onClick?: () => void;
  showDivider?: boolean;
}

const SettingsOption = ({ icon, iconBgColor, label, onClick, showDivider = true }: SettingsOptionProps) => {
  return (
    <div>
      <button
        onClick={onClick}
        className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity"
      >
        <div className="flex items-center gap-4">
          <SettingsIcon bgColor={iconBgColor} iconSrc={icon} iconAlt={label} />
          <span className="text-foreground text-lg font-medium">{label}</span>
        </div>
        <ChevronRight className="w-5 h-5 text-neutral-500" />
      </button>
      {showDivider && <div className="h-px bg-neutral-700/50 mx-4" />}
    </div>
  );
};

const SystemSettings = () => {
  const navigate = useNavigate();
  const { getIconBgColor } = useAppearance();
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 pt-4 pb-8 max-w-2xl mx-auto">
        {/* Back Button and AI icon row */}
        <div className="flex items-center justify-between mb-6 overflow-visible">
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center active:opacity-70 transition-opacity"
          >
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
          <div className="md:hidden">
            <AnimatedAIIcon size={24} onClick={() => navigate('/settings/ai')} />
          </div>
        </div>

        {/* Header Card */}
        <div className="bg-neutral-800/60 rounded-2xl p-5 mb-4">
          {/* System Icon */}
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: getIconBgColor("#34A885") }}
          >
            <img src={systemIcon} alt="System" className="w-7 h-7 object-contain" />
          </div>

          {/* Title */}
          <h1 className="text-xl font-semibold text-foreground mb-2">System</h1>

          {/* Description with Learn more/less */}
          <p className="text-base text-neutral-400 leading-relaxed w-full">
            {showMore 
              ? "These settings allow you to manage and personalize your Point of Sale environment while maintaining stable system performance and functionality. Configure essential controls and preferences to ensure smooth daily operations without impacting core system behavior."
              : "These settings allow you to manage and personalize your Point of Sale environment while maintaining stable system performance and functionality."
            }
            <button 
              onClick={() => setShowMore(!showMore)} 
              className="text-blue-400 ml-1 text-base"
            >
              {showMore ? "Learn less" : "Learn more..."}
            </button>
          </p>
        </div>

        {/* Appearance Card - Individual rounded-full */}
        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-1.5">
          <SettingsOption
            icon={appearanceIcon}
            iconBgColor="#525252"
            label="Appearance"
            onClick={() => navigate('/settings/system/appearance')}
            showDivider={false}
          />
        </div>
        <p className="text-xs text-neutral-500 px-1 mb-4">
          Customize theme, icons, text size, brightness, fonts, and presets.
        </p>

        {/* Control Center Card - Individual rounded-full */}
        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-1.5">
          <SettingsOption
            icon={controlCenterIcon}
            iconBgColor="#7C3AED"
            label="Control Center"
            onClick={() => navigate('/settings/system/control-center')}
            showDivider={false}
          />
        </div>
        <p className="text-xs text-neutral-500 px-1 mb-4">
          Manage app restart, security, display, and operational controls.
        </p>

        {/* AI Integration Card - Individual rounded-full */}
        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-1.5">
          <SettingsOption
            icon={aiIntegrationIcon}
            iconBgColor="#3B82F6"
            label="AI Integration & Settings"
            onClick={() => navigate('/settings/network/ai-integration')}
            showDivider={false}
          />
        </div>
        <p className="text-xs text-neutral-500 px-1 mb-4">
          Configure external AI providers, manage API keys, and control AI-powered features.
        </p>
      </div>
    </div>
  );
};

export default SystemSettings;
