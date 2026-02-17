import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";

// Import custom icons
import systemIcon from "@/assets/icons/settings-system.png";
import appearanceIcon from "@/assets/icons/appearance.png";
import controlCenterIcon from "@/assets/icons/control-center.png";

interface SettingsOptionProps {
  icon: string;
  iconBgColor: string;
  label: string;
  onClick?: () => void;
  showDivider?: boolean;
}

const SettingsOption = ({ icon, iconBgColor, label, onClick, showDivider = true }: SettingsOptionProps) => (
  <div>
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity"
    >
      <div className="flex items-center gap-4">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: iconBgColor }}
        >
          <img src={icon} alt={label} className="w-5 h-5" />
        </div>
        <span className="text-foreground text-lg font-medium">{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-neutral-500" />
    </button>
    {showDivider && <div className="h-px bg-neutral-700/50 mx-4" />}
  </div>
);

const SystemSettings = () => {
  const navigate = useNavigate();

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
            style={{ backgroundColor: "#34A885" }}
          >
            <img src={systemIcon} alt="System" className="w-7 h-7 object-contain" />
          </div>

          {/* Title */}
          <h1 className="text-xl font-semibold text-foreground mb-2">System</h1>

          {/* Description */}
          <p className="text-base text-neutral-400 leading-relaxed">
            These settings help users personalize the visual experience of the Point of Sale without affecting system functionality.
          </p>
        </div>

        {/* Options Card */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          <SettingsOption
            icon={appearanceIcon}
            iconBgColor="#525252"
            label="Appearance"
            onClick={() => navigate('/settings/system/appearance')}
            showDivider={true}
          />
          <SettingsOption
            icon={controlCenterIcon}
            iconBgColor="#7C3AED"
            label="Control Center"
            onClick={() => navigate('/settings/system/control-center')}
            showDivider={false}
          />
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
