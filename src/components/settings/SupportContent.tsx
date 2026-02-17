import { ChevronRight, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useIsMobile } from "@/hooks/use-mobile";
import supportIcon from "@/assets/icons/settings-support.png";
import feedbackIcon from "@/assets/icons/feedback.png";
import aboutIcon from "@/assets/icons/about.png";

interface SettingsOptionProps {
  icon: React.ReactNode;
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
  showDivider = true,
}: SettingsOptionProps) => (
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
          {icon}
        </div>
        <span className="text-foreground text-lg font-medium">{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-neutral-500" />
    </button>
    {showDivider && <div className="h-px bg-neutral-700/50 mx-4" />}
  </div>
);

interface SupportContentProps {
  showHeader?: boolean;
  onNavigate?: (path: string) => void;
  onBack?: () => void;
  onAIClick?: () => void;
}

const SupportContent = ({
  showHeader = true,
  onNavigate,
  onBack,
  onAIClick,
}: SupportContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {/* Header - only shown in tablet/desktop right panel */}
      {showHeader && (
        <div className="flex items-center justify-center py-4 border-b border-neutral-800/50 relative">
          {onBack && (
            <button
              onClick={onBack}
              className="absolute left-4 w-8 h-8 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
          )}
          <h1 className="text-base font-medium text-foreground">Support</h1>
        </div>
      )}

      {/* Content */}
      <div className="pt-6 px-6 pb-28">
        {/* Header Card */}
        <div className={`bg-neutral-800/60 rounded-2xl p-5 mb-4 flex flex-col ${isMobile ? 'items-start' : 'items-center text-center'}`}>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: "#FF0028" }}
          >
            <img src={supportIcon} alt="Support" className="w-7 h-7 object-contain" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Support</h1>
          <p className="text-base text-neutral-400 leading-relaxed">
            Access feedback tools, customer support options, and system information, including logs, app details, updates, and backup settings to help troubleshoot issues and manage system health.
          </p>
        </div>

        {/* AI Assistant Icon - hidden on mobile (shown in page wrapper) */}
        <div className="hidden md:flex justify-end mb-3 overflow-visible">
          <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />
        </div>

        {/* Options Card */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          <SettingsOption
            icon={<img src={feedbackIcon} alt="Feedback" className="w-5 h-5 object-contain" />}
            iconBgColor="#606060"
            label="Feedback"
            onClick={() => onNavigate?.('/settings/support/feedback')}
            showDivider={true}
          />
          <SettingsOption
            icon={<img src={supportIcon} alt="Support" className="w-5 h-5 object-contain" />}
            iconBgColor="#FF0028"
            label="Support"
            onClick={() => onNavigate?.('/settings/support/contact')}
            showDivider={true}
          />
          <SettingsOption
            icon={<img src={aboutIcon} alt="About" className="w-5 h-5 object-contain" />}
            iconBgColor="#4200FF"
            label="About"
            onClick={() => onNavigate?.('/settings/support/about')}
            showDivider={false}
          />
        </div>
      </div>
    </div>
  );
};

export default SupportContent;
