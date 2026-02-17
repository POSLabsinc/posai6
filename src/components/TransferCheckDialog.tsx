import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import transferCheckIcon from "@/assets/icons/transfer-check.svg";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TransferCheckDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isOpen?: boolean;
  onClose?: () => void;
  currentTable?: string;
  currentServer?: string;
  onTransfer?: (newServerName: string) => void;
}

const tables = [
  { id: "1", name: "Table 1", status: "available" },
  { id: "2", name: "Table 2", status: "occupied" },
  { id: "3", name: "Table 3", status: "available" },
  { id: "4", name: "Table 4", status: "available" },
  { id: "5", name: "Table 5", status: "occupied" },
  { id: "6", name: "Table 6", status: "available" },
  { id: "7", name: "Bar 1", status: "available" },
  { id: "8", name: "Bar 2", status: "occupied" },
  { id: "9", name: "Patio 1", status: "available" },
  { id: "10", name: "Patio 2", status: "available" },
];

const servers = [
  { id: "1", name: "John Smith", tables: 4 },
  { id: "2", name: "Sarah Johnson", tables: 3 },
  { id: "3", name: "Mike Davis", tables: 5 },
  { id: "4", name: "Emily Wilson", tables: 2 },
];

function TransferCheckDialog(props: TransferCheckDialogProps) {
  const open = props.open ?? props.isOpen ?? false;
  const onOpenChange = props.onOpenChange ?? (props.onClose ? (v: boolean) => { if (!v) props.onClose?.(); } : undefined);
  const { currentTable } = props;
  const [transferType, setTransferType] = useState<'table' | 'server'>('table');
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-900 border-neutral-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <img src={transferCheckIcon} alt="" className="w-5 h-5" />
            Transfer Check
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            Transfer this check to another table or server
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Transfer Type */}
          <div className="flex gap-2">
            <Button
              variant={transferType === 'table' ? 'default' : 'outline'}
              className={`flex-1 ${transferType === 'table' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-neutral-800 border-neutral-600 hover:bg-neutral-700'}`}
              onClick={() => {
                setTransferType('table');
                setSelectedTarget(null);
              }}
            >
              To Table
            </Button>
            <Button
              variant={transferType === 'server' ? 'default' : 'outline'}
              className={`flex-1 ${transferType === 'server' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-neutral-800 border-neutral-600 hover:bg-neutral-700'}`}
              onClick={() => {
                setTransferType('server');
                setSelectedTarget(null);
              }}
            >
              To Server
            </Button>
          </div>

          {/* Selection Grid */}
          <ScrollArea className="h-[200px]">
            {transferType === 'table' ? (
              <div className="grid grid-cols-3 gap-2 pr-4">
                {tables.map((table) => (
                  <button
                    key={table.id}
                    disabled={table.status === 'occupied'}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      selectedTarget === table.id
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : table.status === 'occupied'
                        ? 'bg-neutral-800/50 border-neutral-700 text-neutral-500 cursor-not-allowed'
                        : 'bg-neutral-800 border-neutral-600 hover:bg-neutral-700 text-white'
                    }`}
                    onClick={() => setSelectedTarget(table.id)}
                  >
                    <span className="text-sm font-medium">{table.name}</span>
                    {table.status === 'occupied' && (
                      <span className="block text-[10px] text-neutral-500">Occupied</span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2 pr-4">
                {servers.map((server) => (
                  <button
                    key={server.id}
                    className={`w-full p-3 rounded-lg border flex items-center gap-3 transition-colors ${
                      selectedTarget === server.id
                        ? 'bg-orange-500 border-orange-500'
                        : 'bg-neutral-800 border-neutral-600 hover:bg-neutral-700'
                    }`}
                    onClick={() => setSelectedTarget(server.id)}
                  >
                    <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="text-sm font-medium block">{server.name}</span>
                      <span className="text-xs text-neutral-400">{server.tables} tables</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="bg-neutral-800 border-neutral-600 hover:bg-neutral-700"
            onClick={() => onOpenChange?.(false)}
          >
            Cancel
          </Button>
          <Button
            className="bg-orange-500 hover:bg-orange-600"
            disabled={!selectedTarget}
            onClick={() => onOpenChange?.(false)}
          >
            Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { TransferCheckDialog };
export default TransferCheckDialog;
