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
  // Store raw digits (no decimal). E.g. "255" means $2.55
  const [digits, setDigits] = useState("");

  const centsValue = parseInt(digits || "0", 10);
  const dollarValue = centsValue / 100;

  const formatDisplay = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const handleKeyPress = (key: string) => {
    setDigits((prev) => {
      const next = prev + key;
      // Max 7 digits = $99,999.99
      if (next.length > 7) return prev;
      return next;
    });
  };

  const handleDelete = () => {
    setDigits((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setDigits("");
  };

  const handleConfirm = () => {
    if (dollarValue > 0) {
      onConfirm(dollarValue);
      setDigits("");
    }
  };

  const btnClass =
    "h-12 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600 text-white text-xl font-medium transition-all duration-150 active:scale-95 flex items-center justify-center";

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) return; onOpenChange(val); }}>
      <DialogContent
        className="bg-neutral-900 border-neutral-700 p-0 max-w-[360px] w-[90vw] overflow-hidden rounded-xl [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <h2 className="text-white text-base font-semibold">Open Price</h2>
          </div>
          <button
            onClick={() => { onOpenChange(false); setDigits(""); }}
            className="w-7 h-7 rounded-full hover:bg-neutral-700 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pt-3 pb-4">
          {/* Product Name & Helper */}
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <h3 className="text-white text-lg font-bold">{productName}</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-neutral-400 cursor-pointer shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[240px] text-center">
                  This product has no fixed price. Enter the selling price to continue.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Price Display */}
          <div className="mb-4 text-center">
            <div className="inline-flex items-baseline gap-1">
              <span className="text-neutral-500 text-2xl font-light">$</span>
              <span className="text-white text-4xl font-bold tracking-tight tabular-nums">
                {formatDisplay(centsValue)}
              </span>
            </div>
            {centsValue === 0 && (
              <p className="text-neutral-500 text-xs mt-1">Enter Base Price</p>
            )}
          </div>

          {/* Keypad: 1-9 */}
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
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button onClick={() => handleKeyPress("00")} className={btnClass}>
              00
            </button>
            <button onClick={() => handleKeyPress("0")} className={btnClass}>
              0
            </button>
            <button onClick={handleDelete} className={btnClass}>
              <Delete className="w-5 h-5 text-neutral-400" />
            </button>
          </div>

          {/* CTA */}
          <button
            onClick={handleConfirm}
            disabled={dollarValue <= 0}
            className="w-full py-3 bg-white hover:bg-neutral-100 text-black font-semibold rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add to Order — ${dollarValue > 0 ? dollarValue.toFixed(2) : "0.00"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OpenPriceDialog;
