import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Delete, DollarSign, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface OpenPriceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  onConfirm: (price: number) => void;
}

export const OpenPriceDialog = ({
  open,
  onOpenChange,
  productName,
  onConfirm,
}: OpenPriceDialogProps) => {
  // Store raw digits (cents). E.g. "20000" means $200.00
  const [digits, setDigits] = useState("");

  const centsValue = parseInt(digits || "0", 10);
  const dollarValue = centsValue / 100;
  const hasPrice = dollarValue > 0;

  // Format as $0.00 from cents
  const formatDisplay = (cents: number) => {
    return (cents / 100).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleKeyPress = (key: string) => {
    setDigits((prev) => {
      // Handle "00" — don't allow if it would create leading zeros
      const next = prev + key;
      // Strip leading zeros beyond natural representation
      const stripped = next.replace(/^0+/, "") || "0";
      // Max 7 digits = $99,999.99
      if (stripped.length > 7) return prev;
      // Prevent all-zero leading: e.g., pressing "0" when empty stays "0"
      if (stripped === "0" && key !== "00") return prev === "" ? "" : prev;
      return stripped === "0" ? prev : stripped;
    });
  };

  const handleZero = () => {
    setDigits((prev) => {
      if (prev === "") return ""; // prevent leading zero
      const next = prev + "0";
      if (next.length > 7) return prev;
      return next;
    });
  };

  const handleDoubleZero = () => {
    setDigits((prev) => {
      if (prev === "") return ""; // prevent leading zeros
      const next = prev + "00";
      if (next.length > 7) return prev;
      return next;
    });
  };

  const handleDelete = () => {
    setDigits((prev) => prev.slice(0, -1));
  };

  const handleConfirm = () => {
    if (hasPrice) {
      onConfirm(dollarValue);
      setDigits("");
    }
  };

  const btnClass =
    "h-12 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600 text-white text-xl font-medium transition-all duration-150 active:scale-95 flex items-center justify-center select-none";

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) return; onOpenChange(val); }}>
      <DialogContent
        className="bg-neutral-900 border-neutral-700 p-0 max-w-[340px] w-[90vw] overflow-hidden rounded-2xl [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <h2 className="text-white text-sm font-semibold tracking-wide">Open Price</h2>
          </div>
          <button
            onClick={() => { onOpenChange(false); setDigits(""); }}
            className="w-7 h-7 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pt-4 pb-4">
          {/* Product Name & Info Tooltip */}
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <h3 className="text-white text-base font-bold text-center leading-tight">{productName}</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-neutral-500 cursor-pointer shrink-0 hover:text-neutral-300 transition-colors" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[220px] text-center text-xs">
                  This item has no fixed price. Enter the selling price before adding.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Price Display Area */}
          <div className="mb-4 text-center">
            <p className="text-neutral-500 text-[10px] font-medium uppercase tracking-widest mb-1">Base Price</p>
            <div className="inline-flex items-baseline gap-1">
              <span className="text-neutral-400 text-2xl font-light">$</span>
              <span className={`text-4xl font-bold tracking-tight tabular-nums transition-colors ${hasPrice ? "text-white" : "text-neutral-600"}`}>
                {formatDisplay(centsValue)}
              </span>
            </div>
            {/* Helper text when no price entered */}
            <div className={`mt-1.5 transition-all duration-200 ${hasPrice ? "opacity-0 h-0 overflow-hidden" : "opacity-100 h-4"}`}>
              <p className="text-orange-400/70 text-[10px] font-medium">Enter base price to continue</p>
            </div>
          </div>

          {/* Keypad: 1–9 */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleKeyPress(num.toString())}
                className={btnClass}
              >
                {num}
              </button>
            ))}
          </div>

          {/* Last row: 00, 0, ⌫ */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button onClick={handleDoubleZero} className={btnClass}>
              00
            </button>
            <button onClick={handleZero} className={btnClass}>
              0
            </button>
            <button onClick={handleDelete} className={btnClass}>
              <Delete className="w-5 h-5 text-neutral-400" />
            </button>
          </div>

          {/* CTA */}
          <button
            onClick={handleConfirm}
            disabled={!hasPrice}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 disabled:cursor-not-allowed"
            style={hasPrice ? {
              background: "linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)",
              color: "white",
              opacity: 1,
            } : {
              background: "#262626",
              color: "#525252",
              opacity: 1,
            }}
          >
            {hasPrice
              ? `Continue — $${formatDisplay(centsValue)}`
              : "Enter Price to Continue"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OpenPriceDialog;
