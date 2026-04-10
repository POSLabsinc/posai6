import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, QrCode, Globe, Mail, ShieldCheck, RefreshCw } from "lucide-react";

type HelpTab = "qr" | "browser" | "email";

interface Props {
  open: boolean;
  onClose: () => void;
}

const tabs: { id: HelpTab; label: string; icon: React.ReactNode; badge?: string }[] = [
  { id: "qr", label: "Option 1", icon: <QrCode className="w-4 h-4" />, badge: "Recommended" },
  { id: "browser", label: "Option 2", icon: <Globe className="w-4 h-4" /> },
  { id: "email", label: "Option 3", icon: <Mail className="w-4 h-4" /> },
];

const DeviceSetupHelpCard = ({ open, onClose }: Props) => {
  const [activeTab, setActiveTab] = useState<HelpTab>("qr");

  const handleClose = () => {
    setActiveTab("qr");
    onClose();
  };

  const renderStep = (num: number, text: string, highlight?: string) => (
    <div className="flex gap-3.5 items-start" key={num}>
      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
        {num}
      </div>
      <p className="text-sm text-foreground/70 leading-relaxed pt-1.5">
        {text}
        {highlight && <span className="text-primary font-semibold"> {highlight}</span>}
      </p>
    </div>
  );

  const renderHelperNote = (icon: React.ReactNode, text: string) => (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
      <div className="text-primary shrink-0 mt-0.5">{icon}</div>
      <p className="text-sm text-foreground/50 leading-relaxed">{text}</p>
    </div>
  );

  const contentMap: Record<HelpTab, {
    title: string;
    icon: React.ReactNode;
    steps: { text: string; highlight?: string }[];
    helperNote?: { icon: React.ReactNode; text: string };
    ctas: { primary: string; secondary?: string };
  }> = {
    qr: {
      title: "Scan QR Code",
      icon: <QrCode className="w-5 h-5" />,
      steps: [
        { text: "Open the camera on your phone or tablet" },
        { text: "Point it at the QR code on this screen" },
        { text: "Tap the link that appears on your phone" },
        { text: "Follow the instructions on your phone to complete activation" },
      ],
      helperNote: {
        icon: <ShieldCheck className="w-4 h-4" />,
        text: "Make sure your camera has permission to scan QR codes. Most modern phones support this natively.",
      },
      ctas: { primary: "Got it", secondary: "Try Again" },
    },
    browser: {
      title: "Activate using a browser",
      icon: <Globe className="w-5 h-5" />,
      steps: [
        { text: "Open a browser on your phone or computer" },
        { text: "Go to:", highlight: "posai.com/pair" },
        { text: "Enter the code shown on this screen" },
        { text: "Follow the instructions to complete activation" },
      ],
      ctas: { primary: "Got it", secondary: "Continue" },
    },
    email: {
      title: "Activate using email or phone",
      icon: <Mail className="w-5 h-5" />,
      steps: [
        { text: "Enter your email or mobile number" },
        { text: 'Tap "Send Code"' },
        { text: "Check your inbox or messages for the code" },
        { text: "Enter the 6-digit code on this device" },
      ],
      helperNote: {
        icon: <RefreshCw className="w-4 h-4" />,
        text: "If you don't receive the code, you can resend it after a few seconds.",
      },
      ctas: { primary: "Got it", secondary: "Send Code" },
    },
  };

  const current = contentMap[activeTab];

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
            className="relative z-10 w-full max-w-2xl bg-[#1C1C1E] border border-foreground/[0.08] rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-7 pt-6 pb-2">
              <div>
                <span className="text-xs font-medium text-foreground/30 uppercase tracking-wider">Help Guide</span>
                <h2 className="text-xl font-bold text-foreground mt-1">
                  Need help activating your device?
                </h2>
                <p className="text-sm text-foreground/40 mt-1">
                  You can activate your device in three simple ways. Choose one below:
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-foreground/40 hover:text-foreground/70 hover:bg-foreground/[0.06] transition-colors shrink-0 self-start"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-7 pt-4 pb-1 flex gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-primary/15 text-primary border border-primary/20"
                      : "bg-foreground/[0.04] text-foreground/50 border border-foreground/[0.08] hover:bg-foreground/[0.07] hover:text-foreground/70"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.badge && activeTab === tab.id && (
                    <span className="text-[10px] font-semibold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full ml-1">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="px-7 py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col gap-5"
                >
                  {/* Title row */}
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      {current.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{current.title}</h3>
                  </div>

                  {/* Steps */}
                  <div className="flex flex-col gap-4">
                    {current.steps.map((s, i) => renderStep(i + 1, s.text, s.highlight))}
                  </div>

                  {/* Helper note */}
                  {current.helperNote && renderHelperNote(current.helperNote.icon, current.helperNote.text)}

                  {/* CTAs */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleClose}
                      className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                    >
                      {current.ctas.primary}
                    </button>
                    {current.ctas.secondary && (
                      <button
                        onClick={handleClose}
                        className="px-6 py-2.5 rounded-xl border border-foreground/10 bg-foreground/[0.03] text-sm font-medium text-foreground/60 hover:bg-foreground/[0.06] transition-colors"
                      >
                        {current.ctas.secondary}
                      </button>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeviceSetupHelpCard;
