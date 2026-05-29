import { useEffect, useMemo, useState } from "react";
import { X, QrCode, Mail, MessageSquare } from "lucide-react";
import type { UnifiedTicketOrder } from "@/hooks/use-ticket-orders";

interface RedeemDepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deposits: UnifiedTicketOrder[];
  onApply?: (deposit: UnifiedTicketOrder) => void;
}

const CODE_LENGTH = 8;

export const RedeemDepositDialog = ({
  open,
  onOpenChange,
  deposits,
  onApply,
}: RedeemDepositDialogProps) => {
  const [code, setCode] = useState("");
  const [validated, setValidated] = useState<UnifiedTicketOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Index deposits by normalized virtualNumber (uppercase, no dashes) for lookup
  const depositIndex = useMemo(() => {
    const map = new Map<string, UnifiedTicketOrder>();
    deposits.forEach((d) => {
      const vn = d?.transferInfo?.virtualNumber;
      if (vn && d?.transferInfo?.type === "deposit") {
        const key = String(vn).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
        map.set(key, d);
      }
    });
    return map;
  }, [deposits]);

  useEffect(() => {
    if (!open) {
      setCode("");
      setValidated(null);
      setError(null);
    }
  }, [open]);

  // Auto-validate when code reaches CODE_LENGTH
  useEffect(() => {
    if (code.length === CODE_LENGTH) {
      const found = depositIndex.get(code);
      if (found) {
        setValidated(found);
        setError(null);
      } else {
        setValidated(null);
        setError("Invalid virtual number");
      }
    } else {
      setValidated(null);
      setError(null);
    }
  }, [code, depositIndex]);

  if (!open) return null;

  const handleChange = (val: string) => {
    const cleaned = val.replace(/[^a-zA-Z0-9]/g, "").slice(0, CODE_LENGTH).toUpperCase();
    setCode(cleaned);
  };

  const twoFA = !!validated?.transferInfo?.twoFAEnabled;
  const expires = validated?.transferInfo?.expires || "—";
  const balance = validated
    ? Number(validated.paidAmount ?? validated.total ?? 0)
    : 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <div
        className={`bg-neutral-900 rounded-xl border border-neutral-700 overflow-hidden animate-scale-in transition-all duration-300 flex max-h-[90vh] mx-4`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left panel */}
        <div className="flex flex-col bg-neutral-900 w-[480px] max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700">
            <div className="w-8 h-8" />
            <span className="text-white text-base font-medium">Redeem Deposit</span>
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-neutral-400" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 px-6 py-8 flex flex-col items-stretch gap-3">
            <label className="text-neutral-400 text-xs uppercase tracking-wide">
              Virtual Number
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="text"
                autoFocus
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                value={code.length > 4 ? `${code.slice(0, 4)}-${code.slice(4)}` : code}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="XXXX-XXXX"
                className="w-full h-14 rounded-lg bg-neutral-800 border border-neutral-600 px-4 pr-12 text-white text-lg tracking-[0.2em] placeholder:text-neutral-500 placeholder:tracking-[0.2em] focus:outline-none focus:border-neutral-400"
              />
              <button
                type="button"
                aria-label="Scan QR"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md hover:bg-neutral-700 flex items-center justify-center transition-colors"
              >
                <QrCode className="w-5 h-5 text-neutral-300" />
              </button>
            </div>
            {error && (
              <p className="text-red-400 text-xs mt-1">{error}</p>
            )}
          </div>

          {/* Charge button area */}
          <div className="px-4 py-4 border-t border-neutral-700 bg-neutral-900 min-h-[80px] flex items-center">
            {validated ? (
              twoFA ? (
                <div className="flex w-full gap-3">
                  <button
                    onClick={() => {/* send sms */}}
                    className="flex-1 h-12 rounded-lg bg-neutral-800 border border-neutral-600 hover:bg-neutral-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Send OTP via SMS
                  </button>
                  <button
                    onClick={() => {/* send email */}}
                    className="flex-1 h-12 rounded-lg bg-neutral-800 border border-neutral-600 hover:bg-neutral-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Send via Email
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onApply?.(validated);
                    onOpenChange(false);
                  }}
                  className="w-full h-12 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
                >
                  Apply Deposit
                </button>
              )
            ) : (
              <div className="w-full h-12" />
            )}
          </div>
        </div>

        {/* Right panel (revealed after validation) */}
        {validated && (
          <div className="flex flex-col bg-neutral-900 border-l border-neutral-700 w-[320px] max-h-[90vh] animate-fade-in">
            <div className="px-4 py-3 border-b border-neutral-700">
              <span className="text-white text-base font-medium">Deposit Details</span>
            </div>
            <div className="flex-1 px-4 py-4 flex flex-col gap-3 overflow-y-auto">
              <Row label="Virtual Number" value={String(validated.transferInfo?.virtualNumber || "")} valueClassName="text-amber-400 font-semibold tracking-widest" />
              <Row label="Balance" value={`$${balance.toFixed(2)}`} valueClassName="text-green-500 font-semibold" />
              <Row label="Status" value={validated.status || "PAID"} valueClassName="text-white" />
              <Row label="2FA" value={twoFA ? "Enabled" : "Disabled"} valueClassName="text-white" />
              <Row label="Expires" value={String(expires)} valueClassName="text-white" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Row = ({
  label,
  value,
  valueClassName = "text-white",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) => (
  <div className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-b-0">
    <span className="text-neutral-400 text-xs uppercase tracking-wide">{label}</span>
    <span className={`text-sm ${valueClassName}`}>{value}</span>
  </div>
);

export default RedeemDepositDialog;
