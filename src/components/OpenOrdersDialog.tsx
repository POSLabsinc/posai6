import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, User, DollarSign } from "lucide-react";
import openOrdersIcon from "@/assets/icons/open-orders.svg";

interface OpenOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectOrder: (orderId: string) => void;
}

const openOrders = [
  { id: "1001", table: "Table 3", guest: "John D.", total: 45.99, time: "12:30 PM", items: 4 },
  { id: "1002", table: "Bar 2", guest: "Sarah M.", total: 28.50, time: "12:45 PM", items: 2 },
  { id: "1003", table: "Patio 1", guest: "Mike R.", total: 67.25, time: "1:00 PM", items: 5 },
  { id: "1004", table: "Table 7", guest: "Emily W.", total: 34.00, time: "1:15 PM", items: 3 },
  { id: "1005", table: "Table 1", guest: "Guest", total: 22.75, time: "1:30 PM", items: 2 },
];

export default function OpenOrdersDialog({ open, onOpenChange, onSelectOrder }: OpenOrdersDialogProps) {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const handleSelect = () => {
    if (selectedOrder) {
      onSelectOrder(selectedOrder);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-900 border-neutral-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <img src={openOrdersIcon} alt="" className="w-5 h-5" />
            Open Orders
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            Select an order to view or continue
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-2">
            {openOrders.map((order) => (
              <button
                key={order.id}
                className={`w-full p-4 rounded-lg border transition-colors text-left ${
                  selectedOrder === order.id
                    ? 'bg-orange-500/20 border-orange-500'
                    : 'bg-neutral-800 border-neutral-600 hover:bg-neutral-700'
                }`}
                onClick={() => setSelectedOrder(order.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">#{order.id}</span>
                    <span className="text-neutral-400">•</span>
                    <span className="text-orange-400">{order.table}</span>
                  </div>
                  <span className="text-lg font-bold">${order.total.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-neutral-400">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{order.guest}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{order.time}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>{order.items} items</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            className="flex-1 bg-neutral-800 border-neutral-600 hover:bg-neutral-700"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-orange-500 hover:bg-orange-600"
            disabled={!selectedOrder}
            onClick={handleSelect}
          >
            Open Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
