import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { RotateCcw, Search, Clock, User, CheckCircle } from "lucide-react";

interface ReopenCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReopenCheck: (checkId: string) => void;
}

const closedChecks = [
  { id: "0998", table: "Table 5", guest: "Alex T.", total: 89.50, closedAt: "11:45 AM", paymentMethod: "Credit Card" },
  { id: "0997", table: "Bar 1", guest: "Chris P.", total: 34.25, closedAt: "11:30 AM", paymentMethod: "Cash" },
  { id: "0996", table: "Table 2", guest: "Jordan K.", total: 156.00, closedAt: "11:15 AM", paymentMethod: "Credit Card" },
  { id: "0995", table: "Patio 2", guest: "Taylor S.", total: 42.75, closedAt: "11:00 AM", paymentMethod: "Gift Card" },
  { id: "0994", table: "Table 8", guest: "Morgan L.", total: 67.00, closedAt: "10:45 AM", paymentMethod: "Credit Card" },
];

export default function ReopenCheckDialog({ open, onOpenChange, onReopenCheck }: ReopenCheckDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCheck, setSelectedCheck] = useState<string | null>(null);

  const filteredChecks = closedChecks.filter(check => 
    check.id.includes(searchQuery) ||
    check.guest.toLowerCase().includes(searchQuery.toLowerCase()) ||
    check.table.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReopen = () => {
    if (selectedCheck) {
      onReopenCheck(selectedCheck);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-900 border-neutral-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <RotateCcw className="w-5 h-5" />
            Reopen Check
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            Search and reopen a recently closed check
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by check #, guest, or table..."
              className="pl-10 bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500"
            />
          </div>

          {/* Closed Checks List */}
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {filteredChecks.map((check) => (
                <button
                  key={check.id}
                  className={`w-full p-4 rounded-lg border transition-colors text-left ${
                    selectedCheck === check.id
                      ? 'bg-orange-500/20 border-orange-500'
                      : 'bg-neutral-800 border-neutral-600 hover:bg-neutral-700'
                  }`}
                  onClick={() => setSelectedCheck(check.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-amber-500" />
                      <span className="font-bold">#{check.id}</span>
                      <span className="text-neutral-400">•</span>
                      <span className="text-orange-400">{check.table}</span>
                    </div>
                    <span className="text-lg font-bold">${check.total.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-neutral-400">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{check.guest}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Closed {check.closedAt}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-neutral-500">
                    Paid via {check.paymentMethod}
                  </div>
                </button>
              ))}
              
              {filteredChecks.length === 0 && (
                <div className="text-center py-8 text-neutral-400">
                  No closed checks found
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

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
            disabled={!selectedCheck}
            onClick={handleReopen}
          >
            Reopen Check
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
