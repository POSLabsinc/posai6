import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Users } from "lucide-react";

interface OrderItem {
  id: number;
  name: string;
  price: number;
  qty: number;
}

interface SplitCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderItems: OrderItem[];
  total: number;
}

export default function SplitCheckDialog({ open, onOpenChange, orderItems, total }: SplitCheckDialogProps) {
  const [splitCount, setSplitCount] = useState(2);
  const [splitMethod, setSplitMethod] = useState<'equal' | 'custom'>('equal');

  const splitAmount = total / splitCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-900 border-neutral-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5" />
            Split Check
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            Divide the check among multiple guests
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Split Method */}
          <div className="flex gap-2">
            <Button
              variant={splitMethod === 'equal' ? 'default' : 'outline'}
              className={`flex-1 ${splitMethod === 'equal' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-neutral-800 border-neutral-600 hover:bg-neutral-700'}`}
              onClick={() => setSplitMethod('equal')}
            >
              Equal Split
            </Button>
            <Button
              variant={splitMethod === 'custom' ? 'default' : 'outline'}
              className={`flex-1 ${splitMethod === 'custom' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-neutral-800 border-neutral-600 hover:bg-neutral-700'}`}
              onClick={() => setSplitMethod('custom')}
            >
              Custom Split
            </Button>
          </div>

          {splitMethod === 'equal' && (
            <>
              {/* Guest Count Selector */}
              <div className="flex items-center justify-between bg-neutral-800 rounded-lg p-4">
                <span className="text-sm text-neutral-300">Number of Guests</span>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-neutral-700 border-neutral-600 hover:bg-neutral-600"
                    onClick={() => setSplitCount(Math.max(2, splitCount - 1))}
                    disabled={splitCount <= 2}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-xl font-bold w-8 text-center">{splitCount}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-neutral-700 border-neutral-600 hover:bg-neutral-600"
                    onClick={() => setSplitCount(Math.min(10, splitCount + 1))}
                    disabled={splitCount >= 10}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Split Preview */}
              <div className="bg-neutral-800 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Total</span>
                  <span className="font-semibold">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Per Person</span>
                  <span className="font-semibold text-orange-400">${splitAmount.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}

          {splitMethod === 'custom' && (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {orderItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-neutral-800 rounded-lg p-3">
                  <div className="flex-1">
                    <span className="text-sm text-white line-clamp-1">{item.name}</span>
                    <span className="text-xs text-neutral-400">${item.price.toFixed(2)} × {item.qty}</span>
                  </div>
                  <Input
                    type="number"
                    placeholder="Guest #"
                    className="w-20 h-8 bg-neutral-700 border-neutral-600 text-center text-sm"
                    min={1}
                    max={10}
                  />
                </div>
              ))}
            </div>
          )}
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
            onClick={() => onOpenChange(false)}
          >
            Apply Split
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
