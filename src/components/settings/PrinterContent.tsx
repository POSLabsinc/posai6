import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import hardwarePrinterIcon from "@/assets/icons/hardware-printer.png";
import { useAppearance } from "@/contexts/AppearanceContext";
import SettingsIcon from "@/components/settings/SettingsIcon";

interface PrinterContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onNavigate?: (path: string) => void;
  onAIClick?: () => void;
}

const PrinterContent = ({ showHeader = true, onBack, onNavigate, onAIClick }: PrinterContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { getIconBgColor } = useAppearance();
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
          <h1 className="text-xl font-semibold text-foreground absolute left-1/2 -translate-x-1/2">Printer</h1>
        </div>
      )}

      <div className={`${showHeader ? 'pt-0' : 'pt-0'} px-4 md:px-6 pb-28`}>
        <div className="bg-neutral-800/60 rounded-2xl p-6 flex flex-col items-start mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
            style={{ backgroundColor: getIconBgColor("#D6336C") }}
          >
            <img src={hardwarePrinterIcon} alt="Printer" className="w-7 h-7 object-contain" />
          </div>
          <h2 className="text-foreground text-lg font-semibold mb-1">Printer</h2>
          <p className="text-neutral-500 text-sm leading-relaxed">Configure and manage your printer connections and advanced printing preferences.</p>
        </div>

        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          {/* Pair Printer */}
          <button
            onClick={() => onNavigate?.('/settings/hardware/details/printer/pair')}
            className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-4">
              <SettingsIcon bgColor="#D6336C" iconSrc={hardwarePrinterIcon} iconAlt="Pair Printer" />
              <span className="text-foreground text-lg font-medium">Pair Printer</span>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-500" />
          </button>

          <div className="h-px bg-neutral-700/50 mx-4" />

          {/* Advanced Settings */}
          <button
            onClick={() => onNavigate?.('/settings/hardware/details/printer/advanced')}
            className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-4">
              <SettingsIcon bgColor="#5E4DD8" iconSrc={hardwarePrinterIcon} iconAlt="Advanced Settings" />
              <span className="text-foreground text-lg font-medium">Advanced Settings</span>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrinterContent;
