import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Delete } from "lucide-react";

interface PriceOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemImage?: string;
  originalPrice: number;
  onApply: (newPrice: number, reason: string, notes?: string) => void;
}

const overrideReasons = [
  "Manager Discount",
  "Price Match",
  "Damaged Item",
  "Promotional Offer",
  "Loyalty Discount",
  "Other"
];

const PriceOverrideDialog = ({
  open,
  onOpenChange,
  itemName,
  itemImage,
  originalPrice,
  onApply
}: PriceOverrideDialogProps) => {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [newPriceInput, setNewPriceInput] = useState<string>("0.00");
  const [notes, setNotes] = useState<string>("");
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedReason("");
      setNewPriceInput("0.00");
      setNotes("");
      setShowNotes(false);
    }
  }, [open]);

  useEffect(() => {
    if (selectedReason === "Other") {
      setShowNotes(true);
    } else {
      setShowNotes(false);
      setNotes("");
    }
  }, [selectedReason]);

  const handleNumberClick = (num: string) => {
    setNewPriceInput(prev => {
      // Remove decimal point for calculation
      const cleaned = prev.replace(".", "");
      // Add new digit
      const newValue = cleaned + num;
      // Convert to cents and format
      const cents = parseInt(newValue, 10);
      const dollars = (cents / 100).toFixed(2);
      return dollars;
    });
  };

  const handleBackspace = () => {
    setNewPriceInput(prev => {
      const cleaned = prev.replace(".", "");
      if (cleaned.length <= 1) {
        return "0.00";
      }
      const newValue = cleaned.slice(0, -1);
      const cents = parseInt(newValue, 10);
      const dollars = (cents / 100).toFixed(2);
      return dollars;
    });
  };

  const handleClear = () => {
    setNewPriceInput("0.00");
  };

  const handleApply = () => {
    const newPrice = parseFloat(newPriceInput);
    if (selectedReason && newPrice >= 0) {
      onApply(newPrice, selectedReason, showNotes ? notes : undefined);
      onOpenChange(false);
    }
  };

  const numpadButtons = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [".", "0", "backspace"]
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-none max-h-none rounded-none bg-[#f5f5f5] border-none p-0 gap-0 flex flex-col">
        {/* Slide Down Handle */}
        <div 
          className="flex justify-center py-3 cursor-pointer"
          onClick={() => onOpenChange(false)}
        >
          <div className="w-12 h-1.5 rounded-full bg-neutral-400" />
        </div>

        {/* Header */}
        <DialogHeader className="px-6 pb-4">
          <DialogTitle className="text-center text-xl font-semibold text-neutral-900">
            Price Override
          </DialogTitle>
        </DialogHeader>

        {/* Item Info */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-3">
            {itemImage && (
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white shadow-sm">
                <img src={itemImage} alt={itemName} className="w-full h-full object-cover" />
              </div>
            )}
            <span className="font-medium text-neutral-900">{itemName}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 space-y-4 overflow-auto">
          {/* Reason Dropdown */}
          <Select value={selectedReason} onValueChange={setSelectedReason}>
            <SelectTrigger className="w-full bg-white border-neutral-200 text-neutral-900 shadow-sm">
              <SelectValue placeholder="Select reason for override" />
            </SelectTrigger>
            <SelectContent className="bg-white border-neutral-200">
              {overrideReasons.map((reason) => (
                <SelectItem 
                  key={reason} 
                  value={reason}
                  className="text-neutral-900 hover:bg-neutral-100 focus:bg-neutral-100"
                >
                  {reason}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Notes for "Other" reason */}
          {showNotes && (
            <div className="space-y-2">
              <label className="text-xs text-neutral-500">Please specify the reason for override</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter reason..."
                className="bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400 resize-none h-20"
                maxLength={200}
              />
              <p className="text-xs text-neutral-500 text-right">{notes.length}/200</p>
            </div>
          )}

          {/* Price Display */}
          <div className="rounded-lg p-4 space-y-2 bg-white shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-sm text-red-500">Price</span>
              <span className="text-sm font-medium text-red-500">${originalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-900">New Price</span>
              <span className="text-lg font-semibold text-green-500">${newPriceInput}</span>
            </div>
          </div>

          {/* Numpad */}
          <div className="flex flex-col gap-3 py-4">
            {numpadButtons.map((row, rowIndex) => (
              <div key={rowIndex} className="flex justify-center gap-4">
                {row.map((btn) => (
                  btn === "backspace" ? (
                    <button
                      key={btn}
                      onClick={handleBackspace}
                      className="w-20 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-neutral-100 active:bg-neutral-200 transition-colors"
                    >
                      <Delete className="w-5 h-5 text-neutral-700" />
                    </button>
                  ) : btn === "." ? (
                    <button
                      key={btn}
                      onClick={handleClear}
                      className="w-20 h-14 rounded-xl bg-white shadow-sm text-2xl font-medium text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 transition-colors"
                    >
                      •
                    </button>
                  ) : (
                    <button
                      key={btn}
                      onClick={() => handleNumberClick(btn)}
                      className="w-20 h-14 rounded-xl bg-white shadow-sm text-2xl font-medium text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 transition-colors"
                    >
                      {btn}
                    </button>
                  )
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-6 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100 rounded-full font-semibold"
            onClick={() => onOpenChange(false)}
          >
            CANCEL
          </Button>
          <Button
            className="flex-1 h-12 bg-neutral-300 hover:bg-neutral-400 text-neutral-500 rounded-full font-semibold disabled:opacity-100"
            onClick={handleApply}
            disabled={!selectedReason || parseFloat(newPriceInput) < 0}
          >
            APPLY
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PriceOverrideDialog;
