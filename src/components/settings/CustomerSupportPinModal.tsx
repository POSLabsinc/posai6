import { useState, useEffect, useCallback } from "react";
import { X, Delete, MapPin, Monitor, AlertTriangle, Loader2, Check } from "lucide-react";
import type { Store } from "@/hooks/useDeviceStore";

interface CustomerSupportPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchStore: (selectedStore: Store) => void;
  stores: Store[];
  currentStore: Store | null;
  deviceName?: string;
}

const PIN_LENGTH = 4;

const PROCESSING_STEPS = [
  "Clearing device data",
  "Syncing store configuration",
  "Preparing device…",
];

type ModalPhase = "main" | "processing";

const CustomerSupportPinModal = ({
  isOpen,
  onClose,
  onSwitchStore,
  stores,
  currentStore,
  deviceName = "POS-Terminal-03",
}: CustomerSupportPinModalProps) => {
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [pinVerified, setPinVerified] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [phase, setPhase] = useState<ModalPhase>("main");
  const [processingStep, setProcessingStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setPin("");
      setPinError(false);
      setPinVerified(false);
      setSelectedStoreId(currentStore?.id ?? null);
      setPhase("main");
      setProcessingStep(0);
    }
  }, [isOpen, currentStore]);

  // Processing animation
  useEffect(() => {
    if (phase !== "processing") return;
    if (processingStep >= PROCESSING_STEPS.length) {
      // Done — trigger the actual switch
      const store = stores.find((s) => s.id === selectedStoreId);
      if (store) {
        setTimeout(() => onSwitchStore(store), 400);
      }
      return;
    }
    const timer = setTimeout(() => setProcessingStep((s) => s + 1), 1200);
    return () => clearTimeout(timer);
  }, [phase, processingStep, selectedStoreId, stores, onSwitchStore]);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length >= PIN_LENGTH || pinVerified) return;
    const newPin = pin + digit;
    setPin(newPin);
    setPinError(false);

    if (newPin.length === PIN_LENGTH) {
      setTimeout(() => {
        setPinVerified(true);
        setPinError(false);
      }, 200);
    }
  };

  const handleBackspace = () => {
    if (pinVerified) return;
    setPin((prev) => prev.slice(0, -1));
    setPinError(false);
  };

  const handleClear = () => {
    if (pinVerified) return;
    setPin("");
    setPinError(false);
  };

  const isDifferentStore = selectedStoreId && selectedStoreId !== currentStore?.id;
  const canSwitch = pinVerified && isDifferentStore;

  const handleSwitch = () => {
    if (!canSwitch) return;
    setPhase("processing");
    setProcessingStep(0);
  };

  // ─── Processing Screen ───
  if (phase === "processing") {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
        <div className="bg-neutral-900 rounded-3xl w-full max-w-md p-8 flex flex-col items-center">
          <h3 className="text-foreground font-bold text-lg mb-8">Switching Store</h3>
          <div className="space-y-5 w-full">
            {PROCESSING_STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                {i < processingStep ? (
                  <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : i === processingStep ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-neutral-700 shrink-0" />
                )}
                <span
                  className={`text-sm font-medium ${
                    i < processingStep
                      ? "text-emerald-400"
                      : i === processingStep
                        ? "text-foreground"
                        : "text-neutral-600"
                  }`}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Screen ───
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-3xl w-full max-w-3xl p-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-center mb-5">
          <h3 className="text-foreground font-bold text-lg">
            Customer Support Authorization
          </h3>
        </div>

        {/* Device Info */}
        <div className="bg-neutral-800/60 rounded-xl p-4 mb-5 flex items-center gap-6">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Monitor className="w-4 h-4 text-neutral-500 shrink-0" />
            <span className="text-neutral-500 text-sm">Device</span>
            <span className="text-foreground text-sm font-medium ml-auto">{deviceName}</span>
          </div>
          <div className="w-px h-8 bg-neutral-700/50" />
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <MapPin className="w-4 h-4 text-neutral-500 shrink-0" />
            <span className="text-neutral-500 text-sm">Current Store</span>
            <span className="text-foreground text-sm font-medium ml-auto">
              {currentStore
                ? `${currentStore.name} – ${currentStore.location}`
                : "Not assigned"}
            </span>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-6">
          {/* Left: Store Selection */}
          <div className="flex-1 min-w-0 flex flex-col">
            <p className="text-neutral-400 text-xs font-medium tracking-wider mb-1 px-1">
              SELECT NEW STORE
            </p>
            <p className="text-neutral-500 text-xs mb-3 px-1">Available Stores</p>
            <div className="space-y-2 flex-1 overflow-y-auto scrollbar-hide max-h-[340px]">
              {[...stores]
                .sort((a, b) => {
                  if (a.id === currentStore?.id) return -1;
                  if (b.id === currentStore?.id) return 1;
                  return 0;
                })
                .map((store) => {
                  const isCurrent = store.id === currentStore?.id;
                  const isSelected = store.id === selectedStoreId;
                  return (
                    <button
                      key={store.id}
                      onClick={() => setSelectedStoreId(store.id)}
                      className={`w-full flex items-center gap-3.5 p-3.5 rounded-xl transition-colors text-left ${
                        isSelected
                          ? isCurrent
                            ? "bg-neutral-700/40 border border-neutral-600"
                            : "bg-primary/10 border border-primary/30"
                          : "bg-neutral-800/60 hover:bg-neutral-700/60 active:bg-neutral-600/60 border border-transparent"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected
                            ? isCurrent
                              ? "border-neutral-400 bg-neutral-400"
                              : "border-primary bg-primary"
                            : "border-neutral-600"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground font-medium text-sm truncate">
                          {store.name} – {store.location}
                        </p>
                        <p className="text-neutral-500 text-xs truncate mt-0.5">
                          {store.address}
                        </p>
                      </div>
                      {isCurrent && (
                        <span className="text-neutral-500 text-[10px] font-medium bg-neutral-700/60 px-2 py-0.5 rounded-full shrink-0">
                          Current
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px bg-neutral-700/50 self-stretch" />

          {/* Right: PIN */}
          <div className="flex-1 min-w-0">
            <p className="text-neutral-400 text-xs font-medium tracking-wider mb-1 px-1">
              ENTER CUSTOMER SUPPORT PIN TO SWITCH STORE
            </p>
            <div
              className={`flex justify-start gap-2 mb-4 ${pinError ? "animate-shake" : ""}`}
            >
              {Array.from({ length: PIN_LENGTH }).map((_, index) => (
                <div
                  key={index}
                  className={`flex-1 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all ${
                    pinVerified
                      ? "border-emerald-500 bg-emerald-500/10"
                      : index < pin.length
                        ? "border-neutral-400 bg-neutral-700"
                        : "border-neutral-600 bg-neutral-800"
                  }`}
                >
                  {pinVerified && index < PIN_LENGTH ? (
                    <span className="text-emerald-400">✱</span>
                  ) : index < pin.length ? (
                    <span className="text-foreground">✱</span>
                  ) : (
                    ""
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2.5 w-full">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleDigit(num.toString())}
                  disabled={pinVerified}
                  className={`h-12 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground text-lg font-semibold transition-colors ${pinVerified ? "opacity-40 cursor-not-allowed" : "hover:bg-neutral-700 active:bg-neutral-600"}`}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleBackspace}
                disabled={pinVerified}
                className={`h-12 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground transition-colors flex items-center justify-center ${pinVerified ? "opacity-40 cursor-not-allowed" : "hover:bg-neutral-700 active:bg-neutral-600"}`}
              >
                <Delete className="w-4.5 h-4.5" />
              </button>
              <button
                type="button"
                onClick={() => handleDigit("0")}
                disabled={pinVerified}
                className={`h-12 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground text-lg font-semibold transition-colors ${pinVerified ? "opacity-40 cursor-not-allowed" : "hover:bg-neutral-700 active:bg-neutral-600"}`}
              >
                0
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={pinVerified}
                className={`h-12 rounded-xl bg-neutral-800 border border-neutral-700 text-base font-bold text-destructive transition-colors ${pinVerified ? "opacity-40 cursor-not-allowed" : "hover:bg-neutral-700 active:bg-neutral-600"}`}
              >
                C
              </button>
            </div>

            {pinVerified && (
              <p className="text-emerald-400 text-xs text-center font-medium mt-2">
                PIN verified successfully
              </p>
            )}
          </div>
        </div>

        {/* Inline Warning */}
        <div className="mt-5 flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-amber-400/90 text-xs leading-relaxed">
            Switching stores will clear all data on this device and log out the current user.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-medium text-sm bg-neutral-800 border border-neutral-700 text-foreground hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSwitch}
            disabled={!canSwitch}
            className={`flex-1 py-3 rounded-xl font-medium text-sm transition-colors ${
              canSwitch
                ? "bg-red-600 text-white hover:bg-red-700 active:bg-red-800"
                : "bg-neutral-800 text-neutral-600 border border-neutral-700 cursor-not-allowed"
            }`}
          >
            Switch Store
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerSupportPinModal;
