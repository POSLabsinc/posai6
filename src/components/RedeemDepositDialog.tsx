import { useEffect, useMemo, useRef, useState } from "react";
import { X, QrCode, Search, Zap, User, Check } from "lucide-react";
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

const normalizeDepositCode = (value: unknown) =>
  String(value || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

const getTransferInfo = (deposit: UnifiedTicketOrder) => {
  const raw = (deposit as any)?.transferInfo;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return raw || {};
};

const isExpired = (expires: string | undefined): boolean => {
  if (!expires) return false;
  const d = new Date(expires);
  if (isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
};

type Stage = "input" | "otp" | "success";

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
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_OTP_ATTEMPTS);
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const depositList = useMemo(() => {
    return deposits
      .filter((d) => {
        const ti = getTransferInfo(d);
        const vn = ti.virtualNumber || ti.virtual_number;
        const isDeposit = (d as any)?.orderType === "Deposit" || String(ti.type || "").toLowerCase() === "deposit";
        return vn && isDeposit;
      })
      .map((d) => {
        const ti = getTransferInfo(d);
        const vn = normalizeDepositCode(ti.virtualNumber || ti.virtual_number);
        return {
          deposit: d,
          code: vn,
          phone: String(ti.phone || ti.guestPhone || ""),
          email: String(ti.email || ti.guestEmail || ""),
          expires: String(ti.expires || ""),
          amount: Number((d as any).paidAmount ?? (d as any).total ?? 0),
          createdAt: String((d as any)?.orderTime || ti.createdAt || ""),
          expired: isExpired(String(ti.expires || "")),
        };
      });
  }, [deposits]);

  const depositIndex = useMemo(() => {
    const map = new Map<string, UnifiedTicketOrder>();
    depositList.forEach((d) => map.set(d.code, d.deposit));
    return map;
  }, [depositList]);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length < 3) return [];
    return depositList.filter(
      (d) => d.phone.toLowerCase().includes(q) || d.email.toLowerCase().includes(q),
    ).slice(0, 6);
  }, [search, depositList]);

  useEffect(() => {
    if (!open) {
      setCode(""); setValidated(null); setError(null);
      setStage("input"); setOtp(["", "", "", "", "", ""]);
      setAttemptsLeft(MAX_OTP_ATTEMPTS); setOtpError(null); setResendIn(RESEND_SECONDS);
      setSearch(""); setShowResults(false);
    }
  }, [open]);

  // Auto-verify on full code entry
  useEffect(() => {
    if (code.length === CODE_LENGTH) {
      const found = depositIndex.get(code);
      if (found) {
        setValidated(found);
        setError(null);
        const ti = getTransferInfo(found);
        if (ti.twoFAEnabled) {
          // Auto-send OTP and move to OTP stage
          setTimeout(() => {
            setStage("otp");
            setOtp(["", "", "", "", "", ""]);
            setAttemptsLeft(MAX_OTP_ATTEMPTS);
            setOtpError(null);
            setResendIn(RESEND_SECONDS);
          }, 400);
        } else {
          // Apply directly
          setTimeout(() => {
            onApply?.(found);
            onOpenChange(false);
          }, 500);
        }
      } else {
        setValidated(null);
        setError("Invalid deposit code");
      }
    } else if (code.length === 0) {
      setValidated(null); setError(null);
    } else {
      setValidated(null); setError(null);
    }
  }, [code, depositIndex]);

  // Resend countdown
  useEffect(() => {
    if (stage !== "otp" || resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [stage, resendIn]);

  // Auto-focus first OTP box
  useEffect(() => {
    if (stage === "otp") setTimeout(() => otpRefs.current[0]?.focus(), 50);
  }, [stage]);

  // Auto-verify OTP when all 6 entered
  useEffect(() => {
    if (stage !== "otp") return;
    if (otp.every((c) => c !== "")) {
      const entered = otp.join("");
      // Demo: accept any 6-digit code as valid
      if (entered.length === 6) {
        setTimeout(() => {
          if (validated) onApply?.(validated);
          onOpenChange(false);
        }, 300);
      } else {
        setOtp(["", "", "", "", "", ""]);
        setAttemptsLeft((a) => Math.max(0, a - 1));
        setOtpError("Incorrect code");
        otpRefs.current[0]?.focus();
      }
    }
  }, [otp, stage, validated, onApply, onOpenChange]);

  if (!open) return null;

  const handleChange = (val: string) => {
    setCode(normalizeDepositCode(val).slice(0, CODE_LENGTH));
  };

  const ti = validated ? getTransferInfo(validated) : {};
  const twoFA = !!ti.twoFAEnabled;
  const expires = ti.expires || "—";
  const vnDisplay = String(ti.virtualNumber || ti.virtual_number || "—");
  const balance = validated ? Number((validated as any).paidAmount ?? (validated as any).total ?? 0) : 0;
  const status = (validated as any)?.status || "—";
  const refundAllowed = ti.refundAllowed ?? ti.allowRefund;
  const createdBy = ti.createdBy || (validated as any)?.serverName || "—";
  const orderNumber = (validated as any)?.orderNumber;
  const orderTime = (validated as any)?.orderTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  const maskContact = (val: string) => {
    if (!val) return "***";
    if (val.includes("@")) {
      const [u, d] = val.split("@");
      return `${u.slice(0, 1)}***@${d}`;
    }
    return val.length > 4 ? `***-***-${val.slice(-4)}` : val;
  };
  const otpChannel = ti.phone || ti.guestPhone ? "SMS" : "Email";
  const otpTarget = ti.phone || ti.guestPhone || ti.email || ti.guestEmail || "";

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

  const handleResendTimer = () => {
    if (resendIn === 0) setResendIn(RESEND_SECONDS);
  };

  const handlePickResult = (depositCode: string) => {
    setShowResults(false);
    setSearch("");
    setCode(depositCode);
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
          <div className="flex-1 px-6 py-6 flex flex-col items-stretch gap-4 overflow-y-auto">
            {stage === "input" && (
              <>
                {/* Search bar */}
                <div className="relative">
                  <label className="text-neutral-400 text-xs uppercase tracking-wide block mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setShowResults(true); }}
                      onFocus={() => setShowResults(true)}
                      placeholder="Search by mobile or email"
                      className="w-full h-11 rounded-lg bg-neutral-800 border border-neutral-600 pl-10 pr-3 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-neutral-400"
                    />
                  </div>

                  {showResults && search.trim().length >= 3 && (
                    <div className="absolute left-0 right-0 top-full mt-2 z-20 bg-neutral-800 border border-neutral-600 rounded-lg shadow-xl max-h-72 overflow-y-auto">
                      {searchResults.length === 0 ? (
                        <div className="px-3 py-3 text-neutral-500 text-xs">No matching deposits</div>
                      ) : (
                        searchResults.map((r) => (
                          <button
                            key={r.code}
                            disabled={r.expired}
                            onClick={() => !r.expired && handlePickResult(r.code)}
                            className={`w-full text-left px-3 py-2.5 border-b border-neutral-700/60 last:border-b-0 transition-colors ${
                              r.expired ? "opacity-40 cursor-not-allowed" : "hover:bg-neutral-700"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-amber-400 text-sm font-semibold tracking-wider">{r.code}</span>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase ${
                                    r.expired
                                      ? "bg-neutral-700 text-neutral-400"
                                      : "bg-emerald-500/20 text-emerald-400"
                                  }`}
                                >
                                  {r.expired ? "Expired" : "Active"}
                                </span>
                                <span className="text-white text-xs font-semibold">${r.amount.toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-[11px] text-neutral-400">
                              <span className="truncate">{r.phone || r.email || "—"}</span>
                              <span className="ml-2 shrink-0">{r.createdAt}</span>
                            </div>
                            {r.phone && r.email && (
                              <div className="text-[11px] text-neutral-500 truncate">{r.email}</div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Deposit code input */}
                <div>
                  <label className="text-neutral-400 text-xs uppercase tracking-wide block mb-2">Deposit Code</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="text"
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
                  {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
                  {validated && !error && (
                    <p className="text-emerald-400 text-xs mt-2 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Verified
                    </p>
                  )}
                </div>
              </>
            )}

            {stage === "otp" && (
              <div className="flex flex-col items-center text-center gap-4 pt-4">
                <h2 className="text-white text-2xl font-semibold">Enter OTP</h2>
                <p className="text-neutral-400 text-sm">
                  OTP sent via {otpChannel} to <span className="text-white">{maskContact(otpTarget)}</span>
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
                    className="text-emerald-400 hover:text-emerald-300 text-xs font-medium"
                    onClick={handleResendTimer}
                  >
                    Resend via Email
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
          </div>
        </div>

        {/* Right Panel - Deposit Details */}
        <div
          className="w-[300px] border-l border-neutral-700 flex flex-col rounded-xl"
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
              <span className="text-green-500 font-bold text-lg">${balance.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex-1 px-4 py-4 flex flex-col gap-1 overflow-y-auto">
            <Row label="Deposit Code" value={vnDisplay} valueClassName="text-amber-400 font-semibold tracking-widest" />
            <Row label="Status" value={String(status)} valueClassName="text-white" />
            <Row label="2FA" value={validated ? (twoFA ? "Enabled" : "Disabled") : "—"} valueClassName="text-white" />
            <Row label="Expires" value={String(expires)} valueClassName="text-white" />
            <Row
              label="Refund Allowed"
              value={validated ? (refundAllowed ? "Yes" : "No") : "—"}
              valueClassName="text-white"
            />
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
