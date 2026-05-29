import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, X, QrCode, Mail, MessageSquare, Zap, User, Check } from "lucide-react";
import type { UnifiedTicketOrder } from "@/hooks/use-ticket-orders";

interface RedeemDepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deposits: UnifiedTicketOrder[];
  onApply?: (deposit: UnifiedTicketOrder) => void;
}

const CODE_LENGTH = 8;
const MAX_OTP_ATTEMPTS = 3;
const RESEND_SECONDS = 45;

const normalizeVirtualNumber = (value: unknown) =>
  String(value || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

const getTransferInfo = (deposit: UnifiedTicketOrder) => {
  const raw = (deposit as any)?.transferInfo;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return raw || {};
};

type Stage = "input" | "otp" | "success";
type Channel = "sms" | "email";

export const RedeemDepositDialog = ({
  open,
  onOpenChange,
  deposits,
  onApply,
}: RedeemDepositDialogProps) => {
  const [code, setCode] = useState("");
  const [validated, setValidated] = useState<UnifiedTicketOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("input");
  const [channel, setChannel] = useState<Channel>("sms");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_OTP_ATTEMPTS);
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const [otpError, setOtpError] = useState<string | null>(null);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const depositIndex = useMemo(() => {
    const map = new Map<string, UnifiedTicketOrder>();
    deposits.forEach((d) => {
      const ti = getTransferInfo(d);
      const vn = ti.virtualNumber || ti.virtual_number;
      const isDeposit = (d as any)?.orderType === "Deposit" || String(ti.type || "").toLowerCase() === "deposit";
      if (vn && isDeposit) map.set(normalizeVirtualNumber(vn), d);
    });
    return map;
  }, [deposits]);

  useEffect(() => {
    if (!open) {
      setCode(""); setValidated(null); setError(null);
      setStage("input"); setOtp(["", "", "", "", "", ""]);
      setAttemptsLeft(MAX_OTP_ATTEMPTS); setOtpError(null); setResendIn(RESEND_SECONDS);
    }
  }, [open]);

  useEffect(() => {
    if (code.length === CODE_LENGTH) {
      const found = depositIndex.get(code);
      if (found) { setValidated(found); setError(null); }
      else { setValidated(null); setError("Invalid virtual number"); }
    } else { setValidated(null); setError(null); }
  }, [code, depositIndex]);

  // Resend countdown
  useEffect(() => {
    if (stage !== "otp") return;
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [stage, resendIn]);

  // Auto-focus first OTP box when entering otp stage
  useEffect(() => {
    if (stage === "otp") setTimeout(() => otpRefs.current[0]?.focus(), 50);
  }, [stage]);

  if (!open) return null;

  const handleChange = (val: string) => {
    setCode(normalizeVirtualNumber(val).slice(0, CODE_LENGTH));
  };

  const ti = validated ? getTransferInfo(validated) : {};
  const twoFA = !!ti.twoFAEnabled;
  const expires = ti.expires || "—";
  const vnDisplay = String(ti.virtualNumber || ti.virtual_number || "—");
  const balance = validated ? Number((validated as any).paidAmount ?? (validated as any).total ?? 0) : 0;
  const status = (validated as any)?.status || "—";
  const createdBy = ti.createdBy || (validated as any)?.serverName || "—";
  const orderNumber = (validated as any)?.orderNumber;
  const orderTime = (validated as any)?.orderTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  const maskedTarget = channel === "sms"
    ? (ti.phone || ti.guestPhone || "***-***-1234")
    : (ti.email || ti.guestEmail || "g***@email.com");
  const resendOtherLabel = channel === "sms" ? "Resend via Email" : "Resend via SMS";

  const startOtp = (ch: Channel) => {
    setChannel(ch); setStage("otp"); setOtp(["", "", "", "", "", ""]);
    setAttemptsLeft(MAX_OTP_ATTEMPTS); setOtpError(null); setResendIn(RESEND_SECONDS);
  };

  const handleOtpInput = (i: number, v: string) => {
    const ch = v.replace(/\D/g, "").slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[i] = ch;
      return next;
    });
    setOtpError(null);
    if (ch && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const handleVerifyOtp = () => {
    const code = otp.join("");
    if (code.length < 6) { setOtpError("Enter all 6 digits"); return; }
    // Accept any 6-digit input as valid (demo). Could be tightened later.
    setStage("success");
  };

  const handleApplyAndClose = () => {
    if (validated) onApply?.(validated);
    onOpenChange(false);
  };

  const switchChannel = () => {
    const next: Channel = channel === "sms" ? "email" : "sms";
    setChannel(next); setOtp(["", "", "", "", "", ""]);
    setAttemptsLeft(MAX_OTP_ATTEMPTS); setOtpError(null); setResendIn(RESEND_SECONDS);
  };

  const handleResendTimer = () => {
    if (resendIn === 0) setResendIn(RESEND_SECONDS);
  };

  const handleBack = () => {
    if (stage === "otp") { setStage("input"); return; }
    if (stage === "success") { onOpenChange(false); return; }
    onOpenChange(false);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="bg-neutral-900 rounded-xl border border-neutral-700 overflow-hidden animate-scale-in transition-all duration-300 flex max-h-[90vh] max-w-[95vw] mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Panel */}
        <div className="flex flex-col bg-neutral-900 overflow-hidden max-h-[90vh] w-[480px]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700">
            <button
              onClick={handleBack}
              className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-300" />
            </button>
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
          <div className="flex-1 px-6 py-8 flex flex-col items-stretch gap-3 overflow-y-auto">
            {stage === "input" && (
              <>
                <label className="text-neutral-400 text-xs uppercase tracking-wide">Virtual Number</label>
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
                {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
              </>
            )}

            {stage === "otp" && (
              <div className="flex flex-col items-center text-center gap-4 pt-4">
                <h2 className="text-white text-2xl font-semibold">Enter OTP</h2>
                <p className="text-neutral-400 text-sm">
                  OTP sent via {channel === "sms" ? "SMS" : "Email"} to <span className="text-white">{maskedTarget}</span>
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleOtpInput(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-12 h-14 rounded-lg bg-neutral-800 border border-neutral-600 text-white text-center text-2xl font-semibold focus:outline-none focus:border-emerald-400"
                    />
                  ))}
                </div>
                <p className="text-neutral-500 text-xs">
                  {attemptsLeft} attempt{attemptsLeft === 1 ? "" : "s"} remaining
                </p>
                {otpError && <p className="text-red-400 text-xs">{otpError}</p>}
                <div className="flex items-center gap-6 mt-1">
                  <button
                    onClick={switchChannel}
                    className="text-emerald-400 hover:text-emerald-300 text-xs font-medium"
                  >
                    {resendOtherLabel}
                  </button>
                  <button
                    onClick={handleResendTimer}
                    disabled={resendIn > 0}
                    className="text-neutral-400 hover:text-neutral-300 text-xs font-medium disabled:opacity-60"
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend"}
                  </button>
                </div>
              </div>
            )}

            {stage === "success" && (
              <div className="flex flex-col items-center text-center gap-5 pt-8">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <Check className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="text-white text-base font-medium px-6">
                  Deposit applied. ${balance.toFixed(2)} credit is now active on this order.
                </p>
              </div>
            )}
          </div>

          {/* Action area */}
          <div className="px-4 py-4 border-t border-neutral-700 bg-neutral-900 min-h-[80px] flex items-center">
            {stage === "input" && validated ? (
              twoFA ? (
                <div className="flex w-full gap-3">
                  <button
                    onClick={() => startOtp("sms")}
                    className="flex-1 h-12 rounded-lg bg-neutral-800 border border-neutral-600 hover:bg-neutral-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Send OTP via SMS
                  </button>
                  <button
                    onClick={() => startOtp("email")}
                    className="flex-1 h-12 rounded-lg bg-neutral-800 border border-neutral-600 hover:bg-neutral-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Send via Email
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleApplyAndClose}
                  className="w-full h-12 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
                >
                  Apply Deposit
                </button>
              )
            ) : stage === "otp" ? (
              <button
                onClick={handleVerifyOtp}
                className="w-full h-12 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
              >
                Verify OTP
              </button>
            ) : stage === "success" ? (
              <button
                onClick={handleApplyAndClose}
                className="w-full h-12 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
              >
                Add Items to Order
              </button>
            ) : (
              <div className="w-full h-12" />
            )}
          </div>
        </div>

        {/* Right Panel - Deposit Details */}
        <div
          className="w-[280px] border-l border-neutral-700 flex flex-col rounded-xl"
          style={{
            background: "#7575754D",
            boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)",
          }}
        >
          <div
            className="p-3 border-b border-neutral-600 rounded-t-xl"
            style={{ background: 'linear-gradient(180deg, #4D4D4D 0%, #616161 100%)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm">Deposit</h3>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-yellow-400" />
                <span className="text-neutral-300 text-xs">{orderTime}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span
                className="text-white text-[10px] font-medium px-2 py-1 rounded"
                style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
              >
                DEPOSIT
              </span>
              {orderNumber && (
                <span
                  className="text-white text-[10px] font-medium px-2 py-1 rounded"
                  style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
                >
                  ORDER #{orderNumber}
                </span>
              )}
              <div className="flex items-center gap-1.5 text-neutral-300">
                <User className="w-3 h-3" />
                <span className="text-xs">{createdBy}</span>
              </div>
            </div>
          </div>

          <div className="mx-3 mt-3 bg-neutral-800 rounded-lg p-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium text-sm">Balance</span>
              <span className="text-green-500 font-bold">${balance.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex-1 px-4 py-4 flex flex-col gap-1 overflow-y-auto">
            <Row label="Virtual Number" value={vnDisplay} valueClassName="text-amber-400 font-semibold tracking-widest" />
            <Row label="Status" value={String(status)} valueClassName="text-white" />
            <Row label="2FA" value={validated ? (twoFA ? "Enabled" : "Disabled") : "—"} valueClassName="text-white" />
            <Row label="Expires" value={String(expires)} valueClassName="text-white" />
          </div>
        </div>
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
  <div className="flex items-center justify-between py-2 border-b border-neutral-700/60 last:border-b-0">
    <span className="text-neutral-400 text-xs uppercase tracking-wide">{label}</span>
    <span className={`text-sm ${valueClassName}`}>{value}</span>
  </div>
);

export default RedeemDepositDialog;
