import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Pencil, KeyRound, Mail, FlaskConical, Clock, Info, Smartphone, CheckCircle2, RefreshCw, ArrowLeft, ChevronDown, Search } from "lucide-react";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import ReactMarkdown from "react-markdown";
import { COUNTRY_CODES, type CountryCodeEntry } from "@/components/voucher/voucherConstants";
import { formatPhone } from "@/components/voucher/voucherHelpers";

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
  const [currentStep, setCurrentStep] = useState<"initial" | "activation-methods" | "activate-code" | "sign-in-input" | "sign-in-email-sent" | "sign-in-phone-sent" | "demo-mode" | "chat">("initial");
  const [signInInput, setSignInInput] = useState("");
  const [sentAddress, setSentAddress] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryCodeEntry>(COUNTRY_CODES[0]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [activationCode, setActivationCode] = useState<string[]>(["", "", "", "", "", ""]);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [showBranding, setShowBranding] = useState(false);
  const [showFirstQuestion, setShowFirstQuestion] = useState(false);
  const [showFirstButtons, setShowFirstButtons] = useState(false);
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
      // Stagger the entrance animations
      setShowBranding(false);
      setShowFirstQuestion(false);
      setShowFirstButtons(false);
      const t1 = setTimeout(() => setShowBranding(true), 200);
      const t2 = setTimeout(() => setShowFirstQuestion(true), 700);
      const t3 = setTimeout(() => setShowFirstButtons(true), 1000);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
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
      setCurrentStep("chat");
      streamChat(newMessages);
    },
    [input, isLoading, messages, streamChat]
  );

  const handleNotNew = useCallback(() => {
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: "No, I'm not new" };
    const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "Please choose one of these activation methods:" };
    setMessages([userMsg, assistantMsg]);
    setCurrentStep("activation-methods");
  }, []);

  const handleActivationOption = useCallback((option: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: option };
    let followUp = "";
    let nextStep: "activate-code" | "sign-in-input" | "demo-mode" = "activate-code";

    if (option === "Activate with Code") {
      followUp = "Great! Please enter your 6-digit activation code. You can find it from your manager or the Admin Portal.";
      nextStep = "activate-code";
    } else if (option === "Sign in with Link") {
      followUp = "Please enter your email address or phone number to receive a secure sign-in link.";
      nextStep = "sign-in-input";
    } else if (option === "Try Demo Mode") {
      followUp = "Demo Mode lets you explore all features with sample data — no real data is affected. Tap \"Try Demo Mode\" on the left panel to get started! Need help with anything else?";
      nextStep = "demo-mode";
    }

    const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: followUp };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setCurrentStep(nextStep);
  }, []);

  const handleGoBack = useCallback(() => {
    if (currentStep === "activation-methods") {
      setMessages([]);
      setCurrentStep("initial");
    } else if (["activate-code", "sign-in-input", "demo-mode"].includes(currentStep)) {
      const userMsg: Message = { id: Date.now().toString(), role: "user", content: "No, I'm not new" };
      const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "Please choose one of these activation methods:" };
      setMessages([userMsg, assistantMsg]);
      setCurrentStep("activation-methods");
    } else if (currentStep === "sign-in-email-sent" || currentStep === "sign-in-phone-sent") {
      const msgs = messages.slice(0, -2);
      setMessages(msgs);
      setCurrentStep("sign-in-input");
      setSignInInput(sentAddress.includes("@") ? sentAddress : "");
      setSentAddress("");
    } else if (currentStep === "chat") {
      setMessages([]);
      setCurrentStep("initial");
    }
  }, [currentStep, messages, sentAddress]);

  const handleCodeInput = useCallback((index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^[0-9]$/.test(value)) return;
    
    const newCode = [...activationCode];
    newCode[index] = value;
    setActivationCode(newCode);
    
    // Auto-focus next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when all 6 digits are filled
    if (value && index === 5 && newCode.every(d => d !== "")) {
      const code = newCode.join("");
      // Small delay for visual feedback
      setTimeout(() => {
        // Trust the device and navigate to clock-in
        localStorage.setItem("pos_device_session", JSON.stringify({
          deviceId: `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          deviceType: "company",
          trustedAt: new Date().toISOString(),
        }));
        window.location.href = "/";
      }, 500);
    }
  }, [activationCode]);

  const handleCodeKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !activationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  }, [activationCode]);

  const handleCodePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newCode = [...activationCode];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setActivationCode(newCode);
    const focusIdx = Math.min(pasted.length, 5);
    codeInputRefs.current[focusIdx]?.focus();
    
    // Auto-submit if all 6 digits pasted
    if (newCode.every(d => d !== "")) {
      setTimeout(() => {
        localStorage.setItem("pos_device_session", JSON.stringify({
          deviceId: `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          deviceType: "company",
          trustedAt: new Date().toISOString(),
        }));
        window.location.href = "/";
      }, 500);
    }
  }, [activationCode]);


  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="w-full h-full flex flex-col"
    >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          >
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
          </motion.div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide flex flex-col">
            {currentStep === "initial" ? (
              <div className="flex flex-col h-full">
                {/* Centered branding area */}
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={showBranding ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="w-20 h-20 rounded-2xl bg-foreground/[0.06] border border-foreground/[0.08] flex items-center justify-center backdrop-blur-sm"
                  >
                    <AnimatedAIIcon size={40} />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={showBranding ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="text-center space-y-2"
                  >
                    <h2 className="text-xl font-semibold text-foreground tracking-tight">
                      Set Up Your Device
                    </h2>
                    <p className="text-sm text-foreground/40 max-w-[260px] mx-auto leading-relaxed">
                      Let AI guide you through a quick and easy device setup — step by step.
                    </p>
                  </motion.div>
                </div>

                {/* First question as a chat bubble at the bottom */}
                <div className="space-y-3 pb-2">
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={showFirstQuestion ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="flex justify-start"
                  >
                    <div className="flex-shrink-0 mr-2 mt-1">
                      <AnimatedAIIcon size={18} />
                    </div>
                    <div className="max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm bg-foreground/[0.04] text-foreground">
                      <p>Hi, How can I assist you today? Are you new here?</p>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={showFirstButtons ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="flex gap-2 pl-7"
                  >
                    <button
                      onClick={() => handleSend("Yes, I'm new")}
                      className="px-5 py-2 rounded-full text-sm font-medium border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Yes, I'm New
                    </button>
                    <button
                      onClick={handleNotNew}
                      className="px-5 py-2 rounded-full text-sm font-medium border border-foreground/[0.1] bg-foreground/[0.03] hover:bg-foreground/[0.06] text-foreground/70 hover:text-foreground transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      No, I'm Not
                    </button>
                  </motion.div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* Chat messages */}
                <div className="flex-1 space-y-4">
                  {messages.map((msg, index) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.08, ease: "easeOut" }}
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
                      {msg.role === "user" && !isLoading && (
                        <button
                          onClick={handleGoBack}
                          className="flex-shrink-0 ml-1.5 mt-1 w-6 h-6 rounded-full flex items-center justify-center hover:bg-foreground/[0.08] transition-colors opacity-40 hover:opacity-70"
                          title="Edit"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                    </motion.div>
                  ))}

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

                {/* Step-based action buttons */}
                {currentStep === "activation-methods" && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="flex flex-col gap-2.5 pl-7 pt-3 pb-2"
                  >
                    <div className="flex gap-2.5">
                      <button
                        onClick={() => handleActivationOption("Activate with Code")}
                        className="flex items-center gap-3 flex-1 px-3 py-3 rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] hover:bg-foreground/[0.06] transition-all hover:scale-[1.01] active:scale-[0.99] text-left"
                      >
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                          <KeyRound className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground leading-tight">Activate with Code</p>
                          <p className="text-[11px] text-foreground/40 leading-tight mt-0.5">Enter a code from your admin portal</p>
                        </div>
                      </button>
                      <button
                        onClick={() => handleActivationOption("Sign in with Link")}
                        className="flex items-center gap-3 flex-1 px-3 py-3 rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] hover:bg-foreground/[0.06] transition-all hover:scale-[1.01] active:scale-[0.99] text-left"
                      >
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground leading-tight">Sign in with Link</p>
                          <p className="text-[11px] text-foreground/40 leading-tight mt-0.5">Get a secure link sent to your email</p>
                        </div>
                      </button>
                    </div>
                    <button
                      onClick={() => handleActivationOption("Try Demo Mode")}
                      className="flex items-center justify-center gap-2.5 w-full px-4 py-3 rounded-xl border border-primary/30 bg-primary/[0.06] hover:bg-primary/[0.12] transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <FlaskConical className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Try Demo Mode</span>
                    </button>
                  </motion.div>
                )}

                {/* 6-digit code input for activate-code step */}
                {currentStep === "activate-code" && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="pl-7 pt-3 pb-2 space-y-4"
                  >
                    <div className="flex gap-2 justify-start">
                      {activationCode.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => { codeInputRefs.current[i] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleCodeInput(i, e.target.value)}
                          onKeyDown={(e) => handleCodeKeyDown(i, e)}
                          onPaste={i === 0 ? handleCodePaste : undefined}
                          className="w-10 h-12 rounded-xl border border-foreground/[0.12] bg-foreground/[0.04] text-center text-lg font-semibold text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                        />
                      ))}
                    </div>
                    <div className="flex items-start gap-1.5 text-foreground/40">
                      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span className="text-xs">One-time code: This code expires in 10 minutes and can only be used once.</span>
                    </div>
                  </motion.div>
                )}

                {/* Unified email/phone input for sign-in-input step */}
                {currentStep === "sign-in-input" && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="pl-7 pt-3 pb-2 space-y-2"
                  >
                    {(() => {
                      const isPhone = /^\d/.test(signInInput) || signInInput === "";
                      const isEmail = /[a-zA-Z@.]/.test(signInInput) && !(/^\d+$/.test(signInInput));
                      const detectedMode = isEmail ? "email" : "phone";
                      const showCountrySelector = detectedMode === "phone";
                      const rawDigits = signInInput.replace(/\D/g, "");
                      
                      const isValidEmail = signInInput.includes("@") && signInInput.includes(".");
                      const isValidPhone = rawDigits.length === selectedCountry.phoneLength;
                      const canSend = detectedMode === "email" ? isValidEmail : isValidPhone;

                      const handleSubmit = () => {
                        if (!canSend) return;
                        if (detectedMode === "email") {
                          const email = signInInput.trim();
                          setSentAddress(email);
                          const userMsg: Message = { id: Date.now().toString(), role: "user", content: email };
                          const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: `We sent a secure sign-in link to **${email}**` };
                          setMessages((prev) => [...prev, userMsg, assistantMsg]);
                          setCurrentStep("sign-in-email-sent");
                          setSignInInput("");
                        } else {
                          const phone = `${selectedCountry.dial} ${formatPhone(rawDigits, selectedCountry.format)}`;
                          setSentAddress(phone);
                          const userMsg: Message = { id: Date.now().toString(), role: "user", content: phone };
                          const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: `We sent a secure sign-in link to **${phone}**` };
                          setMessages((prev) => [...prev, userMsg, assistantMsg]);
                          setCurrentStep("sign-in-phone-sent");
                          setSignInInput("");
                        }
                      };

                      return (
                        <>
                          <div className="flex gap-2">
                            {/* Country code selector - only visible when typing digits */}
                            <AnimatePresence>
                              {showCountrySelector && (
                                <motion.div
                                  initial={{ opacity: 0, width: 0 }}
                                  animate={{ opacity: 1, width: "auto" }}
                                  exit={{ opacity: 0, width: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="relative overflow-visible"
                                >
                                  <button
                                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                                    className="flex items-center gap-1 px-2.5 py-2.5 rounded-xl border border-foreground/[0.12] bg-foreground/[0.04] text-sm text-foreground hover:bg-foreground/[0.06] transition-all h-full"
                                  >
                                    <span className="text-base leading-none">{selectedCountry.flag}</span>
                                    <span className="text-xs text-foreground/60">{selectedCountry.dial}</span>
                                    <ChevronDown className="w-3 h-3 text-foreground/40" />
                                  </button>

                                  <AnimatePresence>
                                    {showCountryDropdown && (
                                      <>
                                        <div className="fixed inset-0 z-40" onClick={() => { setShowCountryDropdown(false); setCountrySearch(""); }} />
                                        <motion.div
                                          initial={{ opacity: 0, y: -4 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0, y: -4 }}
                                          transition={{ duration: 0.15 }}
                                          className="absolute left-0 bottom-full mb-1 w-56 max-h-48 overflow-hidden rounded-xl border border-foreground/[0.1] bg-background shadow-lg z-50 flex flex-col"
                                        >
                                          <div className="p-2 border-b border-foreground/[0.06]">
                                            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-foreground/[0.04]">
                                              <Search className="w-3 h-3 text-foreground/30" />
                                              <input
                                                type="text"
                                                value={countrySearch}
                                                onChange={(e) => setCountrySearch(e.target.value)}
                                                placeholder="Search country..."
                                                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-foreground/30 outline-none"
                                                autoFocus
                                              />
                                            </div>
                                          </div>
                                          <div className="overflow-y-auto flex-1 scrollbar-hide">
                                            {COUNTRY_CODES.filter(c =>
                                              c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                                              c.dial.includes(countrySearch) ||
                                              c.code.toLowerCase().includes(countrySearch.toLowerCase())
                                            ).map((country) => (
                                              <button
                                                key={country.code}
                                                onClick={() => {
                                                  setSelectedCountry(country);
                                                  setShowCountryDropdown(false);
                                                  setCountrySearch("");
                                                  setSignInInput("");
                                                }}
                                                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-foreground/[0.04] transition-colors ${
                                                  selectedCountry.code === country.code ? "bg-primary/[0.06]" : ""
                                                }`}
                                              >
                                                <span className="text-base leading-none">{country.flag}</span>
                                                <span className="text-xs text-foreground flex-1 truncate">{country.name}</span>
                                                <span className="text-xs text-foreground/40">{country.dial}</span>
                                              </button>
                                            ))}
                                          </div>
                                        </motion.div>
                                      </>
                                    )}
                                  </AnimatePresence>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <input
                              type={detectedMode === "email" ? "email" : "tel"}
                              inputMode={detectedMode === "phone" ? "numeric" : "email"}
                              value={detectedMode === "phone" && rawDigits ? formatPhone(rawDigits, selectedCountry.format) : signInInput}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (detectedMode === "phone" || (/^\d+$/.test(val) && !val.includes("@"))) {
                                  setSignInInput(val.replace(/\D/g, "").slice(0, selectedCountry.phoneLength));
                                } else {
                                  setSignInInput(val);
                                }
                              }}
                              placeholder="Email or phone number"
                              className="flex-1 px-4 py-2.5 rounded-xl border border-foreground/[0.12] bg-foreground/[0.04] text-sm text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSubmit();
                              }}
                            />
                            <button
                              onClick={handleSubmit}
                              disabled={!canSend}
                              className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              Send
                            </button>
                          </div>
                          <p className="text-[11px] text-foreground/35 pl-0.5">
                            {detectedMode === "phone" && rawDigits ? selectedCountry.hint : "Enter your email or phone number to receive a sign-in link"}
                          </p>
                        </>
                      );
                    })()}
                  </motion.div>
                )}

                {/* Verification waiting UI for email/phone sent */}
                {(currentStep === "sign-in-email-sent" || currentStep === "sign-in-phone-sent") && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="pl-7 pt-3 pb-2 space-y-4"
                  >
                    {/* Waiting indicator */}
                    <div className="flex items-center gap-2 text-foreground/50">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm font-medium">Waiting for verification...</span>
                    </div>

                    {/* Info box */}
                    <div className="rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] p-3.5 space-y-1.5">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <p className="text-xs text-foreground/50 leading-relaxed">
                          Tap the link in your {currentStep === "sign-in-email-sent" ? "email" : "SMS"} to verify your identity and activate this device. This page will update automatically.
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          // Resend logic - just show a toast-like message
                          const resendMsg: Message = { id: Date.now().toString(), role: "assistant", content: `✅ We've resent the sign-in link to **${sentAddress}**` };
                          setMessages((prev) => [...prev, resendMsg]);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-foreground/[0.1] bg-foreground/[0.03] hover:bg-foreground/[0.06] text-sm text-foreground/60 hover:text-foreground transition-all"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Resend Link
                      </button>
                      <button
                        onClick={() => {
                          // Go back to email/phone input
                          const msgs = messages.slice(0, -2);
                          setMessages(msgs);
                          setCurrentStep("sign-in-input");
                          setSignInInput("");
                          setSentAddress("");
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-foreground/[0.1] bg-foreground/[0.03] hover:bg-foreground/[0.06] text-sm text-foreground/60 hover:text-foreground transition-all"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Use a Different {currentStep === "sign-in-email-sent" ? "Email" : "Number"}
                      </button>
                    </div>
                  </motion.div>
                )}
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
