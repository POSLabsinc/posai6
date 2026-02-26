import { useState, useRef, useEffect, useCallback } from "react";
import { X, Smile, AudioLines, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface SupportChatWidgetProps {
  open: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  created_at: string;
}

const avatars = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Maya",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Sam",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan",
];

const SupportChatWidget = ({ open, onClose }: SupportChatWidgetProps) => {
  const [activeTab, setActiveTab] = useState<"chat" | "help">("chat");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load existing open conversation on mount
  useEffect(() => {
    if (!open) return;
    const loadConversation = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: convos } = await (supabase as any)
        .from("chat_conversations")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(1);

      if (convos && convos.length > 0) {
        const cid = convos[0].id;
        setConversationId(cid);
        setStarted(true);

        const { data: msgs } = await (supabase as any)
          .from("chat_messages")
          .select("*")
          .eq("conversation_id", cid)
          .order("created_at", { ascending: true });

        if (msgs) setMessages(msgs as ChatMessage[]);
      }
    };
    loadConversation();
  }, [open]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    if (open && started && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open, started]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startConversation = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await (supabase as any)
      .from("chat_conversations")
      .insert({ user_id: user?.id || null })
      .select("id")
      .single();

    if (error || !data) {
      console.error("Failed to create conversation:", error);
      return null;
    }
    setConversationId(data.id);
    setStarted(true);
    return data.id;
  }, []);

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    const text = message.trim();
    setMessage("");
    setSending(true);

    try {
      let cid = conversationId;
      if (!cid) {
        cid = await startConversation();
        if (!cid) return;
      }

      const { error } = await (supabase as any).from("chat_messages").insert({
        conversation_id: cid,
        role: "user",
        content: text,
      });

      if (error) console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 right-6 z-[9999] w-[370px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{ height: 480, maxHeight: "calc(100vh - 3rem)" }}
        >
          {/* Header */}
          <div className="bg-neutral-900 px-5 pt-4 pb-3 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex bg-neutral-800 rounded-full p-1 gap-1">
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeTab === "chat"
                      ? "bg-neutral-700 text-white"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  💬 Chat
                </button>
                <button
                  onClick={() => setActiveTab("help")}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeTab === "help"
                      ? "bg-neutral-700 text-white"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  📖 Help
                </button>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-neutral-700 transition-colors"
              >
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            {!started && activeTab === "chat" && (
              <>
                <div className="flex items-center mb-3">
                  {avatars.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt="Agent"
                      className="w-10 h-10 rounded-full border-2 border-neutral-900 bg-neutral-700"
                      style={{ marginLeft: i > 0 ? -8 : 0 }}
                    />
                  ))}
                  <div
                    className="w-10 h-10 rounded-full border-2 border-neutral-900 bg-neutral-700 flex items-center justify-center text-neutral-300 text-xs font-bold"
                    style={{ marginLeft: -8 }}
                  >
                    💬
                  </div>
                </div>
                <h2 className="text-white text-lg font-bold leading-tight mb-1">
                  Hey! I'm Maya. How can I help you today?
                </h2>
                <div className="flex items-center gap-1.5 text-sm text-neutral-400">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  Typically replies under one minute
                </div>
              </>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 bg-neutral-950 flex flex-col overflow-hidden">
            {activeTab === "chat" ? (
              <>
                {started ? (
                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-hide">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            msg.role === "user"
                              ? "bg-blue-600 text-white rounded-br-md"
                              : "bg-neutral-800 text-neutral-200 rounded-bl-md"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="flex-1" />
                )}

                {/* Input */}
                <div className="border-t border-neutral-800 px-4 py-3 bg-neutral-950">
                  {!started ? (
                    <button
                      onClick={async () => {
                        await startConversation();
                      }}
                      className="w-full text-left text-neutral-500 text-base py-2 hover:text-neutral-300 transition-colors"
                    >
                      Compose your message...
                    </button>
                  ) : (
                    <div className="flex items-end gap-2">
                      <textarea
                        ref={inputRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder="Type a message..."
                        rows={1}
                        className="flex-1 bg-transparent text-white text-sm resize-none outline-none placeholder:text-neutral-500 max-h-20"
                      />
                      <button
                        onClick={handleSend}
                        disabled={!message.trim() || sending}
                        className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center disabled:opacity-40 transition-opacity"
                      >
                        <Send className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}
                  {!started && (
                    <div className="flex items-center gap-3 mt-2">
                      <button className="text-neutral-500 hover:text-neutral-300 transition-colors">
                        <Smile className="w-5 h-5" />
                      </button>
                      <button className="text-neutral-500 hover:text-neutral-300 transition-colors">
                        <AudioLines className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 px-5 py-6 text-neutral-400 text-sm">
                <h3 className="text-white font-semibold text-base mb-3">Help Center</h3>
                <p className="leading-relaxed">
                  Browse our knowledge base and FAQs for quick answers to common questions.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SupportChatWidget;
