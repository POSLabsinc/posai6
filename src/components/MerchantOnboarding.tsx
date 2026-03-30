import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Check, ChevronRight, Store, Clock, Users, Shield, ShoppingBag, UtensilsCrossed } from "lucide-react";
import ReactMarkdown from "react-markdown";

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface OnboardingMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
}

interface Phase {
  key: string;
  label: string;
  icon: React.ReactNode;
}

interface OnboardingQuestion {
  phase: string;
  key: string;
  message: string;
  options?: string[];
  skipIf?: (collected: Record<string, string>) => boolean;
  prefillFrom?: string;
}

interface MerchantOnboardingProps {
  prefillEmail?: string;
  prefillName?: string;
  onComplete?: (data: Record<string, string>) => void;
  onBack?: () => void;
}

// ─── PHASES ──────────────────────────────────────────────────────────────────

const PHASES: Phase[] = [
  { key: "signup", label: "Account Setup", icon: <Store className="w-3.5 h-3.5" /> },
  { key: "timing", label: "Restaurant Hours", icon: <Clock className="w-3.5 h-3.5" /> },
  { key: "departments", label: "Departments", icon: <Users className="w-3.5 h-3.5" /> },
  { key: "roles", label: "Roles & Permissions", icon: <Shield className="w-3.5 h-3.5" /> },
  { key: "ordering", label: "Online Ordering", icon: <ShoppingBag className="w-3.5 h-3.5" /> },
  { key: "menu", label: "Menu Setup", icon: <UtensilsCrossed className="w-3.5 h-3.5" /> },
];

// ─── QUESTIONS ───────────────────────────────────────────────────────────────

const QUESTIONS: OnboardingQuestion[] = [
  // Phase 1: Account Setup
  { phase: "signup", key: "full_name", message: "Let's get your restaurant set up! First, what's your **full name**?", prefillFrom: "name" },
  { phase: "signup", key: "email", message: "What's your **email address**?", prefillFrom: "email" },
  { phase: "signup", key: "mobile", message: "What's your **mobile number**?" },
  { phase: "signup", key: "country", message: "Which **country** is your restaurant in?", options: ["United States", "United Kingdom", "Canada", "Australia", "India", "Other"] },
  { phase: "signup", key: "restaurant_name", message: "What's the **name of your restaurant**?" },
  { phase: "signup", key: "store_type", message: "What **type of restaurant** is it?", options: ["Full Service Restaurant", "QSR - Quick Service", "Bakery / Cafe", "Bar & Lounge"] },
  { phase: "signup", key: "address", message: "What's the **full address** of your restaurant?" },

  // Phase 2: Restaurant Hours
  { phase: "timing", key: "timezone", message: "Now let's set up your operating hours. What **timezone** are you in?", options: ["US/Pacific (PT)", "US/Eastern (ET)", "US/Central (CT)", "US/Mountain (MT)", "Europe/London (GMT)", "Asia/Kolkata (IST)", "Other"] },
  { phase: "timing", key: "open_time", message: "What time does your restaurant **open**? (e.g. 9:00 AM)" },
  { phase: "timing", key: "close_time", message: "What time do you **close**? (e.g. 11:00 PM)" },
  { phase: "timing", key: "week_start", message: "Which day does your **business week start**?", options: ["Monday", "Sunday", "Saturday"] },
  { phase: "timing", key: "close_out_time", message: "What's your **day close-out time** for reporting? (e.g. 11:30 PM)" },

  // Phase 3: Departments
  { phase: "departments", key: "departments", message: "Here are your **default departments**:\n\n• Front of House\n• Back of House\n• Kitchen\n• Management\n• Support\n• Delivery\n\nWould you like to keep these or customize?", options: ["Keep all defaults", "Add a custom department", "Remove one"] },

  // Phase 4: Roles & Permissions
  { phase: "roles", key: "roles", message: "Here are your **default roles**:\n\n• Owner/Admin\n• Floor Manager\n• Server\n• Kitchen Staff\n• Cashier\n\nWould you like to keep these or customize?", options: ["Keep all defaults", "Add a custom role", "Modify permissions"] },

  // Phase 5: Online Ordering
  { phase: "ordering", key: "enable_ordering", message: "Would you like to **enable online ordering** for your restaurant?", options: ["Yes - enable it", "No - skip for now"] },
  { phase: "ordering", key: "order_types", message: "Which **order types** would you like to support?", options: ["Delivery + Pickup", "Delivery only", "Pickup only", "All types"], skipIf: (c) => c.enable_ordering === "No - skip for now" },
  { phase: "ordering", key: "payment_methods", message: "Which **payment methods** should be accepted?", options: ["Card only (Visa + MC)", "Card + Apple/Google Pay", "All including Cash"], skipIf: (c) => c.enable_ordering === "No - skip for now" },
  { phase: "ordering", key: "order_approval", message: "Should orders be **auto-accepted** or manually approved?", options: ["Auto-accept all", "Manually approve each"], skipIf: (c) => c.enable_ordering === "No - skip for now" },

  // Phase 6: Menu
  { phase: "menu", key: "menu_name", message: "Now let's build your **menu**! What would you like to name it? (e.g. Main Menu, Breakfast Menu, Lunch Specials)" },
  { phase: "menu", key: "cuisine", message: "What **cuisine type** best describes your food?", options: ["American", "Italian", "Mexican", "Indian", "Chinese", "Japanese", "Mediterranean", "Cafe / Bakery", "Bar & Grill", "Other"] },
  { phase: "menu", key: "categories", message: "What are your **menu categories**? List them separated by commas. (e.g. Starters, Mains, Desserts, Drinks)" },
  { phase: "menu", key: "tax_type", message: "How should **tax** be applied to your menu?", options: ["Inclusive (tax in price)", "Exclusive (tax at checkout)", "No tax / tax exempt"] },
  { phase: "menu", key: "tax_rate", message: "What is your **tax rate**? (e.g. 8.5%)", skipIf: (c) => c.tax_type === "No tax / tax exempt" },
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function MerchantOnboarding({ prefillEmail, prefillName, onComplete, onBack }: MerchantOnboardingProps) {
  const [messages, setMessages] = useState<OnboardingMessage[]>([]);
  const [collected, setCollected] = useState<Record<string, string>>({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [donePhasesSet, setDonePhasesSet] = useState<Set<string>>(new Set());
  const [inputValue, setInputValue] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        scrollRef.current!.scrollTop = scrollRef.current!.scrollHeight;
      });
    }
  }, []);

  // Get current phase progress
  const getCurrentPhaseIdx = useCallback(() => {
    if (currentQuestionIdx >= QUESTIONS.length) return PHASES.length - 1;
    const currentPhase = QUESTIONS[currentQuestionIdx]?.phase;
    return PHASES.findIndex(p => p.key === currentPhase);
  }, [currentQuestionIdx]);

  const completedCount = donePhasesSet.size;
  const progressPct = Math.round((completedCount / PHASES.length) * 100);

  // Add a message helper
  const addMessage = useCallback((role: "assistant" | "user", content: string) => {
    const msg: OnboardingMessage = { id: Date.now().toString() + Math.random(), role, content };
    setMessages(prev => [...prev, msg]);
    setTimeout(scrollToBottom, 50);
    return msg;
  }, [scrollToBottom]);

  // Find next valid question (skip if needed)
  const findNextQuestion = useCallback((fromIdx: number, currentCollected: Record<string, string>): number => {
    let idx = fromIdx;
    while (idx < QUESTIONS.length) {
      const q = QUESTIONS[idx];
      if (q.skipIf && q.skipIf(currentCollected)) {
        idx++;
        continue;
      }
      return idx;
    }
    return idx; // past end = complete
  }, []);

  // Check if phase just completed
  const checkPhaseCompletion = useCallback((answeredIdx: number, currentCollected: Record<string, string>) => {
    const answeredPhase = QUESTIONS[answeredIdx].phase;
    const nextIdx = findNextQuestion(answeredIdx + 1, currentCollected);
    const nextPhase = nextIdx < QUESTIONS.length ? QUESTIONS[nextIdx].phase : null;

    if (nextPhase !== answeredPhase) {
      // Phase changed or complete
      setDonePhasesSet(prev => {
        const next = new Set(prev);
        next.add(answeredPhase);
        return next;
      });
      return answeredPhase;
    }
    return null;
  }, [findNextQuestion]);

  // Ask a question
  const askQuestion = useCallback((idx: number) => {
    if (idx >= QUESTIONS.length) {
      // All done!
      setIsComplete(true);
      setShowConfetti(true);
      const restaurantName = collected.restaurant_name || "Your restaurant";
      addMessage("assistant", `🎉 **${restaurantName} is all set!**\n\nYour restaurant is fully configured and ready to go. Head to your dashboard to start taking orders!`);
      setTimeout(() => setShowConfetti(false), 5000);
      if (onComplete) onComplete(collected);
      return;
    }

    const q = QUESTIONS[idx];

    // Check for prefill
    if (q.prefillFrom) {
      const prefillValue = q.prefillFrom === "email" ? prefillEmail : q.prefillFrom === "name" ? prefillName : undefined;
      if (prefillValue) {
        addMessage("assistant", q.message);
        setTimeout(() => {
          addMessage("user", prefillValue);
          const newCollected = { ...collected, [q.key]: prefillValue };
          setCollected(newCollected);

          const completedPhase = checkPhaseCompletion(idx, newCollected);
          if (completedPhase) {
            const label = PHASES.find(p => p.key === completedPhase)?.label;
            setTimeout(() => addMessage("assistant", `✅ **${label}** complete!`), 300);
          }

          const nextIdx = findNextQuestion(idx + 1, newCollected);
          setCurrentQuestionIdx(nextIdx);
          setTimeout(() => askQuestion(nextIdx), completedPhase ? 800 : 400);
        }, 300);
        return;
      }
    }

    addMessage("assistant", q.message);
    setCurrentQuestionIdx(idx);
  }, [collected, prefillEmail, prefillName, addMessage, checkPhaseCompletion, findNextQuestion, onComplete]);

  // Handle user answer
  const handleAnswer = useCallback((answer: string) => {
    if (isComplete) return;

    addMessage("user", answer);
    const newCollected = { ...collected, [QUESTIONS[currentQuestionIdx].key]: answer };
    setCollected(newCollected);

    // Brief confirmation
    const confirmations = [
      "Got it!",
      "Perfect!",
      "Great choice!",
      "Noted!",
      "Excellent!",
      "Sounds good!",
    ];
    const confirm = confirmations[Math.floor(Math.random() * confirmations.length)];

    const completedPhase = checkPhaseCompletion(currentQuestionIdx, newCollected);

    setTimeout(() => {
      if (completedPhase) {
        const label = PHASES.find(p => p.key === completedPhase)?.label;
        addMessage("assistant", `${confirm} ✅ **${label}** complete!`);
      }

      const nextIdx = findNextQuestion(currentQuestionIdx + 1, newCollected);
      setCurrentQuestionIdx(nextIdx);
      setTimeout(() => askQuestion(nextIdx), completedPhase ? 600 : 300);
    }, 200);
  }, [isComplete, collected, currentQuestionIdx, addMessage, checkPhaseCompletion, findNextQuestion, askQuestion]);

  // Submit text input
  const handleSubmit = useCallback(() => {
    const val = inputValue.trim();
    if (!val) return;
    setInputValue("");
    handleAnswer(val);
  }, [inputValue, handleAnswer]);

  // Boot - ask first question
  useEffect(() => {
    const timer = setTimeout(() => {
      addMessage("assistant", "Welcome! I'm here to help you set up your restaurant on the platform. Let's get started with a few quick questions.");
      setTimeout(() => {
        const firstIdx = findNextQuestion(0, {});
        askQuestion(firstIdx);
      }, 600);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const currentQuestion = currentQuestionIdx < QUESTIONS.length ? QUESTIONS[currentQuestionIdx] : null;
  const hasOptions = currentQuestion?.options && currentQuestion.options.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Progress Header */}
      <div className="flex-shrink-0 px-4 pt-3 pb-2 border-b border-foreground/[0.06]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {onBack && (
              <button onClick={onBack} className="w-7 h-7 rounded-full bg-foreground/[0.06] flex items-center justify-center hover:bg-foreground/[0.1] transition-colors">
                <ArrowLeft className="w-3.5 h-3.5 text-foreground/50" />
              </button>
            )}
            <span className="text-xs font-semibold text-foreground/60">Restaurant Setup</span>
          </div>
          <span className="text-[10px] font-bold text-primary">{progressPct}%</span>
        </div>

        {/* Progress bar */}
        <div className="h-1 rounded-full bg-foreground/[0.06] overflow-hidden mb-2.5">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Phase pills */}
        <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide">
          {PHASES.map((phase, i) => {
            const isDone = donePhasesSet.has(phase.key);
            const isCurrent = i === getCurrentPhaseIdx() && !isDone;
            return (
              <div
                key={phase.key}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all ${
                  isDone
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : isCurrent
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-foreground/[0.03] text-foreground/30 border border-foreground/[0.06]"
                }`}
              >
                {isDone ? <Check className="w-2.5 h-2.5" /> : phase.icon}
                <span className="hidden sm:inline">{phase.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Store className="w-3 h-3 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[85%] px-3 py-2 text-[13px] leading-relaxed ${
                  msg.role === "assistant"
                    ? "bg-foreground/[0.04] border border-foreground/[0.06] rounded-sm rounded-tr-xl rounded-br-xl rounded-bl-xl"
                    : "bg-primary/10 border border-primary/15 rounded-tl-xl rounded-sm rounded-br-xl rounded-bl-xl ml-auto"
                }`}
              >
                <div className="prose prose-sm prose-invert max-w-none [&_p]:m-0 [&_strong]:text-primary [&_ul]:my-1 [&_li]:my-0">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Option chips for current question */}
        {hasOptions && !isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="pl-8 flex flex-wrap gap-1.5 pt-1"
          >
            {currentQuestion.options!.map((opt) => (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                className="px-3 py-1.5 text-xs font-medium rounded-full border border-foreground/[0.1] bg-foreground/[0.03] text-foreground/60 hover:border-primary/40 hover:text-primary hover:bg-primary/[0.06] transition-all"
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Input area */}
      {!isComplete && !hasOptions && (
        <div className="flex-shrink-0 px-4 pb-3 pt-2 border-t border-foreground/[0.06]">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Type your answer..."
              className="flex-1 bg-foreground/[0.04] border border-foreground/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground/25 outline-none focus:border-primary/30 transition-colors"
              autoFocus
            />
            <button
              onClick={handleSubmit}
              disabled={!inputValue.trim()}
              className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Complete state */}
      {isComplete && (
        <div className="flex-shrink-0 px-4 pb-3 pt-2 border-t border-foreground/[0.06]">
          <button
            onClick={() => {
              // Navigate to dashboard
              if (onComplete) onComplete(collected);
              window.location.href = "/";
            }}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            Go to Dashboard
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: -10,
                width: 5 + Math.random() * 6,
                height: 5 + Math.random() * 6,
                backgroundColor: ["hsl(var(--primary))", "#00D4A0", "#F5A623", "#5C9EFF", "#FF8660"][Math.floor(Math.random() * 5)],
                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              }}
              initial={{ y: -10, opacity: 1, rotate: 0 }}
              animate={{ y: "100vh", opacity: 0, rotate: 720 }}
              transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 0.8, ease: "linear" }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
