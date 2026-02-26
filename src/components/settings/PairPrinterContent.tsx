import { useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

import hardwarePrinterIcon from "@/assets/icons/hardware-printer.png";
import { useAppearance } from "@/contexts/AppearanceContext";

interface PairPrinterContentProps {
  showHeader?: boolean;
  onBack?: () => void;
}

const PRINTER_TYPES = [
  { id: "kot", label: "Default KOT Printer Model" },
  { id: "bill", label: "Default Bill/Receipt Printer" },
  { id: "custom", label: "Default Custom Item Printer" },
];

const PairPrinterContent = ({ showHeader = true, onBack }: PairPrinterContentProps) => {
  const isMobile = useIsMobile();
  const [selectedPrinters, setSelectedPrinters] = useState<Record<string, string>>({});
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
          <h1 className="text-base font-medium text-foreground absolute left-1/2 -translate-x-1/2">Pair Printer</h1>
          <div className="w-8 h-8" />
        </div>
      )}

      <div className={`${showHeader ? 'pt-2' : 'pt-0'} px-6 pb-28`}>
        {/* Header Card */}
        <div className="bg-neutral-800/60 rounded-2xl p-6 flex flex-col items-start mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
            style={{ backgroundColor: getIconBgColor("#D6336C") }}
          >
            <img src={hardwarePrinterIcon} alt="Pair Printer" className="w-7 h-7 object-contain" />
          </div>
          <h2 className="text-foreground text-lg font-semibold mb-1">Pair Printer</h2>
          <p className="text-neutral-500 text-sm leading-relaxed">
            Printers can generate various reports, such as sales summaries, inventory reports, and employee timecards, to help manage your business effectively.
          </p>
        </div>

        {/* Detect & Test Buttons */}
        <div className="flex gap-3 mb-6">
          <button className="flex-1 bg-neutral-800/60 rounded-full py-3.5 px-4 flex items-center justify-center active:opacity-70 transition-opacity">
            <span className="text-foreground text-base font-medium">Test Print</span>
          </button>
          <button className="flex-1 bg-neutral-800/60 rounded-full py-3.5 px-4 flex items-center justify-center gap-2 active:opacity-70 transition-opacity">
            <Search className="w-4 h-4 text-foreground" />
            <span className="text-foreground text-base font-medium">Detect</span>
          </button>
        </div>

        {/* Printer Type Selections */}
        <div className="space-y-4">
          {PRINTER_TYPES.map((type) => (
            <div key={type.id}>
              <p className="text-xs font-medium text-neutral-500 tracking-wider mb-3">
                {type.label}
              </p>
              <button className="w-full bg-neutral-800/60 rounded-full py-3.5 px-4 flex items-center justify-between active:opacity-70 transition-opacity">
                <span className="text-neutral-500 text-sm">
                  {selectedPrinters[type.id] || "No device connected"}
                </span>
                <ChevronRight className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default PairPrinterContent;
