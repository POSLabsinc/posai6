import { ChevronRight, ChevronLeft, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useIsMobile } from "@/hooks/use-mobile";
import supportIcon from "@/assets/icons/settings-support.png";
import chatIcon from "@/assets/icons/chat-icon.png";
import contactUsIcon from "@/assets/icons/contact-us-icon.png";
import uploadLogsIcon from "@/assets/icons/upload-logs-icon.png";

interface SettingsOptionProps {
  icon: React.ReactNode;
  iconBgColor: string;
  label: string;
  rightContent?: React.ReactNode;
  onClick?: () => void;
  showDivider?: boolean;
}

const SettingsOption = ({
  icon,
  iconBgColor,
  label,
  rightContent,
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
      {rightContent || <ChevronRight className="w-5 h-5 text-neutral-500" />}
    </button>
    {showDivider && <div className="h-px bg-neutral-700/50 mx-4" />}
  </div>
);

interface SupportContactContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const SupportContactContent = ({
  showHeader = true,
  onBack,
  onAIClick,
}: SupportContactContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
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
        </div>
      )}

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
            Get help through live chat, contact our team, share your live PIN for remote assistance, or upload logs for troubleshooting.
          </p>
        </div>

        {/* AI Assistant Icon */}
        <div className="flex justify-end mb-3 overflow-visible">
          <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />
        </div>

        {/* Options Card */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          <SettingsOption
            icon={<img src={chatIcon} alt="Chat" className="w-5 h-5 object-contain" />}
            iconBgColor="#007AFF"
            label="Chat"
            showDivider={true}
          />
          <SettingsOption
            icon={<img src={contactUsIcon} alt="Contact Us" className="w-5 h-5 object-contain" />}
            iconBgColor="#FFFFFF"
            label="Contact Us"
            showDivider={true}
          />
          <SettingsOption
            icon={
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            }
            iconBgColor="#606060"
            label="Live Pin"
            rightContent={
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-neutral-400" />
                <span className="text-neutral-400 text-base font-medium">G448656</span>
              </div>
            }
            showDivider={true}
          />
          <SettingsOption
            icon={<img src={uploadLogsIcon} alt="Upload Logs" className="w-5 h-5 object-contain" />}
            iconBgColor="#606060"
            label="Upload Logs"
            showDivider={false}
          />
        </div>
      </div>
    </div>
  );
};

export default SupportContactContent;
