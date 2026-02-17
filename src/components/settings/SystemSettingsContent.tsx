import { ChevronRight, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useIsMobile } from "@/hooks/use-mobile";

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
const SettingsOption = ({
  icon,
  iconBgColor,
  label,
  onClick,
  showDivider = true
}: SettingsOptionProps) => <div>
    <button onClick={onClick} className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 active:scale-[0.98] transition-all duration-150">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
        backgroundColor: iconBgColor
      }}>
          <img src={icon} alt={label} className="w-5 h-5" />
        </div>
        <span className="text-foreground text-lg font-medium">{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-neutral-500" />
    </button>
    {showDivider && <div className="h-px bg-neutral-700/50 mx-4" />}
  </div>;
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
  return <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {/* Header - only shown in tablet/desktop right panel */}
      {showHeader && <div className="flex items-center justify-center py-4 border-b border-neutral-800/50 relative">
          {onBack && <button onClick={onBack} className="absolute left-4 w-8 h-8 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity">
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>}
          <h1 className="text-base font-medium text-foreground">System</h1>
        </div>}

      {/* Content */}
      <div className="pt-6 px-6 pb-28">
        {/* Header Card */}
        <div className={`bg-neutral-800/60 rounded-2xl p-5 mb-4 flex flex-col ${isMobile ? 'items-start' : 'items-center text-center'}`}>
          {/* System Icon */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{
          backgroundColor: "#34A885"
        }}>
            <img src={systemIcon} alt="System" className="w-7 h-7 object-contain" />
          </div>

          {/* Title */}
          <h1 className="text-xl font-semibold text-foreground mb-2">System</h1>

          {/* Description */}
          <p className="text-base text-neutral-400 leading-relaxed">
            These settings help users personalize the visual experience of the Point of Sale without affecting system functionality.
          </p>
        </div>

        {/* AI Assistant Icon - hidden on mobile (shown in page wrapper) */}
        <div className="hidden md:flex justify-end mb-3 overflow-visible">
          <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />
        </div>

        {/* Options Card */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          <SettingsOption icon={appearanceIcon} iconBgColor="#525252" label="Appearance" onClick={() => onNavigate?.('/settings/system/appearance')} showDivider={true} />
          <SettingsOption icon={controlCenterIcon} iconBgColor="#7C3AED" label="Control Center" onClick={() => onNavigate?.('/settings/system/control-center')} showDivider={false} />
        </div>
      </div>
    </div>;
};
export default SystemSettingsContent;