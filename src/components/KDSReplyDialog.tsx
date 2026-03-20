import { useState, useEffect, useRef, useMemo, useCallback, KeyboardEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

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

const MAX_LENGTH = 100;
const WARN_THRESHOLD = 90;
const DANGER_THRESHOLD = 95;

const SUGGESTION_STORAGE_KEY = "kds_reply_suggestions";

const DEFAULT_SUGGESTIONS = [
  "Got it",
  "On its way",
  "5 mins",
  "Need more time",
  "Out of stock",
  "Cooking now",
  "Ready in 5 minutes",
  "Ready in 10 minutes",
  "Remake needed",
  "Rush this order",
];

const EXTENDED_SUGGESTIONS = [
  "Hold this order",
  "Fire when ready",
  "Low stock warning",
  "Special request",
  "Extra sauce on the side",
  "Check temperature",
  "Plate presentation important",
  "Send appetizers first",
  "Hold dessert",
  "Substitute needed",
  "Delay on this order",
  "Priority order",
];

const getSuggestionHistory = (): { text: string; count: number }[] => {
  try {
    return JSON.parse(localStorage.getItem(SUGGESTION_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

const recordSuggestionUse = (text: string) => {
  const history = getSuggestionHistory();
  const existing = history.find(h => h.text.toLowerCase() === text.toLowerCase());
  if (existing) {
    existing.count += 1;
    existing.text = text;
  } else {
    history.push({ text, count: 1 });
  }
  history.sort((a, b) => b.count - a.count);
  localStorage.setItem(SUGGESTION_STORAGE_KEY, JSON.stringify(history.slice(0, 30)));
};

const SuggestionChips = ({ message, onSelect, activeChips = [] }: { message: string; onSelect: (text: string) => void; activeChips?: string[] }) => {
  const history = useMemo(() => getSuggestionHistory(), []);

  const allPool = useMemo(() => {
    const pool: { text: string; count: number }[] = [];
    const seen = new Set<string>();
    for (const h of history) {
      pool.push(h);
      seen.add(h.text.toLowerCase());
    }
    for (const d of [...DEFAULT_SUGGESTIONS, ...EXTENDED_SUGGESTIONS]) {
      const lower = d.toLowerCase();
      if (!seen.has(lower)) {
        pool.push({ text: d, count: 0 });
        seen.add(lower);
      }
    }
    pool.sort((a, b) => b.count - a.count);
    return pool;
  }, [history]);

  const activeLower = useMemo(() => new Set(activeChips.map(c => c.toLowerCase())), [activeChips]);

  const chips = useMemo(() => {
    const trimmed = message.trim().toLowerCase();
    const filtered = allPool.filter(s => !activeLower.has(s.text.toLowerCase()));
    if (trimmed.length === 0) {
      return filtered.slice(0, 8);
    }
    return filtered
      .filter(s => s.text.toLowerCase().includes(trimmed) && s.text.toLowerCase() !== trimmed)
      .slice(0, 8);
  }, [message, allPool, activeLower]);

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {chips.map((chip) => (
        <button
          key={chip.text}
          type="button"
          onClick={() => onSelect(chip.text)}
          className="px-2.5 py-1 text-xs rounded-full bg-neutral-700/70 text-neutral-300 hover:bg-orange-500/20 hover:text-orange-400 border border-neutral-600/50 hover:border-orange-500/40 transition-colors truncate max-w-[200px]"
        >
          {chip.text}
        </button>
      ))}
    </div>
  );
};

const KDSReplyDialog = ({ open, onOpenChange, message, onSendReply, hasReplied = false }: KDSReplyDialogProps) => {
  const [messageChips, setMessageChips] = useState<string[]>([]);
  const [chipInput, setChipInput] = useState("");
  const [sending, setSending] = useState(false);
  const [qrExpiry, setQrExpiry] = useState(600);
  const [qrExpired, setQrExpired] = useState(false);
  const [qrKey, setQrKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state on open
  useEffect(() => {
    if (open) {
      setMessageChips([]);
      setChipInput("");
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

  const composedMessage = messageChips.join(", ");
  const charCount = composedMessage.length;
  const canSend = messageChips.length > 0 && !sending;

  const counterColorClass = useMemo(() => {
    if (charCount >= DANGER_THRESHOLD) return "text-destructive";
    if (charCount >= WARN_THRESHOLD) return "text-orange-400";
    return "text-neutral-500";
  }, [charCount]);

  const addChip = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (messageChips.some(c => c.toLowerCase() === trimmed.toLowerCase())) return;
    const newChips = [...messageChips, trimmed];
    const newComposed = newChips.join(", ");
    if (newComposed.length > MAX_LENGTH) return;
    setMessageChips(newChips);
    setChipInput("");
    recordSuggestionUse(trimmed);
  }, [messageChips]);

  const removeChip = useCallback((index: number) => {
    setMessageChips(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleChipInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addChip(chipInput);
    }
    if (e.key === "Backspace" && chipInput === "" && messageChips.length > 0) {
      removeChip(messageChips.length - 1);
    }
  };

  if (!message) return null;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      messageChips.forEach(c => recordSuggestionUse(c));
      onSendReply(message.message_id, composedMessage);
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

            {/* Chip-based Message Input */}
            <div className="space-y-1">
              <label className="text-sm text-neutral-300">Reply <span className="text-red-400">*</span></label>
              <div
                className="flex flex-wrap items-center gap-1.5 min-h-[44px] bg-transparent border border-neutral-600 rounded-md px-2 py-1.5 cursor-text focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-colors"
                onClick={() => inputRef.current?.focus()}
              >
                {messageChips.map((chip, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-orange-500/20 text-orange-400 border border-orange-500/40 rounded-full px-2.5 py-0.5 text-xs">
                    {chip}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeChip(i); }}
                      className="hover:text-orange-200 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  ref={inputRef}
                  type="text"
                  value={chipInput}
                  onChange={e => setChipInput(e.target.value)}
                  onKeyDown={handleChipInputKeyDown}
                  placeholder={messageChips.length === 0 ? "Type a reply or select below..." : ""}
                  className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm text-white placeholder:text-neutral-500"
                />
              </div>
              <div className={`text-xs text-right ${counterColorClass}`}>
                {charCount}/{MAX_LENGTH}
              </div>
            </div>

            {/* Suggestion Chips */}
            <SuggestionChips
              message={chipInput}
              onSelect={addChip}
              activeChips={messageChips}
            />

            {/* Cancel + Send Reply */}
            <div className="pt-2 flex gap-3">
              <button
                onClick={() => onOpenChange(false)}
                disabled={sending}
                className="flex-1 h-10 rounded-md text-sm text-neutral-400 hover:text-white border border-neutral-600 hover:border-neutral-500 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <Button
                onClick={handleSend}
                disabled={!canSend}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold disabled:opacity-50"
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
            <span className="text-[11px] text-white uppercase tracking-wider font-medium">Reply from your phone</span>

            <div className="bg-white rounded-xl p-4 border border-neutral-700/50">
              <QRCodeSVG key={qrKey} value={qrUrl} size={180} bgColor="#ffffff" fgColor="#000000" />
            </div>

            <div className="text-center space-y-1">
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
