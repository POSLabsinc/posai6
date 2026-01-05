import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Delete, Fingerprint, ScanFace, X, ShieldCheck } from "lucide-react";

interface MPINDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  correctPin?: string;
}

const MPINDialog = ({ open, onOpenChange, onSuccess, correctPin = "1234" }: MPINDialogProps) => {
  const [pin, setPin] = useState<string>("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) {
      setPin("");
      setError(false);
    }
  }, [open]);

  useEffect(() => {
    if (pin.length === 4) {
      // For now, accept any 4-digit PIN to test the flow
      onSuccess();
      onOpenChange(false);
    }
  }, [pin, onSuccess, onOpenChange]);

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError(false);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const renderPinDots = () => {
    return (
      <div className="flex items-center justify-center gap-4">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`w-4 h-4 rounded-full transition-all duration-300 ${
              index < pin.length
                ? error
                  ? "bg-destructive shadow-[0_0_12px_hsla(0,84%,60%,0.5)]"
                  : "bg-orange-500 shadow-[0_0_12px_hsla(25,95%,53%,0.5)]"
                : "bg-muted-foreground/20 border border-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    );
  };

  const numpadButtons = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", "backspace"]
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-none max-h-none rounded-none bg-background border-none p-0 gap-0 flex flex-col items-center justify-center overflow-hidden">
        {/* Background gradient mesh */}
        <div className="absolute inset-0 gradient-mesh opacity-50" />
        
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-6 right-6 p-2 rounded-full glass hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Main content container */}
        <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-6">
          
          {/* Header with shield icon */}
          <div className="flex items-center gap-2 mb-8">
            <div className="p-2 rounded-xl bg-orange-500/20 border border-orange-500/30">
              <ShieldCheck className="w-5 h-5 text-orange-500" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Manager Authorization</h2>
          </div>

          {/* Manager Profile Card */}
          <div className="glass-vibrant rounded-2xl p-6 mb-8 w-full flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-orange-500/40 ring-offset-2 ring-offset-background">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face"
                  alt="Manager"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-foreground">Mia Jones</h3>
            <p className="text-sm text-muted-foreground">Floor Manager</p>
          </div>

          {/* PIN Section */}
          <div className="glass rounded-2xl p-6 w-full mb-6">
            <p className="text-center text-muted-foreground text-sm mb-4">Enter your 4-digit PIN</p>
            {renderPinDots()}
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3 w-full mb-6">
            {numpadButtons.flat().map((btn, index) => (
              btn === "" ? (
                <div key={index} className="w-full aspect-[1.5]" />
              ) : btn === "backspace" ? (
                <button
                  key={btn}
                  onClick={handleBackspace}
                  className="w-full aspect-[1.5] rounded-xl glass border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all duration-150"
                >
                  <Delete className="w-6 h-6 text-muted-foreground" />
                </button>
              ) : (
                <button
                  key={btn}
                  onClick={() => handleNumberClick(btn)}
                  className="w-full aspect-[1.5] rounded-xl glass border border-white/10 text-2xl font-medium text-foreground hover:bg-white/10 active:scale-95 active:bg-orange-500/20 transition-all duration-150"
                >
                  {btn}
                </button>
              )
            ))}
          </div>

          {/* Biometric Options */}
          <div className="flex justify-center gap-3 w-full">
            <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl glass border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-all duration-150">
              <Fingerprint className="w-5 h-5" />
              <span className="text-sm font-medium">Touch ID</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl glass border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-all duration-150">
              <ScanFace className="w-5 h-5" />
              <span className="text-sm font-medium">Face ID</span>
            </button>
          </div>

          {/* Forgot PIN */}
          <p className="text-center text-muted-foreground/60 text-xs mt-6">
            Forgot PIN? <span className="text-orange-500 hover:underline cursor-pointer">Contact your manager</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MPINDialog;
