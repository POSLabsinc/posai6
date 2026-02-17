import { ChevronLeft, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

import hardwarePrinterIcon from "@/assets/icons/hardware-printer.png";

interface PrinterContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onNavigate?: (path: string) => void;
}

const PrinterContent = ({ showHeader = true, onBack, onNavigate }: PrinterContentProps) => {
  const isMobile = useIsMobile();
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
            style={{ backgroundColor: "#D6336C" }}
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
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "#D6336C" }}
              >
                <img src={hardwarePrinterIcon} alt="Pair Printer" className="w-5 h-5 object-contain" />
              </div>
              <span className="text-foreground text-base font-medium">Pair Printer</span>
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
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "#5E4DD8" }}
              >
                <img src={hardwarePrinterIcon} alt="Advanced Settings" className="w-5 h-5 object-contain" />
              </div>
              <span className="text-foreground text-base font-medium">Advanced Settings</span>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrinterContent;
