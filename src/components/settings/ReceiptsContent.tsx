import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ReceiptsContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const RECEIPT_TYPES = [
  { id: "kot", label: "KOT", value: "Classic Thermal" },
  { id: "payment-receipt", label: "Payment Receipt", value: "Classic Thermal" },
  { id: "receipt", label: "Receipt", value: "Classic Thermal" },
  { id: "email-receipt", label: "Email Receipt", value: "Default" },
  { id: "sms-receipt", label: "SMS Receipt", value: "Default" },
];

const ReceiptsContent = ({ showHeader = true, onBack }: ReceiptsContentProps) => {
  const navigate = useNavigate();

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
          <h1 className="text-xl font-semibold text-foreground absolute left-1/2 -translate-x-1/2">Receipts</h1>
        </div>
      )}

      <div className="pt-0 px-4 md:px-6 pb-28">
        <div className="mb-4 px-1">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Choose a design for each receipt type. Printed receipts remain on Classic Thermal for now; email and SMS preferences are saved and will apply once available.
          </p>
        </div>

        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          {RECEIPT_TYPES.map((rt, index) => (
            <div key={rt.id}>
              <button
                onClick={() => navigate(`/settings/payments/receipts/${rt.id}`)}
                className="w-full flex items-center justify-between py-3.5 px-4 active:opacity-70 transition-opacity"
              >
                <span className="text-foreground text-base font-medium">{rt.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-500">{rt.value}</span>
                  <ChevronRight className="w-5 h-5 text-neutral-500" />
                </div>
              </button>
              {index < RECEIPT_TYPES.length - 1 && (
                <div className="h-px bg-neutral-700/50 mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReceiptsContent;
