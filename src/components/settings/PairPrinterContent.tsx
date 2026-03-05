import { useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import hardwarePrinterIcon from "@/assets/icons/hardware-printer.png";
import { useAppearance } from "@/contexts/AppearanceContext";

interface PairPrinterContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const PRINTER_TYPES = [
  { id: "kot", label: "Default KOT Printer Model" },
  { id: "bill", label: "Default Bill/Receipt Printer" },
  { id: "custom", label: "Default Custom Item Printer" },
];

const PairPrinterContent = ({ showHeader = true, onBack, onAIClick }: PairPrinterContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
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
          <div className="overflow-visible flex items-center justify-center" style={{ width: 32, height: 32 }}>
            <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />
          </div>
        </div>
      )}

      <div className="px-6 pb-28">
        <div className="mb-4 px-1 pt-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
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
