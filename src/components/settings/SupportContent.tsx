import { ChevronRight, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAppearance } from "@/contexts/AppearanceContext";
import SettingsIcon from "@/components/settings/SettingsIcon";
import supportIcon from "@/assets/icons/settings-support.png";
import feedbackIcon from "@/assets/icons/feedback.png";
import aboutIcon from "@/assets/icons/about.png";

interface SettingsOptionProps {
  iconSrc: string;
  iconBgColor: string;
  label: string;
  onClick?: () => void;
  showDivider?: boolean;
}

const SettingsOption = ({
  iconSrc,
  iconBgColor,
  label,
  onClick,
  showDivider = true,
}: SettingsOptionProps) => {
  return (
    <div>
      <button
        onClick={onClick}
        className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity"
      >
        <div className="flex items-center gap-4">
          <SettingsIcon bgColor={iconBgColor} iconSrc={iconSrc} iconAlt={label} />
          <span className="text-foreground text-lg font-medium">{label}</span>
        </div>
        <ChevronRight className="w-5 h-5 text-neutral-500" />
      </button>
      {showDivider && <div className="h-px bg-neutral-700/50 mx-4" />}
    </div>
  );
};

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
  const { getIconBgColor } = useAppearance();
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
            style={{ backgroundColor: getIconBgColor("#FF0028") }}
          >
            <img src={supportIcon} alt="Support" className="w-7 h-7 object-contain" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Support</h1>
          <p className="text-base text-neutral-400 leading-relaxed w-full">
            Access feedback tools, customer support options, and system information, including logs, app details, updates, and backup settings to help troubleshoot issues and manage system health.
          </p>
        </div>


        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          <SettingsOption
            iconSrc={feedbackIcon}
            iconBgColor="#606060"
            label="Feedback"
            onClick={() => onNavigate?.('/settings/support/feedback')}
            showDivider={true}
          />
          <SettingsOption
            iconSrc={supportIcon}
            iconBgColor="#FF0028"
            label="Support"
            onClick={() => onNavigate?.('/settings/support/contact')}
            showDivider={true}
          />
          <SettingsOption
            iconSrc={aboutIcon}
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
