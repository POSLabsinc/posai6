import { useState, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import OrderLayoutTemplate from "@/components/OrderLayoutTemplate";
import { ticketToTemplateData } from "@/data/ticketOrders";
import { formatPrice } from "@/lib/orderUtils";
import { useTicketOrders, UnifiedTicketOrder } from "@/hooks/use-ticket-orders";
import { toast } from "sonner";

const MAX_LENGTH = 300;
const WARN_THRESHOLD = 270;
const DANGER_THRESHOLD = 295;

const normalizeTableNumber = (raw: string | null | undefined): string => {
  if (!raw) return "";
  return raw.replace(/^Table\s*/i, "").replace(/^T\.?\s*/i, "").trim().toUpperCase();
};

interface MessageKitchenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverName?: string;
}

const MessageKitchenDialog = ({ open, onOpenChange, serverName = "Staff" }: MessageKitchenDialogProps) => {
  const { orders: allOrders, isLoading } = useTicketOrders();

  const [message, setMessage] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [showError, setShowError] = useState(false);

  // Reset state when popup opens
  useEffect(() => {
    if (open) {
      setMessage("");
      setSelectedOrderId(null);
      setSending(false);
      setShowError(false);
    }
  }, [open]);

  const trimmedMessage = message.trim();
  const charCount = message.length;
  const canSend = trimmedMessage.length > 0 && !sending;

  const counterColorClass = useMemo(() => {
    if (charCount >= DANGER_THRESHOLD) return "text-destructive";
    if (charCount >= WARN_THRESHOLD) return "text-orange-400";
    return "text-neutral-500";
  }, [charCount]);

  // Filter active orders only (Ordering, Ordered, Preparing)
  const availableOrders = useMemo(() =>
    allOrders.filter(o => {
      const s = o.status.toUpperCase();
      return s === "ORDERING" || s === "ORDERED" || s === "PREPARING";
    }),
    [allOrders]
  );

  const selectedOrder = selectedOrderId ? availableOrders.find(o => o.id === selectedOrderId) : null;

  const handleClose = () => {
    if (sending) return;
    onOpenChange(false);
  };

  const handleSend = async () => {
    if (trimmedMessage.length === 0) {
      setShowError(true);
      return;
    }
    if (!canSend) return;
    setSending(true);

    const messageId = crypto.randomUUID();
    let linkedTableNumber: string | null = null;
    let linkedOrderNumber: number | null = null;

    if (selectedOrder) {
      linkedOrderNumber = selectedOrder.orderNumber || null;
      if (selectedOrder.table) {
        const norm = normalizeTableNumber(selectedOrder.table);
        linkedTableNumber = norm ? `Table ${norm}` : null;
      }
    }

    const payload = {
      message_id: messageId,
      message_text: trimmedMessage,
      store_id: "default",
      terminal_id: "default",
      employee_id: "default",
      employee_name: serverName,
      table_id: linkedTableNumber ? normalizeTableNumber(selectedOrder?.table || null) : null,
      table_number: linkedTableNumber,
      linked_order_id: selectedOrder?.id || null,
      linked_order_number: linkedOrderNumber,
      timestamp: new Date().toISOString(),
      status: "pending" as const,
    };

    try {
      const queue = JSON.parse(localStorage.getItem("kds_message_queue") || "[]");
      queue.push(payload);
      localStorage.setItem("kds_message_queue", JSON.stringify(queue));

      onOpenChange(false);
      toast.success("Message sent to kitchen \u2713", { duration: 3000 });
    } catch {
      toast.error("Failed to send message. Please try again.");
      setSending(false);
    }
  };

  // Convert UnifiedTicketOrder to ticketToTemplateData format
  const toTemplateData = (order: UnifiedTicketOrder) => ticketToTemplateData({
    id: order.id,
    name: order.name,
    table: order.table || "",
    partySize: order.partySize,
    time: order.time,
    timer: order.timer || "00:00",
    server: order.server,
    check: order.check || "--",
    revenueCenter: order.revenueCenter || "",
    paymentType: order.paymentType || "--",
    phone: order.phone || "",
    orderType: order.orderType || "",
    status: order.status,
    total: order.total,
    subtotal: order.subtotal,
    discount: order.discount,
    serviceCharge: order.serviceCharge,
    tax: order.tax,
    tip: order.tip,
    items: order.items,
    notes: order.notes || "",
  } as any);

  const sendLabel = selectedOrder
    ? `SEND TO ORDER #${selectedOrder.orderNumber || 0}`
    : "SEND MESSAGE";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="bg-neutral-900 border-white/10 p-0 max-w-lg overflow-hidden" aria-describedby={undefined}>
        {/* Header - same structure as Transfer to Order */}
        <div className="p-4 border-b border-white/10">
          <h2 className="text-white text-lg font-semibold">Send Message to Kitchen</h2>
        </div>

        {/* Message compose card - fixed above scrollable list */}
        <div className="px-4 pt-2">
          <div className="rounded-xl border border-white/[0.25] overflow-hidden" style={{ backgroundColor: '#1B1C20' }}>
            <div className="p-3">
              <label className="text-sm text-white font-medium">
                Message <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={message}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_LENGTH) {
                    setMessage(e.target.value);
                    if (e.target.value.trim().length > 0) setShowError(false);
                  }
                }}
                placeholder="Type your message for the kitchen..."
                className="mt-1.5 bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 min-h-[80px] resize-none focus-visible:ring-orange-500"
                maxLength={MAX_LENGTH}
                autoFocus
                disabled={sending}
              />
              <div className="flex items-center justify-between mt-1">
                {showError && trimmedMessage.length === 0 ? (
                  <span className="text-destructive text-xs">Message cannot be empty</span>
                ) : (
                  <span />
                )}
                <span className={`text-xs ${counterColorClass}`}>
                  {charCount}/{MAX_LENGTH}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable order list - same card structure as Transfer to Order */}
        <ScrollArea className="max-h-[45vh]">
          <div className="p-4 pt-2 space-y-3">
            {isLoading ? (
              <div className="py-8 text-center text-white/50 text-sm">Loading orders...</div>
            ) : availableOrders.length === 0 ? (
              <div className="py-8 text-center text-white/50 text-sm">No active orders at the moment</div>
            ) : (
              availableOrders.map((order) => {
                const isSelected = selectedOrderId === order.id;
                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrderId(isSelected ? null : order.id)}
                    className={`w-full rounded-xl border overflow-hidden text-left transition-all ${isSelected ? 'border-orange-500 ring-1 ring-orange-500/30' : 'border-white/[0.25] hover:border-white/40'}`}
                    style={{ backgroundColor: '#1B1C20' }}
                  >
                    <div className="p-3">
                      <OrderLayoutTemplate order={toTemplateData(order)} showBorder={false} />
                      <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <span className="w-7 h-7 rounded-md border border-white/20 text-white text-xs font-medium flex items-center justify-center flex-shrink-0">{item.qty}</span>
                              <span className="text-white text-sm truncate">{item.name}</span>
                            </div>
                            <span className="text-white/70 text-sm font-medium flex-shrink-0 ml-2">{formatPrice(item.price * item.qty)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                        <span className="text-white/50 text-sm">{order.items.length} items</span>
                        <span className="text-white font-semibold text-sm">{formatPrice(order.items.reduce((s, i) => s + i.price * i.qty, 0))}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Bottom CTA bar - same as Transfer to Order */}
        <div className="p-4 border-t border-white/10 flex gap-3">
          <button
            onClick={handleClose}
            disabled={sending}
            className="flex-1 py-2.5 rounded-full font-medium text-sm bg-neutral-800 text-white hover:bg-neutral-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`flex-1 py-2.5 rounded-full font-medium text-sm flex items-center justify-center gap-2 ${canSend ? 'text-black' : 'text-black/50 opacity-50'}`}
            style={canSend ? { background: "linear-gradient(180deg, #F97316 0%, #EA580C 100%)" } : { background: '#555' }}
          >
            {sending && <Loader2 className="w-4 h-4 animate-spin" />}
            {sendLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageKitchenDialog;
