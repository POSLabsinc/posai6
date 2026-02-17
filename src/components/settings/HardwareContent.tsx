import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useIsMobile } from "@/hooks/use-mobile";

import hardwareIcon from "@/assets/icons/settings-hardware.png";

interface HardwareContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onNavigate?: (path: string) => void;
  onAIClick?: () => void;
}

const HardwareContent = ({ showHeader = true, onBack, onNavigate, onAIClick }: HardwareContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [cardReaderBeep, setCardReaderBeep] = useState(false);
  const [requestTipOnReader, setRequestTipOnReader] = useState(false);
  const [openCashDrawer, setOpenCashDrawer] = useState(false);

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {showHeader && (
        <div className="flex items-center justify-center py-4 border-b border-neutral-800/50 relative">
          {onBack && (
            <button
              onClick={onBack}
              className="absolute left-4 w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
          )}
          <h1 className="text-base font-medium text-foreground">Hardware</h1>
        </div>
      )}

      <div className="pt-6 px-6 pb-28">
        {/* Header Card */}
        <div className={`bg-neutral-800/60 rounded-2xl p-5 mb-4 flex flex-col ${isMobile ? 'items-start' : 'items-center text-center'}`}>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: "#5E4DD8" }}
          >
            <img src={hardwareIcon} alt="Hardware" className="w-7 h-7 object-contain" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Hardware</h1>
          <p className="text-base text-neutral-400 leading-relaxed">
            Manage hardware components including printers, cash registers for secure cash transactions, and card readers for electronic card processing.
          </p>
        </div>

        {/* AI Assistant Icon - hidden on mobile (shown in page wrapper) */}
        <div className="hidden md:flex justify-end mb-3 overflow-visible">
          <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />
        </div>

        {/* Hardware Navigation Row */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-6">
          <button
            onClick={() => onNavigate?.('/settings/hardware/details')}
            className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "#5E4DD8" }}
              >
                <img src={hardwareIcon} alt="Hardware" className="w-5 h-5 object-contain" />
              </div>
              <span className="text-foreground text-lg font-medium">Hardware</span>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Hardware Shortcuts Section */}
        <div className="mb-3">
          <span className="text-xs font-medium text-neutral-500 tracking-wider uppercase">Hardware Shortcuts</span>
        </div>

        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          {/* Card Reader Beep */}
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-base font-medium">Card Reader Beep</span>
            <Switch
              checked={cardReaderBeep}
              onCheckedChange={setCardReaderBeep}
            />
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          {/* Request Tip On Reader */}
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-base font-medium">Request Tip On Reader</span>
            <Switch
              checked={requestTipOnReader}
              onCheckedChange={setRequestTipOnReader}
            />
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          {/* Open Cash Drawer */}
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-base font-medium">Open Cash Drawer</span>
            <Switch
              checked={openCashDrawer}
              onCheckedChange={setOpenCashDrawer}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HardwareContent;
