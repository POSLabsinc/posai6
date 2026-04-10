import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, QrCode, Globe, Mail, ChevronLeft, ShieldCheck, RefreshCw } from "lucide-react";

type HelpView = "overview" | "qr" | "browser" | "email";

interface Props {
  open: boolean;
  onClose: () => void;
}

const DeviceSetupHelpCard = ({ open, onClose }: Props) => {
  const [view, setView] = useState<HelpView>("overview");

  const handleClose = () => {
    setView("overview");
    onClose();
  };

  const optionCards: { id: HelpView; icon: React.ReactNode; title: string; subtitle: string; badge?: string }[] = [
    {
      id: "qr",
      icon: <QrCode className="w-5 h-5" />,
      title: "Scan QR Code",
      subtitle: "Fastest and easiest method",
      badge: "Recommended",
    },
    {
      id: "browser",
      icon: <Globe className="w-5 h-5" />,
      title: "Use a Browser",
      subtitle: "Activate using another device",
    },
    {
      id: "email",
      icon: <Mail className="w-5 h-5" />,
      title: "Email / Phone Code",
      subtitle: "Get a secure code to verify",
    },
  ];

  const renderStep = (num: number, text: string, highlight?: string) => (
    <div className="flex gap-3 items-start">
      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
        {num}
      </div>
      <p className="text-sm text-foreground/70 leading-relaxed">
        {text}
        {highlight && <span className="text-primary font-medium"> {highlight}</span>}
      </p>
    </div>
  );

  const renderHelperNote = (icon: React.ReactNode, text: string) => (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/10">
      <div className="text-primary shrink-0 mt-0.5">{icon}</div>
      <p className="text-xs text-foreground/50 leading-relaxed">{text}</p>
    </div>
  );

  const renderDetailView = (
    title: string,
    icon: React.ReactNode,
    steps: { text: string; highlight?: string }[],
    helperNote?: { icon: React.ReactNode; text: string },
    ctas?: { primary: string; secondary?: string }
  ) => (
    <motion.div
      key={title}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-5"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>

      <div className="flex flex-col gap-3.5">
        {steps.map((s, i) => renderStep(i + 1, s.text, s.highlight))}
      </div>

      {helperNote && renderHelperNote(helperNote.icon, helperNote.text)}

      {ctas && (
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            {ctas.primary}
          </button>
          {ctas.secondary && (
            <button
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl border border-foreground/10 bg-foreground/[0.03] text-sm font-medium text-foreground/60 hover:bg-foreground/[0.06] transition-colors"
            >
              {ctas.secondary}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative z-10 w-full max-w-lg bg-[#1C1C1E] border border-foreground/[0.08] rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 pb-0">
              <div className="flex items-center gap-2">
                {view !== "overview" && (
                  <button
                    onClick={() => setView("overview")}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground/40 hover:text-foreground/70 hover:bg-foreground/[0.06] transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                <span className="text-xs font-medium text-foreground/30 uppercase tracking-wider">Help Guide</span>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground/40 hover:text-foreground/70 hover:bg-foreground/[0.06] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              <AnimatePresence mode="wait">
                {view === "overview" && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col gap-5"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-foreground mb-1.5">
                        Need help activating your device?
                      </h2>
                      <p className="text-sm text-foreground/50 leading-relaxed">
                        You can activate your device in three simple ways. Choose one to continue:
                      </p>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {optionCards.map((opt, i) => (
                        <button
                          key={opt.id}
                          onClick={() => setView(opt.id)}
                          className="group flex items-center gap-4 p-4 rounded-xl border border-foreground/[0.08] bg-foreground/[0.02] hover:bg-foreground/[0.05] hover:border-foreground/[0.15] transition-all text-left"
                        >
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                            {opt.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-foreground/30">Option {i + 1}</span>
                              {opt.badge && (
                                <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                  {opt.badge}
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-semibold text-foreground mt-0.5">{opt.title}</h4>
                            <p className="text-xs text-foreground/40 mt-0.5">{opt.subtitle}</p>
                          </div>
                          <ChevronLeft className="w-4 h-4 text-foreground/20 rotate-180 group-hover:text-foreground/40 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {view === "qr" &&
                  renderDetailView(
                    "Scan QR Code",
                    <QrCode className="w-5 h-5" />,
                    [
                      { text: "Open the camera on your phone or tablet" },
                      { text: "Point it at the QR code on this screen" },
                      { text: "Tap the link that appears on your phone" },
                      { text: "Follow the instructions on your phone to complete activation" },
                    ],
                    {
                      icon: <ShieldCheck className="w-4 h-4" />,
                      text: "Make sure your camera has permission to scan QR codes. Most modern phones support this natively.",
                    },
                    { primary: "Got it", secondary: "Try Again" }
                  )}

                {view === "browser" &&
                  renderDetailView(
                    "Activate using a browser",
                    <Globe className="w-5 h-5" />,
                    [
                      { text: "Open a browser on your phone or computer" },
                      { text: "Go to:", highlight: "posai.com/pair" },
                      { text: "Enter the code shown on this screen" },
                      { text: "Follow the instructions to complete activation" },
                    ],
                    undefined,
                    { primary: "Got it", secondary: "Continue" }
                  )}

                {view === "email" &&
                  renderDetailView(
                    "Activate using email or phone",
                    <Mail className="w-5 h-5" />,
                    [
                      { text: "Enter your email or mobile number" },
                      { text: 'Tap "Send Code"' },
                      { text: "Check your inbox or messages for the code" },
                      { text: "Enter the 6-digit code on this device" },
                    ],
                    {
                      icon: <RefreshCw className="w-4 h-4" />,
                      text: "If you don't receive the code, you can resend it after a few seconds.",
                    },
                    { primary: "Got it", secondary: "Send Code" }
                  )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeviceSetupHelpCard;
