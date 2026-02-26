import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useIsMobile } from "@/hooks/use-mobile";
import settingsHardwareIcon from "@/assets/icons/settings-hardware.png";
import hardwarePrinterIcon from "@/assets/icons/hardware-printer.png";
import hardwareCardReaderIcon from "@/assets/icons/hardware-card-reader.png";
import hardwareCashRegisterIcon from "@/assets/icons/hardware-cash-register.png";
import { useAppearance } from "@/contexts/AppearanceContext";
import SettingsIcon from "@/components/settings/SettingsIcon";

interface HardwareDetailsContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onNavigate?: (path: string) => void;
  onAIClick?: () => void;
}

const HardwareDetailsContent = ({ showHeader = true, onBack, onNavigate, onAIClick }: HardwareDetailsContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { getIconBgColor } = useAppearance();
  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {showHeader && (
        <div className="flex items-center justify-between pt-4 pb-2 relative overflow-visible px-4">
          {onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          )}
          <h1 className="text-base font-medium text-foreground absolute left-1/2 -translate-x-1/2">Hardware</h1>
          <div className="overflow-visible flex items-center justify-center" style={{ width: 32, height: 32 }}>
            <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />
          </div>
        </div>
      )}

      <div className={`px-6 pb-28`}>
        <div className="mb-4 px-1 pt-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Manage hardware components including printers, cash registers for secure cash transactions, and card readers for electronic card processing.
          </p>
        </div>

        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          {/* Printer */}
          <button
            onClick={() => onNavigate?.('/settings/hardware/details/printer')}
            className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-4">
              <SettingsIcon bgColor="#D6336C" iconSrc={hardwarePrinterIcon} iconAlt="Printer" />
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
              <SettingsIcon bgColor="#F59F00" iconSrc={hardwareCardReaderIcon} iconAlt="Card Reader" />
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
              <SettingsIcon bgColor="#5E4DD8" iconSrc={hardwareCashRegisterIcon} iconAlt="Cash Register" />
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
