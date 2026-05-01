import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, FileText, Mail, MessageSquare, Download, Share2, Printer, BarChart3, Check, ArrowDownToLine } from "lucide-react";
import ReactMarkdown from "react-markdown";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  confirmAction?: string;
}

export interface ShiftContext {
  employeeName: string;
  employeeRole: string;
  totalHours: string;
  totalCardSales: number;
  totalCashSales: number;
  totalTips: number;
  totalCashTips: number;
  tipsPayable: number;
  overallTotal: number;
  totalCashDrop: number;
  orderCount: number;
  paymentBreakdown: { type: string; qty: number; amount: number; tips: number; totalTips: number }[];
  dateRange: string;
}

export interface ShiftActions {
  exportPDF: () => void;
  sendEmail: () => void;
  sendText: () => void;
  downloadCSV: () => void;
  openCashDrop: () => void;
}

interface ShiftAIChatPanelProps {
  onClose: () => void;
  shiftContext: ShiftContext;
  shiftActions: ShiftActions;
  onUserInteraction?: () => void;
}

type Msg = { role: "user" | "assistant"; content: string };
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shift-insights`;

const addMsg = (role: "assistant", content: string, confirmAction?: string): Message => ({
  id: crypto.randomUUID(), role, content, timestamp: new Date(), confirmAction,
});

const ShiftAIChatPanel = ({ onClose, shiftContext, shiftActions, onUserInteraction }: ShiftAIChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([{
    id: "welcome", role: "assistant",
    content: `Hi! I can help you with this shift summary. Try saying:\n- "Generate a report"\n- "Share report via email"\n- "Export as PDF"\n- "Download CSV"\n- "Cash Drop" to reconcile cash\n- "Analyze my performance"\n- "Show me a summary"`,
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const buildSummaryText = useCallback(() => {
    const { employeeName, totalCardSales, totalCashSales, totalTips, tipsPayable, overallTotal, totalHours, paymentBreakdown, dateRange } = shiftContext;
    const breakdown = paymentBreakdown.map(r => `- **${r.type}**: ${r.qty} orders, $${r.amount.toFixed(2)}, Tips: $${r.totalTips.toFixed(2)}`).join("\n");
    return `**Shift Summary - ${employeeName}**\n**Date:** ${dateRange}\n**Hours:** ${totalHours}h\n\n**Total Sales:** $${overallTotal.toFixed(2)}\n**Card Sales:** $${totalCardSales.toFixed(2)}\n**Cash Sales:** $${totalCashSales.toFixed(2)}\n**Total Tips:** $${totalTips.toFixed(2)}\n**Tips Payable:** $${tipsPayable.toFixed(2)}\n\n**Breakdown:**\n${breakdown}`;
  }, [shiftContext]);

  const validateAndExecute = useCallback((action: string): boolean => {
    switch (action) {
      case "pdf":
        shiftActions.exportPDF();
        setMessages(prev => [...prev, addMsg("assistant", "Opening PDF export... The print dialog should appear shortly.")]);
        return true;
      case "email":
        shiftActions.sendEmail();
        setMessages(prev => [...prev, addMsg("assistant", "Opening email share dialog...")]);
        return true;
      case "text":
        shiftActions.sendText();
        setMessages(prev => [...prev, addMsg("assistant", "Opening text share dialog...")]);
        return true;
      case "download":
        shiftActions.downloadCSV();
        setMessages(prev => [...prev, addMsg("assistant", "Downloading CSV file...")]);
        return true;
      case "cashdrop":
        shiftActions.openCashDrop();
        setMessages(prev => [...prev, addMsg("assistant", "Opening Cash Drop reconciliation...")]);
        return true;
      case "summary": {
        const summary = buildSummaryText();
        setMessages(prev => [...prev, addMsg("assistant", summary)]);
        return true;
      }
      case "report": {
        setMessages(prev => [...prev, addMsg("assistant",
          "How would you like your report? Choose an option:\n- **PDF** for printing\n- **Email** to send it\n- **Text** to share via SMS\n- **CSV** to download data\n\nYou can say something like \"export as PDF\" or \"send via email\"."
        )]);
        return true;
      }
      case "analyze": {
        setIsTyping(true);
        fetchAIAnalysis();
        return true;
      }
      default:
        return false;
    }
  }, [shiftActions, buildSummaryText]);

  const fetchAIAnalysis = async () => {
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ shiftData: shiftContext }),
      });

      if (resp.status === 429) { toast.error("Rate limit exceeded. Please try again in a moment."); setIsTyping(false); return; }
      if (resp.status === 402) { toast.error("AI credits exhausted. Please add funds."); setIsTyping(false); return; }
      if (!resp.ok) throw new Error("Failed to get insights");

      const data = await resp.json();
      const insights = data?.insights || "Unable to generate insights at this time.";
      setMessages(prev => [...prev, addMsg("assistant", insights)]);
    } catch (e) {
      console.error("AI analysis error:", e);
      setMessages(prev => [...prev, addMsg("assistant", "Sorry, I couldn't generate the analysis right now. Please try again.")]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleConfirm = useCallback((action: string) => {
    setPendingAction(null);
    validateAndExecute(action);
  }, [validateAndExecute]);

  const handleCancelConfirm = useCallback(() => {
    setPendingAction(null);
    setMessages(prev => [...prev, addMsg("assistant", "Action cancelled.")]);
  }, []);

  const processCommand = useCallback((text: string): boolean => {
    const lower = text.toLowerCase();

    if (pendingAction) {
      if (lower === "yes" || lower === "confirm" || lower === "y") { handleConfirm(pendingAction); return true; }
      if (lower === "no" || lower === "cancel" || lower === "n") { handleCancelConfirm(); return true; }
    }

    if (lower.includes("pdf") || lower.includes("print")) return validateAndExecute("pdf");
    if (lower.includes("email") || lower.includes("mail")) return validateAndExecute("email");
    if (lower.includes("text") || lower.includes("sms")) return validateAndExecute("text");
    if (lower.includes("cash drop") || lower.includes("cashdrop") || lower.includes("reconcile") || lower.includes("drop cash")) return validateAndExecute("cashdrop");
    if (lower.includes("download") || lower.includes("csv") || lower.includes("export")) return validateAndExecute("download");
    if (lower.includes("summary") || lower.includes("details") || lower.includes("show")) return validateAndExecute("summary");
    if (lower.includes("report") || lower.includes("generate")) return validateAndExecute("report");
    if (lower.includes("analy") || lower.includes("insight") || lower.includes("performance") || lower.includes("how did") || lower.includes("tips breakdown")) return validateAndExecute("analyze");
    if (lower.includes("share")) return validateAndExecute("report");
    return false;
  }, [pendingAction, handleConfirm, handleCancelConfirm, validateAndExecute]);

  const sendMessage = useCallback(async (text: string) => {
    if (isTyping) return;
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "user", content: text, timestamp: new Date() }]);

    if (processCommand(text)) return;

    // For unrecognized commands, use AI analysis with the question
    setIsTyping(true);
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          shiftData: {
            ...shiftContext,
            userQuestion: text,
          },
        }),
      });

      if (resp.status === 429) { toast.error("Rate limit exceeded."); return; }
      if (resp.status === 402) { toast.error("AI credits exhausted."); return; }
      if (!resp.ok) throw new Error("Failed");

      const data = await resp.json();
      setMessages(prev => [...prev, addMsg("assistant", data?.insights || "I'm not sure how to help with that. Try asking about your shift performance or use one of the quick actions below.")]);
    } catch {
      setMessages(prev => [...prev, addMsg("assistant", "Sorry, I encountered an error. Please try again.")]);
    } finally {
      setIsTyping(false);
    }
  }, [isTyping, processCommand, shiftContext]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;
    setInput("");
    onUserInteraction?.();
    await sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const quickActions = [
    { icon: BarChart3, label: "Analyze", action: () => { onUserInteraction?.(); validateAndExecute("analyze"); } },
    { icon: FileText, label: "Summary", action: () => { onUserInteraction?.(); validateAndExecute("summary"); } },
    { icon: ArrowDownToLine, label: "Cash Drop", action: () => { onUserInteraction?.(); validateAndExecute("cashdrop"); } },
    { icon: Printer, label: "PDF", action: () => { onUserInteraction?.(); validateAndExecute("pdf"); } },
    { icon: Mail, label: "Email", action: () => { onUserInteraction?.(); validateAndExecute("email"); } },
    { icon: MessageSquare, label: "Text", action: () => { onUserInteraction?.(); validateAndExecute("text"); } },
    { icon: Download, label: "CSV", action: () => { onUserInteraction?.(); validateAndExecute("download"); } },
    { icon: Share2, label: "Share", action: () => validateAndExecute("report") },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <AnimatedAIIcon size={14} />
          <span className="text-sm font-semibold text-foreground">AI Assistant</span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"
            }`}>
              {msg.role === "assistant" ? (
                <>
                  <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                  {msg.confirmAction && pendingAction === msg.confirmAction && (
                    <div className="flex gap-2 mt-3 pt-2 border-t border-border">
                      <button
                        onClick={() => handleConfirm(msg.confirmAction!)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                      >
                        <Check className="w-3 h-3" /> Confirm
                      </button>
                      <button
                        onClick={handleCancelConfirm}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-accent transition-colors"
                      >
                        <X className="w-3 h-3" /> Cancel
                      </button>
                    </div>
                  )}
                </>
              ) : msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-3 pt-2 flex-shrink-0 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1.5 pb-2">
          {quickActions.map((btn) => (
            <button key={btn.label} onClick={btn.action} disabled={isTyping}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-accent text-foreground text-xs font-medium whitespace-nowrap transition-colors disabled:opacity-40">
              <btn.icon className="w-3 h-3" /> {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-1 border-t border-border flex-shrink-0">
        <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
          <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown} placeholder="Try 'analyze performance' or 'export PDF'..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
          <button onClick={handleSend} disabled={!input.trim() || isTyping}
            className="p-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-30 transition-opacity">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShiftAIChatPanel;
