import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Printer, MessageSquare, Mail, ChevronLeft } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { CountryCodeSelector, countryCodes, type CountryCode } from "./CountryCodeSelector";
import { useIsLandscape } from "@/hooks/use-landscape";
import eatosLogo from "@/assets/icons/posai-logo.png";

interface ReceiptOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrint?: () => void;
  onText?: (phoneNumber: string) => void;
  onEmail?: (email: string) => void;
  onNoReceipt?: () => void;
}

type ReceiptView = "main" | "text" | "email";

const ReceiptOptionsDialog = ({
  open,
  onOpenChange,
  onPrint,
  onText,
  onEmail,
  onNoReceipt,
}: ReceiptOptionsDialogProps) => {
  const isLandscape = useIsLandscape();
  const [noMarketing, setNoMarketing] = useState(false);
  const [currentView, setCurrentView] = useState<ReceiptView>("main");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(countryCodes[0]);

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const formatPhoneDisplay = (phone: string) => {
    if (!phone) return "(000) 000- 0000";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length <= 3) return `(${cleaned.padEnd(3, "0")}) 000- 0000`;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3).padEnd(3, "0")}- 0000`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}- ${cleaned.slice(6).padEnd(4, "0")}`;
  };

  const handlePhoneKeypadPress = (key: string) => {
    if (phoneNumber.length >= 10) return;
    setPhoneNumber(phoneNumber + key);
  };

  const handlePhoneDelete = () => {
    setPhoneNumber(phoneNumber.slice(0, -1));
  };

  const handleOptionClick = (callback?: () => void) => {
    callback?.();
    onOpenChange(false);
    resetState();
  };

  const resetState = () => {
    setCurrentView("main");
    setPhoneNumber("");
    setEmail("");
    setNoMarketing(false);
    setSelectedCountry(countryCodes[0]);
  };

  const handleClose = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      resetState();
    }
  };

  const handleTextSubmit = () => {
    if (phoneNumber.length === 10) {
      const formattedPhone = `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
      onText?.(formattedPhone);
      onOpenChange(false);
      resetState();
    }
  };

  const handleEmailSubmit = () => {
    if (email.trim() && validateEmail(email)) {
      onEmail?.(email);
      onOpenChange(false);
      resetState();
    }
  };

  const handleBackFromPhone = () => {
    setCurrentView("main");
    setPhoneNumber("");
  };

  const handleBackFromEmail = () => {
    setCurrentView("main");
    setEmail("");
  };

  const phoneKeypadKeys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["0", "⌫"],
  ];

  const handlePhoneKeypadKeyPress = (key: string) => {
    if (key === "⌫") {
      handlePhoneDelete();
      return;
    }
    handlePhoneKeypadPress(key);
  };

  const isFullScreen = currentView === "text" || currentView === "email";

  const content = (
    <div className={`flex flex-col px-5 pt-4 h-full ${isFullScreen ? 'overflow-hidden pb-4' : 'overflow-y-auto pb-8'}`}>
      {currentView === "main" && (
        /* Main View - Receipt Options */
        <div className="flex flex-col h-full justify-between">
          {/* Header */}
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-white text-3xl font-semibold text-center mb-12 leading-tight">
              How would you like to<br />receive your receipt?
            </h2>

            {/* Receipt Options Grid */}
            <div className="grid grid-cols-3 gap-3 mb-4 px-2">
              {/* Print Option */}
              <button
                onClick={() => handleOptionClick(onPrint)}
                className="aspect-square rounded-2xl bg-neutral-800/60 border border-neutral-700 flex flex-col items-center justify-center gap-3 hover:bg-neutral-700/60 hover:border-neutral-600 transition-all active:scale-95"
              >
                <Printer className="w-10 h-10 text-white" strokeWidth={1.5} />
                <span className="text-white text-lg font-medium">Print</span>
              </button>

              {/* Text Option */}
              <button
                onClick={() => setCurrentView("text")}
                className="aspect-square rounded-2xl bg-neutral-800/60 border border-neutral-700 flex flex-col items-center justify-center gap-3 hover:bg-neutral-700/60 hover:border-neutral-600 transition-all active:scale-95"
              >
                <MessageSquare className="w-10 h-10 text-white" strokeWidth={1.5} />
                <span className="text-white text-lg font-medium">Text</span>
              </button>

              {/* Email Option */}
              <button
                onClick={() => setCurrentView("email")}
                className="aspect-square rounded-2xl bg-neutral-800/60 border border-neutral-700 flex flex-col items-center justify-center gap-3 hover:bg-neutral-700/60 hover:border-neutral-600 transition-all active:scale-95"
              >
                <Mail className="w-10 h-10 text-white" strokeWidth={1.5} />
                <span className="text-white text-lg font-medium">Email</span>
              </button>
            </div>

            {/* No Receipt Button */}
            <button
              onClick={() => handleOptionClick(onNoReceipt)}
              className="w-full py-4 rounded-full bg-neutral-800/80 border border-neutral-700 text-white font-semibold text-lg hover:bg-neutral-700/80 transition-colors mb-6"
            >
              NO RECEIPT
            </button>

            {/* Marketing Opt-out Checkbox */}
            <div className="flex items-center gap-3 px-1">
              <Checkbox
                id="no-marketing"
                checked={noMarketing}
                onCheckedChange={(checked) => setNoMarketing(checked as boolean)}
                className="w-6 h-6 border-2 border-neutral-600 data-[state=checked]:bg-neutral-600 data-[state=checked]:border-neutral-600"
              />
              <label htmlFor="no-marketing" className="text-neutral-400 text-base cursor-pointer">
                Do not use my email or phone number for marketing
              </label>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="shrink-0">
            {/* Divider */}
            <div className="border-t border-neutral-700 mb-4" />

            {/* Privacy Policy */}
            <p className="text-neutral-500 text-center text-sm leading-relaxed">
              Your information will be securely processed under<br />
              eatOS' <span className="text-violet-500">Terms of Service</span> and <span className="text-violet-500">Privacy Policy</span><br />
              to protect your privacy.
            </p>

            {/* Powered by eatOS */}
            <div className="flex items-center justify-center gap-2 mt-6">
              <span className="text-neutral-500 text-sm">Powered by</span>
              <img src={eatosLogo} alt="POS AI" className="h-5" />
            </div>
          </div>
        </div>
      )}

      {currentView === "text" && (
        /* Text View - Phone Input */
        <div className="flex flex-col h-full">
          {/* Back Button */}
          <button 
            onClick={handleBackFromPhone}
            className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center mb-6 shrink-0 hover:bg-neutral-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          {/* Header */}
          <h2 className="text-white text-2xl font-semibold text-center mb-6 leading-tight shrink-0">
            Where should we<br />text your receipt?
          </h2>

          {/* Phone Input Field */}
          <div className="flex items-center bg-neutral-800/60 rounded-full overflow-visible mb-4 shrink-0 relative z-10">
            {/* Country Code Dropdown */}
            <CountryCodeSelector
              selectedCountry={selectedCountry}
              onCountryChange={setSelectedCountry}
            />
            {/* Phone Number Display */}
            <div className="flex-1 px-4 py-3">
              <span className={`text-lg ${phoneNumber ? 'text-white' : 'text-neutral-500'}`}>
                {formatPhoneDisplay(phoneNumber)}
              </span>
            </div>
          </div>

          {/* Marketing Opt-out Checkbox */}
          <div className="flex items-center gap-3 mb-4 shrink-0">
            <Checkbox
              id="phone-marketing-opt-out"
              checked={noMarketing}
              onCheckedChange={(checked) => setNoMarketing(checked === true)}
              className="w-6 h-6 border-2 border-neutral-600 data-[state=checked]:bg-neutral-600 data-[state=checked]:border-neutral-600"
            />
            <label 
              htmlFor="phone-marketing-opt-out" 
              className="text-neutral-400 text-base cursor-pointer"
            >
              Do not use my phone number for marketing
            </label>
          </div>

          {/* Divider */}
          <div className="border-t border-neutral-700 mb-4 shrink-0" />

          {/* Privacy Policy */}
          <p className="text-neutral-400 text-center text-sm leading-relaxed mb-4 px-2 shrink-0">
            Your phone number will be used only to send SMS receipts. Message and data rates may apply. Message frequency may vary. <span className="text-violet-500">Terms of Service</span> and <span className="text-violet-500">Privacy Policy</span> apply.
          </p>

          {/* Powered by eatOS */}
          <div className="flex items-center justify-center gap-2 mb-4 shrink-0">
            <span className="text-neutral-500 text-sm">Powered by</span>
            <img src={eatosLogo} alt="POS AI" className="h-5" />
          </div>

          {/* Send Button */}
          <button
            onClick={handleTextSubmit}
            disabled={phoneNumber.length !== 10}
            className={`w-full py-4 rounded-full font-semibold text-lg mb-4 shrink-0 transition-colors ${
              phoneNumber.length === 10 
                ? 'bg-neutral-600 text-white hover:bg-neutral-500' 
                : 'bg-neutral-700 text-neutral-400'
            }`}
          >
            SEND
          </button>

          {/* Phone Keypad - Same style as TipBottomSheet */}
          <div className="flex-1 min-h-0 bg-neutral-200 rounded-t-2xl p-2 -mx-5 -mb-4 mt-auto">
            <div className="grid grid-cols-3 gap-1 h-full">
              {phoneKeypadKeys.flat().map((key, index) => (
                <button
                  key={key + index}
                  onClick={() => handlePhoneKeypadKeyPress(key)}
                  className={`rounded-lg flex flex-col items-center justify-center bg-white hover:bg-neutral-100 active:bg-neutral-200 transition-colors ${
                    key === "0" ? "col-span-1 col-start-2" : ""
                  } ${key === "⌫" ? "col-span-1" : ""}`}
                >
                  <span className="text-black text-2xl font-medium">{key}</span>
                  {key !== "⌫" && key !== "0" && (
                    <span className="text-neutral-500 text-[10px] tracking-widest">
                      {["", "ABC", "DEF", "GHI", "JKL", "MNO", "PQRS", "TUV", "WXYZ"][parseInt(key) || 0]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {currentView === "email" && (
        /* Email View */
        <div className="flex flex-col h-full">
          {/* Back Button */}
          <button 
            onClick={handleBackFromEmail}
            className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center mb-6 shrink-0 hover:bg-neutral-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          {/* Header */}
          <h2 className="text-white text-2xl font-semibold text-center mb-6 leading-tight shrink-0">
            Where should we<br />email your receipt?
          </h2>

          {/* Email Input Field */}
          <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-4 shrink-0">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@gmail.com"
              className="w-full px-5 py-4 bg-transparent text-white text-lg placeholder:text-neutral-500 outline-none"
              autoFocus
            />
          </div>

          {/* Marketing Opt-out Checkbox */}
          <div className="flex items-center gap-3 mb-4 shrink-0">
            <Checkbox
              id="email-marketing-opt-out"
              checked={noMarketing}
              onCheckedChange={(checked) => setNoMarketing(checked === true)}
              className="w-6 h-6 border-2 border-neutral-600 data-[state=checked]:bg-neutral-600 data-[state=checked]:border-neutral-600"
            />
            <label 
              htmlFor="email-marketing-opt-out" 
              className="text-neutral-400 text-base cursor-pointer"
            >
              Do not use my email for marketing
            </label>
          </div>

          {/* Divider */}
          <div className="border-t border-neutral-700 mb-4 shrink-0" />

          {/* Privacy Policy */}
          <p className="text-neutral-400 text-center text-sm leading-relaxed mb-4 px-2 shrink-0">
            By placing your order, you agree to receive important transactional messages, including order updates and digital receipts, from eatOS and this restaurant. Marketing messages are optional. <span className="text-violet-500">Terms of Service</span> and <span className="text-violet-500">Privacy Policy</span> apply.
          </p>

          {/* Powered by eatOS */}
          <div className="flex items-center justify-center gap-2 mb-6 shrink-0">
            <span className="text-neutral-500 text-sm">Powered by</span>
            <img src={eatosLogo} alt="POS AI" className="h-5" />
          </div>

          {/* Send Button */}
          <button
            onClick={handleEmailSubmit}
            disabled={!validateEmail(email)}
            className={`w-full py-4 rounded-full font-semibold text-lg shrink-0 transition-colors ${
              validateEmail(email)
                ? 'bg-neutral-600 text-white hover:bg-neutral-500' 
                : 'bg-neutral-700 text-neutral-400'
            }`}
          >
            SEND
          </button>
        </div>
      )}
    </div>
  );

  // Use Drawer for portrait/mobile, Dialog for landscape - same as TipBottomSheet
  if (isLandscape) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent 
          hideCloseButton 
          className={`flex flex-col bg-black border border-neutral-800 rounded-2xl p-0 max-w-2xl w-[90vw] gap-0 ${isFullScreen ? 'h-[90vh] max-h-[90vh]' : 'h-[85vh]'}`}
          aria-describedby={undefined}
        >
          <VisuallyHidden>
            <DialogTitle>Receipt Options</DialogTitle>
          </VisuallyHidden>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className={`bg-black border-t border-neutral-800 rounded-t-[20px] ${isFullScreen ? 'h-[100dvh] max-h-[100dvh]' : 'h-[95vh]'}`}>
        {content}
      </DrawerContent>
    </Drawer>
  );
};

export default ReceiptOptionsDialog;