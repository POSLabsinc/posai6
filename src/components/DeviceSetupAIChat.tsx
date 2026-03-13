import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Pencil, KeyRound, Mail, FlaskConical, Clock, Info, Smartphone, CheckCircle2, RefreshCw, ArrowLeft, ChevronDown, Search, ShieldCheck, AlertCircle, ScanLine, Lock, Eye, EyeOff, User, ShieldX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

type StepType = "initial" | "activation-methods" | "activate-code" | "activate-code-verifying" | "sign-in-link" | "sign-in-email" | "sign-in-phone" | "sign-in-email-sent" | "sign-in-phone-sent" | "sign-in-verified" | "demo-mode" | "demo-email" | "demo-otp" | "demo-verified" | "chat" | "personal-link-methods" | "personal-invite-code" | "personal-invite-verifying" | "personal-sign-in-email" | "personal-sign-in-password" | "personal-sign-in-verifying" | "personal-access-denied";

interface VerificationWaitingProps {
  currentStep: StepType;
  sentAddress: string;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setCurrentStep: React.Dispatch<React.SetStateAction<StepType>>;
  setSignInInput: React.Dispatch<React.SetStateAction<string>>;
  setSentAddress: React.Dispatch<React.SetStateAction<string>>;
}

const VerificationWaiting = ({ currentStep, sentAddress, messages, setMessages, setCurrentStep, setSignInInput, setSentAddress }: VerificationWaitingProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      const successMsg: Message = { id: Date.now().toString(), role: "assistant", content: "✅ Identity verified successfully!" };
      setMessages((prev) => [...prev, successMsg]);
      setCurrentStep("sign-in-verified");

      // After 2s on verified screen, save session and redirect
      setTimeout(() => {
        localStorage.setItem("pos_device_session", JSON.stringify({
          deviceId: `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          deviceType: "company",
          trustedAt: new Date().toISOString(),
        }));
        window.location.href = "/";
      }, 2000);
    }, 5000);

    return () => clearTimeout(timer);
  }, [setMessages, setCurrentStep]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="pl-7 pt-3 pb-2 space-y-4"
    >
      <div className="flex items-center gap-2 text-foreground/50">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span className="text-sm font-medium">Waiting for verification...</span>
      </div>
      <div className="rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] p-3.5 space-y-1.5">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-foreground/50 leading-relaxed">
            Tap the link in your {currentStep === "sign-in-email-sent" ? "email" : "SMS"} to verify your identity and activate this device. This page will update automatically.
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => {
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
            const msgs = messages.slice(0, -2);
            setMessages(msgs);
            setCurrentStep(currentStep === "sign-in-email-sent" ? "sign-in-email" : "sign-in-phone");
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
  );
};

interface DeviceSetupAIChatProps {
  open: boolean;
  onClose: () => void;
  deviceType?: "company" | "personal";
}

const DeviceSetupAIChat = ({ open, onClose, deviceType = "company" }: DeviceSetupAIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showActivationOptions, setShowActivationOptions] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepType>("initial");
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
  const [demoEmail, setDemoEmail] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [demoOtpError, setDemoOtpError] = useState("");
  const [demoSendingOtp, setDemoSendingOtp] = useState(false);
  const [demoVerifyingOtp, setDemoVerifyingOtp] = useState(false);
  const [demoResendCooldown, setDemoResendCooldown] = useState(0);
  const [demoResendCount, setDemoResendCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const demoEmailRef = useRef<HTMLInputElement>(null);
  const demoOtpRef = useRef<HTMLInputElement>(null);
  
  // Personal device invite flow states
  const [inviteCode, setInviteCode] = useState<string[]>(["", "", "", "", "", ""]);
  const inviteCodeRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [invitedUser, setInvitedUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [personalEmail, setPersonalEmail] = useState("");
  const [personalPassword, setPersonalPassword] = useState("");
  const [showPersonalPassword, setShowPersonalPassword] = useState(false);
  const [personalSignInError, setPersonalSignInError] = useState("");
  const [isPersonalSigningIn, setIsPersonalSigningIn] = useState(false);

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

  // Demo OTP resend cooldown
  useEffect(() => {
    if (demoResendCooldown > 0) {
      const timer = setTimeout(() => setDemoResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [demoResendCooldown]);

  const handleDemoSendOtp = useCallback(async (email: string) => {
    setDemoSendingOtp(true);
    setDemoOtpError("");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) {
        setDemoOtpError(error.message);
        setDemoSendingOtp(false);
        return false;
      }
      setDemoResendCooldown(60);
      setDemoSendingOtp(false);
      return true;
    } catch {
      setDemoOtpError("Failed to send code. Try again.");
      setDemoSendingOtp(false);
      return false;
    }
  }, []);

  const handleDemoVerifyOtp = useCallback(async () => {
    if (demoOtp.length !== 6) {
      setDemoOtpError("Please enter the 6-digit code");
      return;
    }
    setDemoVerifyingOtp(true);
    setDemoOtpError("");
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: demoEmail,
        token: demoOtp,
        type: "email",
      });
      if (error) {
        setDemoOtpError("Invalid or expired code. Try again.");
        setDemoOtp("");
        setDemoVerifyingOtp(false);
        return;
      }
      // Sign out — demo doesn't need a real session
      await supabase.auth.signOut();
      
      const successMsg: Message = { id: Date.now().toString(), role: "assistant", content: "✅ Email verified! Starting demo mode with sample data..." };
      setMessages(prev => [...prev, successMsg]);
      setCurrentStep("demo-verified");
      setDemoVerifyingOtp(false);

      // Start demo after brief delay
      setTimeout(() => {
        localStorage.setItem("pos_device_session", JSON.stringify({
          deviceId: `demo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          deviceType: "company",
          trustedAt: new Date().toISOString(),
          lastValidated: new Date().toISOString(),
          isDemo: true,
          businessType: "restaurant",
          demoEmail,
        }));
        localStorage.setItem("pos_session", JSON.stringify({
          employeeId: "demo-user",
          employeeName: "Demo User",
          employeeRole: "Manager",
          employeeAvatar: "",
          revenueCenter: "Demo Station",
          deviceType: "company",
          isDemo: true,
          businessType: "restaurant",
          loginTime: new Date().toISOString(),
        }));
        window.location.href = "/";
      }, 1500);
    } catch {
      setDemoOtpError("Verification failed. Try again.");
      setDemoOtp("");
      setDemoVerifyingOtp(false);
    }
  }, [demoEmail, demoOtp]);

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
    if (deviceType === "personal") {
      const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "How would you like to link this device?" };
      setMessages([userMsg, assistantMsg]);
      setCurrentStep("personal-link-methods");
    } else {
      const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "Please choose one of these activation methods:" };
      setMessages([userMsg, assistantMsg]);
      setCurrentStep("activation-methods");
    }
  }, [deviceType]);

  const handleActivationOption = useCallback((option: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: option };
    let followUp = "";
    let nextStep: "activate-code" | "sign-in-link" | "demo-email" = "activate-code";

    if (option === "Activate with Code") {
      followUp = "Great! Please enter your 6-digit activation code. You can find it from your manager or the Admin Portal.";
      nextStep = "activate-code";
    } else if (option === "Sign in with Link") {
      followUp = "How would you like to receive your secure sign-in link?";
      nextStep = "sign-in-link";
    } else if (option === "Try Demo Mode") {
      followUp = "To access Demo Mode, we need to verify your email first. Please enter your email address below.";
      nextStep = "demo-email";
    }

    const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: followUp };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setCurrentStep(nextStep);
  }, []);

  const handleGoBack = useCallback(() => {
    if (currentStep === "activation-methods" || currentStep === "personal-link-methods") {
      setMessages([]);
      setCurrentStep("initial");
    } else if (["activate-code", "sign-in-link", "demo-email"].includes(currentStep)) {
      const userMsg: Message = { id: Date.now().toString(), role: "user", content: "No, I'm not new" };
      const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "Please choose one of these activation methods:" };
      setMessages([userMsg, assistantMsg]);
      setCurrentStep("activation-methods");
      setDemoEmail("");
      setDemoOtp("");
      setDemoOtpError("");
    } else if (currentStep === "personal-invite-code") {
      const userMsg: Message = { id: Date.now().toString(), role: "user", content: "No, I'm not new" };
      const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "How would you like to link this device?" };
      setMessages([userMsg, assistantMsg]);
      setCurrentStep("personal-link-methods");
      setInviteCode(["", "", "", "", "", ""]);
    } else if (currentStep === "personal-sign-in-email") {
      const userMsg: Message = { id: Date.now().toString(), role: "user", content: "No, I'm not new" };
      const assistantMsg2: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "How would you like to link this device?" };
      setMessages([userMsg, assistantMsg2]);
      setCurrentStep("personal-link-methods");
      setInvitedUser(null);
      setPersonalEmail("");
      setPersonalPassword("");
      setPersonalSignInError("");
      setInviteCode(["", "", "", "", "", ""]);
    } else if (currentStep === "personal-sign-in-password") {
      // Go back to email step - remove password ask message and user email bubble
      const msgs = messages.slice(0, -2);
      setMessages(msgs);
      setCurrentStep("personal-sign-in-email");
      setPersonalEmail("");
      setPersonalPassword("");
    } else if (currentStep === "personal-access-denied") {
      // Go back to email step
      setCurrentStep("personal-sign-in-email");
      setPersonalEmail("");
      setPersonalPassword("");
      setPersonalSignInError("");
      const msgs = messages.slice(0, -1);
      setMessages(msgs);
    } else if (currentStep === "personal-sign-in-verifying") {
      // Can't go back during verification
    } else if (currentStep === "demo-otp") {
      const msgs = messages.slice(0, -2);
      setMessages(msgs);
      setCurrentStep("demo-email");
      setDemoOtp("");
      setDemoOtpError("");
    } else if (currentStep === "sign-in-email" || currentStep === "sign-in-phone") {
      const msgs = messages.slice(0, -2);
      setMessages(msgs);
      setCurrentStep("sign-in-link");
      setSignInInput("");
      setSentAddress("");
    } else if (currentStep === "sign-in-email-sent") {
      const msgs = messages.slice(0, -2);
      setMessages(msgs);
      setCurrentStep("sign-in-email");
      setSignInInput(sentAddress);
      setSentAddress("");
    } else if (currentStep === "sign-in-phone-sent") {
      const msgs = messages.slice(0, -2);
      setMessages(msgs);
      setCurrentStep("sign-in-phone");
      setSignInInput(sentAddress);
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
      // Show verification animation
      setTimeout(() => {
        const verifyMsg: Message = { id: Date.now().toString(), role: "assistant", content: `🔐 Verifying activation code **${code}**...` };
        setMessages((prev) => [...prev, verifyMsg]);
        setCurrentStep("activate-code-verifying");
      }, 300);
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
        const code = newCode.join("");
        const verifyMsg: Message = { id: Date.now().toString(), role: "assistant", content: `🔐 Verifying activation code **${code}**...` };
        setMessages((prev) => [...prev, verifyMsg]);
        setCurrentStep("activate-code-verifying");
      }, 300);
    }
  }, [activationCode]);

  // Handle activation code verification animation + redirect
  useEffect(() => {
    if (currentStep === "activate-code-verifying") {
      const timer = setTimeout(() => {
        const successMsg: Message = { id: Date.now().toString(), role: "assistant", content: "✅ Activation code verified successfully! Setting up your device..." };
        setMessages((prev) => [...prev, successMsg]);

        // After showing success, save session and redirect
        setTimeout(() => {
          localStorage.setItem("pos_device_session", JSON.stringify({
            deviceId: `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            deviceType: "company",
            trustedAt: new Date().toISOString(),
          }));
          window.location.href = "/";
        }, 2000);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Invite code input handlers (personal device)
  const handleInviteCodeInput = useCallback((index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^[0-9]$/.test(value)) return;
    
    const newCode = [...inviteCode];
    newCode[index] = value;
    setInviteCode(newCode);
    
    if (value && index < 5) {
      inviteCodeRefs.current[index + 1]?.focus();
    }
    
    if (value && index === 5 && newCode.every(d => d !== "")) {
      const code = newCode.join("");
      setTimeout(() => {
        const verifyMsg: Message = { id: Date.now().toString(), role: "assistant", content: `🔐 Verifying invite code **${code}**...` };
        setMessages((prev) => [...prev, verifyMsg]);
        setCurrentStep("personal-invite-verifying");
      }, 300);
    }
  }, [inviteCode]);

  const handleInviteCodeKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !inviteCode[index] && index > 0) {
      inviteCodeRefs.current[index - 1]?.focus();
    }
  }, [inviteCode]);

  const handleInviteCodePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newCode = [...inviteCode];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setInviteCode(newCode);
    const focusIdx = Math.min(pasted.length, 5);
    inviteCodeRefs.current[focusIdx]?.focus();
    
    if (newCode.every(d => d !== "")) {
      setTimeout(() => {
        const code = newCode.join("");
        const verifyMsg: Message = { id: Date.now().toString(), role: "assistant", content: `🔐 Verifying invite code **${code}**...` };
        setMessages((prev) => [...prev, verifyMsg]);
        setCurrentStep("personal-invite-verifying");
      }, 300);
    }
  }, [inviteCode]);

  // Handle invite code verification → show sign-in
  useEffect(() => {
    if (currentStep === "personal-invite-verifying") {
      const timer = setTimeout(() => {
        const user = { name: "Alex Johnson", email: "alex.johnson@restaurant.com", role: "Manager" };
        setInvitedUser(user);
        const successMsg: Message = { id: Date.now().toString(), role: "assistant", content: `✅ Code verified! This invite was issued to **${user.name}** (${user.role}). Please sign in with your approved credentials.` };
        setMessages((prev) => [...prev, successMsg]);
        setCurrentStep("personal-sign-in");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Handle personal device sign-in
  const handlePersonalSignIn = useCallback(() => {
    if (!personalEmail.trim() || !personalPassword.trim()) {
      setPersonalSignInError("Please enter both email and password");
      return;
    }
    
    setIsPersonalSigningIn(true);
    setPersonalSignInError("");
    
    setTimeout(() => {
      setIsPersonalSigningIn(false);
      
      // Check if email matches invited user
      if (invitedUser && personalEmail.trim().toLowerCase() !== invitedUser.email.toLowerCase()) {
        const deniedMsg: Message = { id: Date.now().toString(), role: "assistant", content: "⛔ The email you entered doesn't match the invited user for this device code." };
        setMessages((prev) => [...prev, deniedMsg]);
        setCurrentStep("personal-access-denied");
        return;
      }
      
      // Success - save session and redirect
      const successMsg: Message = { id: Date.now().toString(), role: "assistant", content: "✅ Identity verified! Setting up your personal device..." };
      setMessages((prev) => [...prev, successMsg]);
      
      setTimeout(() => {
        localStorage.setItem("pos_device_session", JSON.stringify({
          deviceId: `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          deviceType: "personal",
          trustedAt: new Date().toISOString(),
        }));
        localStorage.setItem("pos_session", JSON.stringify({
          employeeId: "personal-user",
          employeeName: invitedUser?.name || "User",
          employeeRole: invitedUser?.role || "Staff",
          employeeAvatar: "",
          revenueCenter: "Personal Device",
          deviceType: "personal",
          loginTime: new Date().toISOString(),
        }));
        window.location.href = "/";
      }, 1500);
    }, 1500);
  }, [personalEmail, personalPassword, invitedUser]);


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
                      onClick={() => {
                        const userMsg: Message = { id: Date.now().toString(), role: "user", content: "Yes, I'm new" };
                        const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "Please contact your admin to get the Activation Code. Once you receive the code, enter it here to activate this device." };
                        setMessages([userMsg, assistantMsg]);
                        setCurrentStep("activate-code");
                      }}
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

                {/* Personal device link methods: Enter Code or Scan QR */}
                {currentStep === "personal-link-methods" && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="flex flex-col gap-2.5 pl-7 pt-3 pb-2"
                  >
                    <div className="flex gap-2.5">
                      <button
                        onClick={() => {
                          const userMsg: Message = { id: Date.now().toString(), role: "user", content: "Enter Code" };
                          const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "Enter the code from your manager's invite. Check your email or scan the QR from the admin portal." };
                          setMessages((prev) => [...prev, userMsg, assistantMsg]);
                          setCurrentStep("personal-invite-code");
                          setInviteCode(["", "", "", "", "", ""]);
                          setTimeout(() => inviteCodeRefs.current[0]?.focus(), 100);
                        }}
                        className="flex items-center gap-3 flex-1 px-3 py-3 rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] hover:bg-foreground/[0.06] transition-all hover:scale-[1.01] active:scale-[0.99] text-left"
                      >
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                          <KeyRound className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground leading-tight">Enter Code</p>
                          <p className="text-[11px] text-foreground/40 leading-tight mt-0.5">Code from your manager's invite</p>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          const userMsg: Message = { id: Date.now().toString(), role: "user", content: "Scan QR Code" };
                          const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "Please use your device camera to scan the QR code from the admin portal." };
                          setMessages((prev) => [...prev, userMsg, assistantMsg]);
                          // QR scanning would be handled here
                        }}
                        className="flex items-center gap-3 flex-1 px-3 py-3 rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] hover:bg-foreground/[0.06] transition-all hover:scale-[1.01] active:scale-[0.99] text-left"
                      >
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                          <ScanLine className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground leading-tight">Scan QR Code</p>
                          <p className="text-[11px] text-foreground/40 leading-tight mt-0.5">Scan from the admin portal</p>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Personal invite code input */}
                {currentStep === "personal-invite-code" && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="pl-7 pt-3 pb-2 space-y-4"
                  >
                    <div className="flex gap-2 justify-start">
                      {inviteCode.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => { inviteCodeRefs.current[i] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleInviteCodeInput(i, e.target.value)}
                          onKeyDown={(e) => handleInviteCodeKeyDown(i, e)}
                          onPaste={i === 0 ? handleInviteCodePaste : undefined}
                          className="w-10 h-12 rounded-xl border border-foreground/[0.12] bg-foreground/[0.04] text-center text-lg font-semibold text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                        />
                      ))}
                    </div>
                    <div className="flex items-start gap-1.5 text-foreground/40">
                      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span className="text-xs">Check your email or scan the QR from the admin portal.</span>
                    </div>
                    <button
                      onClick={() => {
                        const userMsg: Message = { id: Date.now().toString(), role: "user", content: "Scan QR Code" };
                        const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "Please use your device camera to scan the QR code from the admin portal." };
                        setMessages((prev) => [...prev, userMsg, assistantMsg]);
                      }}
                      className="flex items-center justify-center gap-2.5 w-full px-4 py-3 rounded-xl border border-foreground/[0.1] bg-foreground/[0.03] hover:bg-foreground/[0.06] transition-all"
                    >
                      <ScanLine className="w-4 h-4 text-foreground/60" />
                      <span className="text-sm font-medium text-foreground/70">Scan QR Code</span>
                    </button>
                  </motion.div>
                )}

                {/* Personal invite code verifying */}
                {currentStep === "personal-invite-verifying" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="pl-7 pt-3 pb-2 space-y-4"
                  >
                    <div className="flex items-center gap-2 text-foreground/50">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm font-medium">Verifying invite code...</span>
                    </div>
                  </motion.div>
                )}

                {/* Personal sign-in with credentials */}
                {currentStep === "personal-sign-in" && !isLoading && invitedUser && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="pl-7 pt-3 pb-2 space-y-4"
                  >
                    {/* User info card */}
                    <div className="flex flex-col items-center gap-3 py-4">
                      <div className="w-16 h-16 rounded-full bg-foreground/[0.06] border border-foreground/[0.1] flex items-center justify-center">
                        <User className="w-8 h-8 text-foreground/40" />
                      </div>
                      <div className="text-center">
                        <p className="text-base font-semibold text-foreground">{invitedUser.name}</p>
                        <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary">
                          {invitedUser.role}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/40">Sign in with your approved credentials</p>
                    </div>

                    {/* Email input */}
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                      <input
                        type="email"
                        value={personalEmail}
                        onChange={(e) => { setPersonalEmail(e.target.value); setPersonalSignInError(""); }}
                        placeholder="Email address"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-foreground/[0.12] bg-foreground/[0.04] text-sm text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                      />
                    </div>

                    {/* Password input */}
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                      <input
                        type={showPersonalPassword ? "text" : "password"}
                        value={personalPassword}
                        onChange={(e) => { setPersonalPassword(e.target.value); setPersonalSignInError(""); }}
                        placeholder="Password"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handlePersonalSignIn();
                        }}
                        className="w-full pl-10 pr-10 py-3 rounded-xl border border-foreground/[0.12] bg-foreground/[0.04] text-sm text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                      />
                      <button
                        onClick={() => setShowPersonalPassword(!showPersonalPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/50 transition-colors"
                      >
                        {showPersonalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Forgot password */}
                    <div className="flex justify-end">
                      <button className="text-xs text-foreground/40 hover:text-foreground/60 transition-colors">
                        Forgot password?
                      </button>
                    </div>

                    {/* Error */}
                    {personalSignInError && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10">
                        <AlertCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                        <span className="text-xs text-destructive">{personalSignInError}</span>
                      </div>
                    )}

                    {/* Sign in button */}
                    <button
                      onClick={handlePersonalSignIn}
                      disabled={!personalEmail.trim() || !personalPassword.trim() || isPersonalSigningIn}
                      className="w-full py-3 rounded-xl bg-foreground/80 text-background text-sm font-semibold hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isPersonalSigningIn ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Signing In...
                        </span>
                      ) : (
                        "Sign In"
                      )}
                    </button>

                    {/* 2FA notice */}
                    <div className="flex items-center justify-center gap-2 text-foreground/30">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span className="text-xs">2FA required by organization policy</span>
                    </div>

                    <p className="text-[11px] text-foreground/30 text-center">
                      Use the same email your administrator invited you with
                    </p>
                  </motion.div>
                )}

                {/* Personal access denied */}
                {currentStep === "personal-access-denied" && invitedUser && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="pl-7 pt-3 pb-2 space-y-4"
                  >
                    {/* Access denied icon */}
                    <div className="flex flex-col items-center gap-3 py-4">
                      <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                        <ShieldX className="w-8 h-8 text-destructive" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-foreground">Access Denied</p>
                        <p className="text-xs text-foreground/40 mt-1 max-w-[280px]">
                          The email you entered doesn't match the invited user for this device code.
                        </p>
                      </div>
                    </div>

                    {/* Invited user info */}
                    <div className="rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] p-4 space-y-1">
                      <p className="text-[11px] text-foreground/40 uppercase tracking-wider font-medium">Invite Issued To</p>
                      <p className="text-sm font-semibold text-foreground">{invitedUser.name}</p>
                      <p className="text-xs text-foreground/50">{invitedUser.email}</p>
                    </div>

                    {/* Try again button */}
                    <button
                      onClick={() => {
                        setCurrentStep("personal-sign-in");
                        setPersonalEmail("");
                        setPersonalPassword("");
                        setPersonalSignInError("");
                        const msgs = messages.slice(0, -1);
                        setMessages(msgs);
                      }}
                      className="w-full py-3 rounded-xl bg-foreground/80 text-background text-sm font-semibold hover:bg-foreground/90 transition-all"
                    >
                      Try Again
                    </button>

                    <p className="text-xs text-foreground/40 text-center">Not you? Contact your administrator</p>

                    <button
                      className="flex items-center justify-center gap-2 w-full text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      Request New Invite
                    </button>
                  </motion.div>
                )}


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

                {/* Activation code verification animation */}
                {currentStep === "activate-code-verifying" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="pl-7 pt-3 pb-2 space-y-4"
                  >
                    <div className="flex items-center gap-2 text-foreground/50">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm font-medium">Verifying activation code...</span>
                    </div>
                    <div className="rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] p-3.5 space-y-1.5">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <p className="text-xs text-foreground/50 leading-relaxed">
                          We're validating your activation code. This will only take a moment.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Sign-in link options */}
                {currentStep === "sign-in-link" && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="pl-7 pt-3 pb-2"
                  >
                    <div className="flex gap-2.5">
                      <button
                        onClick={() => {
                          const userMsg: Message = { id: Date.now().toString(), role: "user", content: "Email" };
                          const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "Please enter your email address to receive the secure sign-in link." };
                          setMessages((prev) => [...prev, userMsg, assistantMsg]);
                          setCurrentStep("sign-in-email");
                          setSignInInput("");
                        }}
                        className="flex items-center gap-3 flex-1 px-3 py-3 rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] hover:bg-foreground/[0.06] transition-all hover:scale-[1.01] active:scale-[0.99] text-left"
                      >
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground leading-tight">Email</p>
                          <p className="text-[11px] text-foreground/40 leading-tight mt-0.5">Receive a sign-in link via email</p>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          const userMsg: Message = { id: Date.now().toString(), role: "user", content: "Phone" };
                          const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "Please enter your phone number to receive the secure sign-in link." };
                          setMessages((prev) => [...prev, userMsg, assistantMsg]);
                          setCurrentStep("sign-in-phone");
                          setSignInInput("");
                        }}
                        className="flex items-center gap-3 flex-1 px-3 py-3 rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] hover:bg-foreground/[0.06] transition-all hover:scale-[1.01] active:scale-[0.99] text-left"
                      >
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                          <Smartphone className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground leading-tight">Phone</p>
                          <p className="text-[11px] text-foreground/40 leading-tight mt-0.5">Receive a sign-in link via SMS</p>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Email input for sign-in-email step */}
                {currentStep === "sign-in-email" && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="pl-7 pt-3 pb-2 space-y-3"
                  >
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={signInInput}
                        onChange={(e) => setSignInInput(e.target.value)}
                        placeholder="name@company.com"
                        className="flex-1 px-4 py-2.5 rounded-xl border border-foreground/[0.12] bg-foreground/[0.04] text-sm text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && signInInput.trim() && signInInput.includes("@")) {
                            const email = signInInput.trim();
                            setSentAddress(email);
                            const userMsg: Message = { id: Date.now().toString(), role: "user", content: email };
                            const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: `We sent a secure sign-in link to **${email}**` };
                            setMessages((prev) => [...prev, userMsg, assistantMsg]);
                            setCurrentStep("sign-in-email-sent");
                            setSignInInput("");
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (signInInput.trim() && signInInput.includes("@")) {
                            const email = signInInput.trim();
                            setSentAddress(email);
                            const userMsg: Message = { id: Date.now().toString(), role: "user", content: email };
                            const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: `We sent a secure sign-in link to **${email}**` };
                            setMessages((prev) => [...prev, userMsg, assistantMsg]);
                            setCurrentStep("sign-in-email-sent");
                            setSignInInput("");
                          }
                        }}
                        disabled={!signInInput.trim() || !signInInput.includes("@")}
                        className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        Send
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Phone input for sign-in-phone step */}
                {currentStep === "sign-in-phone" && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="pl-7 pt-3 pb-2 space-y-2"
                  >
                    <div className="flex gap-2">
                      {/* Country code selector */}
                      <div className="relative">
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
                      </div>

                      {/* Phone input */}
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={formatPhone(signInInput, selectedCountry.format)}
                        onChange={(e) => setSignInInput(e.target.value.replace(/\D/g, "").slice(0, selectedCountry.phoneLength))}
                        placeholder={selectedCountry.placeholder}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-foreground/[0.12] bg-foreground/[0.04] text-sm text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && signInInput.length === selectedCountry.phoneLength) {
                            const phone = `${selectedCountry.dial} ${formatPhone(signInInput, selectedCountry.format)}`;
                            setSentAddress(phone);
                            const userMsg: Message = { id: Date.now().toString(), role: "user", content: phone };
                            const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: `We sent a secure sign-in link to **${phone}**` };
                            setMessages((prev) => [...prev, userMsg, assistantMsg]);
                            setCurrentStep("sign-in-phone-sent");
                            setSignInInput("");
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (signInInput.length === selectedCountry.phoneLength) {
                            const phone = `${selectedCountry.dial} ${formatPhone(signInInput, selectedCountry.format)}`;
                            setSentAddress(phone);
                            const userMsg: Message = { id: Date.now().toString(), role: "user", content: phone };
                            const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: `We sent a secure sign-in link to **${phone}**` };
                            setMessages((prev) => [...prev, userMsg, assistantMsg]);
                            setCurrentStep("sign-in-phone-sent");
                            setSignInInput("");
                          }
                        }}
                        disabled={signInInput.length !== selectedCountry.phoneLength}
                        className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        Send
                      </button>
                    </div>
                    <p className="text-[11px] text-foreground/35 pl-0.5">{selectedCountry.hint}</p>
                  </motion.div>
                )}

                {/* Verification waiting UI for email/phone sent */}
                {(currentStep === "sign-in-email-sent" || currentStep === "sign-in-phone-sent") && !isLoading && (
                  <VerificationWaiting
                    currentStep={currentStep}
                    sentAddress={sentAddress}
                    messages={messages}
                    setMessages={setMessages}
                    setCurrentStep={setCurrentStep}
                    setSignInInput={setSignInInput}
                    setSentAddress={setSentAddress}
                  />
                )}

                {/* Demo email error display */}
                {currentStep === "demo-email" && demoOtpError && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pl-7 pt-3 pb-2"
                  >
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10">
                      <AlertCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                      <span className="text-xs text-destructive">{demoOtpError}</span>
                    </div>
                  </motion.div>
                )}

                {/* Demo OTP input step */}
                {currentStep === "demo-otp" && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="pl-7 pt-3 pb-2 space-y-3"
                  >
                    <div className="flex gap-2 justify-start">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-9 h-11 rounded-xl border-2 flex items-center justify-center text-lg font-semibold transition-all ${
                            demoOtp[i]
                              ? "border-amber-500/40 bg-amber-500/5 text-foreground"
                              : i === demoOtp.length
                                ? "border-amber-500/30 bg-foreground/[0.02]"
                                : "border-foreground/[0.08] bg-foreground/[0.02] text-foreground/30"
                          }`}
                        >
                          {demoOtp[i] || ""}
                        </div>
                      ))}
                    </div>
                    <input
                      ref={demoOtpRef}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={demoOtp}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setDemoOtp(val);
                        setDemoOtpError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && demoOtp.length === 6) {
                          handleDemoVerifyOtp();
                        }
                      }}
                      className="sr-only"
                      autoFocus
                    />
                    <label htmlFor="" onClick={() => demoOtpRef.current?.focus()} className="block w-full cursor-text" />

                    {demoOtpError && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10">
                        <AlertCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                        <span className="text-xs text-destructive">{demoOtpError}</span>
                      </div>
                    )}

                    <button
                      onClick={handleDemoVerifyOtp}
                      disabled={demoOtp.length !== 6 || demoVerifyingOtp}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {demoVerifyingOtp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          Verify & Start Demo
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          setCurrentStep("demo-email");
                          setDemoOtp("");
                          setDemoOtpError("");
                          const msgs = messages.slice(0, -2);
                          setMessages(msgs);
                        }}
                        className="text-xs text-foreground/40 hover:text-foreground/60 transition-colors"
                      >
                        Change email
                      </button>
                      <button
                        onClick={() => {
                          if (demoResendCooldown > 0 || demoResendCount >= 3) return;
                          setDemoResendCount(c => c + 1);
                          setDemoResendCooldown(30 * (demoResendCount + 1));
                          handleDemoSendOtp(demoEmail);
                        }}
                        disabled={demoResendCooldown > 0 || demoSendingOtp || demoResendCount >= 3}
                        className="text-xs text-primary hover:text-primary/80 transition-colors disabled:text-foreground/30 disabled:cursor-not-allowed"
                      >
                        {demoResendCount >= 3
                          ? "Max attempts"
                          : demoResendCooldown > 0
                            ? `Resend in ${demoResendCooldown}s`
                            : "Resend code"
                        }
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Demo verified success */}
                {currentStep === "demo-verified" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="pl-7 pt-3 pb-2 space-y-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Demo Mode Starting!</p>
                        <p className="text-xs text-foreground/50">Loading sample data...</p>
                      </div>
                    </div>
                    <div className="w-full h-1 rounded-full bg-foreground/[0.08] overflow-hidden">
                      <motion.div
                        className="h-full bg-emerald-500 rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1.5, ease: "linear" }}
                      />
                    </div>
                  </motion.div>
                )}

                {currentStep === "sign-in-verified" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="pl-7 pt-3 pb-2 space-y-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">This device is activated!</p>
                        <p className="text-xs text-foreground/50">Redirecting to clock-in...</p>
                      </div>
                    </div>
                    <div className="w-full h-1 rounded-full bg-foreground/[0.08] overflow-hidden">
                      <motion.div
                        className="h-full bg-green-500 rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2, ease: "linear" }}
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Input - hide when in email/phone/code input steps or OTP/verified */}
          {currentStep !== "sign-in-email" && currentStep !== "sign-in-phone" && currentStep !== "activate-code" && currentStep !== "activate-code-verifying" && currentStep !== "demo-otp" && currentStep !== "demo-verified" && currentStep !== "personal-invite-code" && currentStep !== "personal-invite-verifying" && currentStep !== "personal-sign-in" && currentStep !== "personal-access-denied" && (
            <div className="px-6 py-4 flex-shrink-0">
              {currentStep === "demo-email" ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                      <input
                        ref={inputRef}
                        type="email"
                        value={demoEmail}
                        onChange={(e) => { setDemoEmail(e.target.value); setDemoOtpError(""); }}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter" && demoEmail.includes("@") && !demoSendingOtp) {
                            e.preventDefault();
                            const ok = await handleDemoSendOtp(demoEmail);
                            if (ok) {
                              const userMsg: Message = { id: Date.now().toString(), role: "user", content: demoEmail };
                              const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: `Verification code sent to **${demoEmail}**. Enter the 6-digit code below.` };
                              setMessages(prev => [...prev, userMsg, assistantMsg]);
                              setCurrentStep("demo-otp");
                              setTimeout(() => demoOtpRef.current?.focus(), 100);
                            }
                          }
                        }}
                        placeholder="your@email.com"
                        className="flex-1 w-full bg-foreground/[0.04] border border-foreground/[0.08] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/30 transition-colors"
                        disabled={demoSendingOtp}
                        autoFocus
                      />
                    </div>
                    <button
                      onClick={async () => {
                        if (!demoEmail.includes("@") || demoSendingOtp) return;
                        const ok = await handleDemoSendOtp(demoEmail);
                        if (ok) {
                          const userMsg: Message = { id: Date.now().toString(), role: "user", content: demoEmail };
                          const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: `Verification code sent to **${demoEmail}**. Enter the 6-digit code below.` };
                          setMessages(prev => [...prev, userMsg, assistantMsg]);
                          setCurrentStep("demo-otp");
                          setTimeout(() => demoOtpRef.current?.focus(), 100);
                        }
                      }}
                      disabled={!demoEmail.includes("@") || demoSendingOtp}
                      className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      {demoSendingOtp ? (
                        <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 text-primary-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              ) : (
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
              )}
            </div>
          )}
        </motion.div>
  );
};

export default DeviceSetupAIChat;
