import { useState } from "react";
import { Clock, AlertTriangle, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import AppleAlertDialog from "@/components/AppleAlertDialog";

type ModalState = "prompt" | "extend" | "no-extension";

interface ClosingGracePeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExtension?: (minutes: number) => void;
  onConfirmNoExtension?: () => void;
}

const ClosingGracePeriodModal = ({
  isOpen,
  onClose,
  onConfirmExtension,
  onConfirmNoExtension,
}: ClosingGracePeriodModalProps) => {
  const [modalState, setModalState] = useState<ModalState>("prompt");
  const [extensionMinutes, setExtensionMinutes] = useState(30);
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [showNoExtensionAlert, setShowNoExtensionAlert] = useState(false);

  // Base closing time (10:00 PM = 22:00)
  const baseClosingHour = 22;
  const baseClosingMinute = 0;

  // Calculate new closing time based on extension
  const getNewClosingTime = () => {
    const totalMinutes = baseClosingHour * 60 + baseClosingMinute + extensionMinutes;
    const newHour = Math.floor(totalMinutes / 60) % 24;
    const newMinute = totalMinutes % 60;
    
    const period = newHour >= 12 ? "PM" : "AM";
    const displayHour = newHour === 0 ? 12 : newHour > 12 ? newHour - 12 : newHour;
    const displayMinute = newMinute.toString().padStart(2, "0");
    
    return `${displayHour}:${displayMinute} ${period}`;
  };

  const handleSliderChange = (value: number[]) => {
    setExtensionMinutes(value[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setExtensionMinutes(Math.min(120, Math.max(0, value)));
  };

  const handleBack = () => {
    setModalState("prompt");
  };

  const handleConfirmExtensionClick = () => {
    setShowConfirmAlert(true);
  };

  const handleConfirmExtension = () => {
    setShowConfirmAlert(false);
    onConfirmExtension?.(extensionMinutes);
    setModalState("prompt");
    onClose();
  };

  const handleDontExtendClick = () => {
    setShowNoExtensionAlert(true);
  };

  const handleConfirmNoExtension = () => {
    setShowNoExtensionAlert(false);
    onConfirmNoExtension?.();
    setModalState("prompt");
    onClose();
  };

  const contentVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        hideCloseButton
        className="max-w-md w-full p-0 gap-0 bg-neutral-900 border-neutral-700 rounded-2xl overflow-hidden z-[10001]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <AnimatePresence mode="wait">
          {/* ==================== PROMPT STATE ==================== */}
          {modalState === "prompt" && (
            <motion.div
              key="prompt"
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="flex flex-col"
            >
              <DialogHeader className="px-6 pt-6 pb-4 text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Clock className="w-7 h-7 text-amber-500" />
                  </div>
                </div>
                <DialogTitle className="text-2xl font-bold text-foreground text-center">
                  Restaurant closing time is nearing
                </DialogTitle>
                <DialogDescription className="text-base text-muted-foreground mt-1 text-center">
                  Do you want to extend today's operating hours?
                </DialogDescription>
              </DialogHeader>

              {/* Today's Operating Hours Info */}
              <div className="px-6 pb-4">
                <div className="bg-neutral-800/50 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Operating hours</span>
                    <span className="text-sm font-medium text-foreground">10:00 AM – 10:00 PM</span>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6 grid grid-cols-2 gap-3">
                <Button
                  size="lg"
                  onClick={() => setModalState("extend")}
                  className="h-14 text-lg font-bold bg-primary hover:bg-primary/90"
                >
                  Yes
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => setModalState("no-extension")}
                  className="h-14 text-lg font-bold"
                >
                  No
                </Button>
              </div>
            </motion.div>
          )}

          {/* ==================== EXTEND STATE ==================== */}
          {modalState === "extend" && (
            <motion.div
              key="extend"
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="flex flex-col"
            >
              <DialogHeader className="px-6 pt-6 pb-4 text-center">
                <DialogTitle className="text-2xl font-bold text-foreground">
                  Extend closing time
                </DialogTitle>
              </DialogHeader>

              <div className="px-6 space-y-4">
                {/* Extension Minutes */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Extension minutes
                  </Label>
                  
                  {/* Slider with Value Display */}
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[extensionMinutes]}
                      onValueChange={handleSliderChange}
                      min={0}
                      max={120}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-lg font-bold text-primary min-w-[70px] text-right">
                      {extensionMinutes} min
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-xs text-muted-foreground px-1">
                    <span>0 min</span>
                    <span>120 min</span>
                  </div>
                </div>

                {/* Numeric Input */}
                <div className="space-y-2">
                  <Label htmlFor="minutes" className="text-sm font-medium text-muted-foreground">
                    Minutes (0–120)
                  </Label>
                  <Input
                    id="minutes"
                    type="number"
                    min={0}
                    max={120}
                    value={extensionMinutes}
                    onChange={handleInputChange}
                    className="h-12 text-lg text-center font-semibold"
                  />
                </div>

                {/* New Closing Time Preview */}
                <div className="bg-muted/30 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">New closing time</span>
                  <span className="text-xl font-bold text-foreground">{getNewClosingTime()}</span>
                </div>

              </div>

              <div className="px-6 py-5 grid grid-cols-2 gap-3 mt-2">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleBack}
                  className="h-12 text-base font-semibold"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  size="lg"
                  onClick={handleConfirmExtensionClick}
                  className="h-12 text-base font-bold bg-primary hover:bg-primary/90"
                >
                  Confirm Extension
                </Button>
              </div>
            </motion.div>
          )}

          {/* ==================== NO-EXTENSION STATE ==================== */}
          {modalState === "no-extension" && (
            <motion.div
              key="no-extension"
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="flex flex-col"
            >
              <DialogHeader className="px-6 pt-6 pb-4 text-center">
                <DialogTitle className="text-2xl font-bold text-foreground text-center">
                  No extension selected
                </DialogTitle>
                <DialogDescription className="text-base text-muted-foreground mt-1 text-center">
                  Restaurant will close at the scheduled time.
                </DialogDescription>
              </DialogHeader>

              <div className="px-6 pb-4">
                <div className="bg-muted/30 rounded-xl p-5 text-center">
                  <span className="text-sm text-muted-foreground block mb-1">Closing at</span>
                  <span className="text-4xl font-bold text-foreground">10:00 PM</span>
                </div>
              </div>

              <div className="px-6 pb-6 grid grid-cols-2 gap-3">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleBack}
                  className="h-12 text-base font-semibold"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  size="lg"
                  onClick={handleDontExtendClick}
                  className="h-12 text-base font-bold bg-primary hover:bg-primary/90"
                >
                  Don't extend
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>

      {/* Confirmation Alert for Extension */}
      <AppleAlertDialog
        open={showConfirmAlert}
        onOpenChange={setShowConfirmAlert}
        onConfirm={handleConfirmExtension}
        title="Extend Closing Time?"
        description={`Are you sure you want to extend the closing time by ${extensionMinutes} minutes to ${getNewClosingTime()}?`}
        confirmText="Extend"
      />

      {/* Confirmation Alert for No Extension */}
      <AppleAlertDialog
        open={showNoExtensionAlert}
        onOpenChange={setShowNoExtensionAlert}
        onConfirm={handleConfirmNoExtension}
        title="Don't Extend?"
        description="The restaurant will be closed at 10:00 PM and no transactions can be processed until reopening."
        confirmText="Confirm"
      />
    </Dialog>
  );
};

export default ClosingGracePeriodModal;
