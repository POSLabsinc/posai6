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
          <h1 className="text-base font-medium text-foreground absolute left-1/2 -translate-x-1/2">Support</h1>
          <div className="overflow-visible flex items-center justify-center" style={{ width: 32, height: 32 }}>
    </>);

};

export default SupportContactContent;