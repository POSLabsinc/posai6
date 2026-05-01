import { useEffect, useState } from "react";
import { ChevronLeft, Check } from "lucide-react";
import {
  PaymentPricingMode,
  getPaymentPricingMode,
  setPaymentPricingMode,
  subscribePaymentPricingMode,
} from "@/lib/paymentPricingMode";

interface PaymentPricingContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

interface ModeOption {
  id: PaymentPricingMode;
  title: string;
  description: string;
}

const modeOptions: ModeOption[] = [
  {
    id: "cash-discount",
    title: "Cash Discount Only",
    description: "Apply a 3% discount only for cash payments. Card payments use normal pricing.",
  },
  {
    id: "card-surcharge",
    title: "Card Surcharge Only",
    description: "Apply a 3% surcharge only for card payments. Cash payments use normal pricing.",
  },
  {
    id: "show-both",
    title: "Show Both Prices",
    description: "Display both Total (Cash) and Total (Card). The amount due updates based on the selected payment method.",
  },
];

const PaymentPricingContent = ({ showHeader = true, onBack }: PaymentPricingContentProps) => {
  const [mode, setMode] = useState<PaymentPricingMode>(() => getPaymentPricingMode());

  useEffect(() => {
    return subscribePaymentPricingMode(setMode);
  }, []);

  const handleSelect = (next: PaymentPricingMode) => {
    setMode(next);
    setPaymentPricingMode(next);
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {showHeader && (
        <div className="flex items-center justify-between pt-0 pb-2 relative overflow-visible px-4">
          {onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          )}
          <h1 className="text-xl font-semibold text-foreground absolute left-1/2 -translate-x-1/2">
            Payment Pricing
          </h1>
        </div>
      )}

      <div className="pt-0 px-4 md:px-6 pb-28">
        <div className="mb-4 px-1">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Choose how cash and card pricing are presented at checkout. Only one mode can be active at a time, and changes apply instantly to the payment screen.
          </p>
        </div>

        <h2 className="text-base text-neutral-500 font-medium px-1 mb-2">Pricing Mode</h2>

        <div className="space-y-3">
          {modeOptions.map((option) => {
            const isActive = mode === option.id;
            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className="w-full text-left bg-neutral-800/60 rounded-2xl p-4 transition-all active:opacity-80"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      isActive ? "bg-primary" : "border border-neutral-600"
                    }`}
                  >
                    {isActive && <Check className="w-4 h-4 text-primary-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-foreground text-base font-medium">{option.title}</div>
                    <p className="text-sm text-neutral-400 mt-1 leading-relaxed">
                      {option.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PaymentPricingContent;
