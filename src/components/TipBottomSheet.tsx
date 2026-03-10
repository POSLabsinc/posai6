import { useState, useRef, useEffect } from "react";
import { SettingsManager } from "@/lib/settingsManager";
import { useNavigate } from "react-router-dom";
import { getActiveTaxRate } from "@/lib/orderUtils";
import { ChevronLeft, Printer, MessageSquare, Mail, Star, DollarSign } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useIsLandscape } from "@/hooks/use-landscape";
import { CountryCodeSelector, countryCodes, type CountryCode } from "./CountryCodeSelector";
import eatosLogo from "@/assets/icons/eatos-logo.svg";
import successTick from "@/assets/icons/success-tick.svg";
export interface OrderItemForDisplay {
  name: string;
  price: number;
  qty: number;
}

interface TipBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onSelectTip: (tipAmount: number) => void;
  existingTip?: number;
  skipReceiptMode?: boolean;
  orderItems?: OrderItemForDisplay[];
}

const TipBottomSheet = ({ isOpen, onClose, totalAmount, onSelectTip, existingTip = 0, skipReceiptMode = false, orderItems = [] }: TipBottomSheetProps) => {
  const isLandscape = useIsLandscape();
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [customTipMode, setCustomTipMode] = useState(false);
  const [signatureMode, setSignatureMode] = useState(false);
  const [receiptMode, setReceiptMode] = useState(false);
  const [phoneInputMode, setPhoneInputMode] = useState(false);
  const [emailInputMode, setEmailInputMode] = useState(false);
  const [loyaltyMode, setLoyaltyMode] = useState(false);
  const [successMode, setSuccessMode] = useState(false);
  const [ratingMode, setRatingMode] = useState(false);
  const [subRatingMode, setSubRatingMode] = useState(false);
  const [thankYouMode, setThankYouMode] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [subRatings, setSubRatings] = useState<{
    foodAndDrinks: number | null;
    service: number | null;
    ambience: number | null;
    valueForMoney: number | null;
  }>({
    foodAndDrinks: null,
    service: null,
    ambience: null,
    valueForMoney: null,
  });
  const [loyaltyMethod, setLoyaltyMethod] = useState<"text" | "email">("text");
  const [customTipValue, setCustomTipValue] = useState("0.00");
  const [isPercentMode, setIsPercentMode] = useState(false);
  const [finalTipAmount, setFinalTipAmount] = useState(0);
  const [finalTipPercent, setFinalTipPercent] = useState<number | null>(null);
  const [noMarketingOptOut, setNoMarketingOptOut] = useState(false);
  const [noMarketingLoyalty, setNoMarketingLoyalty] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [isCFDMode, setIsCFDMode] = useState(false); // CFD mode toggle for landscape (off by default)
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(countryCodes[0]);

  // Signature pad refs and state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const tipOptions = [
    { percent: 25, amount: totalAmount * 0.25 },
    { percent: 20, amount: totalAmount * 0.20 },
    { percent: 15, amount: totalAmount * 0.15 },
    { percent: 10, amount: totalAmount * 0.10 },
  ];

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  // Initialize canvas when signature mode is active
  useEffect(() => {
    if (signatureMode && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Set canvas size to match display size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        // Set drawing style
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, [signatureMode]);

  const getCoordinates = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleTipSelect = (percent: number, amount: number) => {
    setSelectedTip(percent);
    // The amount is the ADDITIONAL tip to add to existing tip
    const newTotalTip = existingTip + amount;
    setFinalTipAmount(newTotalTip);
    setFinalTipPercent(percent);
    setCustomTipMode(false);
    // When CFD mode is off (employee mode), skip signature and go directly to receipt
    if (!isCFDMode) {
      onSelectTip(amount); // Pass the additional tip amount
      // For additive tip mode (closed tickets), close directly without receipt screen
      if (skipReceiptMode) {
        onClose();
      } else {
        setReceiptMode(true);
      }
    } else {
      if (SettingsManager.getCheckoutOptionsSettings().skipSignature) {
        onSelectTip(amount);
        setReceiptMode(true);
      } else {
        setSignatureMode(true);
      }
    }
  };

  const handleNoTip = () => {
    setSelectedTip(null);
    // No additional tip - keep existing tip unchanged
    setFinalTipAmount(existingTip);
    setFinalTipPercent(null);
    // When CFD mode is off (employee mode), skip signature and go directly
    if (!isCFDMode) {
      onSelectTip(0); // No additional tip
      // For additive tip mode (closed tickets), close directly without receipt screen
      if (skipReceiptMode) {
        onClose();
      } else {
        setReceiptMode(true);
      }
    } else {
      if (SettingsManager.getCheckoutOptionsSettings().skipSignature) {
        onSelectTip(0);
        setReceiptMode(true);
      } else {
        setSignatureMode(true);
      }
    }
  };

  const handleCustomTip = () => {
    setCustomTipMode(true);
    setSelectedTip(null);
    setCustomTipValue("0.00");
    setIsPercentMode(false);
  };

  const handleCustomTipSubmit = () => {
    let additionalTip: number;
    const numericValue = parseFloat(customTipValue) || 0;
    
    if (isPercentMode) {
      additionalTip = totalAmount * (numericValue / 100);
      setFinalTipPercent(numericValue);
    } else {
      additionalTip = numericValue;
      // Calculate percentage for display
      const calculatedPercent = totalAmount > 0 ? Math.round((numericValue / totalAmount) * 100) : 0;
      setFinalTipPercent(calculatedPercent);
    }
    
    // The tip amount is ADDED to existing tip
    const newTotalTip = existingTip + additionalTip;
    setFinalTipAmount(newTotalTip);
    setCustomTipMode(false);
    // When CFD mode is off (employee mode), skip signature and go directly to receipt
    if (!isCFDMode) {
      onSelectTip(additionalTip); // Pass the additional tip amount
      // For additive tip mode (closed tickets), close directly without receipt screen
      if (skipReceiptMode) {
        onClose();
      } else {
        setReceiptMode(true);
      }
    } else {
      if (SettingsManager.getCheckoutOptionsSettings().skipSignature) {
        onSelectTip(additionalTip);
        setReceiptMode(true);
      } else {
        setSignatureMode(true);
      }
    }
  };

  const handleSignatureConfirm = () => {
    // In CFD mode, pass the additional tip (finalTipAmount - existingTip)
    const additionalTip = finalTipAmount - existingTip;
    onSelectTip(additionalTip);
    setSignatureMode(false);
    setReceiptMode(true);
  };

  const handleBackFromSignature = () => {
    setSignatureMode(false);
    setHasSignature(false);
    // Go back to appropriate screen
    if (customTipMode) {
      // If came from custom tip, go back to main screen
      setCustomTipMode(false);
    }
  };

  const handleReceiptOption = (option: "print" | "text" | "email" | "none") => {
    if (option === "text") {
      setPhoneInputMode(true);
      setReceiptMode(false);
      return;
    }
    if (option === "email") {
      setEmailInputMode(true);
      setReceiptMode(false);
      return;
    }
    console.log("Receipt option selected:", option);
    handleFinalClose();
  };

  const handleBackFromEmail = () => {
    setEmailInputMode(false);
    setReceiptMode(true);
    setEmail("");
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSendEmailReceipt = () => {
    if (isValidEmail(email)) {
      console.log("Sending receipt to:", email);
      setEmailInputMode(false);
      setLoyaltyMethod("email");
      setLoyaltyMode(true);
    }
  };

  const handleBackFromPhone = () => {
    setPhoneInputMode(false);
    setReceiptMode(true);
    setPhoneNumber("");
  };

  const handlePhoneKeypadPress = (key: string) => {
    if (key === "⌫") {
      setPhoneNumber(phoneNumber.slice(0, -1));
      return;
    }
    if (phoneNumber.length >= 10) return;
    setPhoneNumber(phoneNumber + key);
  };

  const formatPhoneDisplay = (phone: string) => {
    if (!phone) return "(000) 000- 0000";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length <= 3) return `(${cleaned.padEnd(3, "0")}) 000- 0000`;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3).padEnd(3, "0")}- 0000`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}- ${cleaned.slice(6).padEnd(4, "0")}`;
  };

  const handleSendReceipt = () => {
    if (phoneNumber.length === 10) {
      console.log("Sending receipt to:", phoneNumber);
      setPhoneInputMode(false);
      setLoyaltyMethod("text");
      setLoyaltyMode(true);
    }
  };

  const handleLoyaltyClaim = () => {
    console.log("Loyalty claimed via:", loyaltyMethod);
    setLoyaltyMode(false);
    setSuccessMode(true);
  };

  // Auto-transition from success to rating after 3 seconds (only in CFD mode)
  useEffect(() => {
    if (successMode) {
      // When CFD mode is off (employee mode), skip rating screen entirely
      if (!isCFDMode) {
        const timer = setTimeout(() => {
          handleFinalClose();
        }, 3000);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => {
          setSuccessMode(false);
          setRatingMode(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [successMode, isCFDMode]);

  const handleSuccessClose = () => {
    handleFinalClose();
  };

  const handleLoyaltyNoThanks = () => {
    handleFinalClose();
  };

  const handleBackFromRating = () => {
    setRatingMode(false);
    setSuccessMode(true);
  };

  const handleSkipRating = () => {
    handleFinalClose();
  };

  const handleRatingSelect = (rating: number) => {
    setSelectedRating(rating);
    console.log("Rating selected:", rating);
    // After selecting rating, go to sub-rating screen
    setRatingMode(false);
    setSubRatingMode(true);
  };

  const handleBackFromSubRating = () => {
    setSubRatingMode(false);
    setRatingMode(true);
  };

  const handleSubRatingSelect = (category: keyof typeof subRatings, value: number) => {
    setSubRatings(prev => ({ ...prev, [category]: value }));
  };

  const handleSubRatingContinue = () => {
    console.log("Sub ratings:", subRatings);
    setSubRatingMode(false);
    setThankYouMode(true);
  };

  const navigate = useNavigate();

  const handleDownloadReceipt = () => {
    console.log("Downloading receipt...");
    handleFinalClose();
    navigate("/tickets");
  };

  const handleFinalClose = () => {
    // Reset all states
    setSignatureMode(false);
    setCustomTipMode(false);
    setReceiptMode(false);
    setPhoneInputMode(false);
    setEmailInputMode(false);
    setLoyaltyMode(false);
    setSuccessMode(false);
    setRatingMode(false);
    setSubRatingMode(false);
    setThankYouMode(false);
    setSelectedRating(null);
    setSubRatings({
      foodAndDrinks: null,
      service: null,
      ambience: null,
      valueForMoney: null,
    });
    setSelectedTip(null);
    setFinalTipAmount(0);
    setFinalTipPercent(null);
    setHasSignature(false);
    setNoMarketingOptOut(false);
    setNoMarketingLoyalty(false);
    setPhoneNumber("");
    setEmail("");
    onClose();
  };

  const finalTotal = totalAmount + finalTipAmount;
  const earnedPoints = Math.floor(finalTotal);
  const totalLoyaltyPoints = 102 + earnedPoints; // Simulated existing points + new points

  const handleKeypadPress = (key: string) => {
    if (key === "C") {
      setCustomTipValue("0.00");
      return;
    }

    if (key === ".") {
      if (customTipValue.includes(".")) return;
      setCustomTipValue(customTipValue + ".");
      return;
    }

    // Remove formatting for calculation
    let currentValue = customTipValue.replace(".", "");
    
    // Remove leading zeros
    if (currentValue === "000") {
      currentValue = "00";
    }
    
    // Add new digit
    currentValue = currentValue + key;
    
    // Convert to decimal format (last 2 digits are cents)
    const numericValue = parseInt(currentValue, 10);
    const formatted = (numericValue / 100).toFixed(2);
    
    setCustomTipValue(formatted);
  };

  const handleBackFromCustom = () => {
    setCustomTipMode(false);
    setCustomTipValue("0.00");
  };

  const keypadKeys = [
    ["7", "8", "9"],
    ["4", "5", "6"],
    ["1", "2", "3"],
    [".", "0", "C"],
  ];

  const phoneKeypadKeys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["0", "⌫"],
  ];

  const receiptOptions = [
    { id: "print" as const, icon: Printer, label: "Print" },
    { id: "text" as const, icon: MessageSquare, label: "Text" },
    { id: "email" as const, icon: Mail, label: "Email" },
  ];

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  const formattedTime = currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const subRatingCategories = [
    { key: 'foodAndDrinks' as const, label: 'Food and Drinks' },
    { key: 'service' as const, label: 'Service' },
    { key: 'ambience' as const, label: 'Ambience' },
    { key: 'valueForMoney' as const, label: 'Value for money' },
  ];

  // Emoji faces for ratings (1-5: very sad to very happy)
  const emojiOptions = ['😖', '🙁', '😐', '🙂', '😄'];

  // Get the contact info to display in thank you screen
  const getReceiptContact = () => {
    if (loyaltyMethod === "email" && email) {
      return email;
    } else if (phoneNumber) {
      return formatPhoneDisplay(phoneNumber).replace(/[^\d\s()-]/g, '');
    }
    return "your email";
  };

  const isFullScreen = customTipMode || signatureMode || receiptMode || phoneInputMode || emailInputMode || loyaltyMode || successMode || ratingMode || subRatingMode || thankYouMode;

  const content = (
    <div className={`flex flex-col px-5 pt-4 h-full ${isFullScreen ? 'overflow-hidden pb-4' : 'overflow-y-auto pb-8'}`}>
          {thankYouMode ? (
            /* Thank You Mode */
            <div className="flex flex-col h-full items-center justify-center" onClick={handleFinalClose}>
              {/* Title */}
              <h2 className="text-white text-3xl font-semibold text-center mb-6 leading-tight">
                Thank you for your feedback!
              </h2>

              {/* Star Rating Display */}
              <div className="flex items-center justify-center gap-3 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-14 h-14 ${
                      selectedRating && star <= selectedRating
                        ? "text-white fill-white"
                        : "text-neutral-700"
                    }`}
                    strokeWidth={1}
                  />
                ))}
              </div>

              {/* Please come again */}
              <p className="text-white text-xl mb-4">
                Please come again!
              </p>

              {/* Receipt sent info */}
              <p className="text-neutral-400 text-center text-lg mb-8">
                Your receipt has been sent to<br />
                {getReceiptContact()}
              </p>

              {/* Download Receipt Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadReceipt();
                }}
                className="w-full py-4 rounded-full bg-neutral-700 text-white text-lg font-medium tracking-wide"
              >
                DOWNLOAD RECEIPT
              </button>
            </div>
          ) : subRatingMode ? (
            /* Sub Rating Mode */
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={handleBackFromSubRating}
                  className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={handleSkipRating}
                  className="text-white text-lg font-medium tracking-wide"
                >
                  SKIP
                </button>
              </div>

              {/* Title */}
              <h2 className="text-white text-3xl font-semibold text-center mb-2 leading-tight">
                Can you tell us more?
              </h2>
              <p className="text-neutral-400 text-center text-lg mb-6">
                You've been served by John
              </p>

              {/* Star Rating Display */}
              <div className="flex items-center justify-center gap-3 mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-14 h-14 ${
                      selectedRating && star <= selectedRating
                        ? "text-white fill-white"
                        : "text-neutral-700"
                    }`}
                    strokeWidth={1}
                  />
                ))}
              </div>

              {/* Sub Rating Categories */}
              <div className="flex-1 overflow-y-auto space-y-6">
                {subRatingCategories.map((category) => (
                  <div key={category.key} className="flex items-center justify-between">
                    <span className="text-white text-lg">{category.label}</span>
                    <div className="flex gap-2">
                      {emojiOptions.map((emoji, index) => (
                        <button
                          key={index}
                          onClick={() => handleSubRatingSelect(category.key, index + 1)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-2xl transition-all ${
                            subRatings[category.key] === index + 1
                              ? 'bg-neutral-600 scale-110'
                              : 'opacity-60 grayscale'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Continue Button */}
              <button
                onClick={handleSubRatingContinue}
                className="w-full py-4 rounded-full bg-neutral-700 text-white text-lg font-medium tracking-wide mt-6"
              >
                CONTINUE
              </button>
            </div>
          ) : ratingMode ? (
            /* Rating Mode */
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={handleBackFromRating}
                  className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={handleSkipRating}
                  className="text-white text-lg font-medium tracking-wide"
                >
                  SKIP
                </button>
              </div>

              {/* Title */}
              <h2 className="text-white text-3xl font-semibold text-center mb-4 leading-tight">
                How would you rate your<br />experience today?
              </h2>
              <p className="text-neutral-400 text-center text-lg mb-auto">
                Click on stars to rate from 1 to 5
              </p>

              {/* Star Rating */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="flex items-center gap-4 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRatingSelect(star)}
                      className="p-1 transition-transform active:scale-110"
                    >
                      <Star
                        className={`w-14 h-14 ${
                          selectedRating && star <= selectedRating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-neutral-600"
                        }`}
                        strokeWidth={1}
                      />
                    </button>
                  ))}
                </div>
                <div className="flex justify-between w-full px-4 max-w-sm">
                  <span className="text-neutral-400 text-lg">Bad</span>
                  <span className="text-neutral-400 text-lg">Good</span>
                </div>
              </div>

              {/* Spacer */}
              <div className="h-24" />
            </div>
          ) : successMode ? (
            /* Success Mode */
            <div className="flex flex-col h-full items-center justify-center" onClick={handleSuccessClose}>
              {/* Total Amount */}
              <p className="text-neutral-400 text-lg mb-1">Total Amount</p>
              <h2 className="text-white text-5xl font-bold mb-8">
                <span className="text-2xl align-top">$</span>
                {finalTotal.toFixed(2)}
              </h2>

              {/* Success Tick Icon */}
              <img src={successTick} alt="Success" className="w-32 h-32 mb-8" />

              {/* Payment Complete Text */}
              <h3 className="text-white text-2xl font-semibold mb-3">Payment Complete</h3>
              <p className="text-neutral-400 text-center text-lg mb-8 px-4">
                You've earned {earnedPoints} loyalty points. Your loyalty points is now {totalLoyaltyPoints}
              </p>

              {/* Info Card */}
              <div className="w-full bg-neutral-800/60 rounded-2xl border border-neutral-700 p-4">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="border-r border-neutral-600">
                    <p className="text-neutral-400 text-sm">Tip</p>
                    <p className="text-neutral-400 text-sm">({finalTipPercent || 0}%)</p>
                    <p className="text-white text-lg font-semibold mt-1">${finalTipAmount.toFixed(2)}</p>
                  </div>
                  <div className="border-r border-neutral-600">
                    <p className="text-neutral-400 text-sm">Total</p>
                    <p className="text-neutral-400 text-sm">Loyalty Points</p>
                    <p className="text-white text-lg font-semibold mt-1">{totalLoyaltyPoints}</p>
                  </div>
                  <div className="border-r border-neutral-600">
                    <p className="text-neutral-400 text-sm">Payment</p>
                    <p className="text-neutral-400 text-sm">Method</p>
                    <p className="text-white text-lg font-semibold mt-1">Card</p>
                  </div>
                  <div>
                    <p className="text-neutral-400 text-sm">Date & Time</p>
                    <p className="text-white text-base font-semibold mt-1">{formattedDate}</p>
                    <p className="text-white text-sm">{formattedTime}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : loyaltyMode ? (
            /* Loyalty Signup Mode */
            <div className="flex flex-col h-full">
              {/* Header */}
              <h2 className="text-white text-2xl font-semibold text-center mb-2 mt-2 leading-tight">
                Would you like to join our<br />loyalty program today?
              </h2>
              <p className="text-neutral-400 text-center text-base mb-6">
                Earn 1 point per dollar. Get $5 off at 50 points.
              </p>

              {/* Text / Email Toggle - Smaller buttons */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => setLoyaltyMethod("text")}
                  className={`aspect-[1.6] rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${
                    loyaltyMethod === "text"
                      ? "bg-white"
                      : "bg-neutral-800/60 border border-neutral-700"
                  }`}
                >
                  <MessageSquare 
                    className={`w-7 h-7 ${loyaltyMethod === "text" ? "text-black" : "text-white"}`} 
                    strokeWidth={1.5} 
                  />
                  <span className={`text-base font-medium ${loyaltyMethod === "text" ? "text-black" : "text-white"}`}>
                    Text
                  </span>
                </button>
                <button
                  onClick={() => setLoyaltyMethod("email")}
                  className={`aspect-[1.6] rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${
                    loyaltyMethod === "email"
                      ? "bg-white"
                      : "bg-neutral-800/60 border border-neutral-700"
                  }`}
                >
                  <Mail 
                    className={`w-7 h-7 ${loyaltyMethod === "email" ? "text-black" : "text-white"}`} 
                    strokeWidth={1.5} 
                  />
                  <span className={`text-base font-medium ${loyaltyMethod === "email" ? "text-black" : "text-white"}`}>
                    Email
                  </span>
                </button>
              </div>

              {/* Dynamic Input Field based on selection */}
              <div className="transition-all duration-200 ease-in-out">
                {loyaltyMethod === "text" ? (
                  <div className="flex items-center bg-neutral-800/60 rounded-full overflow-visible mb-4 relative z-10">
                    <CountryCodeSelector
                      selectedCountry={selectedCountry}
                      onCountryChange={setSelectedCountry}
                    />
                    <input
                      type="tel"
                      value={formatPhoneDisplay(phoneNumber).replace(/[^\d\s()-]/g, '')}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhoneNumber(digits);
                      }}
                      placeholder="(000) 000-0000"
                      className="flex-1 px-4 py-3 bg-transparent text-white text-base outline-none placeholder:text-neutral-500"
                    />
                  </div>
                ) : (
                  <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-4">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@gmail.com"
                      className="w-full px-5 py-3 bg-transparent text-white text-base outline-none placeholder:text-neutral-500"
                    />
                  </div>
                )}
              </div>

              {/* Claim Button */}
              <button
                onClick={handleLoyaltyClaim}
                className="w-full py-4 rounded-full bg-neutral-600 text-white font-semibold text-lg hover:bg-neutral-500 transition-colors mb-3"
              >
                CLAIM
              </button>

              {/* No Thanks */}
              <button
                onClick={handleLoyaltyNoThanks}
                className="w-full py-3 text-white font-semibold text-lg mb-4"
              >
                No Thanks
              </button>

              {/* Marketing Opt-out */}
              <div className="flex items-center gap-3 mb-4">
                <Checkbox
                  id="loyalty-marketing-opt-out"
                  checked={noMarketingLoyalty}
                  onCheckedChange={(checked) => setNoMarketingLoyalty(checked === true)}
                  className="w-6 h-6 border-2 border-neutral-600 data-[state=checked]:bg-neutral-600 data-[state=checked]:border-neutral-600"
                />
                <label 
                  htmlFor="loyalty-marketing-opt-out" 
                  className="text-neutral-400 text-base cursor-pointer"
                >
                  Do not use my {loyaltyMethod === "text" ? "phone number" : "email"} for marketing
                </label>
              </div>

              {/* Divider */}
              <div className="border-t border-neutral-700 mb-4" />

              {/* Privacy Policy */}
              <p className="text-neutral-400 text-center text-sm leading-relaxed px-2">
                By joining the loyalty program, you agree to receive loyalty-related messages and updates from eatOS and this restaurant via text or email. Message and data rates may apply. Message frequency may vary. Participation is optional. <span className="text-violet-500">Terms of Service</span> and <span className="text-violet-500">Privacy Policy</span> apply.
              </p>
            </div>
          ) : emailInputMode ? (
            /* Email Input Mode */
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
                  checked={noMarketingOptOut}
                  onCheckedChange={(checked) => setNoMarketingOptOut(checked === true)}
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
              <p className="text-neutral-400 text-center text-sm leading-relaxed mb-6 px-2 shrink-0">
                By placing your order, you agree to receive important transactional messages, including order updates and digital receipts, from eatOS and this restaurant. Marketing messages are optional. <span className="text-violet-500">Terms of Service</span> and <span className="text-violet-500">Privacy Policy</span> apply.
              </p>

              {/* Send Button */}
              <button
                onClick={handleSendEmailReceipt}
                disabled={!isValidEmail(email)}
                className={`w-full py-4 rounded-full font-semibold text-lg shrink-0 transition-colors ${
                  isValidEmail(email)
                    ? 'bg-neutral-600 text-white hover:bg-neutral-500' 
                    : 'bg-neutral-700 text-neutral-400'
                }`}
              >
                SEND
              </button>
            </div>
          ) : phoneInputMode ? (
            /* Phone Input Mode */
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
                {/* Country Code */}
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
                  checked={noMarketingOptOut}
                  onCheckedChange={(checked) => setNoMarketingOptOut(checked === true)}
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

              {/* Send Button */}
              <button
                onClick={handleSendReceipt}
                disabled={phoneNumber.length !== 10}
                className={`w-full py-4 rounded-full font-semibold text-lg mb-4 shrink-0 transition-colors ${
                  phoneNumber.length === 10 
                    ? 'bg-neutral-600 text-white hover:bg-neutral-500' 
                    : 'bg-neutral-700 text-neutral-400'
                }`}
              >
                SEND
              </button>

              {/* Phone Keypad */}
              <div className="flex-1 min-h-0 bg-neutral-200 rounded-t-2xl p-2 -mx-5 -mb-4 mt-auto">
                <div className="grid grid-cols-3 gap-1 h-full">
                  {phoneKeypadKeys.flat().map((key, index) => (
                    <button
                      key={key + index}
                      onClick={() => handlePhoneKeypadPress(key)}
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
          ) : receiptMode ? (
            /* Receipt Mode */
            <div className="flex flex-col h-full justify-between">
              {/* Header */}
              <div className="flex-1 flex flex-col justify-center">
                <h2 className="text-white text-3xl font-semibold text-center mb-12 leading-tight">
                  How would you like to<br />receive your receipt?
                </h2>

                {/* Receipt Options Grid */}
                <div className="grid grid-cols-3 gap-3 mb-4 px-2">
                  {receiptOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleReceiptOption(option.id)}
                      className="aspect-square rounded-2xl bg-neutral-800/60 border border-neutral-700 flex flex-col items-center justify-center gap-3 hover:bg-neutral-700/60 hover:border-neutral-600 transition-all active:scale-95"
                    >
                      <option.icon className="w-10 h-10 text-white" strokeWidth={1.5} />
                      <span className="text-white text-lg font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>

                {/* No Receipt Button */}
                <button
                  onClick={() => handleReceiptOption("none")}
                  className="w-full py-4 rounded-full bg-neutral-800/80 border border-neutral-700 text-white font-semibold text-lg hover:bg-neutral-700/80 transition-colors mb-6"
                >
                  NO RECEIPT
                </button>

                {/* Marketing Opt-out Checkbox */}
                <div className="flex items-center gap-3 px-1">
                  <Checkbox
                    id="marketing-opt-out"
                    checked={noMarketingOptOut}
                    onCheckedChange={(checked) => setNoMarketingOptOut(checked === true)}
                    className="w-6 h-6 border-2 border-neutral-600 data-[state=checked]:bg-neutral-600 data-[state=checked]:border-neutral-600"
                  />
                  <label 
                    htmlFor="marketing-opt-out" 
                    className="text-neutral-400 text-base cursor-pointer"
                  >
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

                {/* Powered by eatOS - CFD Mode only */}
                {isCFDMode && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <span className="text-neutral-500 text-sm">Powered by</span>
                    <img src={eatosLogo} alt="eatOS" className="h-5" />
                  </div>
                )}
              </div>
            </div>
          ) : signatureMode ? (
            /* Signature Mode */
            <div className="flex flex-col h-full overflow-hidden">
              {/* Back Button */}
              <button 
                onClick={handleBackFromSignature}
                className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center mb-4 shrink-0 hover:bg-neutral-700 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>

              {/* Total Amount */}
              <h2 className="text-white text-3xl font-bold text-center mb-1 shrink-0">
                Total {formatPrice(finalTotal)}
              </h2>

              {/* Amount Breakdown */}
              <p className="text-neutral-400 text-center text-lg mb-4 shrink-0">
                {formatPrice(totalAmount)} + {formatPrice(finalTipAmount)}
                {finalTipPercent !== null && `(${finalTipPercent}%)`} tip
              </p>

              {/* Signature Pad */}
              <div className="flex-1 min-h-0 mb-4">
                <div className="relative w-full h-full bg-neutral-800/80 rounded-2xl border border-neutral-700 overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-neutral-500 text-2xl font-light">Signature Here</span>
                    </div>
                  )}
                  {hasSignature && (
                    <button
                      onClick={clearSignature}
                      className="absolute top-3 right-3 px-3 py-1 bg-neutral-700 rounded-full text-neutral-300 text-sm hover:bg-neutral-600 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-neutral-700 mb-3 shrink-0" />

              {/* Privacy Policy */}
              <p className="text-neutral-500 text-center text-sm leading-relaxed mb-4 px-2 shrink-0">
                {isCFDMode ? (
                  <>
                    I understand that my information will be used to complete this transaction and for other purposes described in eatOS's{" "}
                    <span className="text-violet-500">Privacy Policy</span>, and that it may be shared with the merchant.
                  </>
                ) : (
                  "I acknowledge that tips are distributed according to the company's tip pooling policy"
                )}
              </p>

              {/* Powered by eatOS - CFD Mode only */}
              {isCFDMode && (
                <div className="flex items-center justify-center gap-2 mb-4 shrink-0">
                  <span className="text-neutral-500 text-sm">Powered by</span>
                  <img src={eatosLogo} alt="eatOS" className="h-5" />
                </div>
              )}

              {/* Confirm Button */}
              <button
                onClick={handleSignatureConfirm}
                className="w-full py-4 rounded-full bg-neutral-600 text-white font-semibold text-lg shrink-0 hover:bg-neutral-500 transition-colors"
              >
                CONFIRM
              </button>
            </div>
          ) : customTipMode ? (
            /* Custom Tip Input Mode - Fixed View */
            <div className="flex flex-col h-full overflow-hidden">
              {/* Back Button */}
              <button 
                onClick={handleBackFromCustom}
                className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center mb-3 shrink-0 hover:bg-neutral-700 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>

              {/* Total Amount */}
              <h2 className="text-white text-2xl font-bold text-center mb-1 shrink-0">
                Total {formatPrice(totalAmount)}
              </h2>
              
              {/* Existing tip and new tip display - additive model */}
              {existingTip > 0 && (
                <div className="bg-neutral-800/60 rounded-xl p-3 mb-3 border border-neutral-700 shrink-0">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-neutral-400">Current Tip</span>
                    <span className="text-white font-semibold">{formatPrice(existingTip)}</span>
                  </div>
                  {(() => {
                    const additionalTip = isPercentMode 
                      ? totalAmount * (parseFloat(customTipValue) || 0) / 100
                      : parseFloat(customTipValue) || 0;
                    const newTotalTip = existingTip + additionalTip;
                    
                    return (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-neutral-300">Adding</span>
                          <span className="text-emerald-400 font-semibold">
                            +{formatPrice(additionalTip)}
                          </span>
                        </div>
                        <div className="border-t border-neutral-600 mt-2 pt-2 flex items-center justify-between text-sm">
                          <span className="text-neutral-300 font-medium">New Total</span>
                          <span className="text-white font-semibold">
                            {formatPrice(newTotalTip)}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Input Field with Toggle */}
              <div className="flex items-center gap-2 bg-neutral-800 rounded-full py-3 px-5 mb-3 shrink-0">
                <div className="flex-1 text-center">
                  <span className="text-white text-2xl font-semibold">
                    {isPercentMode ? `${customTipValue}%` : `$${customTipValue}`}
                  </span>
                </div>
                
                {/* $ / % Toggle */}
                <div className="flex bg-neutral-700 rounded-full p-1">
                  <button
                    onClick={() => setIsPercentMode(false)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-base font-semibold transition-colors ${
                      !isPercentMode ? "bg-neutral-500 text-white" : "text-neutral-400"
                    }`}
                  >
                    $
                  </button>
                  <button
                    onClick={() => setIsPercentMode(true)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-base font-semibold transition-colors ${
                      isPercentMode ? "bg-neutral-500 text-white" : "text-neutral-400"
                    }`}
                  >
                    %
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-neutral-700 mb-3 shrink-0" />

              {/* Privacy Policy */}
              <p className="text-neutral-500 text-center text-xs leading-relaxed mb-3 px-1 shrink-0">
                {isCFDMode ? (
                  <>
                    I understand that my information will be used to complete this transaction and for other purposes described in eatOS's{" "}
                    <span className="text-violet-500">Privacy Policy</span>, and that it may be shared with the merchant.
                  </>
                ) : (
                  "I acknowledge that tips are distributed according to the company's tip pooling policy"
                )}
              </p>

              {/* Powered by eatOS - CFD Mode only */}
              {isCFDMode && (
                <div className="flex items-center justify-center gap-2 mb-3 shrink-0">
                  <span className="text-neutral-500 text-sm">Powered by</span>
                  <img src={eatosLogo} alt="eatOS" className="h-5" />
                </div>
              )}

              {/* Confirm Button */}
              <button
                onClick={handleCustomTipSubmit}
                className="w-full py-3 rounded-full bg-neutral-600 text-white font-semibold text-base mb-3 shrink-0 hover:bg-neutral-500 transition-colors"
              >
                CONFIRM
              </button>

              {/* Numeric Keypad - Takes remaining space */}
              <div className="grid grid-cols-3 gap-1 flex-1 min-h-0">
                {keypadKeys.flat().map((key) => (
                  <button
                    key={key}
                    onClick={() => handleKeypadPress(key)}
                    className={`rounded-lg flex items-center justify-center text-2xl font-semibold transition-colors active:scale-95 ${
                      key === "C" 
                        ? "bg-neutral-800 text-red-500 hover:bg-neutral-700" 
                        : "bg-neutral-800 text-white hover:bg-neutral-700"
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Header with Back Button and CFD/Give to Customer Toggle */}
              <div className="flex items-center justify-between mb-4">
                {isLandscape ? (
                  <button 
                    onClick={handleFinalClose}
                    className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-neutral-700 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                ) : (
                  <DrawerClose asChild>
                    <button className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-neutral-700 transition-colors">
                      <ChevronLeft className="w-6 h-6 text-white" />
                    </button>
                  </DrawerClose>
                )}
                
                {/* CFD Toggle for Landscape / Give to Customer for Portrait */}
                {isLandscape ? (
                  <button
                    onClick={() => setIsCFDMode(!isCFDMode)}
                    className={`px-3 py-2 rounded-full text-xs font-medium transition-all ${
                      isCFDMode 
                        ? 'bg-amber-600/20 text-amber-400 border border-amber-600/40' 
                        : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                    }`}
                  >
                    {isCFDMode ? 'CFD • On' : 'Request tip on built-in CFD'}
                  </button>
                ) : (
                  <button
                    onClick={() => setIsCFDMode(!isCFDMode)}
                    className={`px-3 py-2 rounded-full text-xs font-medium transition-all ${
                      isCFDMode 
                        ? 'bg-amber-600/20 text-amber-400 border border-amber-600/40' 
                        : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                    }`}
                  >
                    {isCFDMode ? 'Customer • On' : 'Give to Customer'}
                  </button>
                )}
              </div>

              {/* Total Amount */}
              <h2 className="text-white text-3xl font-bold text-center mb-2">
                Total {formatPrice(totalAmount)}
              </h2>

              {/* Order Summary - shown when setting is enabled */}
              {(() => {
                const taxRate = getActiveTaxRate();
                const subtotal = totalAmount / (1 + taxRate);
                const taxAmount = totalAmount - subtotal;
                return (
                  <div className="bg-neutral-800/50 rounded-xl p-3 mb-3 border border-neutral-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-neutral-400 text-sm">Subtotal</span>
                      <span className="text-white text-sm">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-neutral-400 text-sm">Tax ({(taxRate * 100).toFixed(2)}%)</span>
                      <span className="text-white text-sm">{formatPrice(taxAmount)}</span>
                    </div>
                    <div className="border-t border-neutral-700/50 pt-2 flex items-center justify-between">
                      <span className="text-white text-sm font-semibold">Total</span>
                      <span className="text-white text-sm font-semibold">{formatPrice(totalAmount)}</span>
                    </div>
                  </div>
                );
              })()}
              )}

              {/* Itemized Tax per Product - shown when setting is enabled */}
              {SettingsManager.getCheckoutOptionsSettings().showItemizedTax && orderItems.length > 0 && (
                <div className="bg-neutral-800/50 rounded-xl p-3 mb-3 border border-neutral-700/50">
                  <p className="text-neutral-500 text-xs font-medium uppercase tracking-wider mb-2">Tax Breakdown by Product</p>
                  {orderItems.map((item, idx) => {
                    const taxRate = getActiveTaxRate();
                    const itemTotal = item.price * item.qty;
                    const itemTax = itemTotal * taxRate;
                    return (
                      <div key={idx} className="flex items-center justify-between py-1.5 border-b border-neutral-700/30 last:border-b-0">
                        <div className="flex-1 min-w-0">
                          <span className="text-white text-sm truncate block">{item.name} {item.qty > 1 ? `×${item.qty}` : ''}</span>
                          <span className="text-neutral-500 text-xs">{formatPrice(itemTotal)}</span>
                        </div>
                        <span className="text-neutral-400 text-sm ml-3">+{formatPrice(itemTax)} tax</span>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Existing Tip Info Banner - for paid tickets */}
              {existingTip > 0 && (
                <div className="bg-emerald-900/30 rounded-xl p-4 mb-4 border border-emerald-700/50 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <span className="text-emerald-400 text-sm font-semibold block">Adding to Existing Tip</span>
                    <span className="text-neutral-400 text-xs">Your selection will be added to the current tip</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-neutral-400 text-xs block">Current Tip</span>
                    <span className="text-emerald-400 font-bold text-lg">{formatPrice(existingTip)}</span>
                  </div>
                </div>
              )}
              
              {/* Suggestions Label */}
              <p className="text-neutral-400 text-center text-sm mb-6">
                {existingTip > 0 
                  ? `Select additional tip amount`
                  : `Suggestions based on original amount of ${formatPrice(totalAmount)}`
                }
              </p>

              {/* Tip Options Grid */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                {tipOptions.map((option) => {
                  // The tip amount is ADDITIONAL (will be added to existing)
                  const additionalTipAmount = option.amount;
                  const newTotalTip = existingTip + additionalTipAmount;
                  
                  return (
                    <button
                      key={option.percent}
                      onClick={() => handleTipSelect(option.percent, additionalTipAmount)}
                      className={`py-6 rounded-2xl border transition-all ${
                        selectedTip === option.percent 
                          ? "border-white bg-neutral-700 hover:border-neutral-500" 
                          : "border-neutral-700 bg-neutral-800/50 hover:border-neutral-500"
                      }`}
                    >
                      <div className="text-3xl font-bold text-white">{option.percent}%</div>
                      <div className="text-lg mt-1 text-neutral-400">{formatPrice(additionalTipAmount)}</div>
                      {existingTip > 0 && (
                        <div className="text-xs mt-1 text-emerald-400">
                          New total: {formatPrice(newTotalTip)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom Tip Button */}
              <button
                onClick={handleCustomTip}
                className="w-full py-5 rounded-2xl bg-neutral-800/50 border border-neutral-700 text-white font-bold text-lg mb-4 hover:border-neutral-500 transition-colors"
              >
                CUSTOM TIP
              </button>

              {/* No Tip Option */}
              <button
                onClick={handleNoTip}
                className="w-full py-3 font-semibold text-lg text-white hover:text-neutral-300 transition-colors"
              >
                No Tip
              </button>
              
              {/* Info text when existing tip */}
              {existingTip > 0 && (
                <p className="text-center text-neutral-500 text-xs mt-2">
                  Current tip: {formatPrice(existingTip)} • Use REFUND to reduce or remove tip
                </p>
              )}

              {/* Divider */}
              <div className="border-t border-neutral-700 my-4" />

              {/* Privacy Policy */}
              <p className="text-neutral-500 text-center text-sm leading-relaxed">
                {isCFDMode ? (
                  <>
                    I understand that my information will be used to complete this transaction and for other purposes described in eatOS's{" "}
                    <span className="text-violet-500">Privacy Policy</span>, and that it may be shared with the merchant.
                  </>
                ) : (
                  "I acknowledge that tips are distributed according to the company's tip pooling policy"
                )}
              </p>

              {/* Powered by eatOS - CFD Mode only */}
              {isCFDMode && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <span className="text-neutral-500 text-sm">Powered by</span>
                  <img src={eatosLogo} alt="eatOS" className="h-5" />
                </div>
              )}
            </>
          )}
        </div>
  );

  if (isLandscape) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleFinalClose()}>
        <DialogContent hideCloseButton className={`flex flex-col bg-black border border-neutral-800 rounded-2xl p-0 max-w-2xl w-[90vw] gap-0 ${isFullScreen ? 'h-[90vh] max-h-[90vh]' : 'h-[85vh]'}`}>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleFinalClose()}>
      <DrawerContent className={`bg-black border-t border-neutral-800 rounded-t-[20px] ${isFullScreen ? 'h-[100dvh] max-h-[100dvh]' : 'h-[95vh]'}`}>
        {content}
      </DrawerContent>
    </Drawer>
  );
};

export default TipBottomSheet;
