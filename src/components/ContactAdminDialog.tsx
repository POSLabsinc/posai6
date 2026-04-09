import { useState, useCallback } from "react";
import { Mail, Phone, Send, Loader2, ExternalLink, MessageSquare, Monitor, ScanLine, KeyRound, UserPlus, LogIn, ChevronRight, ArrowLeft, HelpCircle, CheckCircle2, Smartphone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface ContactAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminEmail?: string;
  adminPhone?: string;
  restaurantName?: string;
}

type HelpView = "main" | "activation" | "signin" | "contact";

const ContactAdminDialog = ({
  open,
  onOpenChange,
  adminEmail = "admin@restaurant.com",
  adminPhone = "(555) 123-4567",
  restaurantName = "The Rustic Table",
}: ContactAdminDialogProps) => {
  const { toast } = useToast();
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [view, setView] = useState<HelpView>("main");

  const handleSendAdminRequest = useCallback(() => {
    setIsSendingRequest(true);
    setTimeout(() => {
      setIsSendingRequest(false);
      onOpenChange(false);
      toast({
        title: "Request sent",
        description: "Admin has been notified. They will contact you shortly."
      });
    }, 1500);
  }, [toast, onOpenChange]);

  const handleClose = useCallback((val: boolean) => {
    if (!val) setView("main");
    onOpenChange(val);
  }, [onOpenChange]);

  const activationSteps = [
    {
      icon: <Monitor className="w-4 h-4 text-amber-400" />,
      iconBg: "bg-amber-500/20",
      title: "Select New User",
      description: "On the welcome screen, tap \"New User\" to begin the device activation process.",
    },
    {
      icon: <ScanLine className="w-4 h-4 text-blue-400" />,
      iconBg: "bg-blue-500/20",
      title: "Scan QR Code or Enter Details",
      description: "Scan the QR code with your phone, or tap \"Try another way\" to enter your email or phone number manually.",
    },
    {
      icon: <KeyRound className="w-4 h-4 text-purple-400" />,
      iconBg: "bg-purple-500/20",
      title: "Verify with OTP",
      description: "Enter the 6-digit verification code sent to your email or phone. The device will activate automatically once verified.",
    },
    {
      icon: <Smartphone className="w-4 h-4 text-emerald-400" />,
      iconBg: "bg-emerald-500/20",
      title: "Name Your Device",
      description: "Give your device a name (e.g., \"Front Counter\") to identify it. Tap \"Continue\" to complete activation.",
    },
  ];

  const signinSteps = [
    {
      icon: <LogIn className="w-4 h-4 text-blue-400" />,
      iconBg: "bg-blue-500/20",
      title: "Select Existing User",
      description: "On the welcome screen, tap \"Existing User\" to access the sign-in options.",
    },
    {
      icon: <KeyRound className="w-4 h-4 text-amber-400" />,
      iconBg: "bg-amber-500/20",
      title: "Choose Sign-In Method",
      description: "Pick one: \"Activate with Code\" (enter a device code), \"Sign in with Link\" (email/phone link), or \"Try Demo Mode\" for a quick tour.",
    },
    {
      icon: <ScanLine className="w-4 h-4 text-purple-400" />,
      iconBg: "bg-purple-500/20",
      title: "Complete Verification",
      description: "Enter the required code or scan the QR code. Any 6-digit code is accepted in demo mode for instant access.",
    },
    {
      icon: <UserPlus className="w-4 h-4 text-emerald-400" />,
      iconBg: "bg-emerald-500/20",
      title: "Clock In with PIN",
      description: "After verification, you will be taken to the PIN pad. Enter your employee PIN to clock in and start your shift.",
    },
  ];

  const renderSteps = (steps: typeof activationSteps) => (
    <div className="px-5 pb-5 space-y-3">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className="flex flex-col items-center gap-1 pt-0.5">
            <div className={`w-8 h-8 rounded-full ${step.iconBg} flex items-center justify-center flex-shrink-0`}>
              {step.icon}
            </div>
            {i < steps.length - 1 && (
              <div className="w-[1.5px] h-6 bg-white/10 rounded-full" />
            )}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-white/30 uppercase tracking-wider">Step {i + 1}</span>
            </div>
            <p className="text-[14px] font-semibold text-white mt-0.5">{step.title}</p>
            <p className="text-[12px] text-white/50 leading-[17px] mt-0.5">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[360px] rounded-[20px] p-0 border-0 bg-[#2C2C2E]/95 backdrop-blur-xl shadow-2xl overflow-hidden gap-0">
        {/* Header */}
        <DialogHeader className="pt-5 pb-3 px-5 space-y-2 flex flex-col items-center">
          {view !== "main" && (
            <button
              onClick={() => setView("main")}
              className="absolute left-4 top-4 text-white/50 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <DialogTitle className="text-[17px] font-semibold text-white text-center tracking-[-0.4px]">
            {view === "main" && "Need Help?"}
            {view === "activation" && "How to Activate"}
            {view === "signin" && "How to Sign In"}
            {view === "contact" && "Contact"}
          </DialogTitle>
          <p className="text-[12px] text-[#EBEBF599] text-center leading-[16px] tracking-[-0.08px]">
            {view === "main" && "Choose a topic below to get started."}
            {view === "activation" && "Follow these steps to activate your device."}
            {view === "signin" && "Follow these steps to sign in to your device."}
            {view === "contact" && "Reach out to your administrator for help."}
          </p>
        </DialogHeader>

        {/* Main Menu */}
        {view === "main" && (
          <div className="px-5 pb-5 space-y-2">
            <button
              onClick={() => setView("activation")}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Monitor className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-white">Device Activation</p>
                <p className="text-[11px] text-white/40">Step-by-step guide for new devices</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
            </button>

            <button
              onClick={() => setView("signin")}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <LogIn className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-white">Sign In Guide</p>
                <p className="text-[11px] text-white/40">How to sign in to an existing device</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
            </button>

            <button
              onClick={() => setView("contact")}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-white">Contact Admin</p>
                <p className="text-[11px] text-white/40">Get help from your administrator</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
            </button>
          </div>
        )}

        {/* Activation Steps */}
        {view === "activation" && renderSteps(activationSteps)}

        {/* Sign In Steps */}
        {view === "signin" && renderSteps(signinSteps)}

        {/* Contact Admin */}
        {view === "contact" && (
          <>
            <div className="px-5 pb-4 space-y-2.5">
              <a
                href={`mailto:${adminEmail}?subject=Account%20Setup%20Assistance`}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] transition-colors group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[#EBEBF599] uppercase tracking-wide">Email</p>
                  <p className="text-[14px] text-white truncate">{adminEmail}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-[#EBEBF599] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </a>
              <a
                href={`tel:${adminPhone.replace(/[^0-9+]/g, '')}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] transition-colors group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[#EBEBF599] uppercase tracking-wide">Call</p>
                  <p className="text-[14px] text-white">{adminPhone}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-[#EBEBF599] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </a>
              <a
                href={`sms:${adminPhone.replace(/[^0-9+]/g, '')}?body=Hi,%20I%20need%20assistance%20with%20account%20setup.`}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] transition-colors group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[#EBEBF599] uppercase tracking-wide">Text Message</p>
                  <p className="text-[14px] text-white">{adminPhone}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-[#EBEBF599] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </a>
            </div>
            <div className="border-t border-[#545458]/50 flex flex-col">
              <button
                onClick={handleSendAdminRequest}
                disabled={isSendingRequest}
                className="h-12 flex items-center justify-center gap-2 text-[17px] font-semibold text-[#FF9500] hover:bg-[#545458]/30 transition-colors disabled:opacity-50"
              >
                {isSendingRequest ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Request to Admin
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* Footer for step views */}
        {(view === "activation" || view === "signin") && (
          <div className="border-t border-[#545458]/50 flex flex-col">
            <button
              onClick={() => setView("contact")}
              className="h-11 flex items-center justify-center gap-2 text-[15px] font-medium text-[#FF9500] hover:bg-[#545458]/30 transition-colors"
            >
              Still need help? Contact Admin
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContactAdminDialog;
