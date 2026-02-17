import { ChevronLeft, ChevronRight, Eye, EyeOff, Delete } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface PasswordInputRowProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggleVisibility: () => void;
  error?: string;
}

const PasswordInputRow = ({
  label,
  value,
  onChange,
  showPassword,
  onToggleVisibility,
  error,
}: PasswordInputRowProps) => (
  <div className="flex flex-col">
    <div className="flex items-center justify-between w-full py-3 px-5">
      <label className="text-foreground text-base font-medium min-w-[80px]">{label}</label>
      <div className="flex items-center gap-2 flex-1 justify-end">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className="bg-transparent text-neutral-300 text-base text-right outline-none placeholder:text-neutral-500 w-full max-w-[200px]"
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="p-1 text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
    {error && (
      <p className="text-red-400 text-xs px-5 pb-2">{error}</p>
    )}
  </div>
);

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

  const resetState = () => {
    setStep("current");
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setError("");
  };

  const getCurrentValue = () => {
    switch (step) {
      case "current":
        return currentPin;
      case "new":
        return newPin;
      case "confirm":
        return confirmPin;
    }
  };

  const setCurrentValue = (value: string) => {
    switch (step) {
      case "current":
        setCurrentPin(value);
        break;
      case "new":
        setNewPin(value);
        break;
      case "confirm":
        setConfirmPin(value);
        break;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case "current":
        return "Enter Current PIN";
      case "new":
        return "Enter New PIN";
      case "confirm":
        return "Confirm New PIN";
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
      setStep("new");
    } else if (step === "new") {
      setStep("confirm");
    } else if (step === "confirm") {
      if (pin !== newPin) {
        setError("PINs do not match");
        setConfirmPin("");
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      toast({
        title: "PIN Updated",
        description: "Your PIN has been changed successfully.",
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
                  index <= currentStepIndex
                    ? "bg-blue-500"
                    : "bg-neutral-600"
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
                  currentValue.length > index
                    ? "bg-foreground scale-100"
                    : "bg-neutral-700 scale-90"
                }`}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-red-400 text-xs mb-2">{error}</p>
          )}
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

interface SecurityContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const SecurityContent = ({ showHeader = true, onBack, onAIClick }: SecurityContentProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Validation errors
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  
  // Loading state
  const [isSaving, setIsSaving] = useState(false);

  const validatePassword = (password: string): string | undefined => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    return undefined;
  };

  const handleSavePassword = async () => {
    const newErrors: typeof errors = {};
    
    if (!currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }
    
    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else {
      const passwordError = validatePassword(newPassword);
      if (passwordError) {
        newErrors.newPassword = passwordError;
      }
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return;
    }
    
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    
    toast({
      title: "Password Updated",
      description: "Your password has been changed successfully.",
    });
  };

  const hasPasswordChanges = currentPassword || newPassword || confirmPassword;

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {/* Header - only shown in tablet/desktop right panel */}
      {showHeader && (
        <div className="flex items-center justify-center py-4 relative">
          {onBack && (
            <button
              onClick={onBack}
              className="absolute left-4 w-8 h-8 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
          )}
          <h1 className="text-base font-medium text-foreground">Security</h1>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col items-center pt-6 px-6 pb-8">
        {/* AI Assistant Icon - hidden on mobile (shown in page wrapper) */}
        <div className="hidden md:flex justify-end w-full mb-3 overflow-visible">
          <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />
        </div>

        <div className="w-full">
          {/* Password Section */}
          <div className="mb-6">
            <h2 className="text-xs font-medium text-neutral-500 tracking-wider uppercase mb-3">
              Password
            </h2>
            <div className="bg-neutral-800/40 rounded-2xl overflow-hidden">
              <PasswordInputRow
                label="Current"
                value={currentPassword}
                onChange={setCurrentPassword}
                showPassword={showCurrentPassword}
                onToggleVisibility={() => setShowCurrentPassword(!showCurrentPassword)}
                error={errors.currentPassword}
              />
              <div className="h-px bg-neutral-700/50 mx-5" />
              <PasswordInputRow
                label="New"
                value={newPassword}
                onChange={setNewPassword}
                showPassword={showNewPassword}
                onToggleVisibility={() => setShowNewPassword(!showNewPassword)}
                error={errors.newPassword}
              />
              <div className="h-px bg-neutral-700/50 mx-5" />
              <PasswordInputRow
                label="Confirm"
                value={confirmPassword}
                onChange={setConfirmPassword}
                showPassword={showConfirmPassword}
                onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
                error={errors.confirmPassword}
              />
            </div>
            <p className="text-xs text-neutral-500 mt-3 px-2">
              Your password must be at least 8 characters long, an uppercase letter and a lowercase letter.
            </p>
            
            {hasPasswordChanges && (
              <Button
                onClick={handleSavePassword}
                disabled={isSaving}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl"
              >
                {isSaving ? "Saving..." : "Update Password"}
              </Button>
            )}
          </div>

          {/* Two Factor Authentication Section */}
          <div className="mb-6">
            <h2 className="text-xs font-medium text-neutral-500 tracking-wider uppercase mb-3">
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
            <h2 className="text-xs font-medium text-neutral-500 tracking-wider uppercase mb-3">
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
          </div>
        </div>
      </div>

      <ChangePinDialog open={pinDialogOpen} onOpenChange={setPinDialogOpen} />
    </div>
  );
};

export default SecurityContent;
