import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, RotateCcw, Receipt, Percent, MessageSquare, FileText, ArrowRightLeft, Ban, DollarSign } from "lucide-react";
import ReactMarkdown from "react-markdown";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface TicketContext {
  orderId: string;
  orderNumber?: number;
  guestName: string;
  status: string;
  total: number;
  paymentType: string;
  table: string;
  items: { name: string; qty: number; price: number }[];
}

export interface TicketActions {
  openRefund: () => void;
  openVoid: () => void;
  openTransfer: () => void;
  openReceipt: () => void;
  openDiscount: () => void;
  openMessageKitchen: () => void;
  reopenOrder: () => void;
}

interface TicketAIChatPanelProps {
  onClose: () => void;
  ticketContext?: TicketContext;
  ticketActions?: TicketActions;
}

type Msg = { role: "user" | "assistant"; content: string };
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/order-ai-chat`;

const TicketAIChatPanel = ({ onClose, ticketContext, ticketActions }: TicketAIChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([{
    id: "welcome", role: "assistant",
    content: `Hi! I can help you manage this ticket. Try saying:\n- "Refund this order"\n- "Transfer to another table"\n- "Print the receipt"\n- "Apply a discount"\n- "Send a message to the kitchen"`,
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const conversationRef = useRef<Msg[]>([]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const processTicketCommand = useCallback((text: string): boolean => {
    const lower = text.toLowerCase();
    
    if (lower.includes("refund")) {
      ticketActions?.openRefund();
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "Opening refund flow...", timestamp: new Date() }]);
      return true;
    }
    if (lower.includes("void") || lower.includes("cancel order")) {
      ticketActions?.openVoid();
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "Opening void/cancel flow...", timestamp: new Date() }]);
      return true;
    }
    if (lower.includes("transfer")) {
      ticketActions?.openTransfer();
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "Opening transfer options...", timestamp: new Date() }]);
      return true;
    }
    if (lower.includes("receipt") || lower.includes("print")) {
      ticketActions?.openReceipt();
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "Opening receipt options...", timestamp: new Date() }]);
      return true;
    }
    if (lower.includes("discount")) {
      ticketActions?.openDiscount();
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "Opening discount dialog...", timestamp: new Date() }]);
      return true;
    }
    if (lower.includes("message kitchen") || lower.includes("kitchen message") || lower.includes("send.*kitchen")) {
      ticketActions?.openMessageKitchen();
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "Opening kitchen message...", timestamp: new Date() }]);
      return true;
    }
    if (lower.includes("reopen")) {
      ticketActions?.reopenOrder();
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "Reopening the order...", timestamp: new Date() }]);
      return true;
    }
    if (lower.includes("summary") || lower.includes("details")) {
      if (ticketContext) {
        const itemsList = ticketContext.items.map(i => `- ${i.qty}x ${i.name} ($${(i.price * i.qty).toFixed(2)})`).join("\n");
        const summary = `**Order #${ticketContext.orderNumber || "N/A"}**\n` +
          `**Guest:** ${ticketContext.guestName}\n` +
          `**Status:** ${ticketContext.status}\n` +
          `**Table:** ${ticketContext.table}\n` +
          `**Payment:** ${ticketContext.paymentType}\n\n` +
          `**Products:**\n${itemsList || "No products"}\n\n` +
          `**Total:** $${ticketContext.total.toFixed(2)}`;
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: summary, timestamp: new Date() }]);
      } else {
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "No ticket selected. Please select a ticket first.", timestamp: new Date() }]);
      }
      return true;
    }
    return false;
  }, [ticketActions, ticketContext]);

  const streamChat = useCallback(async (userMessage: string) => {
    const userMsg: Msg = { role: "user", content: userMessage };
    conversationRef.current = [...conversationRef.current, userMsg];

    const contextMessage = ticketContext ? 
      `Context: Managing ticket #${ticketContext.orderNumber} for ${ticketContext.guestName}, status: ${ticketContext.status}, total: $${ticketContext.total.toFixed(2)}, table: ${ticketContext.table}` : "";

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      body: JSON.stringify({ 
        messages: conversationRef.current,
        orderContext: {
          orderType: "Ticket Management",
          guestName: ticketContext?.guestName || "",
          orderItems: ticketContext?.items.map((i, idx) => ({ id: idx, qty: i.qty, name: i.name, price: i.price })) || [],
          orderNotes: contextMessage,
          availableProducts: [],
        }
      }),
    });
    if (resp.status === 429) { toast.error("Rate limit exceeded. Please try again in a moment."); throw new Error("Rate limited"); }
    if (resp.status === 402) { toast.error("AI credits exhausted. Please add funds."); throw new Error("Payment required"); }
    if (!resp.ok || !resp.body) throw new Error("Failed to start stream");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "", assistantContent = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });
      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") { streamDone = true; break; }
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant" && last.id !== "welcome")
                return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
              return [...prev, { id: crypto.randomUUID(), role: "assistant", content: assistantContent, timestamp: new Date() }];
            });
          }
        } catch { textBuffer = line + "\n" + textBuffer; break; }
      }
    }

    if (assistantContent) conversationRef.current = [...conversationRef.current, { role: "assistant", content: assistantContent }];
  }, [ticketContext]);

  const sendMessage = useCallback(async (text: string) => {
    if (isTyping) return;
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "user", content: text, timestamp: new Date() }]);
    
    // Try local command processing first
    if (processTicketCommand(text)) return;

    // Fall back to AI chat
    setIsTyping(true);
    try { await streamChat(text); } catch (e: any) {
      console.error("Chat error:", e);
      if (!(e instanceof Error && (e.message === "Rate limited" || e.message === "Payment required")))
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "Sorry, I encountered an error. Please try again.", timestamp: new Date() }]);
    } finally { setIsTyping(false); }
  }, [isTyping, processTicketCommand, streamChat]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;
    setInput("");
    await sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const quickActions = [
    { icon: DollarSign, label: "Refund", action: () => ticketActions?.openRefund() },
    { icon: Ban, label: "Void", action: () => ticketActions?.openVoid() },
    { icon: ArrowRightLeft, label: "Transfer", action: () => ticketActions?.openTransfer() },
    { icon: Receipt, label: "Receipt", action: () => ticketActions?.openReceipt() },
    { icon: Percent, label: "Discount", action: () => ticketActions?.openDiscount() },
    { icon: MessageSquare, label: "Msg Kitchen", action: () => ticketActions?.openMessageKitchen() },
    { icon: FileText, label: "Summary", action: () => sendMessage("Show me the order summary") },
    { icon: RotateCcw, label: "Reopen", action: () => ticketActions?.reopenOrder() },
  ];

  return (
    <div className="flex flex-col h-full bg-[#131316] border-l border-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <AnimatedAIIcon size={14} />
          <span className="text-sm font-semibold text-foreground">AI Assistant</span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-800 transition-colors">
          <X className="w-4 h-4 text-neutral-400" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-[#252525] text-foreground rounded-bl-md"
            }`}>
              {msg.role === "assistant" ? (
                <div className="prose prose-sm prose-invert max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
              ) : msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[#252525] rounded-2xl rounded-bl-md px-4 py-3">
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#252525] hover:bg-[#303030] text-neutral-300 text-xs font-medium whitespace-nowrap transition-colors disabled:opacity-40">
              <btn.icon className="w-3 h-3" /> {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-1 border-t border-neutral-800 flex-shrink-0">
        <div className="flex items-center gap-2 bg-[#252525] rounded-xl px-3 py-2">
          <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown} placeholder="Try 'refund this order' or 'print receipt'..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-neutral-500 outline-none" />
          <button onClick={handleSend} disabled={!input.trim() || isTyping}
            className="p-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-30 transition-opacity">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketAIChatPanel;
