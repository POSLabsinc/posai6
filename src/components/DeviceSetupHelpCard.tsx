import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, QrCode, Globe, Mail, ShieldCheck, RefreshCw } from "lucide-react";

type HelpTab = "qr" | "browser" | "email";

interface Props {
  open: boolean;
  onClose: () => void;
}

const tabs: { id: HelpTab; label: string; shortLabel: string; icon: React.ReactNode; badge?: string }[] = [
  { id: "qr", label: "Option 1", shortLabel: "QR", icon: <QrCode className="w-4 h-4" />, badge: "Recommended" },
  { id: "browser", label: "Option 2", shortLabel: "Browser", icon: <Globe className="w-4 h-4" /> },
  { id: "email", label: "Option 3", shortLabel: "Email", icon: <Mail className="w-4 h-4" /> },
];

const DeviceSetupHelpCard = ({ open, onClose }: Props) => {
  const [activeTab, setActiveTab] = useState<HelpTab>("qr");

  const handleClose = () => {
    setActiveTab("qr");
    onClose();
  };

  const renderStep = (num: number, text: string, highlight?: string) => (
    <div className="flex gap-2.5 sm:gap-3.5 items-start" key={num}>
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs sm:text-sm font-bold shrink-0 mt-0.5">
        {num}
      </div>
      <p className="text-xs sm:text-sm text-foreground/70 leading-relaxed pt-1 sm:pt-1.5">
        {text}
        {highlight && <span className="text-primary font-semibold"> {highlight}</span>}
      </p>
    </div>
  );

  const renderHelperNote = (icon: React.ReactNode, text: string) => (
    <div className="flex items-start gap-2.5 p-3 sm:p-4 rounded-xl bg-primary/5 border border-primary/10">
      <div className="text-primary shrink-0 mt-0.5">{icon}</div>
      <p className="text-xs sm:text-sm text-foreground/50 leading-relaxed">{text}</p>
    </div>
  );

  const contentMap: Record<HelpTab, {
    title: string;
    icon: React.ReactNode;
    steps: { text: string; highlight?: string }[];
    helperNote?: { icon: React.ReactNode; text: string };
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
          className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative z-10 w-full sm:max-w-2xl bg-[#1C1C1E] border border-foreground/[0.08] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] sm:max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-start justify-between px-4 sm:px-7 pt-4 sm:pt-6 pb-1 sm:pb-2 shrink-0">
              <div className="flex-1 min-w-0">
                <span className="text-[10px] sm:text-xs font-medium text-foreground/30 uppercase tracking-wider">Help Guide</span>
                <h2 className="text-base sm:text-xl font-bold text-foreground mt-0.5 sm:mt-1">
                  Need help activating your device?
                </h2>
                <p className="text-xs sm:text-sm text-foreground/40 mt-0.5 sm:mt-1 leading-relaxed">
                  You can activate your device in three simple ways. Choose one below:
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-foreground/40 hover:text-foreground/70 hover:bg-foreground/[0.06] transition-colors shrink-0 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-4 sm:px-7 pt-3 sm:pt-4 pb-1 flex gap-1.5 sm:gap-2 shrink-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-primary/15 text-primary border border-primary/20"
                      : "bg-foreground/[0.04] text-foreground/50 border border-foreground/[0.08] hover:bg-foreground/[0.07] hover:text-foreground/70"
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                  {tab.badge && activeTab === tab.id && (
                    <span className="text-[9px] sm:text-[10px] font-semibold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full hidden sm:inline-block">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="px-4 sm:px-7 py-4 sm:py-6 overflow-y-auto flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col gap-4 sm:gap-5"
                >
                  {/* Title row */}
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      {current.icon}
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-foreground">{current.title}</h3>
                  </div>

                  {/* Steps */}
                  <div className="flex flex-col gap-3 sm:gap-4">
                    {current.steps.map((s, i) => renderStep(i + 1, s.text, s.highlight))}
                  </div>

                  {/* Helper note */}
                  {current.helperNote && renderHelperNote(current.helperNote.icon, current.helperNote.text)}

                  {/* CTA */}
                  <div className="pt-1 sm:pt-2">
                    <button
                      onClick={handleClose}
                      className="w-full py-3 sm:py-3.5 rounded-xl bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors"
                    >
                      Got it
                    </button>
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
