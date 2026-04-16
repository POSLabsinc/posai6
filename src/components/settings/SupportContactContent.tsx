import { useState } from "react";
import { ChevronRight, ChevronLeft, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAppearance, iconContainerSizeMap } from "@/contexts/AppearanceContext";
import SettingsIcon from "@/components/settings/SettingsIcon";
import supportIcon from "@/assets/icons/settings-support.png";
import chatIcon from "@/assets/icons/chat-icon.png";
import contactUsIcon from "@/assets/icons/contact-us-icon.png";
import uploadLogsIcon from "@/assets/icons/upload-logs-icon.png";
import SupportChatWidget from "@/components/settings/SupportChatWidget";

interface SettingsOptionProps {
  icon: React.ReactNode;
  iconBgColor: string;
  label: string;
  rightContent?: React.ReactNode;
  onClick?: () => void;
  showDivider?: boolean;
  iconSrc?: string;
}

const SettingsOption = ({
  icon,
  iconBgColor,
  label,
  rightContent,
  onClick,
  showDivider = true,
  iconSrc
}: SettingsOptionProps) => {
  return (
    <div>
      <button
        onClick={onClick}
        className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity">

        <div className="flex items-center gap-4">
          {iconSrc ?
          <SettingsIcon bgColor={iconBgColor} iconSrc={iconSrc} iconAlt={label} /> :

          <SettingsIcon bgColor={iconBgColor}>
              {icon}
            </SettingsIcon>
          }
          <span className="text-foreground text-lg font-medium">{label}</span>
        </div>
        {rightContent || <ChevronRight className="w-5 h-5 text-neutral-500" />}
      </button>
      {showDivider && <div className="h-px bg-neutral-700/50 mx-4" />}
    </div>);

};

interface SupportContactContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const SupportContactContent = ({
  showHeader = true,
  onBack,
  onAIClick
}: SupportContactContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { getIconBgColor } = useAppearance();
  const [chatOpen, setChatOpen] = useState(false);
  return (
    <>
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {showHeader &&
        <div className="flex items-center justify-between pt-0 pb-2 relative overflow-visible px-4">
          {onBack &&
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity">

              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          }
          <h1 className="text-lg font-semibold text-foreground absolute left-1/2 -translate-x-1/2">Support</h1>
        </div>
        }

      <div className={`${showHeader ? 'pt-0' : 'pt-0'} px-6 pb-28`}>
        <div className="mb-4">
          <p className="text-base text-neutral-400 leading-relaxed">
            Get help through live chat, contact our team, share your live PIN for remote assistance, or upload logs for troubleshooting.
          </p>
        </div>

        



        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          <SettingsOption
              icon={null}
              iconSrc={chatIcon}
              iconBgColor="#007AFF"
              label="Chat"
              onClick={() => setChatOpen(true)}
              showDivider={true} />

          <SettingsOption
              icon={null}
              iconSrc={contactUsIcon}
              iconBgColor="#FFFFFF"
              label="Contact Us"
              showDivider={true} />

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
              showDivider={true} />

          <SettingsOption
              icon={null}
              iconSrc={uploadLogsIcon}
              iconBgColor="#606060"
              label="Upload Logs"
              showDivider={false} />

        </div>
      </div>
    </div>
    <SupportChatWidget open={chatOpen} onClose={() => setChatOpen(false)} />
    </>);

};

export default SupportContactContent;