import { useState, useEffect, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";

interface KDSMessageData {
  message_id: string;
  message_text: string;
  store_id: string;
  terminal_id: string;
  terminal_name?: string;
  employee_id: string;
  employee_name: string;
  employee_role?: string;
  table_id: string | null;
  table_number?: string | null;
  linked_order_id?: string | null;
  linked_order_number?: number | null;
  linked_order_ids?: string[] | null;
  link_type?: string;
  timestamp: string;
  status: "pending" | "acknowledged";
  acknowledged_at?: string;
}

interface KDSReplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: KDSMessageData | null;
  onSendReply: (messageId: string, text: string) => void;
  hasReplied?: boolean;
}

const MAX_LENGTH = 150;
const WARN_THRESHOLD = 120;
const DANGER_THRESHOLD = 145;

const QUICK_REPLIES = ["Got it", "On its way", "5 mins", "Need more time", "Out of stock"];

const KDSReplyDialog = ({ open, onOpenChange, message, onSendReply, hasReplied = false }: KDSReplyDialogProps) => {
  const [text, setText] = useState("");
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [qrExpiry, setQrExpiry] = useState(600);
  const [qrExpired, setQrExpired] = useState(false);
  const [qrKey, setQrKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset state on open
  useEffect(() => {
    if (open) {
      setText("");
      setSelectedChip(null);
      setSending(false);
      setQrExpiry(600);
      setQrExpired(false);
      setQrKey(prev => prev + 1);
    }
  }, [open]);

  // QR countdown timer
  useEffect(() => {
    if (!open) return;
    timerRef.current = setInterval(() => {
      setQrExpiry(prev => {
        if (prev <= 1) {
          setQrExpired(true);
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [open, qrKey]);

  if (!message) return null;

  const charCount = text.length;
  const canSend = text.trim().length > 0 && !sending;

  const counterColorClass = charCount >= DANGER_THRESHOLD
    ? "text-destructive"
    : charCount >= WARN_THRESHOLD
      ? "text-orange-400"
      : "text-neutral-500";

  const handleChipClick = (chip: string) => {
    if (selectedChip === chip) {
      setSelectedChip(null);
      setText("");
    } else {
      setSelectedChip(chip);
      setText(chip);
    }
  };

  const handleTextChange = (val: string) => {
    if (val.length <= MAX_LENGTH) {
      setText(val);
      if (selectedChip) setSelectedChip(null);
    }
  };

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      onSendReply(message.message_id, text.trim());
      onOpenChange(false);
    } catch {
      setSending(false);
    }
  };

  const handleRefreshQR = () => {
    setQrExpiry(600);
    setQrExpired(false);
    setQrKey(prev => prev + 1);
  };

  const formatExpiry = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  // Build subtitle
  const subtitleParts: string[] = [];
  if (message.linked_order_number && (message.table_number || message.table_id)) {
    subtitleParts.push(`Order #${message.linked_order_number} · ${message.table_number || `Table ${message.table_id}`}`);
  } else if (message.linked_order_number) {
    subtitleParts.push(`Order #${message.linked_order_number}`);
  } else if (message.table_number || message.table_id) {
    subtitleParts.push(message.table_number || `Table ${message.table_id}`);
  }

  const qrUrl = `https://${window.location.host}/kds-reply?messageId=${message.message_id}&orderId=${message.linked_order_id || ""}&table=${message.table_number || message.table_id || ""}&from=${encodeURIComponent(message.employee_name)}&preview=${encodeURIComponent(message.message_text.slice(0, 50))}&session=${sessionStorage.getItem("kds_session_cleared") || ""}`;

  return (
    <Dialog open={open} onOpenChange={sending ? undefined : onOpenChange}>
      <DialogContent className="bg-neutral-900 border-neutral-700 text-white max-w-[820px]" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="text-white text-lg">Reply to kitchen message</DialogTitle>
          <DialogDescription className="text-neutral-400 text-sm">
            Replying to {message.employee_name}{message.employee_role ? ` | ${message.employee_role}` : ""}{subtitleParts.length > 0 ? ` · ${subtitleParts.join(" · ")}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-row gap-0">
          {/* Left Column - Reply Compose */}
          <div className="flex-1 pr-5 border-r border-neutral-700 space-y-3">
            {/* Original Message Reference */}
            <div className="border-l-2 border-violet-500 bg-neutral-800/60 border-y border-r border-neutral-700/50 px-3 py-2.5">
              <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">Original message</span>
              <p className="text-xs text-neutral-300 mt-1 line-clamp-2">{message.message_text}</p>
            </div>

            {/* Reply Field */}
            <div className="space-y-1">
              <label className="text-sm text-neutral-300">Reply <span className="text-red-400">*</span></label>
              <Textarea
                value={text}
                onChange={e => handleTextChange(e.target.value)}
                placeholder="Type your reply..."
                maxLength={MAX_LENGTH}
                className="min-h-[100px] bg-transparent border-neutral-600 text-white placeholder:text-neutral-500 text-sm focus-visible:ring-orange-500 resize-none"
              />
              <div className={`text-xs text-right ${counterColorClass}`}>
                {charCount}/{MAX_LENGTH}
              </div>
            </div>

            {/* Quick Reply Chips */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REPLIES.map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    selectedChip === chip
                      ? "bg-orange-500/20 text-orange-400 border-orange-500/40"
                      : "bg-neutral-700/70 text-neutral-300 hover:bg-orange-500/20 hover:text-orange-400 border-neutral-600/50 hover:border-orange-500/40"
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Cancel + Send Reply */}
            <div className="pt-2 space-y-2">
              <button
                onClick={() => onOpenChange(false)}
                disabled={sending}
                className="w-full text-center text-sm text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <Button
                onClick={handleSend}
                disabled={!canSend}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold disabled:opacity-50"
              >
                {sending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </span>
                ) : "Send Reply"}
              </Button>
            </div>
          </div>

          {/* Right Column - QR Code */}
          <div className="w-[300px] pl-5 flex flex-col items-center justify-center space-y-4">
            <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">Reply from your phone</span>

            <div className="bg-white rounded-xl p-4 border border-neutral-700/50">
              <QRCodeSVG key={qrKey} value={qrUrl} size={180} bgColor="#ffffff" fgColor="#000000" />
            </div>

            <div className="text-center space-y-1">
              <p className="text-[13px] font-medium text-neutral-200">Scan to reply on mobile</p>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-[220px]">
                Open your phone camera and scan this code to reply from your phone
              </p>
            </div>

            {/* Expiry Timer Pill */}
            {qrExpired ? (
              <button
                onClick={handleRefreshQR}
                className="px-3 py-1.5 rounded-full text-xs bg-neutral-800 border border-neutral-700 text-destructive hover:bg-neutral-700 transition-colors"
              >
                QR expired - tap to refresh
              </button>
            ) : (
              <span className="px-3 py-1.5 rounded-full text-xs bg-neutral-800 border border-neutral-700 text-neutral-400">
                Expires in {formatExpiry(qrExpiry)}
              </span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KDSReplyDialog;
