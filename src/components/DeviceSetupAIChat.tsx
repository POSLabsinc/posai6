import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Send, Loader2 } from "lucide-react";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/device-setup-chat`;

const QUICK_QUESTIONS = [
  "How do I get an activation code?",
  "What is Demo Mode?",
  "My code isn't working",
  "How long does setup take?",
];

interface DeviceSetupAIChatProps {
  open: boolean;
  onClose: () => void;
}

const DeviceSetupAIChat = ({ open, onClose }: DeviceSetupAIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const streamChat = useCallback(async (allMessages: Message[]) => {
    setIsLoading(true);
    let assistantContent = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to connect to AI");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const assistantId = Date.now().toString() + "-a";

      // Add empty assistant message
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: assistantContent } : m))
              );
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Something went wrong";
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString() + "-err", role: "assistant", content: `⚠️ ${errorMsg}. Please try again.` },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSend = useCallback(
    (text?: string) => {
      const msg = (text || input).trim();
      if (!msg || isLoading) return;

      const userMsg: Message = { id: Date.now().toString(), role: "user", content: msg };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput("");
      streamChat(newMessages);
    },
    [input, isLoading, messages, streamChat]
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="w-full h-full flex flex-col"
    >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/[0.06] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <AnimatedAIIcon size={22} />
              <div>
                <p className="text-sm font-semibold text-foreground">Setup Assistant</p>
                <p className="text-[11px] text-foreground/40">Ask me anything about device setup</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-foreground/[0.06] transition-colors"
            >
              <X className="w-4 h-4 text-foreground/50" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <AnimatedAIIcon size={28} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground mb-1">Need help setting up?</p>
                  <p className="text-xs text-foreground/40 max-w-[240px]">
                    I can help you activate your device, troubleshoot codes, or explain setup options.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      className="px-3 py-1.5 rounded-full text-xs border border-foreground/[0.08] bg-foreground/[0.03] hover:bg-foreground/[0.06] text-foreground/60 hover:text-foreground/80 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0 mr-2 mt-1">
                      <AnimatedAIIcon size={18} />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-foreground/[0.04] text-foreground"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none [&>p]:m-0 [&>p+p]:mt-2 [&>ul]:mt-1 [&>ul]:mb-0 [&>ol]:mt-1 [&>ol]:mb-0">
                        <ReactMarkdown>{msg.content || "..."}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex items-center gap-2 text-foreground/40">
                <AnimatedAIIcon size={18} />
                <div className="flex items-center gap-1.5 bg-foreground/[0.04] rounded-2xl px-3.5 py-2.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-xs">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-foreground/[0.06] flex-shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Ask about device setup..."
                className="flex-1 bg-foreground/[0.04] border border-foreground/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/30 transition-colors"
                disabled={isLoading}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>
          </div>
        </motion.div>
  );
};

export default DeviceSetupAIChat;
