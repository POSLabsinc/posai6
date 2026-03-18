import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Search, X } from "lucide-react";

interface KDSTicketData {
  id: string;
  orderNumber: number;
  orderType: string;
  tableNumber: string | null;
  serverName: string;
  createdAt: string;
  products: { name: string; qty: number }[];
  status: string;
}

interface MessageKitchenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableId?: string | null;
  serverName?: string;
}

const MAX_LENGTH = 100;
const WARN_THRESHOLD = 90;
const DANGER_THRESHOLD = 95;

const normalizeTableNumber = (raw: string | null | undefined): string => {
  if (!raw) return "";
  return raw.replace(/^Table\s*/i, "").replace(/^T\.?\s*/i, "").trim().toUpperCase();
};

const getOrderItemPreview = (order: KDSTicketData) => {
  const uniqueNames: string[] = [];
  const seen = new Set<string>();
  for (const p of order.products) {
    if (!seen.has(p.name)) {
      seen.add(p.name);
      uniqueNames.push(p.name);
    }
  }
  const first3 = uniqueNames.slice(0, 3).join(", ");
  const remaining = uniqueNames.length - 3;
  if (remaining > 0) return `${first3}... +${remaining} more`;
  return first3;
};

const MessageKitchenDialog = ({ open, onOpenChange, tableId, serverName = "Staff" }: MessageKitchenDialogProps) => {
  const [message, setMessage] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [activeOrders, setActiveOrders] = useState<KDSTicketData[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setMessage("");
      setSelectedOrderId(null);
      setError(null);
      setFieldError(null);
      setSending(false);
      setOrderSearch("");
      setDropdownOpen(false);
      loadActiveOrders();
    }
  }, [open]);

  const loadActiveOrders = () => {
    setLoadingOrders(true);
    try {
      const queue = JSON.parse(localStorage.getItem("kds_ticket_queue") || "[]");
      const realOrders: KDSTicketData[] = queue
        .filter((e: any) => e.status === "active")
        .map((e: any) => ({
          id: e.sessionId || `kds-live-${e.orderNumber}`,
          orderNumber: e.orderNumber || 0,
          orderType: e.orderType || "DINE IN",
          tableNumber: e.tableNumber || null,
          serverName: e.serverName || "Staff",
          createdAt: e.createdAt || new Date().toISOString(),
          products: (e.items || []).map((i: any) => ({ name: i.name, qty: i.qty || 1 })),
          status: "active",
        }));

      if (realOrders.length === 0) {
        const now = new Date();
        const mockOrders: KDSTicketData[] = [
          { id: "kds-1", orderNumber: 23, orderType: "DINE IN", tableNumber: "T2", serverName: "Mia Jones", createdAt: new Date(now.getTime() - 38 * 60000).toISOString(), products: [{ name: "Fried Calamari", qty: 1 }, { name: "Filet Mignon", qty: 1 }, { name: "Meatballs", qty: 2 }, { name: "Meatballs", qty: 1 }, { name: "Grassfed Sirloin Steak", qty: 1 }, { name: "Tres Leches", qty: 1 }], status: "active" },
          { id: "kds-2", orderNumber: 24, orderType: "DINE IN", tableNumber: "T4", serverName: "Dustin H", createdAt: new Date(now.getTime() - 23 * 60000).toISOString(), products: [{ name: "Cheese Selection", qty: 1 }, { name: "Meatballs", qty: 2 }, { name: "Meatballs", qty: 1 }], status: "active" },
          { id: "kds-3", orderNumber: 25, orderType: "DINE IN", tableNumber: "T5", serverName: "Mia Jones", createdAt: new Date(now.getTime() - 23 * 60000).toISOString(), products: [{ name: "Meatballs", qty: 2 }, { name: "Meatballs", qty: 2 }], status: "active" },
          { id: "kds-4", orderNumber: 26, orderType: "DINE IN", tableNumber: "T6", serverName: "Sarah K", createdAt: new Date(now.getTime() - 38 * 60000).toISOString(), products: [{ name: "Cheese Selection", qty: 1 }, { name: "Meatballs", qty: 2 }, { name: "Meatballs", qty: 1 }], status: "active" },
          { id: "kds-5", orderNumber: 24, orderType: "DINE IN", tableNumber: "T8", serverName: "Dustin H", createdAt: new Date(now.getTime() - 23 * 60000).toISOString(), products: [{ name: "Meatballs", qty: 2 }, { name: "Cheese Selection", qty: 1 }], status: "active" },
          { id: "kds-6", orderNumber: 28, orderType: "DINE IN", tableNumber: "T3", serverName: "Mia Jones", createdAt: new Date(now.getTime() - 23 * 60000).toISOString(), products: [{ name: "Cheese Selection", qty: 1 }, { name: "Filet Mignon", qty: 1 }, { name: "Meatballs", qty: 4 }, { name: "Grassfed Sirloin Steak", qty: 2 }, { name: "Tres Leches", qty: 3 }, { name: "Meatballs", qty: 1 }, { name: "Grassfed Sirloin Steak", qty: 2 }, { name: "Grassfed Sirloin Steak", qty: 1 }], status: "active" },
        ];
        setActiveOrders(mockOrders);
      } else {
        setActiveOrders(realOrders);
      }
    } catch {
      setActiveOrders([]);
    }
    setLoadingOrders(false);
  };

  const trimmedMessage = message.trim();
  const charCount = message.length;
  const canSend = trimmedMessage.length > 0 && !sending;

  const counterColorClass = useMemo(() => {
    if (charCount >= DANGER_THRESHOLD) return "text-destructive";
    if (charCount >= WARN_THRESHOLD) return "text-orange-400";
    return "text-neutral-500";
  }, [charCount]);

  const filteredOrders = useMemo(() => {
    if (!orderSearch.trim()) return activeOrders;
    const q = orderSearch.trim().toLowerCase();
    return activeOrders.filter(o => {
      const orderNum = `#${o.orderNumber}`.toLowerCase();
      const tableNum = normalizeTableNumber(o.tableNumber).toLowerCase();
      return orderNum.includes(q) || o.orderNumber.toString().includes(q) || tableNum.includes(q) || (o.tableNumber || "").toLowerCase().includes(q);
    });
  }, [activeOrders, orderSearch]);

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return activeOrders.find(o => o.id === selectedOrderId) || null;
  }, [selectedOrderId, activeOrders]);

  const handleSend = async () => {
    if (trimmedMessage.length === 0) {
      setFieldError("Message cannot be empty");
      return;
    }
    if (!canSend) return;
    setSending(true);
    setError(null);
    setFieldError(null);

    const messageId = crypto.randomUUID();

    let linkedTableId: string | null = null;
    let linkedTableNumber: string | null = null;
    let linkedOrderId: string | null = null;
    let linkedOrderNumber: number | null = null;

    if (selectedOrder) {
      linkedOrderId = selectedOrder.id;
      linkedOrderNumber = selectedOrder.orderNumber;
      if (selectedOrder.tableNumber) {
        linkedTableId = normalizeTableNumber(selectedOrder.tableNumber);
        linkedTableNumber = `Table ${normalizeTableNumber(selectedOrder.tableNumber)}`;
      }
    }

    const payload = {
      message_id: messageId,
      message_text: trimmedMessage,
      store_id: "default",
      terminal_id: "default",
      employee_id: "default",
      employee_name: serverName,
      table_id: linkedTableId,
      table_number: linkedTableNumber,
      linked_order_id: linkedOrderId,
      linked_order_number: linkedOrderNumber,
      timestamp: new Date().toISOString(),
      status: "pending" as const,
    };

    try {
      const queue = JSON.parse(localStorage.getItem("kds_message_queue") || "[]");
      queue.push(payload);
      localStorage.setItem("kds_message_queue", JSON.stringify(queue));

      onOpenChange(false);
      toast.success("Message sent to kitchen ✓", { duration: 3000 });
    } catch (err) {
      setError("Failed to send message. Please try again.");
      toast.error("Failed to send message. Please try again.");
      setSending(false);
    }
  };

  const formatOrderTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const formatTableDisplay = (tableNumber: string | null) => {
    if (!tableNumber) return "No Table";
    return `Table ${normalizeTableNumber(tableNumber)}`;
  };

  return (
    <Dialog open={open} onOpenChange={sending ? undefined : onOpenChange}>
      <DialogContent className="bg-neutral-900 border-neutral-700 text-white max-w-[480px]" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="text-white text-lg">Send Message to Kitchen</DialogTitle>
          <DialogDescription className="sr-only">Send a message to the kitchen display system</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Message Field */}
          <div className="space-y-1.5">
            <label className="text-sm text-neutral-300">Message <span className="text-red-400">*</span></label>
            <Textarea
              value={message}
              onChange={(e) => {
                if (e.target.value.length <= MAX_LENGTH) {
                  setMessage(e.target.value);
                  if (e.target.value.trim().length > 0) setFieldError(null);
                }
              }}
              placeholder="Type your message for the kitchen…"
              className="bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 min-h-[100px] resize-none focus-visible:ring-orange-500"
              maxLength={MAX_LENGTH}
              autoFocus
            />
            {fieldError && (
              <p className="text-xs text-destructive">{fieldError}</p>
            )}
            <div className={`text-xs text-right ${counterColorClass}`}>
              {charCount}/{MAX_LENGTH}
            </div>
          </div>

          {/* Select Order (Optional) */}
          <div className="space-y-1.5">
            <label className="text-sm text-neutral-300">Select Order <span className="text-neutral-500">(Optional)</span></label>

            {/* Selected order display / trigger */}
            {selectedOrder ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 bg-neutral-800 border border-neutral-600 rounded-md px-2.5 py-2">
                  <div className="flex-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">#{selectedOrder.orderNumber}</span>
                      <span className="text-neutral-400">{formatTableDisplay(selectedOrder.tableNumber)}</span>
                      <span className="text-neutral-500">·</span>
                      <span className="text-neutral-400">{selectedOrder.serverName}</span>
                      <span className="text-neutral-500 ml-auto">{formatOrderTime(selectedOrder.createdAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelectedOrderId(null); setDropdownOpen(false); }}
                    className="p-0.5 hover:bg-neutral-700 rounded transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-neutral-400" />
                  </button>
                </div>
                <p className="text-[11px] text-neutral-400 px-1">{getOrderItemPreview(selectedOrder)}</p>
              </div>
            ) : (
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full flex items-center bg-neutral-800 border border-neutral-600 rounded-md px-2.5 py-2 text-xs text-neutral-500 hover:border-neutral-500 transition-colors"
              >
                No Order
              </button>
            )}

            {/* Dropdown list */}
            {dropdownOpen && !selectedOrder && (
              <div className="space-y-1.5">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                  <Input
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search by order number or table..."
                    className="bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 pl-8 h-8 text-xs"
                  />
                </div>
                {loadingOrders ? (
                  <div className="flex items-center gap-2 py-3 justify-center text-neutral-400 text-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Loading orders...
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-3">No active orders at the moment</p>
                ) : (
                  <div className="max-h-[140px] overflow-y-auto space-y-0.5 scrollbar-hide">
                    {filteredOrders.map(order => {
                      const tableDisplay = formatTableDisplay(order.tableNumber);
                      const timeStr = formatOrderTime(order.createdAt);
                      return (
                        <button
                          key={order.id}
                          onClick={() => { setSelectedOrderId(order.id); setDropdownOpen(false); setOrderSearch(""); }}
                          className="w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors bg-neutral-800 hover:bg-neutral-700 border border-transparent"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-white font-semibold">#{order.orderNumber}</span>
                            <span className="text-neutral-400">{tableDisplay}</span>
                            <span className="text-neutral-500">·</span>
                            <span className="text-neutral-400">{order.serverName}</span>
                            <span className="text-neutral-500 ml-auto">{timeStr}</span>
                          </div>
                          <p className="text-[10px] text-neutral-500 mt-0.5">{getOrderItemPreview(order)}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-neutral-800 border-neutral-600 text-white hover:bg-neutral-700"
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!canSend}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
            >
              {sending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending…
                </span>
              ) : "Send"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageKitchenDialog;
