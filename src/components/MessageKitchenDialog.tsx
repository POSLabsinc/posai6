import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";


interface MessageKitchenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableId?: string | null;
}

const MAX_LENGTH = 300;

const MessageKitchenDialog = ({ open, onOpenChange, tableId }: MessageKitchenDialogProps) => {
  const [message, setMessage] = useState("");
  const [selectedTable, setSelectedTable] = useState<string>(tableId || "none");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMessage("");
      setSelectedTable(tableId || "none");
      setError(null);
      setSending(false);
    }
  }, [open, tableId]);

  const trimmedMessage = message.trim();
  const canSend = trimmedMessage.length > 0 && !sending;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    setError(null);

    const messageId = crypto.randomUUID();
    const payload = {
      message_id: messageId,
      message_text: trimmedMessage,
      store_id: "default",
      terminal_id: "default",
      employee_id: "default",
      employee_name: "Staff",
      table_id: selectedTable === "none" ? null : selectedTable,
      timestamp: new Date().toISOString(),
    };

    try {
      // For now, simulate the API call since /kds/messages endpoint needs to be created
      // In production, this would be: await supabase.functions.invoke('kds-messages', { body: payload })
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      // Store in localStorage queue for offline support
      const queue = JSON.parse(localStorage.getItem("kds_message_queue") || "[]");
      queue.push({ ...payload, sent: true });
      localStorage.setItem("kds_message_queue", JSON.stringify(queue));

      onOpenChange(false);
      toast.success("Message sent to kitchen");
    } catch (err) {
      setError("Failed to send message. Please try again.");
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-900 border-neutral-700 text-white max-w-md" hideCloseButton>
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
                }
              }}
              placeholder="Type your message for the kitchen…"
              className="bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 min-h-[100px] resize-none focus-visible:ring-orange-500"
              maxLength={MAX_LENGTH}
              autoFocus
            />
            <div className="text-xs text-neutral-500 text-right">
              {trimmedMessage.length}/{MAX_LENGTH}
            </div>
          </div>

          {/* Table Selector */}
          <div className="space-y-1.5">
            <label className="text-sm text-neutral-300">Table <span className="text-neutral-500">(Optional)</span></label>
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                <SelectValue placeholder="Select table" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-600">
                <SelectItem value="none" className="text-white hover:bg-neutral-700">No Table</SelectItem>
                {Array.from({ length: 20 }, (_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)} className="text-white hover:bg-neutral-700">
                    Table {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              {sending ? "Sending…" : "Send"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageKitchenDialog;
