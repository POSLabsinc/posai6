import { ChevronLeft, ChevronRight, Delete } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { lookupEmployeeByPin, updateEmployeePin } from "@/lib/employeePinLookup";
import { notifyPinUpdated } from "@/lib/notificationService";

type PinStep = "current" | "new" | "confirm";

interface ChangePinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ChangePinDialog = ({ open, onOpenChange }: ChangePinDialogProps) => {
  const { toast } = useToast();
  
  const [step, setStep] = useState<PinStep>("current");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [matchedEmployeeId, setMatchedEmployeeId] = useState<string | null>(null);

  const resetState = () => {
    setStep("current");
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setError("");
    setMatchedEmployeeId(null);
  };

  const getCurrentValue = () => {
    switch (step) {
      case "current": return currentPin;
      case "new": return newPin;
      case "confirm": return confirmPin;
    }
  };

  const setCurrentValue = (value: string) => {
    switch (step) {
      case "current": setCurrentPin(value); break;
      case "new": setNewPin(value); break;
      case "confirm": setConfirmPin(value); break;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case "current": return "Enter Current PIN";
      case "new": return "Enter New PIN";
      case "confirm": return "Confirm New PIN";
    }
  };

  const handleNumberPress = (num: string) => {
    const currentValue = getCurrentValue();
    if (currentValue.length < 4) {
      const newValue = currentValue + num;
      setCurrentValue(newValue);
      setError("");

      if (newValue.length === 4) {
        setTimeout(() => handlePinComplete(newValue), 200);
      }
    }
  };

  const handleDelete = () => {
    const currentValue = getCurrentValue();
    if (currentValue.length > 0) {
      setCurrentValue(currentValue.slice(0, -1));
      setError("");
    }
  };

  const handleClear = () => {
    setCurrentValue("");
    setError("");
  };

  const handlePinComplete = async (pin: string) => {
    if (step === "current") {
      const employee = await lookupEmployeeByPin(pin);
      if (!employee) {
        setError("Incorrect current PIN");
        setCurrentPin("");
        return;
      }
      setMatchedEmployeeId(employee.id);
      setStep("new");
    } else if (step === "new") {
      setStep("confirm");
    } else if (step === "confirm") {
      if (pin !== newPin) {
        setError("PINs do not match");
        setConfirmPin("");
        return;
      }

      if (!matchedEmployeeId) {
        setError("Session expired. Please start over.");
        resetState();
        return;
      }

      const success = await updateEmployeePin(matchedEmployeeId, newPin);
      if (!success) {
        setError("Failed to update PIN. Please try again.");
        setConfirmPin("");
        return;
      }

      notifyPinUpdated();

      toast({
        title: "PIN Updated",
        description: "Your new PIN is now active for all POS access.",
      });

      resetState();
      onOpenChange(false);
    }
  };

  const handleBack = () => {
    if (step === "current") {
      resetState();
      onOpenChange(false);
    } else if (step === "new") {
      setStep("current");
      setNewPin("");
    } else {
      setStep("new");
      setConfirmPin("");
    }
  };

  const currentValue = getCurrentValue();
  const steps: PinStep[] = ["current", "new", "confirm"];
  const currentStepIndex = steps.indexOf(step);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetState();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="bg-neutral-900 border-neutral-800 p-0 max-w-sm rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-center relative p-4 border-b border-neutral-800">
          <button
            onClick={handleBack}
            className="absolute left-4 w-8 h-8 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <h2 className="text-base font-semibold text-foreground">Change PIN</h2>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center pt-6 pb-4 px-4">
          {/* Step Indicators */}
          <div className="flex gap-2 mb-4">
            {steps.map((s, index) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index <= currentStepIndex ? "bg-blue-500" : "bg-neutral-600"
                }`}
              />
            ))}
          </div>

          {/* Step Title */}
          <p className="text-sm text-neutral-400 mb-6">{getStepTitle()}</p>

          {/* PIN Dots */}
          <div className="flex gap-4 mb-3">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`w-3.5 h-3.5 rounded-full transition-all ${
                  currentValue.length > index ? "bg-foreground scale-100" : "bg-neutral-700 scale-90"
                }`}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
        </div>

        {/* Numeric Keypad */}
        <div className="p-4 pt-0">
          <div className="grid grid-cols-3 gap-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberPress(num)}
                className="h-14 bg-neutral-800/60 rounded-xl text-xl font-medium text-foreground active:bg-neutral-700 transition-colors"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleDelete}
              className="h-14 bg-neutral-800/60 rounded-xl flex items-center justify-center active:bg-neutral-700 transition-colors"
            >
              <Delete className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={() => handleNumberPress("0")}
              className="h-14 bg-neutral-800/60 rounded-xl text-xl font-medium text-foreground active:bg-neutral-700 transition-colors"
            >
              0
            </button>
            <button
              onClick={handleClear}
              className="h-14 bg-transparent rounded-xl text-base font-medium text-red-400 active:bg-neutral-800/40 transition-colors"
            >
              C
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Security = () => {
  const navigate = useNavigate();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background p-4 pb-28">
      {/* Header with back button and AI icon */}
      <div className="relative flex items-center justify-center mb-8 overflow-visible h-12">
        <button
          onClick={() => navigate(-1)}
          className="absolute left-0 w-12 h-12 rounded-full bg-muted flex items-center justify-center active:opacity-70 transition-opacity"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Security</h1>
        <div className="absolute right-0 md:hidden">
          <AnimatedAIIcon size={24} onClick={() => navigate('/settings/ai')} />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col items-center">
        <div className="w-full max-w-2xl">
          {/* Password Section - Read Only Notice */}
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-neutral-400 tracking-wider mb-3 px-2">
              Password
            </h2>
            <div className="bg-neutral-800/40 rounded-2xl overflow-hidden">
              <div className="py-4 px-5">
                <p className="text-foreground text-base font-medium">Password Management</p>
                <p className="text-neutral-400 text-sm mt-1">
                  Password changes are restricted to the Manager Dashboard for security purposes.
                </p>
              </div>
            </div>
          </div>

          {/* Two Factor Authentication Section */}
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-neutral-400 tracking-wider mb-3 px-2">
              Two Factor Authentication
            </h2>
            <div className="bg-neutral-800/40 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between w-full py-4 px-5">
                <span className="text-foreground text-base font-medium">Two Factor Authentication</span>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={setTwoFactorEnabled}
                />
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-3 px-2">
              Enable two factor authentication to add an extra layer of security to your account.
            </p>
          </div>

          {/* PIN Settings Section */}
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-neutral-400 tracking-wider mb-3 px-2">
              PIN Settings
            </h2>
            <div className="bg-neutral-800/40 rounded-2xl overflow-hidden">
              <button 
                onClick={() => setPinDialogOpen(true)}
                className="flex items-center justify-between w-full py-4 px-5 active:opacity-70 transition-opacity"
              >
                <span className="text-foreground text-base font-medium">Change Pin</span>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400 text-base tracking-wider">••••</span>
                  <ChevronRight className="w-5 h-5 text-neutral-500" />
                </div>
              </button>
            </div>
            <p className="text-xs text-neutral-500 mt-3 px-2">
              Your PIN is used for POS access, clock-in, clock-out, and authorization prompts. Changes take effect immediately.
            </p>
          </div>
        </div>
      </div>

      <ChangePinDialog open={pinDialogOpen} onOpenChange={setPinDialogOpen} />
    </div>
  );
};

export default Security;
