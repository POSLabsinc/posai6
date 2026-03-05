import { useState, useEffect } from "react";
import { X, Delete, MapPin, Check, Monitor } from "lucide-react";
import type { Store } from "@/hooks/useDeviceStore";

interface CustomerSupportPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (selectedStore: Store) => void;
  stores: Store[];
  currentStore: Store | null;
  deviceName?: string;
}

const PIN_LENGTH = 4;

const CustomerSupportPinModal = ({
  isOpen,
  onClose,
  onSuccess,
  stores,
  currentStore,
  deviceName = "POS-Terminal-03",
}: CustomerSupportPinModalProps) => {
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [pinVerified, setPinVerified] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPin("");
      setPinError(false);
      setPinVerified(false);
      setSelectedStoreId(currentStore?.id ?? null);
    }
  }, [isOpen, currentStore]);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length >= PIN_LENGTH) return;
    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === PIN_LENGTH) {
      setTimeout(() => {
        setPinVerified(true);
        setPinError(false);
      }, 200);
    }
  };

  const handleBackspace = () => setPin((prev) => prev.slice(0, -1));
  const handleClear = () => {
    setPin("");
    setPinError(false);
  };

  const selectedStore = stores.find((s) => s.id === selectedStoreId);
  const canContinue =
    pinVerified &&
    selectedStoreId &&
    selectedStoreId !== currentStore?.id;

  const handleContinue = () => {
    if (canContinue && selectedStore) {
      onSuccess(selectedStore);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-3xl w-full max-w-3xl p-6 pb-8">
        {/* Header */}
        <div className="relative flex items-center justify-center mb-5">
          <h3 className="text-foreground font-bold text-lg">
            Customer Support Authorization
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-0 w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Device Info - Horizontal */}
        <div className="bg-neutral-800/60 rounded-xl p-4 mb-5 flex items-center gap-6">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Monitor className="w-4 h-4 text-neutral-500 shrink-0" />
            <span className="text-neutral-500 text-sm">Device Name</span>
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
          {/* Left: PIN */}
          <div className="flex-1 min-w-0">
            {/* PIN Section */}
            <div>
              <p className="text-neutral-400 text-xs font-medium tracking-wider mb-3 px-1">
                ENTER CUSTOMER SUPPORT PIN
              </p>
              <div
                className={`flex justify-start gap-2.5 mb-4 ${pinError ? "animate-shake" : ""}`}
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
                    onClick={() => !pinVerified && handleDigit(num.toString())}
                    disabled={pinVerified}
                    className={`h-12 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground text-lg font-semibold transition-colors ${pinVerified ? "opacity-40 cursor-not-allowed" : "hover:bg-neutral-700 active:bg-neutral-600"}`}
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => !pinVerified && handleBackspace()}
                  disabled={pinVerified}
                  className={`h-12 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground transition-colors flex items-center justify-center ${pinVerified ? "opacity-40 cursor-not-allowed" : "hover:bg-neutral-700 active:bg-neutral-600"}`}
                >
                  <Delete className="w-4.5 h-4.5" />
                </button>
                <button
                  type="button"
                  onClick={() => !pinVerified && handleDigit("0")}
                  disabled={pinVerified}
                  className={`h-12 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground text-lg font-semibold transition-colors ${pinVerified ? "opacity-40 cursor-not-allowed" : "hover:bg-neutral-700 active:bg-neutral-600"}`}
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => !pinVerified && handleClear()}
                  disabled={pinVerified}
                  className={`h-12 rounded-xl bg-neutral-800 border border-neutral-700 text-base font-bold text-destructive transition-colors ${pinVerified ? "opacity-40 cursor-not-allowed" : "hover:bg-neutral-700 active:bg-neutral-600"}`}
                >
                  C
                </button>
              </div>

              {pinVerified && (
                <p className="text-emerald-400 text-xs text-center font-medium">
                  PIN verified successfully
                </p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px bg-neutral-700/50 self-stretch" />

          {/* Right: Store Selection */}
          <div className="flex-1 min-w-0 flex flex-col">
            <p className="text-neutral-400 text-xs font-medium tracking-wider mb-3 px-1">
              AVAILABLE STORES
            </p>
            <div className="space-y-2 flex-1 overflow-y-auto scrollbar-hide max-h-[400px]">
              {[...stores].sort((a, b) => {
                if (a.id === currentStore?.id) return -1;
                if (b.id === currentStore?.id) return 1;
                return 0;
              }).map((store) => {
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
        </div>

        {/* Button */}
        <div className="mt-6">
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className={`w-full py-3 rounded-xl font-medium transition-colors text-sm ${
              canContinue
                ? "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80"
                : "bg-neutral-800 text-neutral-600 border border-neutral-700 cursor-not-allowed"
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerSupportPinModal;
