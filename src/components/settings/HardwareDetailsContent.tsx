import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useIsMobile } from "@/hooks/use-mobile";
import settingsHardwareIcon from "@/assets/icons/settings-hardware.png";
import hardwarePrinterIcon from "@/assets/icons/hardware-printer.png";
import hardwareCardReaderIcon from "@/assets/icons/hardware-card-reader.png";
import hardwareCashRegisterIcon from "@/assets/icons/hardware-cash-register.png";

interface HardwareDetailsContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onNavigate?: (path: string) => void;
  onAIClick?: () => void;
}

const HardwareDetailsContent = ({ showHeader = true, onBack, onNavigate, onAIClick }: HardwareDetailsContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {showHeader && onBack && (
        <div className="px-6 pt-5">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
        </div>
      )}

      <div className="pt-6 px-6 pb-28">
        {/* Header Card */}
        <div className={`bg-neutral-800/60 rounded-2xl p-6 flex flex-col ${isMobile ? 'items-start' : 'items-center text-center'} mb-6`}>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
            style={{ backgroundColor: "#5E4DD8" }}
          >
            <img src={settingsHardwareIcon} alt="Hardware" className="w-7 h-7 object-contain" />
          </div>
          <h2 className="text-foreground text-lg font-semibold mb-1">Hardware</h2>
          <p className="text-neutral-500 text-sm leading-relaxed">Manage hardware components including printers, cash registers for secure cash transactions, and card readers for electronic card processing.</p>
        </div>

        {/* AI Assistant Icon */}
        <div className="flex justify-end mb-3 overflow-visible">
          <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />
        </div>

        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          {/* Printer */}
          <button
            onClick={() => onNavigate?.('/settings/hardware/details/printer')}
            className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "#D6336C" }}
              >
                <img src={hardwarePrinterIcon} alt="Printer" className="w-5 h-5 object-contain" />
              </div>
              <span className="text-foreground text-base font-medium">Printer</span>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-500" />
          </button>

          <div className="h-px bg-neutral-700/50 mx-4" />

          {/* Card Reader */}
          <button
            onClick={() => onNavigate?.('/settings/hardware/details/card-reader')}
            className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "#F59F00" }}
              >
                <img src={hardwareCardReaderIcon} alt="Card Reader" className="w-5 h-5 object-contain" />
              </div>
              <span className="text-foreground text-base font-medium">Card Reader</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 text-sm">Off</span>
              <ChevronRight className="w-5 h-5 text-neutral-500" />
            </div>
          </button>

          <div className="h-px bg-neutral-700/50 mx-4" />

          {/* Cash Register */}
          <button
            onClick={() => onNavigate?.('/settings/hardware/details/cash-register')}
            className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "#5E4DD8" }}
              >
                <img src={hardwareCashRegisterIcon} alt="Cash Register" className="w-5 h-5 object-contain" />
              </div>
              <span className="text-foreground text-base font-medium">Cash Register</span>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HardwareDetailsContent;
