import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Delete, DollarSign, Pencil } from "lucide-react";

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
  const [priceInput, setPriceInput] = useState("");

  const handleKeyPress = (key: string) => {
    if (key === "." && priceInput.includes(".")) return;
    if (priceInput.includes(".") && priceInput.split(".")[1]?.length >= 2) return;
    if (priceInput.length >= 8) return;
    setPriceInput((prev) => prev + key);
  };

  const handleDelete = () => {
    setPriceInput((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPriceInput("");
  };

  const handleConfirm = () => {
    const price = parseFloat(priceInput);
    if (!isNaN(price) && price > 0) {
      onConfirm(price);
      setPriceInput("");
    }
  };

  const displayPrice = priceInput || "0.00";
  const numericValue = parseFloat(priceInput) || 0;

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) return; onOpenChange(val); }}>
      <DialogContent
        className="bg-neutral-900 border-neutral-700 p-0 max-w-md w-[90vw] overflow-hidden rounded-xl [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-orange-400" />
            </div>
            <h2 className="text-white text-lg font-semibold">Open Price</h2>
          </div>
          <button
            onClick={() => { onOpenChange(false); setPriceInput(""); }}
            className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Product Name */}
          <div className="text-center mb-2">
            <h3 className="text-white text-xl font-bold">{productName}</h3>
            <p className="text-neutral-400 text-sm mt-1">
              This item has no fixed price. Enter the amount to continue.
            </p>
          </div>

          {/* Price Display */}
          <div className="my-6 text-center">
            <div className="inline-flex items-baseline gap-1">
              <span className="text-neutral-500 text-3xl font-light">$</span>
              <span className="text-white text-5xl font-bold tracking-tight">
                {displayPrice}
              </span>
            </div>
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleKeyPress(num.toString())}
                className="h-14 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600 text-white text-2xl font-medium transition-all duration-150 active:scale-95 flex items-center justify-center"
              >
                {num}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <button
              onClick={() => handleKeyPress(".")}
              className="h-14 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600 text-white text-2xl font-medium transition-all duration-150 active:scale-95 flex items-center justify-center"
            >
              .
            </button>
            <button
              onClick={() => handleKeyPress("0")}
              className="h-14 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600 text-white text-2xl font-medium transition-all duration-150 active:scale-95 flex items-center justify-center"
            >
              0
            </button>
            <button
              onClick={() => handleKeyPress("00")}
              className="h-14 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600 text-white text-2xl font-medium transition-all duration-150 active:scale-95 flex items-center justify-center"
            >
              00
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={handleClear}
              className="h-14 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-base font-semibold transition-all duration-150 active:scale-95 flex items-center justify-center gap-2"
            >
              Clear
            </button>
            <button
              onClick={handleDelete}
              className="h-14 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600 transition-all duration-150 active:scale-95 flex items-center justify-center"
            >
              <Delete className="w-6 h-6 text-neutral-400" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-700">
          <button
            onClick={handleConfirm}
            disabled={numericValue <= 0}
            className="w-full py-3 bg-white hover:bg-neutral-100 text-black font-semibold rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add to Order — ${numericValue > 0 ? numericValue.toFixed(2) : "0.00"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OpenPriceDialog;
