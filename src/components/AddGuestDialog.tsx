import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus } from "lucide-react";
import addGuestIcon from "@/assets/icons/add-guest.svg";

interface AddGuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentGuestCount: number;
  onUpdate: (count: number) => void;
}

export default function AddGuestDialog({ open, onOpenChange, currentGuestCount, onUpdate }: AddGuestDialogProps) {
  const [guestCount, setGuestCount] = useState(currentGuestCount || 1);

  const handleUpdate = () => {
    onUpdate(guestCount);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-900 border-neutral-700 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <img src={addGuestIcon} alt="" className="w-5 h-5" />
            Guest Count
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            Set the number of guests for this order
          </DialogDescription>
        </DialogHeader>

        <div className="py-8">
          {/* Guest Count Selector */}
          <div className="flex items-center justify-center gap-6">
            <Button
              variant="outline"
              size="icon"
              className="h-14 w-14 rounded-full bg-neutral-800 border-neutral-600 hover:bg-neutral-700"
              onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
              disabled={guestCount <= 1}
            >
              <Minus className="w-6 h-6" />
            </Button>
            
            <div className="text-center">
              <span className="text-5xl font-bold">{guestCount}</span>
              <p className="text-neutral-400 text-sm mt-1">
                {guestCount === 1 ? 'Guest' : 'Guests'}
              </p>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              className="h-14 w-14 rounded-full bg-neutral-800 border-neutral-600 hover:bg-neutral-700"
              onClick={() => setGuestCount(Math.min(20, guestCount + 1))}
              disabled={guestCount >= 20}
            >
              <Plus className="w-6 h-6" />
            </Button>
          </div>

          {/* Quick Select */}
          <div className="flex justify-center gap-2 mt-8">
            {[1, 2, 4, 6, 8].map((num) => (
              <button
                key={num}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                  guestCount === num
                    ? 'bg-orange-500 text-white'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
                onClick={() => setGuestCount(num)}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="bg-neutral-800 border-neutral-600 hover:bg-neutral-700"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="bg-orange-500 hover:bg-orange-600"
            onClick={handleUpdate}
          >
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
