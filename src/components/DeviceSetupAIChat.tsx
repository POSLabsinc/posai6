import { useState, useRef, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Html5Qrcode } from "html5-qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Pencil, KeyRound, Mail, FlaskConical, Clock, Info, Smartphone, CheckCircle2, RefreshCw, ArrowLeft, ChevronDown, ChevronRight, Search, ShieldCheck, AlertCircle, ScanLine, Lock, Eye, EyeOff, User, ShieldX, Building2, Globe, Key, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import InlineIOSKeyboard from "@/components/InlineIOSKeyboard";
import ReactMarkdown from "react-markdown";
import MerchantOnboarding from "@/components/MerchantOnboarding";
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

type StepType = "initial" | "activation-methods" | "activate-code" | "activate-code-verifying" | "sign-in-link" | "sign-in-email" | "sign-in-phone" | "sign-in-email-sent" | "sign-in-phone-sent" | "sign-in-verified" | "demo-mode" | "demo-email" | "demo-otp" | "demo-verified" | "chat" | "chat-qr-options" | "chat-qr-scanning" | "chat-browser" | "chat-browser-connected" | "chat-device-name" | "personal-link-methods" | "personal-invite-code" | "personal-invite-verifying" | "personal-sign-in-email" | "personal-sign-in-password" | "personal-sign-in-verifying" | "personal-access-denied" | "personal-qr-scanner" | "returning-contact" | "returning-email" | "returning-phone" | "new-contact" | "new-email" | "new-phone" | "new-not-found" | "new-checking" | "create-fullname" | "create-confirm-email" | "create-email" | "create-phone" | "create-otp" | "create-otp-verifying" | "create-password" | "create-device-pin" | "create-country" | "create-business" | "create-creating" | "create-success" | "license-request" | "license-submitted";

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
  onAccountCreated?: () => void;
}

const DeviceSetupAIChat = ({ open, onClose, deviceType = "company", onAccountCreated }: DeviceSetupAIChatProps) => {
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
  const [scannerError, setScannerError] = useState("");
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const [invitedUser, setInvitedUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [personalEmail, setPersonalEmail] = useState("");
  const [personalPassword, setPersonalPassword] = useState("");
  const [showPersonalPassword, setShowPersonalPassword] = useState(false);
  const [personalSignInError, setPersonalSignInError] = useState("");
  const [isPersonalSigningIn, setIsPersonalSigningIn] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);

  // Account creation flow states
  const [createFullName, setCreateFullName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createOtp, setCreateOtp] = useState("");
  const [createOtpError, setCreateOtpError] = useState("");
  const [createCountry, setCreateCountry] = useState("");
  const [createBusiness, setCreateBusiness] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createPasswordError, setCreatePasswordError] = useState("");
  const [createDevicePin, setCreateDevicePin] = useState("");
  const [createDevicePinError, setCreateDevicePinError] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [chatDeviceName, setChatDeviceName] = useState("Rustic Table POS 1");

  useEffect(() => {
    if (open && scrollRef.current) {
      const container = scrollRef.current;
      // Scroll incrementally to show new content without hiding the top header
      const targetScroll = Math.min(
        container.scrollTop + 120,
        container.scrollHeight - container.clientHeight
      );
      container.scrollTo({ top: targetScroll, behavior: 'smooth' });
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

  // Reset keyboard visibility when step changes
  useEffect(() => {
    setShowKeyboard(false);
  }, [currentStep]);

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
      const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "Welcome back! To send you an activation code, how would you like to be reached?" };
      setMessages([userMsg, assistantMsg]);
      setCurrentStep("returning-contact");
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
    if (currentStep === "activation-methods" || currentStep === "personal-link-methods" || currentStep === "returning-contact" || currentStep === "new-contact") {
      setMessages([]);
      setCurrentStep("initial");
    } else if (["activate-code", "sign-in-link", "demo-email"].includes(currentStep)) {
      const userMsg: Message = { id: Date.now().toString(), role: "user", content: "No, I'm not new" };
      const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "Welcome back! To send you an activation code, how would you like to be reached?" };
      setMessages([userMsg, assistantMsg]);
      setCurrentStep("returning-contact");
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
    } else if (currentStep === "returning-email" || currentStep === "returning-phone") {
      const userMsg: Message = { id: Date.now().toString(), role: "user", content: "No, I'm not new" };
      const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "Welcome back! To send you an activation code, how would you like to be reached?" };
      setMessages([userMsg, assistantMsg]);
      setCurrentStep("returning-contact");
      setSignInInput("");
      setSentAddress("");
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
    } else if (currentStep === "new-email" || currentStep === "new-phone") {
      const userMsg: Message = { id: Date.now().toString(), role: "user", content: "Yes, I'm new" };
      const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "Great, let's get started. What's your email or mobile number?" };
      setMessages([userMsg, assistantMsg]);
      setCurrentStep("new-contact");
      setSignInInput("");
      setSentAddress("");
    } else if (currentStep === "new-not-found") {
      const userMsg: Message = { id: Date.now().toString(), role: "user", content: "Yes, I'm new" };
      const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "Great, let's get started. What's your email or mobile number?" };
      setMessages([userMsg, assistantMsg]);
      setCurrentStep("new-contact");
      setSignInInput("");
      setSentAddress("");
    } else if (currentStep === "create-confirm-email") {
      setMessages((prev) => prev.slice(0, -2));
      setCurrentStep("new-contact");
      setSignInInput("");
      setSentAddress("");
      setCreateEmail("");
    } else if (currentStep === "create-fullname") {
      setMessages((prev) => prev.slice(0, -2));
      setCurrentStep("create-confirm-email");
      setCreateFullName("");
    } else if (currentStep === "create-email") {
      setMessages((prev) => prev.slice(0, -2));
      setCurrentStep("create-confirm-email");
      setCreateEmail("");
    } else if (currentStep === "create-phone") {
      setMessages((prev) => prev.slice(0, -2));
      setCurrentStep("create-email");
      setCreatePhone("");
    } else if (currentStep === "create-otp") {
      setMessages((prev) => prev.slice(0, -2));
      setCurrentStep("create-confirm-email");
      setCreateOtp("");
      setCreateOtpError("");
    } else if (currentStep === "create-password") {
      setMessages((prev) => prev.slice(0, -2));
      setCurrentStep("create-otp");
      setCreatePassword("");
      setCreatePasswordError("");
    } else if (currentStep === "create-device-pin") {
      setMessages((prev) => prev.slice(0, -2));
      setCurrentStep("create-password");
      setCreateDevicePin("");
      setCreateDevicePinError("");
    } else if (currentStep === "create-country") {
      setMessages((prev) => prev.slice(0, -2));
      setCurrentStep("create-password");
      setCreateCountry("");
    } else if (currentStep === "create-business") {
      setMessages((prev) => prev.slice(0, -2));
      setCurrentStep("create-country");
      setCreateBusiness("");
    } else if (currentStep === "license-request") {
      // Can't go back from here
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

  const handleActivationKeypadPress = useCallback((key: string) => {
    const nextIndex = activationCode.findIndex((digit) => digit === "");
    if (nextIndex === -1) return;
    handleCodeInput(nextIndex, key);
  }, [activationCode, handleCodeInput]);

  const handleActivationKeypadDelete = useCallback(() => {
    let lastFilledIndex = -1;
    for (let i = activationCode.length - 1; i >= 0; i--) {
      if (activationCode[i]) {
        lastFilledIndex = i;
        break;
      }
    }
    if (lastFilledIndex === -1) return;

    const newCode = [...activationCode];
    newCode[lastFilledIndex] = "";
    setActivationCode(newCode);
    codeInputRefs.current[lastFilledIndex]?.focus();
  }, [activationCode]);

  // Auto-open keyboard when entering activate-code step
  useEffect(() => {
   if (currentStep === "activate-code" || currentStep === "personal-invite-code") {
      setShowKeyboard(true);
    }
  }, [currentStep]);

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

  const handleInviteKeypadPress = useCallback((key: string) => {
    const nextIndex = inviteCode.findIndex((digit) => digit === "");
    if (nextIndex === -1) return;
    handleInviteCodeInput(nextIndex, key);
  }, [inviteCode, handleInviteCodeInput]);

  const handleInviteKeypadDelete = useCallback(() => {
    let lastFilledIndex = -1;
    for (let i = inviteCode.length - 1; i >= 0; i--) {
      if (inviteCode[i]) {
        lastFilledIndex = i;
        break;
      }
    }
    if (lastFilledIndex === -1) return;

    const newCode = [...inviteCode];
    newCode[lastFilledIndex] = "";
    setInviteCode(newCode);
    inviteCodeRefs.current[lastFilledIndex]?.focus();
  }, [inviteCode]);

  // QR Scanner handlers
  const stopQRScanner = useCallback(async () => {
    if (qrScannerRef.current) {
      try {
        await qrScannerRef.current.stop();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      } finally {
        qrScannerRef.current = null;
      }
    }
    setScannerError("");
  }, []);

  const startQRScanner = useCallback(() => {
    setShowKeyboard(false);
    setScannerError("");
    setCurrentStep("personal-qr-scanner");
  }, []);

  useEffect(() => {
    if (currentStep !== "personal-qr-scanner") return;

    const timer = setTimeout(() => {
      const initScanner = async () => {
        try {
          await stopQRScanner();
          const html5QrCode = new Html5Qrcode("ai-qr-reader");
          qrScannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 220, height: 220 } },
            (decodedText) => {
              const digits = decodedText.replace(/\D/g, "").slice(0, 6);
              const newCode = ["", "", "", "", "", ""];
              for (let i = 0; i < digits.length; i++) newCode[i] = digits[i];
              setInviteCode(newCode);
              void stopQRScanner();
              const scannedMsg: Message = { id: Date.now().toString(), role: "assistant", content: "✅ QR Code scanned! Verifying your invite code..." };
              setMessages((prev) => [...prev, scannedMsg]);
              setCurrentStep("personal-invite-verifying");
            },
            () => {}
          );
        } catch (err) {
          console.error("QR Scanner error:", err);
          setScannerError("Unable to access camera. Please check permissions.");
        }
      };

      void initScanner();
    }, 200);

    return () => {
      clearTimeout(timer);
      void stopQRScanner();
    };
  }, [currentStep, stopQRScanner]);

  // Handle invite code verification → show profile + ask email
  useEffect(() => {
    if (currentStep === "personal-invite-verifying") {
      const timer = setTimeout(() => {
        const user = { name: "Alex Johnson", email: "alex.johnson@restaurant.com", role: "Manager" };
        setInvitedUser(user);
        const successMsg: Message = { id: Date.now().toString(), role: "assistant", content: `✅ Code verified! This invite was issued to **${user.name}** (${user.role}). Please enter your email address to sign in.` };
        setMessages((prev) => [...prev, successMsg]);
        setCurrentStep("personal-sign-in-email");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Handle personal email submission (from bottom input)
  const handlePersonalEmailSubmit = useCallback(() => {
    if (!personalEmail.trim() || !personalEmail.includes("@")) return;
    
    const emailVal = personalEmail.trim();
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: emailVal };
    const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: `Got it. Now please enter your password.` };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setCurrentStep("personal-sign-in-password");
  }, [personalEmail]);

  // Handle personal password submission (from bottom input)
  const handlePersonalPasswordSubmit = useCallback(() => {
    if (!personalPassword.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: "••••••••" };
    setMessages((prev) => [...prev, userMsg]);
    setCurrentStep("personal-sign-in-verifying");
    setIsPersonalSigningIn(true);
    
    setTimeout(() => {
      setIsPersonalSigningIn(false);
      
      // Check if email matches invited user
      if (invitedUser && personalEmail.trim().toLowerCase() !== invitedUser.email.toLowerCase()) {
        const deniedMsg: Message = { id: Date.now().toString(), role: "assistant", content: "⛔ The email you entered doesn't match the invited user for this device code." };
        setMessages((prev) => [...prev, deniedMsg]);
        setCurrentStep("personal-access-denied");
        return;
      }
      
      // Success
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


  return showOnboarding ? (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="w-full h-full"
    >
      <MerchantOnboarding
        prefillEmail={createEmail}
        prefillName={createFullName}
        onBack={() => setShowOnboarding(false)}
        onComplete={(data) => {
          localStorage.setItem("pos_device_session", JSON.stringify({
            deviceId: `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            deviceType,
            trustedAt: new Date().toISOString(),
            lastValidated: new Date().toISOString(),
          }));
          localStorage.setItem("pos_session", JSON.stringify({
            employeeId: "onboarded-user",
            employeeName: createFullName || data.full_name || "Manager",
            employeeRole: "manager",
            revenueCenter: "Dine Center",
            deviceType,
            loginTime: new Date().toISOString(),
          }));
          localStorage.setItem("pos_onboarding_data", JSON.stringify(data));
          window.location.href = "/";
        }}
      />
    </motion.div>
  ) : (
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
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide flex flex-col" style={{ scrollBehavior: 'smooth' }}>
            <AnimatePresence mode="wait">
            {currentStep === "initial" ? (
              <motion.div key="initial" className="flex flex-col h-full" exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
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
                    <div className="max-w-[80%] rounded-2xl px-3.5 py-2.5 text-lg bg-foreground/[0.04] text-foreground">
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
                        const newMessages = [userMsg];
                        setMessages(newMessages);
                        setCurrentStep("chat-qr-options");
                        streamChat(newMessages);
                      }}
                      className="px-5 py-2 rounded-full text-lg font-medium border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Yes, I'm New
                    </button>
                    <button
                      onClick={handleNotNew}
                      className="px-5 py-2 rounded-full text-lg font-medium border border-foreground/[0.1] bg-foreground/[0.03] hover:bg-foreground/[0.06] text-foreground/70 hover:text-foreground transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      No, I'm Not
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="messages" className="flex flex-col h-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
                {/* Chat messages */}
                <div className="flex-1 space-y-4">
                  {messages.map((msg, index) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.15, ease: "easeOut" }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="flex-shrink-0 mr-2 mt-1">
                          <AnimatedAIIcon size={18} />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-lg ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-foreground/[0.04] text-foreground"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <div className="prose prose-lg prose-invert max-w-none [&>p]:m-0 [&>p+p]:mt-2 [&>ul]:mt-1 [&>ul]:mb-0 [&>ol]:mt-1 [&>ol]:mb-0">
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
                        <span className="text-base">Thinking...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Chat QR Options - shown after AI suggests QR */}
                {currentStep === "chat-qr-options" && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="flex flex-wrap gap-2 pl-7 pt-3 pb-2"
                  >
                    <button
                      onClick={() => {
                        const userMsg: Message = { id: Date.now().toString(), role: "user", content: "Yes, scan QR" };
                        const assistantMsg: Message = {
                          id: (Date.now() + 1).toString(),
                          role: "assistant",
                          content: "Great!\n\nPlease use your phone or tablet to scan the QR code shown on this screen.\n\nOnce scanned, a link will open on your phone. Just follow the steps there.\n\nI'll wait here while you complete it on your phone..."
                        };
                        setMessages(prev => [...prev, userMsg, assistantMsg]);
                        setCurrentStep("chat-qr-scanning");
                      }}
                      className="px-4 py-2 rounded-full text-sm font-medium border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Yes, scan QR
                    </button>
                    <button
                      onClick={() => {
                        const userMsg: Message = { id: Date.now().toString(), role: "user", content: "Use browser instead" };
                        const assistantMsg: Message = {
                          id: (Date.now() + 1).toString(),
                          role: "assistant",
                          content: "No problem! You can activate this device using any browser.\n\n**Step 1:** Open this link on your phone or computer:\n**posai.com/pair**\n\n**Step 2:** Enter the code shown below.\n\nLet me know once you've entered the code."
                        };
                        setMessages(prev => [...prev, userMsg, assistantMsg]);
                        setCurrentStep("chat-browser");
                      }}
                      className="px-4 py-2 rounded-full text-sm font-medium border border-foreground/[0.1] bg-foreground/[0.03] hover:bg-foreground/[0.06] text-foreground/70 hover:text-foreground transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Use browser instead
                    </button>
                    <button
                      onClick={() => {
                        const userMsg: Message = { id: Date.now().toString(), role: "user", content: "Send code to email/phone" };
                        setMessages(prev => [...prev, userMsg]);
                        setCurrentStep("chat");
                        streamChat([...messages, { id: Date.now().toString(), role: "user", content: "Send code to email/phone" }]);
                      }}
                      className="px-4 py-2 rounded-full text-sm font-medium border border-foreground/[0.1] bg-foreground/[0.03] hover:bg-foreground/[0.06] text-foreground/70 hover:text-foreground transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Send code to email/phone
                    </button>
                  </motion.div>
                )}

                {/* QR Code display after user selects scan QR */}
                {currentStep === "chat-qr-scanning" && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="flex flex-col items-center gap-4 pl-7 pt-4 pb-4"
                  >
                    <div className="bg-white p-4 rounded-2xl shadow-lg">
                      <QRCodeSVG
                        value="https://posai.com/pair?device=activate"
                        size={200}
                        bgColor="#FFFFFF"
                        fgColor="#000000"
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                    <p className="text-xs text-foreground/40 text-center">Scan with your phone camera</p>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => {
                          const userMsg: Message = { id: Date.now().toString(), role: "user", content: "Done, I scanned it" };
                          setMessages(prev => [...prev, userMsg]);
                          setCurrentStep("chat");
                          streamChat([...messages, { id: Date.now().toString(), role: "user", content: "Done, I scanned it" }]);
                        }}
                        className="px-4 py-2 rounded-full text-sm font-medium border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Done
                      </button>
                      <button
                        onClick={() => {
                          const userMsg: Message = { id: Date.now().toString(), role: "user", content: "Having trouble scanning" };
                          setMessages(prev => [...prev, userMsg]);
                          setCurrentStep("chat");
                          streamChat([...messages, { id: Date.now().toString(), role: "user", content: "Having trouble scanning" }]);
                        }}
                        className="px-4 py-2 rounded-full text-sm font-medium border border-foreground/[0.1] bg-foreground/[0.03] hover:bg-foreground/[0.06] text-foreground/70 hover:text-foreground transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Need help
                      </button>
                    </div>
                  </motion.div>
                )}

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

                {/* Returning user contact choice: Email or Phone */}
                {currentStep === "returning-contact" && !isLoading && (
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
                          const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "Please enter your email address. We'll send you a 6-digit activation code." };
                          setMessages((prev) => [...prev, userMsg, assistantMsg]);
                          setCurrentStep("returning-email");
                          setSignInInput("");
                        }}
                        className="flex items-center gap-3 flex-1 px-3 py-3 rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] hover:bg-foreground/[0.06] transition-all hover:scale-[1.01] active:scale-[0.99] text-left"
                      >
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground leading-tight">Email</p>
                          <p className="text-[11px] text-foreground/40 leading-tight mt-0.5">Receive activation code via email</p>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          const userMsg: Message = { id: Date.now().toString(), role: "user", content: "Phone" };
                          const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "Please enter your phone number. We'll send you a 6-digit activation code." };
                          setMessages((prev) => [...prev, userMsg, assistantMsg]);
                          setCurrentStep("returning-phone");
                          setSignInInput("");
                        }}
                        className="flex items-center gap-3 flex-1 px-3 py-3 rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] hover:bg-foreground/[0.06] transition-all hover:scale-[1.01] active:scale-[0.99] text-left"
                      >
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                          <Smartphone className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground leading-tight">Phone</p>
                          <p className="text-[11px] text-foreground/40 leading-tight mt-0.5">Receive activation code via SMS</p>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Returning user email input */}
                {currentStep === "returning-email" && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="px-0 pt-3 pb-2 space-y-4"
                  >
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={signInInput}
                        placeholder="name@company.com"
                        readOnly
                        onFocus={() => setShowKeyboard(true)}
                        className="flex-1 px-4 py-3 rounded-2xl border border-foreground/[0.12] bg-foreground/[0.04] text-base text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && signInInput.trim() && signInInput.includes("@")) {
                            const email = signInInput.trim();
                            setSentAddress(email);
                            const userMsg: Message = { id: Date.now().toString(), role: "user", content: email };
                            const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: `We've sent a 6-digit activation code to **${email}**. Please enter the code below.` };
                            setMessages((prev) => [...prev, userMsg, assistantMsg]);
                            setCurrentStep("activate-code");
                            setSignInInput("");
                            setActivationCode(["", "", "", "", "", ""]);
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (signInInput.trim() && signInInput.includes("@")) {
                            const email = signInInput.trim();
                            setSentAddress(email);
                            const userMsg: Message = { id: Date.now().toString(), role: "user", content: email };
                            const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: `We've sent a 6-digit activation code to **${email}**. Please enter the code below.` };
                            setMessages((prev) => [...prev, userMsg, assistantMsg]);
                            setCurrentStep("activate-code");
                            setSignInInput("");
                            setActivationCode(["", "", "", "", "", ""]);
                          }
                        }}
                        disabled={!signInInput.trim() || !signInInput.includes("@")}
                        className="px-5 py-3 rounded-2xl bg-primary text-primary-foreground text-base font-medium hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        Send
                      </button>
                    </div>

                    {showKeyboard && (
                      <InlineIOSKeyboard
                        mode="email"
                        fullWidth
                        size="large"
                        onKeyPress={(key) => setSignInInput((prev) => `${prev}${key}`.slice(0, 80))}
                        onDelete={() => setSignInInput((prev) => prev.slice(0, -1))}
                      />
                    )}
                  </motion.div>
                )}

                {/* Returning user phone input */}
                {currentStep === "returning-phone" && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="px-0 pt-3 pb-2 space-y-4"
                  >
                    <div className="flex gap-2">
                      <div className="relative">
                        <button
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                          className="flex items-center gap-1 px-3 py-3 rounded-2xl border border-foreground/[0.12] bg-foreground/[0.04] text-sm text-foreground hover:bg-foreground/[0.06] transition-all h-full"
                        >
                          <span className="text-base leading-none">{selectedCountry.flag}</span>
                          <span className="text-sm text-foreground/60">{selectedCountry.dial}</span>
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

                      <input
                        type="tel"
                        inputMode="numeric"
                        value={formatPhone(signInInput, selectedCountry.format)}
                        placeholder={selectedCountry.placeholder}
                        readOnly
                        onFocus={() => setShowKeyboard(true)}
                        className="flex-1 px-4 py-3 rounded-2xl border border-foreground/[0.12] bg-foreground/[0.04] text-base text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && signInInput.length === selectedCountry.phoneLength) {
                            const phone = `${selectedCountry.dial} ${formatPhone(signInInput, selectedCountry.format)}`;
                            setSentAddress(phone);
                            const userMsg: Message = { id: Date.now().toString(), role: "user", content: phone };
                            const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: `We've sent a 6-digit activation code to **${phone}**. Please enter the code below.` };
                            setMessages((prev) => [...prev, userMsg, assistantMsg]);
                            setCurrentStep("activate-code");
                            setSignInInput("");
                            setActivationCode(["", "", "", "", "", ""]);
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (signInInput.length === selectedCountry.phoneLength) {
                            const phone = `${selectedCountry.dial} ${formatPhone(signInInput, selectedCountry.format)}`;
                            setSentAddress(phone);
                            const userMsg: Message = { id: Date.now().toString(), role: "user", content: phone };
                            const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: `We've sent a 6-digit activation code to **${phone}**. Please enter the code below.` };
                            setMessages((prev) => [...prev, userMsg, assistantMsg]);
                            setCurrentStep("activate-code");
                            setSignInInput("");
                            setActivationCode(["", "", "", "", "", ""]);
                          }
                        }}
                        disabled={signInInput.length !== selectedCountry.phoneLength}
                        className="px-5 py-3 rounded-2xl bg-primary text-primary-foreground text-base font-medium hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        Send
                      </button>
                    </div>

                    {showKeyboard && (
                      <InlineIOSKeyboard
                        mode="phone"
                        fullWidth
                        size="large"
                        onKeyPress={(key) =>
                          setSignInInput((prev) => `${prev}${key}`.replace(/\D/g, "").slice(0, selectedCountry.phoneLength))
                        }
                        onDelete={() => setSignInInput((prev) => prev.slice(0, -1))}
                      />
                    )}

                    <p className="text-xs text-foreground/35 pl-0.5">{selectedCountry.hint}</p>
                  </motion.div>
                )}

                {/* New user contact choice: Email or Phone */}
                {currentStep === "new-contact" && !isLoading && (
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
                          const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "Please enter your email address so we can look up your account." };
                          setMessages((prev) => [...prev, userMsg, assistantMsg]);
                          setCurrentStep("new-email");
                          setSignInInput("");
                        }}
                        className="flex items-center gap-3 flex-1 px-3 py-3 rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] hover:bg-foreground/[0.06] transition-all hover:scale-[1.01] active:scale-[0.99] text-left"
                      >
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground leading-tight">Email</p>
                          <p className="text-[11px] text-foreground/40 leading-tight mt-0.5">Enter your email address</p>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          const userMsg: Message = { id: Date.now().toString(), role: "user", content: "Phone" };
                          const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "Please enter your mobile number so we can look up your account." };
                          setMessages((prev) => [...prev, userMsg, assistantMsg]);
                          setCurrentStep("new-phone");
                          setSignInInput("");
                        }}
                        className="flex items-center gap-3 flex-1 px-3 py-3 rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] hover:bg-foreground/[0.06] transition-all hover:scale-[1.01] active:scale-[0.99] text-left"
                      >
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                          <Smartphone className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground leading-tight">Phone</p>
                          <p className="text-[11px] text-foreground/40 leading-tight mt-0.5">Enter your mobile number</p>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* New user email input with account lookup */}
                {currentStep === "new-email" && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="px-0 pt-3 pb-2 space-y-4"
                  >
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={signInInput}
                        placeholder="name@company.com"
                        readOnly
                        onFocus={() => setShowKeyboard(true)}
                        className="flex-1 px-4 py-3 rounded-2xl border border-foreground/[0.12] bg-foreground/[0.04] text-base text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                      />
                      <button
                        onClick={() => {
                          if (signInInput.trim() && signInInput.includes("@")) {
                            const email = signInInput.trim();
                            setSentAddress(email);
                            const userMsg: Message = { id: Date.now().toString(), role: "user", content: email };
                            const checkingMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: `🔍 Checking account for **${email}**...` };
                            setMessages((prev) => [...prev, userMsg, checkingMsg]);
                            setCurrentStep("new-checking");
                            setSignInInput("");

                            // Simulate account lookup (2s delay) - new users go directly to account setup
                            setTimeout(() => {
                              const setupMsg: Message = { id: (Date.now() + 2).toString(), role: "assistant", content: `No existing account found. Let's set up your new account! We'll use **${email}** for your account. Would you like to continue with this email?` };
                              setMessages((prev) => [...prev, setupMsg]);
                              setCreateEmail(email);
                              setCurrentStep("create-confirm-email");
                            }, 2000);
                          }
                        }}
                        disabled={!signInInput.trim() || !signInInput.includes("@")}
                        className="px-5 py-3 rounded-2xl bg-primary text-primary-foreground text-base font-medium hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        Verify
                      </button>
                    </div>

                    {showKeyboard && (
                      <InlineIOSKeyboard
                        mode="email"
                        fullWidth
                        size="large"
                        onKeyPress={(key) => setSignInInput((prev) => `${prev}${key}`.slice(0, 80))}
                        onDelete={() => setSignInInput((prev) => prev.slice(0, -1))}
                      />
                    )}
                  </motion.div>
                )}

                {/* New user phone input with account lookup */}
                {currentStep === "new-phone" && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="px-0 pt-3 pb-2 space-y-4"
                  >
                    <div className="flex gap-2">
                      <div className="relative">
                        <button
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                          className="flex items-center gap-1 px-3 py-3 rounded-2xl border border-foreground/[0.12] bg-foreground/[0.04] text-sm text-foreground hover:bg-foreground/[0.06] transition-all h-full"
                        >
                          <span className="text-base leading-none">{selectedCountry.flag}</span>
                          <span className="text-sm text-foreground/60">{selectedCountry.dial}</span>
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

                      <input
                        type="tel"
                        inputMode="numeric"
                        value={formatPhone(signInInput, selectedCountry.format)}
                        placeholder={selectedCountry.placeholder}
                        readOnly
                        onFocus={() => setShowKeyboard(true)}
                        className="flex-1 px-4 py-3 rounded-2xl border border-foreground/[0.12] bg-foreground/[0.04] text-base text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                      />
                      <button
                        onClick={() => {
                          if (signInInput.length === selectedCountry.phoneLength) {
                            const phone = `${selectedCountry.dial} ${formatPhone(signInInput, selectedCountry.format)}`;
                            setSentAddress(phone);
                            const userMsg: Message = { id: Date.now().toString(), role: "user", content: phone };
                            const checkingMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: `🔍 Checking account for **${phone}**...` };
                            setMessages((prev) => [...prev, userMsg, checkingMsg]);
                            setCurrentStep("new-checking");
                            setSignInInput("");

                            // Simulate account lookup (2s delay) - new users go directly to account setup
                            setTimeout(() => {
                              const setupMsg: Message = { id: (Date.now() + 2).toString(), role: "assistant", content: `No existing account found. Let's set up your new account! We'll use **${phone}** for your account. Would you like to continue?` };
                              setMessages((prev) => [...prev, setupMsg]);
                              setCreateEmail(phone);
                              setCurrentStep("create-confirm-email");
                            }, 2000);
                          }
                        }}
                        disabled={signInInput.length !== selectedCountry.phoneLength}
                        className="px-5 py-3 rounded-2xl bg-primary text-primary-foreground text-base font-medium hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        Verify
                      </button>
                    </div>

                    {showKeyboard && (
                      <InlineIOSKeyboard
                        mode="phone"
                        fullWidth
                        size="large"
                        onKeyPress={(key) =>
                          setSignInInput((prev) => `${prev}${key}`.replace(/\D/g, "").slice(0, selectedCountry.phoneLength))
                        }
                        onDelete={() => setSignInInput((prev) => prev.slice(0, -1))}
                      />
                    )}

                    <p className="text-xs text-foreground/35 pl-0.5">{selectedCountry.hint}</p>
                  </motion.div>
                )}

                {/* New user checking animation */}
                {currentStep === "new-checking" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="pl-7 pt-3 pb-2"
                  >
                    <div className="flex items-center gap-2 text-foreground/50">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm font-medium">Looking up your account...</span>
                    </div>
                  </motion.div>
                )}

                {/* New user account not found */}
                {currentStep === "new-not-found" && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="pl-7 pt-3 pb-2"
                  >
                    <div className="flex gap-2.5">
                       <button
                        onClick={() => {
                          const emailFromInput = signInInput || sentAddress || "";
                          const userMsg: Message = { id: Date.now().toString(), role: "user", content: "Create New Account" };
                          const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: emailFromInput ? `We'll use **${emailFromInput}** for your new account. Would you like to continue with this email?` : "Let's create your account! Please enter your email address." };
                          setMessages((prev) => [...prev, userMsg, assistantMsg]);
                          if (emailFromInput) {
                            setCreateEmail(emailFromInput);
                            setCurrentStep("create-confirm-email");
                          } else {
                            setCurrentStep("create-email");
                          }
                          setCreateFullName("");
                          setCreatePhone("");
                          setCreateOtp("");
                          setCreateOtpError("");
                          setCreateCountry("");
                          setCreateBusiness("");
                        }}
                        className="flex items-center gap-3 flex-1 px-3 py-3 rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] hover:bg-foreground/[0.06] transition-all hover:scale-[1.01] active:scale-[0.99] text-left"
                      >
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground leading-tight">Create New Account</p>
                          <p className="text-[11px] text-foreground/40 leading-tight mt-0.5">Set up a new account</p>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          const userMsg: Message = { id: Date.now().toString(), role: "user", content: "Change Email / Mobile Number" };
                          const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "Great, let's get started. What's your email or mobile number?" };
                          setMessages((prev) => [...prev, userMsg, assistantMsg]);
                          setCurrentStep("new-contact");
                          setSignInInput("");
                          setSentAddress("");
                        }}
                        className="flex items-center gap-3 flex-1 px-3 py-3 rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] hover:bg-foreground/[0.06] transition-all hover:scale-[1.01] active:scale-[0.99] text-left"
                      >
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                          <Pencil className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground leading-tight">Change Email / Mobile</p>
                          <p className="text-[11px] text-foreground/40 leading-tight mt-0.5">Try a different contact</p>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Account creation - Confirm email */}
                {currentStep === "create-confirm-email" && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="pl-7 pt-3 pb-2"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-foreground/[0.08] bg-foreground/[0.03]">
                        <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground">{createEmail}</span>
                      </div>
                      <div className="flex gap-2.5">
                        <button
                          onClick={() => {
                            const userMsg: Message = { id: Date.now().toString(), role: "user", content: `Yes, use ${createEmail}` };
                            const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: `We've sent a verification code to **${createEmail}**. Please enter the 6-digit code.` };
                            setMessages((prev) => [...prev, userMsg, assistantMsg]);
                            setCurrentStep("create-otp");
                          }}
                          className="flex items-center gap-2 flex-1 justify-center px-3 py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Yes, continue
                        </button>
                        <button
                          onClick={() => {
                            const userMsg: Message = { id: Date.now().toString(), role: "user", content: "Use a different email" };
                            const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "No problem! Please enter the email you'd like to use." };
                            setMessages((prev) => [...prev, userMsg, assistantMsg]);
                            setCreateEmail("");
                            setCurrentStep("create-email");
                          }}
                          className="flex items-center gap-2 flex-1 justify-center px-3 py-2.5 rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] hover:bg-foreground/[0.06] text-[13px] font-medium text-foreground/60 transition-all"
                        >
                          <Pencil className="w-4 h-4" />
                          Change email
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Account creation - OTP verification */}
                {currentStep === "create-otp" && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="px-0 pt-3 pb-2 space-y-4"
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={createOtp}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                          setCreateOtp(val);
                          setCreateOtpError("");
                        }}
                        placeholder="Enter 6-digit code"
                        className="flex-1 px-4 py-3 rounded-2xl border border-foreground/[0.12] bg-foreground/[0.04] text-base text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all tracking-[0.3em] text-center font-mono"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          if (createOtp.length !== 6) {
                            setCreateOtpError("Please enter the 6-digit code");
                            return;
                          }
                          setCurrentStep("create-otp-verifying");
                          // Simulate OTP verification
                          setTimeout(() => {
                            const userMsg: Message = { id: Date.now().toString(), role: "user", content: `Code: ${createOtp}` };
                            const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "✅ Email verified! Now, create a password for your account." };
                            setMessages((prev) => [...prev, userMsg, assistantMsg]);
                            setCurrentStep("create-password");
                          }, 1500);
                        }}
                        disabled={createOtp.length !== 6}
                        className="px-5 py-3 rounded-2xl bg-primary text-primary-foreground text-base font-medium hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        Verify
                      </button>
                    </div>
                    {createOtpError && (
                      <p className="text-xs text-destructive pl-1">{createOtpError}</p>
                    )}
                    <p className="text-xs text-foreground/35 pl-0.5">We sent a verification code to your email.</p>
                  </motion.div>
                )}

                {/* Account creation - OTP verifying loader */}
                {currentStep === "create-otp-verifying" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="pl-7 pt-3 pb-2"
                  >
                    <div className="flex items-center gap-2 text-foreground/50">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm font-medium">Verifying code...</span>
                    </div>
                  </motion.div>
                )}

                {/* Account creation - Password step */}
                {currentStep === "create-password" && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="pl-7 pt-3 pb-2 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                        <input
                          type={showCreatePassword ? "text" : "password"}
                          value={createPassword}
                          onChange={(e) => {
                            setCreatePassword(e.target.value);
                            setCreatePasswordError("");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && createPassword.length >= 6) {
                              const userMsg: Message = { id: Date.now().toString(), role: "user", content: "Password set" };
                              const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "🔐 Now set a **4-digit device PIN** for quick Clock In and Clock Out." };
                              setMessages((prev) => [...prev, userMsg, assistantMsg]);
                              setCurrentStep("create-device-pin");
                            }
                          }}
                          placeholder="Create a password (min 6 characters)"
                          className="flex-1 w-full bg-foreground/[0.04] border border-foreground/[0.08] rounded-xl pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/30 transition-colors"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowCreatePassword(!showCreatePassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showCreatePassword ? <EyeOff className="w-4 h-4 text-foreground/30" /> : <Eye className="w-4 h-4 text-foreground/30" />}
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          if (createPassword.length < 6) {
                            setCreatePasswordError("Password must be at least 6 characters");
                            return;
                          }
                          const userMsg: Message = { id: Date.now().toString(), role: "user", content: "Password set" };
                          const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "🔐 Now set a **4-digit device PIN** for quick Clock In and Clock Out." };
                          setMessages((prev) => [...prev, userMsg, assistantMsg]);
                          setCurrentStep("create-device-pin");
                        }}
                        disabled={createPassword.length < 6}
                        className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <Send className="w-4 h-4 text-primary-foreground" />
                      </button>
                    </div>
                    {createPasswordError && (
                      <p className="text-xs text-destructive pl-1">{createPasswordError}</p>
                    )}
                    <p className="text-xs text-foreground/35 pl-0.5">Must be at least 6 characters</p>
                  </motion.div>
                )}

                {/* Account creation - Device PIN step */}
                {currentStep === "create-device-pin" && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="pl-7 pt-3 pb-2 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          value={createDevicePin}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                            setCreateDevicePin(val);
                            setCreateDevicePinError("");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && createDevicePin.length === 4) {
                              const userMsg: Message = { id: Date.now().toString(), role: "user", content: "Device PIN set" };
                              const creatingMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "🔄 Creating your account..." };
                              setMessages((prev) => [...prev, userMsg, creatingMsg]);
                              setCurrentStep("create-creating");
                              setTimeout(() => {
                                const successMsg: Message = { id: (Date.now() + 2).toString(), role: "assistant", content: `🎉 Account created successfully!\n\n📧 ${createEmail}\n\nNow let's set up your restaurant!` };
                                setMessages((prev) => [...prev, successMsg]);
                                setTimeout(() => setShowOnboarding(true), 1000);
                              }, 2000);
                            }
                          }}
                          placeholder="Enter 4-digit PIN"
                          className="flex-1 w-full bg-foreground/[0.04] border border-foreground/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/30 transition-colors tracking-[0.5em] text-center"
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (createDevicePin.length !== 4) {
                            setCreateDevicePinError("PIN must be exactly 4 digits");
                            return;
                          }
                          const userMsg: Message = { id: Date.now().toString(), role: "user", content: "Device PIN set" };
                          const creatingMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "🔄 Creating your account..." };
                          setMessages((prev) => [...prev, userMsg, creatingMsg]);
                          setCurrentStep("create-creating");
                          setTimeout(() => {
                            const successMsg: Message = { id: (Date.now() + 2).toString(), role: "assistant", content: `🎉 Account created successfully!\n\n📧 ${createEmail}\n\nNow let's set up your restaurant!` };
                            setMessages((prev) => [...prev, successMsg]);
                            setTimeout(() => setShowOnboarding(true), 1000);
                          }, 2000);
                        }}
                        disabled={createDevicePin.length !== 4}
                        className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <Send className="w-4 h-4 text-primary-foreground" />
                      </button>
                    </div>
                    {createDevicePinError && (
                      <p className="text-xs text-destructive pl-1">{createDevicePinError}</p>
                    )}
                    <p className="text-xs text-foreground/35 pl-0.5">This PIN will be used for Clock In and Clock Out</p>
                  </motion.div>
                )}


                {currentStep === "create-creating" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="pl-7 pt-3 pb-2"
                  >
                    <div className="flex items-center gap-2 text-foreground/50">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm font-medium">Creating your account...</span>
                    </div>
                  </motion.div>
                )}

                {/* Account creation - Success + License request */}
                {currentStep === "license-request" && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="pl-7 pt-3 pb-2"
                  >
                    <button
                      onClick={() => {
                        const userMsg: Message = { id: Date.now().toString(), role: "user", content: "Request License Key" };
                        const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "✅ Your request has been submitted. Our team will get back to you with the license key within 24 hours." };
                        setMessages((prev) => [...prev, userMsg, assistantMsg]);
                        setCurrentStep("license-submitted");
                      }}
                      className="flex items-center gap-3 w-full px-3 py-3 rounded-xl border border-primary/30 bg-primary/[0.06] hover:bg-primary/[0.12] transition-all hover:scale-[1.01] active:scale-[0.99] text-left"
                    >
                      <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                        <Key className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-foreground leading-tight">Request License Key</p>
                        <p className="text-[11px] text-foreground/40 leading-tight mt-0.5">Get your license key to activate your device</p>
                      </div>
                    </button>
                  </motion.div>
                )}

                {/* License submitted - final state */}
                {currentStep === "license-submitted" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="pl-7 pt-3 pb-2 space-y-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Request Submitted!</p>
                        <p className="text-xs text-foreground/50">You'll receive your license key within 24 hours.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const userMsg: Message = { id: Date.now().toString(), role: "user", content: "Try Demo Mode" };
                        const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "✅ Starting Demo Mode with sample data. Since you just created your account, no additional verification is needed. Enjoy exploring eatOS!" };
                        setMessages((prev) => [...prev, userMsg, assistantMsg]);
                        setCurrentStep("demo-verified");
                      }}
                      className="flex items-center gap-3 w-full px-3 py-3 rounded-xl border border-primary/30 bg-primary/[0.06] hover:bg-primary/[0.12] transition-all hover:scale-[1.01] active:scale-[0.99] text-left mt-2"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                        <Play className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">Try Demo Mode</p>
                        <p className="text-[11px] text-foreground/50">Explore eatOS with sample data while you wait</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-foreground/30 flex-shrink-0" />
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
                          startQRScanner();
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
                    className="px-0 pt-3 pb-2 space-y-4"
                  >
                    <div className="flex gap-2 justify-center">
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
                          onFocus={() => setShowKeyboard(true)}
                          className="w-12 h-14 rounded-xl border border-foreground/[0.12] bg-foreground/[0.04] text-center text-xl font-semibold text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                        />
                      ))}
                    </div>

                    <div className="flex items-start gap-1.5 text-foreground/40 px-2">
                      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span className="text-xs">Check your email or scan the QR from the admin portal.</span>
                    </div>

                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => {
                          setInviteCode(["", "", "", "", "", ""]);
                          const reqMsg: Message = { id: Date.now().toString(), role: "assistant", content: "A new invite code has been requested. Please check your email or contact your manager for the new code." };
                          setMessages((prev) => [...prev, reqMsg]);
                        }}
                        className="flex-1 py-2.5 rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] hover:bg-foreground/[0.06] text-foreground/50 text-[13px] font-medium transition-all"
                      >
                        Request a new code
                      </button>

                      <button
                        onClick={() => {
                          const userMsg: Message = { id: Date.now().toString(), role: "user", content: "Scan QR Code" };
                          const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "Please use your device camera to scan the QR code from the admin portal." };
                          setMessages((prev) => [...prev, userMsg, assistantMsg]);
                          startQRScanner();
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-foreground/[0.1] bg-foreground/[0.03] hover:bg-foreground/[0.06] transition-all"
                      >
                        <ScanLine className="w-4 h-4 text-foreground/60" />
                        <span className="text-[13px] font-medium text-foreground/70">Scan QR Code</span>
                      </button>
                    </div>

                    {showKeyboard && (
                      <InlineIOSKeyboard
                        mode="phone"
                        fullWidth
                        size="large"
                        onKeyPress={handleInviteKeypadPress}
                        onDelete={handleInviteKeypadDelete}
                      />
                    )}
                  </motion.div>
                )}

                {/* Personal QR Scanner */}
                {currentStep === "personal-qr-scanner" && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="px-0 pt-3 pb-2 space-y-3"
                  >
                    <div 
                      id="ai-qr-reader" 
                      ref={scannerContainerRef}
                      className="w-full aspect-square max-w-[280px] mx-auto rounded-2xl overflow-hidden bg-black/50 border border-foreground/[0.1]"
                    />
                    {scannerError && (
                      <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-destructive/10">
                        <AlertCircle className="w-4 h-4 text-destructive" />
                        <span className="text-sm font-medium text-destructive">{scannerError}</span>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        stopQRScanner();
                        setCurrentStep("personal-invite-code");
                        setInviteCode(["", "", "", "", "", ""]);
                        const msg: Message = { id: Date.now().toString(), role: "assistant", content: "Enter the code from your manager's invite." };
                        setMessages((prev) => [...prev, msg]);
                        setTimeout(() => inviteCodeRefs.current[0]?.focus(), 100);
                      }}
                      className="flex items-center justify-center gap-2.5 w-full px-4 py-3 rounded-xl border border-foreground/[0.1] bg-foreground/[0.03] hover:bg-foreground/[0.06] transition-all"
                    >
                      <KeyRound className="w-4 h-4 text-foreground/60" />
                      <span className="text-sm font-medium text-foreground/70">Enter code manually</span>
                    </button>
                  </motion.div>
                )}


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

                {/* Personal sign-in: profile card shown when email or password step */}
                {(currentStep === "personal-sign-in-email" || currentStep === "personal-sign-in-password" || currentStep === "personal-sign-in-verifying") && !isLoading && invitedUser && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="pl-7 pt-3 pb-2"
                  >
                    {/* Profile card as AI content */}
                    <div className="flex flex-col items-center gap-3 py-3 rounded-xl border border-foreground/[0.08] bg-foreground/[0.02]">
                      <div className="w-14 h-14 rounded-full bg-foreground/[0.06] border border-foreground/[0.1] flex items-center justify-center">
                        <User className="w-7 h-7 text-foreground/40" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-foreground">{invitedUser.name}</p>
                        <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-[11px] font-medium bg-primary/15 text-primary">
                          {invitedUser.role}
                        </span>
                      </div>
                    </div>

                    {/* 2FA + hint below card */}
                    <div className="flex flex-col items-center gap-1.5 mt-3">
                      <div className="flex items-center gap-1.5 text-foreground/25">
                        <ShieldCheck className="w-3 h-3" />
                        <span className="text-[10px]">2FA required by organization policy</span>
                      </div>
                      <p className="text-[10px] text-foreground/25">
                        Use the same email your administrator invited you with
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Personal sign-in verifying */}
                {currentStep === "personal-sign-in-verifying" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="pl-7 pt-3 pb-2"
                  >
                    <div className="flex items-center gap-2 text-foreground/50">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm font-medium">Verifying credentials...</span>
                    </div>
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

                    <div className="rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] p-4 space-y-1">
                      <p className="text-[11px] text-foreground/40 uppercase tracking-wider font-medium">Invite Issued To</p>
                      <p className="text-sm font-semibold text-foreground">{invitedUser.name}</p>
                      <p className="text-xs text-foreground/50">{invitedUser.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setCurrentStep("personal-sign-in-email");
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

                    <button className="flex items-center justify-center gap-2 w-full text-xs text-primary hover:text-primary/80 transition-colors">
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
                    className="px-0 pt-3 pb-2 space-y-3"
                  >
                    <div className="flex gap-2 justify-center">
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
                          onFocus={() => setShowKeyboard(true)}
                          className="w-12 h-14 rounded-xl border border-foreground/[0.12] bg-foreground/[0.04] text-center text-xl font-semibold text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                        />
                      ))}
                    </div>

                    <div className="flex items-start gap-1.5 text-foreground/40 px-2">
                      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span className="text-xs">One-time code: This code expires in 10 minutes and can only be used once.</span>
                    </div>

                    <button
                      onClick={() => {
                        setActivationCode(["", "", "", "", "", ""]);
                        const reqMsg: Message = { id: Date.now().toString(), role: "assistant", content: "A new activation code has been requested. Please check your admin portal or contact your manager for the new code." };
                        setMessages((prev) => [...prev, reqMsg]);
                      }}
                      className="w-full py-2.5 rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] hover:bg-foreground/[0.06] text-foreground/50 hover:text-foreground/70 text-[13px] font-medium transition-all"
                    >
                      Request a new code
                    </button>

                    <InlineIOSKeyboard
                      mode="phone"
                      fullWidth
                      size="large"
                      onKeyPress={handleActivationKeypadPress}
                      onDelete={handleActivationKeypadDelete}
                    />
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
                    className="px-0 pt-3 pb-2 space-y-4"
                  >
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={signInInput}
                        placeholder="name@company.com"
                        readOnly
                        onFocus={() => setShowKeyboard(true)}
                        className="flex-1 px-4 py-3 rounded-2xl border border-foreground/[0.12] bg-foreground/[0.04] text-base text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
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
                        className="px-5 py-3 rounded-2xl bg-primary text-primary-foreground text-base font-medium hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        Send
                      </button>
                    </div>

                    {showKeyboard && (
                      <InlineIOSKeyboard
                        mode="email"
                        fullWidth
                        size="large"
                        onKeyPress={(key) => setSignInInput((prev) => `${prev}${key}`.slice(0, 80))}
                        onDelete={() => setSignInInput((prev) => prev.slice(0, -1))}
                      />
                    )}
                  </motion.div>
                )}

                {/* Phone input for sign-in-phone step */}
                {currentStep === "sign-in-phone" && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="px-0 pt-3 pb-2 space-y-4"
                  >
                    <div className="flex gap-2">
                      {/* Country code selector */}
                      <div className="relative">
                        <button
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                          className="flex items-center gap-1 px-3 py-3 rounded-2xl border border-foreground/[0.12] bg-foreground/[0.04] text-sm text-foreground hover:bg-foreground/[0.06] transition-all h-full"
                        >
                          <span className="text-base leading-none">{selectedCountry.flag}</span>
                          <span className="text-sm text-foreground/60">{selectedCountry.dial}</span>
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
                        placeholder={selectedCountry.placeholder}
                        readOnly
                        onFocus={() => setShowKeyboard(true)}
                        className="flex-1 px-4 py-3 rounded-2xl border border-foreground/[0.12] bg-foreground/[0.04] text-base text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
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
                        className="px-5 py-3 rounded-2xl bg-primary text-primary-foreground text-base font-medium hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        Send
                      </button>
                    </div>

                    {showKeyboard && (
                      <InlineIOSKeyboard
                        mode="phone"
                        fullWidth
                        size="large"
                        onKeyPress={(key) =>
                          setSignInInput((prev) => `${prev}${key}`.replace(/\D/g, "").slice(0, selectedCountry.phoneLength))
                        }
                        onDelete={() => setSignInInput((prev) => prev.slice(0, -1))}
                      />
                    )}

                    <p className="text-xs text-foreground/35 pl-0.5">{selectedCountry.hint}</p>
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
                    <div className="flex gap-2 justify-center cursor-text" onClick={() => { setShowKeyboard(true); demoOtpRef.current?.focus(); }}>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-11 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-semibold transition-all ${
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

                    {showKeyboard && (
                      <InlineIOSKeyboard
                        mode="phone"
                        fullWidth
                        size="large"
                        onKeyPress={(key) => {
                          if (demoOtp.length >= 6) return;
                          setDemoOtp((prev) => `${prev}${key}`.slice(0, 6));
                          setDemoOtpError("");
                        }}
                        onDelete={() => {
                          setDemoOtp((prev) => prev.slice(0, -1));
                          setDemoOtpError("");
                        }}
                      />
                    )}

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
              </motion.div>
            )}
            </AnimatePresence>
          </div>

          {/* Input - hide when in specific steps */}
          {(currentStep === "demo-email" || currentStep === "personal-sign-in-email" || currentStep === "personal-sign-in-password" || currentStep === "chat" || currentStep === "create-fullname" || currentStep === "create-email" || currentStep === "create-phone" || currentStep === "create-country" || currentStep === "create-business") && (
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
              ) : currentStep === "personal-sign-in-email" ? (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                    <input
                      ref={inputRef}
                      type="email"
                      value={personalEmail}
                      onChange={(e) => setPersonalEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handlePersonalEmailSubmit();
                      }}
                      placeholder="Enter your email address..."
                      className="flex-1 w-full bg-foreground/[0.04] border border-foreground/[0.08] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/30 transition-colors"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handlePersonalEmailSubmit}
                    disabled={!personalEmail.trim() || !personalEmail.includes("@")}
                    className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <Send className="w-4 h-4 text-primary-foreground" />
                  </button>
                </div>
              ) : currentStep === "personal-sign-in-password" ? (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                    <input
                      ref={inputRef}
                      type={showPersonalPassword ? "text" : "password"}
                      value={personalPassword}
                      onChange={(e) => setPersonalPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handlePersonalPasswordSubmit();
                      }}
                      placeholder="Enter your password..."
                      className="flex-1 w-full bg-foreground/[0.04] border border-foreground/[0.08] rounded-xl pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/30 transition-colors"
                      autoFocus
                    />
                    <button
                      onClick={() => setShowPersonalPassword(!showPersonalPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/50 transition-colors"
                    >
                      {showPersonalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={handlePersonalPasswordSubmit}
                    disabled={!personalPassword.trim()}
                    className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <Send className="w-4 h-4 text-primary-foreground" />
                  </button>
                </div>
              ) : currentStep === "create-fullname" ? (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={createFullName}
                      onChange={(e) => setCreateFullName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && createFullName.trim().length >= 2) {
                          const userMsg: Message = { id: Date.now().toString(), role: "user", content: createFullName.trim() };
                          const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: `Nice to meet you, ${createFullName.trim()}! What's your email address?` };
                          setMessages((prev) => [...prev, userMsg, assistantMsg]);
                          setCurrentStep("create-email");
                        }
                      }}
                      placeholder="Enter your full name..."
                      className="flex-1 w-full bg-foreground/[0.04] border border-foreground/[0.08] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/30 transition-colors"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (createFullName.trim().length >= 2) {
                        const userMsg: Message = { id: Date.now().toString(), role: "user", content: createFullName.trim() };
                        const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: `Nice to meet you, ${createFullName.trim()}! What's your email address?` };
                        setMessages((prev) => [...prev, userMsg, assistantMsg]);
                        setCurrentStep("create-email");
                      }
                    }}
                    disabled={createFullName.trim().length < 2}
                    className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <Send className="w-4 h-4 text-primary-foreground" />
                  </button>
                </div>
              ) : currentStep === "create-email" ? (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                    <input
                      ref={inputRef}
                      type="email"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && createEmail.trim() && createEmail.includes("@")) {
                          const userMsg: Message = { id: Date.now().toString(), role: "user", content: createEmail.trim() };
                          const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: `We've sent a verification code to **${createEmail.trim()}**. Please enter the 6-digit code.` };
                          setMessages((prev) => [...prev, userMsg, assistantMsg]);
                          setCurrentStep("create-otp");
                        }
                      }}
                      placeholder="Enter your email address..."
                      className="flex-1 w-full bg-foreground/[0.04] border border-foreground/[0.08] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/30 transition-colors"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (createEmail.trim() && createEmail.includes("@")) {
                        const userMsg: Message = { id: Date.now().toString(), role: "user", content: createEmail.trim() };
                        const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: `We've sent a verification code to **${createEmail.trim()}**. Please enter the 6-digit code.` };
                        setMessages((prev) => [...prev, userMsg, assistantMsg]);
                        setCurrentStep("create-otp");
                      }
                    }}
                    disabled={!createEmail.trim() || !createEmail.includes("@")}
                    className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <Send className="w-4 h-4 text-primary-foreground" />
                  </button>
                </div>
              ) : currentStep === "create-phone" ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative">
                      <button
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className="flex items-center gap-1 px-3 py-2.5 rounded-xl border border-foreground/[0.08] bg-foreground/[0.04] text-sm text-foreground hover:bg-foreground/[0.06] transition-all h-full"
                      >
                        <span className="text-base leading-none">{selectedCountry.flag}</span>
                        <span className="text-sm text-foreground/60">{selectedCountry.dial}</span>
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
                                      setCreatePhone("");
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

                    <input
                      ref={inputRef}
                      type="tel"
                      inputMode="numeric"
                      value={createPhone}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "");
                        if (raw.length <= (selectedCountry.phoneLength || 10)) {
                          setCreatePhone(raw);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && createPhone.length >= 7) {
                          const fullPhone = `${selectedCountry.dial} ${createPhone}`;
                          const userMsg: Message = { id: Date.now().toString(), role: "user", content: fullPhone };
                          const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: `We've sent a verification code to **${createEmail}** and **${fullPhone}**. Please enter the 6-digit code.` };
                          setMessages((prev) => [...prev, userMsg, assistantMsg]);
                          setCurrentStep("create-otp");
                        }
                      }}
                      placeholder={selectedCountry.placeholder || "Enter phone number..."}
                      className="flex-1 bg-foreground/[0.04] border border-foreground/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/30 transition-colors"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        if (createPhone.length >= 7) {
                          const fullPhone = `${selectedCountry.dial} ${createPhone}`;
                          const userMsg: Message = { id: Date.now().toString(), role: "user", content: fullPhone };
                          const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: `We've sent a verification code to **${createEmail}** and **${fullPhone}**. Please enter the 6-digit code.` };
                          setMessages((prev) => [...prev, userMsg, assistantMsg]);
                          setCurrentStep("create-otp");
                        }
                      }}
                      disabled={createPhone.length < 7}
                      className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <Send className="w-4 h-4 text-primary-foreground" />
                    </button>
                  </div>
                </div>
              ) : currentStep === "create-country" ? (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={createCountry}
                      onChange={(e) => setCreateCountry(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && createCountry.trim().length >= 2) {
                          const userMsg: Message = { id: Date.now().toString(), role: "user", content: createCountry.trim() };
                          const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "Almost done! What's your business name?" };
                          setMessages((prev) => [...prev, userMsg, assistantMsg]);
                          setCurrentStep("create-business");
                        }
                      }}
                      placeholder="Enter your country..."
                      className="flex-1 w-full bg-foreground/[0.04] border border-foreground/[0.08] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/30 transition-colors"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (createCountry.trim().length >= 2) {
                        const userMsg: Message = { id: Date.now().toString(), role: "user", content: createCountry.trim() };
                        const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "Almost done! What's your business name?" };
                        setMessages((prev) => [...prev, userMsg, assistantMsg]);
                        setCurrentStep("create-business");
                      }
                    }}
                    disabled={createCountry.trim().length < 2}
                    className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <Send className="w-4 h-4 text-primary-foreground" />
                  </button>
                </div>
              ) : currentStep === "create-business" ? (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={createBusiness}
                      onChange={(e) => setCreateBusiness(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && createBusiness.trim().length >= 2) {
                          const userMsg: Message = { id: Date.now().toString(), role: "user", content: createBusiness.trim() };
                          const creatingMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "🔄 Creating your account..." };
                          setMessages((prev) => [...prev, userMsg, creatingMsg]);
                          setCurrentStep("create-creating");
                          // Simulate account creation
                          setTimeout(() => {
                            const successMsg: Message = { id: (Date.now() + 2).toString(), role: "assistant", content: `🎉 Account created successfully!\n\n**${createFullName}**\n📧 ${createEmail}\n📱 ${createPhone}\n🌍 ${createCountry}\n🏢 ${createBusiness.trim()}\n\nWould you like to request a License Key to activate your device?` };
                            setMessages((prev) => [...prev, successMsg]);
                            setCurrentStep("license-request");
                          }, 2000);
                        }
                      }}
                      placeholder="Enter your business name..."
                      className="flex-1 w-full bg-foreground/[0.04] border border-foreground/[0.08] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/30 transition-colors"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (createBusiness.trim().length >= 2) {
                        const userMsg: Message = { id: Date.now().toString(), role: "user", content: createBusiness.trim() };
                        const creatingMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "🔄 Creating your account..." };
                        setMessages((prev) => [...prev, userMsg, creatingMsg]);
                        setCurrentStep("create-creating");
                        setTimeout(() => {
                          const successMsg: Message = { id: (Date.now() + 2).toString(), role: "assistant", content: `🎉 Account created successfully!\n\n**${createFullName}**\n📧 ${createEmail}\n📱 ${createPhone}\n🌍 ${createCountry}\n🏢 ${createBusiness.trim()}\n\nWould you like to request a License Key to activate your device?` };
                          setMessages((prev) => [...prev, successMsg]);
                          setCurrentStep("license-request");
                        }, 2000);
                      }
                    }}
                    disabled={createBusiness.trim().length < 2}
                    className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <Send className="w-4 h-4 text-primary-foreground" />
                  </button>
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
