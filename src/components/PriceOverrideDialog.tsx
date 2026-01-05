import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Delete, Fingerprint, ScanLine } from "lucide-react";

interface PriceOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemImage?: string;
  originalPrice: number;
  onApply: (newPrice: number, reason: string, notes?: string) => void;
  isManager?: boolean; // If true, skip MPIN screen
  correctPin?: string; // Expected PIN for validation
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
  onApply,
  isManager = false,
  correctPin = "1234"
}: PriceOverrideDialogProps) => {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [newPriceInput, setNewPriceInput] = useState<string>("0.00");
  const [notes, setNotes] = useState<string>("");
  const [showNotes, setShowNotes] = useState(false);
  
  // MPIN state
  const [pinVerified, setPinVerified] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedReason("");
      setNewPriceInput("0.00");
      setNotes("");
      setShowNotes(false);
      setPin("");
      setPinVerified(false);
      setPinError(false);
    } else if (isManager) {
      // Skip MPIN for managers
      setPinVerified(true);
    }
  }, [open, isManager]);

  useEffect(() => {
    if (selectedReason === "Other") {
      setShowNotes(true);
    } else {
      setShowNotes(false);
      setNotes("");
    }
  }, [selectedReason]);

  // Check PIN when 4 digits entered
  useEffect(() => {
    if (pin.length === 4) {
      if (pin === correctPin) {
        setPinVerified(true);
        setPinError(false);
      } else {
        setPinError(true);
        setTimeout(() => {
          setPin("");
          setPinError(false);
        }, 500);
      }
    }
  }, [pin, correctPin]);

  const handlePinNumberClick = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
    }
  };

  const handlePinBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handlePinClear = () => {
    setPin("");
  };

  const handleNumberClick = (num: string) => {
    setNewPriceInput(prev => {
      const cleaned = prev.replace(".", "");
      const newValue = cleaned + num;
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

  const handleApply = () => {
    const newPrice = parseFloat(newPriceInput);
    if (selectedReason && newPrice >= 0) {
      onApply(newPrice, selectedReason, showNotes ? notes : undefined);
      onOpenChange(false);
    }
  };

  // Render PIN dots
  const renderPinDots = () => {
    return (
      <div className="flex justify-center gap-4 py-6">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`w-12 h-12 flex items-center justify-center text-3xl transition-all ${
              pinError ? 'animate-shake' : ''
            }`}
          >
            {index < pin.length ? (
              <span className="text-foreground">✱</span>
            ) : (
              <span className="text-neutral-500">✱</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  // MPIN Access Screen
  const renderMpinScreen = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="text-center pt-8 pb-4">
        <h2 className="text-xl font-semibold text-foreground">Access Restricted</h2>
        <p className="text-sm text-muted-foreground mt-1">Enter Manager PIN to Adjust Price.</p>
      </div>

      {/* PIN Dots */}
      {renderPinDots()}

      {/* Numpad */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-4">
        <div className="flex flex-col gap-2">
          {[["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"]].map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-2">
              {row.map((btn) => (
                <button
                  key={btn}
                  onClick={() => handlePinNumberClick(btn)}
                  className="w-[100px] h-14 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xl font-medium text-neutral-900 dark:text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-700 active:bg-neutral-300 dark:active:bg-neutral-600 transition-colors"
                >
                  {btn}
                </button>
              ))}
            </div>
          ))}
          {/* Last row: backspace, 0, clear */}
          <div className="flex justify-center gap-2">
            <button
              onClick={handlePinBackspace}
              className="w-[100px] h-14 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 active:bg-neutral-300 dark:active:bg-neutral-600 transition-colors"
            >
              <Delete className="w-5 h-5 text-neutral-900 dark:text-foreground" />
            </button>
            <button
              onClick={() => handlePinNumberClick("0")}
              className="w-[100px] h-14 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xl font-medium text-neutral-900 dark:text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-700 active:bg-neutral-300 dark:active:bg-neutral-600 transition-colors"
            >
              0
            </button>
            <button
              onClick={handlePinClear}
              className="w-[100px] h-14 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 active:bg-neutral-300 dark:active:bg-neutral-600 transition-colors"
            >
              <span className="text-xl font-bold text-red-500">C</span>
            </button>
          </div>
        </div>

        {/* Biometric buttons */}
        <div className="flex justify-center gap-3 mt-6">
          <button className="flex-1 max-w-[154px] h-14 rounded-xl bg-neutral-800 dark:bg-neutral-900 flex items-center justify-center hover:bg-neutral-700 dark:hover:bg-neutral-800 transition-colors">
            <Fingerprint className="w-6 h-6 text-neutral-400" />
          </button>
          <button className="flex-1 max-w-[154px] h-14 rounded-xl bg-neutral-800 dark:bg-neutral-900 flex items-center justify-center hover:bg-neutral-700 dark:hover:bg-neutral-800 transition-colors">
            <ScanLine className="w-6 h-6 text-neutral-400" />
          </button>
        </div>
      </div>
    </div>
  );

  // Price Override Screen
  const renderPriceScreen = () => (
    <>
      {/* Grab Bar - mobile only */}
      <div 
        className="flex justify-center py-3 cursor-grab active:cursor-grabbing sm:hidden"
        onClick={() => onOpenChange(false)}
      >
        <div className="w-12 h-1.5 bg-neutral-600 rounded-full" />
      </div>

      {/* Header */}
      <DialogHeader className="px-6 pt-6 sm:pt-6 pb-4 border-b border-neutral-700">
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
      <div className="flex-1 flex flex-col justify-center p-6 space-y-4 overflow-auto">
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
          {[["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"]].map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-2">
              {row.map((btn) => (
                <button
                  key={btn}
                  onClick={() => handleNumberClick(btn)}
                  className="w-[100px] h-12 rounded-lg bg-neutral-800 border border-neutral-700 text-xl font-medium text-foreground hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
                >
                  {btn}
                </button>
              ))}
            </div>
          ))}
          {/* Last row with 0 and backspace spanning full width */}
          <div className="flex justify-center gap-2">
            <button
              onClick={() => handleNumberClick("0")}
              className="w-[154px] h-12 rounded-lg bg-neutral-800 border border-neutral-700 text-xl font-medium text-foreground hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="w-[154px] h-12 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
            >
              <Delete className="w-5 h-5 text-foreground" />
            </button>
          </div>
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
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-none max-h-none rounded-none sm:w-[480px] sm:h-auto sm:max-h-[90vh] sm:rounded-xl bg-[#1a1a1a] border-none sm:border sm:border-neutral-700 p-0 gap-0 flex flex-col overflow-hidden">
        {pinVerified ? renderPriceScreen() : renderMpinScreen()}
      </DialogContent>
    </Dialog>
  );
};

export default PriceOverrideDialog;
