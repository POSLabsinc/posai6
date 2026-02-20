import { useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

import hardwarePrinterIcon from "@/assets/icons/hardware-printer.png";

interface PairPrinterContentProps {
  showHeader?: boolean;
  onBack?: () => void;
}

const PRINTER_TYPES = [
  { id: "kot", label: "Default KOT Printer Model" },
  { id: "bill", label: "Default Bill/Receipt Printer" },
  { id: "custom", label: "Default Custom Product Printer" },
];

const PairPrinterContent = ({ showHeader = true, onBack }: PairPrinterContentProps) => {
  const isMobile = useIsMobile();
  const [selectedPrinters, setSelectedPrinters] = useState<Record<string, string>>({});

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
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
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
