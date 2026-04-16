import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
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
  const [terminalName, setTerminalName] = useState(() => localStorage.getItem("pos_terminal_name") || "POS 1");

  const handleTerminalNameChange = (value: string) => {
    setTerminalName(value);
    if (value.trim()) {
      localStorage.setItem("pos_terminal_name", value.trim());
    } else {
      localStorage.removeItem("pos_terminal_name");
    }
  };
  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {showHeader && (
        <div className="flex items-center justify-between pt-0 pb-2 relative overflow-visible px-4">
          {onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          )}
          <h1 className="text-lg font-semibold text-foreground absolute left-1/2 -translate-x-1/2">Hardware</h1>
        </div>
      )}

      <div className={`px-6 pb-28`}>
        <div className="mb-4 px-1 pt-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Manage hardware components including printers, cash registers for secure cash transactions, and card readers for electronic card processing.
          </p>
        </div>

        {/* POS Terminal Name */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-4 px-4 py-3.5">
          <label className="text-sm text-muted-foreground mb-2 block">POS Terminal Name</label>
          <input
            type="text"
            value={terminalName}
            onChange={(e) => handleTerminalNameChange(e.target.value)}
            placeholder="e.g. POS 1, Bar Terminal, Drive-Thru"
            className="w-full bg-neutral-700/50 text-foreground text-sm rounded-lg px-3 py-2.5 border border-neutral-600/50 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-500"
          />
          <p className="text-xs text-neutral-500 mt-1.5">This name appears on kitchen display messages</p>
        </div>

        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          {/* Printer */}
          <button
            onClick={() => onNavigate?.('/settings/hardware/details/printer')}
            className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-4">
              <SettingsIcon bgColor="#D6336C" iconSrc={hardwarePrinterIcon} iconAlt="Printer" />
              <span className="text-foreground text-lg font-medium">Printer</span>
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
              <span className="text-foreground text-lg font-medium">Card Reader</span>
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
              <span className="text-foreground text-lg font-medium">Cash Register</span>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HardwareDetailsContent;
