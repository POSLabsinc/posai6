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
      <DialogContent className="sm:max-w-[420px] bg-[#1a1a1a] border-neutral-700 p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-neutral-700">
          <DialogTitle className="flex items-center gap-3 text-foreground">
            {itemImage && (
              <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-800">
                <img src={itemImage} alt={itemName} className="w-full h-full object-cover" />
              </div>
            )}
            <span className="font-semibold">Price Override</span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            {!itemImage && (
              <span className="w-6 h-6 rounded bg-neutral-800 flex items-center justify-center text-xs">🍔</span>
            )}
            {itemName}
          </p>
        </DialogHeader>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Reason Dropdown */}
          <Select value={selectedReason} onValueChange={setSelectedReason}>
            <SelectTrigger className="w-full bg-neutral-800 border-neutral-700 text-foreground">
              <SelectValue placeholder="Select reason for override" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-neutral-700">
              {overrideReasons.map((reason) => (
                <SelectItem 
                  key={reason} 
                  value={reason}
                  className="text-foreground hover:bg-neutral-700 focus:bg-neutral-700"
                >
                  {reason}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Notes for "Other" reason */}
          {showNotes && (
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Please specify the reason for override</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter reason..."
                className="bg-neutral-800 border-neutral-700 text-foreground placeholder:text-muted-foreground resize-none h-20"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground text-right">{notes.length}/200</p>
            </div>
          )}

          {/* Price Display */}
          <div className="rounded-lg p-4 space-y-2" style={{ background: 'rgba(117, 117, 117, 0.3)' }}>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Price</span>
              <span className="text-sm font-medium text-foreground">${originalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">New Price</span>
              <span className="text-lg font-semibold text-green-500">${newPriceInput}</span>
            </div>
          </div>

          {/* Numpad */}
          <div className="flex flex-col gap-2">
            {numpadButtons.map((row, rowIndex) => (
              <div key={rowIndex} className="flex justify-center gap-2">
                {row.map((btn) => (
                  btn === "backspace" ? (
                    <button
                      key={btn}
                      onClick={handleBackspace}
                      className="w-[100px] h-12 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
                    >
                      <Delete className="w-5 h-5 text-foreground" />
                    </button>
                  ) : btn === "." ? (
                    <button
                      key={btn}
                      onClick={handleClear}
                      className="w-[100px] h-12 rounded-lg bg-neutral-800 border border-neutral-700 text-lg font-medium text-foreground hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
                    >
                      •
                    </button>
                  ) : (
                    <button
                      key={btn}
                      onClick={() => handleNumberClick(btn)}
                      className="w-[100px] h-12 rounded-lg bg-neutral-800 border border-neutral-700 text-xl font-medium text-foreground hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
                    >
                      {btn}
                    </button>
                  )
                ))}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 bg-transparent border-neutral-600 text-foreground hover:bg-neutral-800"
              onClick={() => onOpenChange(false)}
            >
              CANCEL
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              onClick={handleApply}
              disabled={!selectedReason || parseFloat(newPriceInput) < 0}
            >
              APPLY
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PriceOverrideDialog;
