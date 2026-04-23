import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

import hardwareIcon from "@/assets/icons/settings-hardware.png";
import { useAppearance } from "@/contexts/AppearanceContext";
import SettingsIcon from "@/components/settings/SettingsIcon";

interface HardwareContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onNavigate?: (path: string) => void;
  onAIClick?: () => void;
}

const HardwareContent = ({ showHeader = true, onBack, onNavigate, onAIClick }: HardwareContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { getIconBgColor } = useAppearance();
  const [cardReaderBeep, setCardReaderBeep] = useState(false);
  const [requestTipOnReader, setRequestTipOnReader] = useState(false);
  const [openCashDrawer, setOpenCashDrawer] = useState(false);

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

      <div className={`${showHeader ? 'pt-0' : 'pt-0'} px-4 md:px-6 pb-28`}>
        <div className="bg-neutral-800/60 rounded-2xl p-5 mb-4 flex flex-col items-start">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: getIconBgColor("#5E4DD8") }}
          >
            <img src={hardwareIcon} alt="Hardware" className="w-7 h-7 object-contain" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Hardware</h1>
          <p className="text-base text-neutral-400 leading-relaxed w-full">
            Manage hardware components including printers, cash registers for secure cash transactions, and card readers for electronic card processing.
          </p>
        </div>


        {/* Hardware Navigation Row */}
        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-6">
          <button
            onClick={() => onNavigate?.('/settings/hardware/details')}
            className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-4">
              <SettingsIcon bgColor="#5E4DD8" iconSrc={hardwareIcon} iconAlt="Hardware" />
              <span className="text-foreground text-lg font-medium">Hardware</span>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Hardware Shortcuts Section */}
        <div className="mb-0.5">
          <span className="text-base font-medium text-muted-foreground px-1">Hardware Shortcuts</span>
        </div>

        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-lg font-medium">Card Reader Beep</span>
            <Switch checked={cardReaderBeep} onCheckedChange={setCardReaderBeep} />
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-lg font-medium">Request Tip On Reader</span>
            <Switch checked={requestTipOnReader} onCheckedChange={setRequestTipOnReader} />
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-lg font-medium">Open Cash Drawer</span>
            <Switch checked={openCashDrawer} onCheckedChange={setOpenCashDrawer} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HardwareContent;
