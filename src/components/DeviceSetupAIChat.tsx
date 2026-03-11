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
  const [showActivationOptions, setShowActivationOptions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, showActivationOptions]);

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
      setShowActivationOptions(false);
      streamChat(newMessages);
    },
    [input, isLoading, messages, streamChat]
  );

  const handleNotNew = useCallback(() => {
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: "No, I'm not new" };
    setMessages([userMsg]);
    setShowActivationOptions(true);
  }, []);

  const handleActivationOption = useCallback((option: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: option };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setShowActivationOptions(false);
    streamChat(newMessages);
  }, [messages, streamChat]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full flex flex-col"
    >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <AnimatedAIIcon size={28} />
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
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-4 scrollbar-hide">
            {messages.length === 0 ? (
              <div className="flex flex-col h-full">
                {/* Centered branding area */}
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-foreground/[0.06] border border-foreground/[0.08] flex items-center justify-center backdrop-blur-sm">
                    <AnimatedAIIcon size={40} />
                  </div>
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-semibold text-foreground tracking-tight">
                      Set Up Your Device
                    </h2>
                    <p className="text-sm text-foreground/40 max-w-[260px] mx-auto leading-relaxed">
                      Let AI guide you through a quick and easy device setup — step by step.
                    </p>
                  </div>
                </div>

                {/* First question as a chat bubble at the bottom */}
                <div className="space-y-3 pb-2">
                  <div className="flex justify-start">
                    <div className="flex-shrink-0 mr-2 mt-1">
                      <AnimatedAIIcon size={18} />
                    </div>
                    <div className="max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm bg-foreground/[0.04] text-foreground">
                      <p>Hi, How can I assist you today? Are you new here?</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pl-7">
                    <button
                      onClick={() => handleSend("Yes, I'm new")}
                      className="px-5 py-2 rounded-full text-sm font-medium border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Yes, I'm New
                    </button>
                    <button
                      onClick={() => handleSend("No, I'm not new")}
                      className="px-5 py-2 rounded-full text-sm font-medium border border-foreground/[0.1] bg-foreground/[0.03] hover:bg-foreground/[0.06] text-foreground/70 hover:text-foreground transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      No, I'm Not
                    </button>
                  </div>
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
          <div className="px-6 py-4 flex-shrink-0">
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
