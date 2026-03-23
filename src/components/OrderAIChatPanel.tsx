import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface OrderItem {
  id: number;
  qty: number;
  name: string;
  price: number;
  modifiers?: string[];
  notes?: string;
}

interface AvailableProduct {
  id: string;
  name: string;
  price: number;
}

interface OrderContext {
  orderType: string;
  guestName: string;
  orderItems: OrderItem[];
  orderNotes: string;
  availableProducts: AvailableProduct[];
}

interface OrderActions {
  addProduct: (name: string, price: number, quantity: number) => void;
  removeProduct: (name: string) => void;
  updateQuantity: (name: string, quantity: number) => void;
  setOrderType: (type: string) => void;
  setGuestName: (name: string) => void;
  clearOrder: () => void;
  setOrderNotes: (notes: string) => void;
}

interface OrderAIChatPanelProps {
  onClose: () => void;
  orderContext?: OrderContext;
  orderActions?: OrderActions;
}

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/order-ai-chat`;

function processToolCalls(toolCalls: any[], actions: OrderActions | undefined) {
  if (!actions) return;
  for (const tc of toolCalls) {
    try {
      const args = typeof tc.function.arguments === "string"
        ? JSON.parse(tc.function.arguments)
        : tc.function.arguments;
      const fn = tc.function.name;

      if (fn === "add_product") {
        actions.addProduct(args.product_name, args.price, args.quantity || 1);
      } else if (fn === "remove_product") {
        actions.removeProduct(args.product_name);
      } else if (fn === "update_quantity") {
        actions.updateQuantity(args.product_name, args.quantity);
      } else if (fn === "set_order_type") {
        actions.setOrderType(args.order_type);
      } else if (fn === "set_guest_name") {
        actions.setGuestName(args.guest_name);
      } else if (fn === "clear_order") {
        actions.clearOrder();
      } else if (fn === "set_order_notes") {
        actions.setOrderNotes(args.notes);
      }
    } catch (e) {
      console.error("Tool call processing error:", e);
    }
  }
}

const OrderAIChatPanel = ({ onClose, orderContext, orderActions }: OrderAIChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I can help you manage this order. Try saying things like:\n- \"Add 2 Margherita Pizza\"\n- \"Remove the Caesar Salad\"\n- \"Change order type to Take Out\"\n- \"Set guest name to John\"",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const conversationRef = useRef<Msg[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const streamChat = useCallback(async (userMessage: string) => {
    const userMsg: Msg = { role: "user", content: userMessage };
    conversationRef.current = [...conversationRef.current, userMsg];

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: conversationRef.current,
        orderContext,
      }),
    });

    if (resp.status === 429) {
      toast.error("Rate limit exceeded. Please try again in a moment.");
      throw new Error("Rate limited");
    }
    if (resp.status === 402) {
      toast.error("AI credits exhausted. Please add funds.");
      throw new Error("Payment required");
    }
    if (!resp.ok || !resp.body) throw new Error("Failed to start stream");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";
    let toolCalls: any[] = [];
    let toolCallMap: Record<number, { id: string; function: { name: string; arguments: string } }> = {};
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
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta;
          if (!delta) continue;

          // Handle text content
          if (delta.content) {
            assistantContent += delta.content;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant" && last.id !== "welcome") {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [
                ...prev,
                { id: crypto.randomUUID(), role: "assistant", content: assistantContent, timestamp: new Date() },
              ];
            });
          }

          // Handle tool calls
          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index ?? 0;
              if (!toolCallMap[idx]) {
                toolCallMap[idx] = { id: tc.id || "", function: { name: tc.function?.name || "", arguments: "" } };
              }
              if (tc.function?.name) toolCallMap[idx].function.name = tc.function.name;
              if (tc.function?.arguments) toolCallMap[idx].function.arguments += tc.function.arguments;
            }
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Process accumulated tool calls
    toolCalls = Object.values(toolCallMap);
    if (toolCalls.length > 0) {
      processToolCalls(toolCalls, orderActions);

      // If no text content was generated alongside tool calls, add a confirmation
      if (!assistantContent) {
        const actionNames = toolCalls.map((tc) => tc.function.name.replace(/_/g, " ")).join(", ");
        assistantContent = `Done! Executed: ${actionNames}`;
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: assistantContent, timestamp: new Date() },
        ]);
      }
    }

    // Store assistant response in conversation history
    if (assistantContent) {
      conversationRef.current = [...conversationRef.current, { role: "assistant", content: assistantContent }];
    }
  }, [orderContext, orderActions]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      await streamChat(trimmed);
    } catch (e) {
      console.error("Chat error:", e);
      if (!(e instanceof Error && (e.message === "Rate limited" || e.message === "Payment required"))) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again.",
            timestamp: new Date(),
          },
        ]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#131316] border-l border-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <AnimatedAIIcon size={14} />
          <span className="text-sm font-semibold text-foreground">
            AI Assistant
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <X className="w-4 h-4 text-neutral-400" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-[#252525] text-foreground rounded-bl-md"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
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

      {/* Input */}
      <div className="px-3 pb-3 pt-2 border-t border-neutral-800 flex-shrink-0">
        <div className="flex items-center gap-2 bg-[#252525] rounded-xl px-3 py-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-neutral-500 outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="p-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-30 transition-opacity"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderAIChatPanel;
