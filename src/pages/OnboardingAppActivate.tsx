import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Info, AlertCircle, ArrowUpRight } from "lucide-react";
import { useIsLandscape } from "@/hooks/use-landscape";
import MarketingPanel from "@/components/onboarding/MarketingPanel";

const CODE_RE = /^POS-[A-Z0-9]{4}-[A-Z0-9]{2}$/;

type ErrorKind =
  | "not_found"
  | "expired"
  | "used"
  | "plan_limit"
  | "wrong_prefix"
  | "generic"
  | null;

const errorMessage = (kind: ErrorKind, planLimit?: number): string => {
  switch (kind) {
    case "not_found":
      return "Code not found or already used";
    case "expired":
      return "This code has expired. Codes are valid for 24 hours.";
    case "used":
      return "This code has already been used on another device.";
    case "plan_limit":
      return `Your plan only supports ${planLimit ?? 1} devices. Upgrade to add more.`;
    case "wrong_prefix":
      return "This code is for a different device type.";
    case "generic":
      return "Something went wrong. Please try again.";
    default:
      return "";
  }
};

const formatCode = (raw: string): string => {
  // Strip everything not alphanumeric, uppercase
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  // Ensure POS prefix consumed first
  let core = cleaned;
  if (core.startsWith("POS")) core = core.slice(3);
  // Limit to 6 chars after POS
  core = core.slice(0, 6);
  let out = "POS";
  if (core.length > 0) out += "-" + core.slice(0, 4);
  if (core.length > 4) out += "-" + core.slice(4, 6);
  return out;
};

const OnboardingAppActivate = () => {
  const navigate = useNavigate();
  const isLandscape = useIsLandscape();

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorKind, setErrorKind] = useState<ErrorKind>(null);
  const [planLimit, setPlanLimit] = useState<number | undefined>(undefined);

  const isValidFormat = useMemo(() => CODE_RE.test(code), [code]);
  const hasError = errorKind !== null;

  const handleChange = (raw: string) => {
    if (errorKind) {
      setErrorKind(null);
      setPlanLimit(undefined);
    }
    // Detect wrong prefix early: user typed at least 3 letters that don't start with POS
    const upper = raw.toUpperCase();
    const cleaned = upper.replace(/[^A-Z0-9]/g, "");
    if (cleaned.length >= 3 && !cleaned.startsWith("POS")) {
      setCode(formatCode(raw));
      setErrorKind("wrong_prefix");
      return;
    }
    setCode(formatCode(raw));
  };

  const handleSubmit = async () => {
    if (!isValidFormat || submitting) return;
    setSubmitting(true);
    setErrorKind(null);
    try {
      const res = await fetch("/devices/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, app_type: "POS" }),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json().catch(() => ({} as any));
        navigate("/onboarding/app/activate/validating", {
          state: {
            code,
            restaurant_name: data?.restaurant_name,
            device: data?.device,
            device_name: data?.device_name,
          },
        });
        return;
      }

      // Map error
      const data = res ? await res.json().catch(() => ({} as any)) : ({} as any);
      const errCode = (data?.error_code as string) || "";
      if (errCode === "code_expired") setErrorKind("expired");
      else if (errCode === "code_used") setErrorKind("used");
      else if (errCode === "plan_limit") {
        setErrorKind("plan_limit");
        setPlanLimit(data?.plan_device_limit);
      } else if (errCode === "code_not_found") setErrorKind("not_found");
      else setErrorKind("generic");
    } finally {
      setSubmitting(false);
    }
  };

  const backBtn = (
    <button
      onClick={() => navigate("/onboarding/app/signin/success")}
      className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
      aria-label="Back"
    >
      <ChevronLeft className="w-5 h-5 text-foreground" />
    </button>
  );

  const title = (
    <h1 className="text-2xl font-bold text-foreground mt-2">Activate this terminal</h1>
  );
  const subtitle = (
    <p className="text-sm text-foreground/60 mt-2">
      Enter the code from Dashboard, Devices to pair this Point of Sale to your account.
    </p>
  );

  const codeInput = (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="activation-code"
        className="text-[11px] font-semibold tracking-[0.14em] uppercase text-foreground/60 text-center"
      >
        Activation code
      </label>
      <div
        className={`relative flex items-center rounded-2xl border bg-foreground/[0.04] transition-colors ${
          hasError
            ? "border-destructive"
            : "border-foreground/[0.08] focus-within:border-primary"
        }`}
      >
        <input
          id="activation-code"
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          value={code}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          placeholder="POS-____-__"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "16px",
            letterSpacing: "2px",
          }}
          className={`w-full bg-transparent outline-none text-center placeholder:text-foreground/40 px-4 py-3 min-h-[44px] ${
            hasError ? "text-destructive" : "text-foreground"
          }`}
        />
      </div>
      {hasError ? (
        <p className="text-xs text-destructive mt-0.5 text-center">
          {errorMessage(errorKind, planLimit)}
        </p>
      ) : null}
      <p className="text-[11px] text-foreground/50 mt-1 text-center">
        Format: POS-XXXX-XX
      </p>
    </div>
  );

  const infoBanner = hasError ? (
    <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-3">
      <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
      <p className="text-xs text-destructive leading-relaxed">
        {errorMessage(errorKind, planLimit)}
      </p>
    </div>
  ) : (
    <div className="flex items-start gap-2 rounded-2xl border border-primary/30 bg-primary/10 p-3">
      <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <p className="text-xs text-foreground/80 leading-relaxed">
        Open <a href="https://www.eatos.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">eatos.com/dashboard</a> on another device, go to Devices, and tap Generate code.
      </p>
    </div>
  );

  const helpLink = (
    <button
      type="button"
      onClick={() => navigate("/onboarding/app/activate/help")}
      className="inline-flex items-center gap-1 text-xs font-semibold text-primary active:opacity-70 transition-opacity mx-auto"
    >
      {hasError ? "Generate a new code" : "Where do I find my code?"}
      <ArrowUpRight className="w-3.5 h-3.5" />
    </button>
  );

  const ctaButton = (
    <button
      onClick={handleSubmit}
      disabled={!isValidFormat || submitting}
      className="w-full min-h-[44px] py-3 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground active:opacity-80 transition-opacity disabled:opacity-40 disabled:pointer-events-none"
    >
      {submitting ? "Please wait…" : hasError ? "Try again" : "Activate"}
    </button>
  );

  if (isLandscape) {
    return (
      <div className="fixed inset-0 login-bg overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30 pointer-events-none" />
        <div
          className="relative z-10 flex h-full w-full"
          style={{
            paddingLeft: "env(safe-area-inset-left)",
            paddingRight: "env(safe-area-inset-right)",
          }}
        >
          <div
            className="flex flex-col border-r border-foreground/[0.08]"
            style={{ width: "45%" }}
          >
            <MarketingPanel
              eyebrow="Activate"
              caption="Enter your device code to pair this terminal with your Point of Sale account."
            />
          </div>
          <div
            className="flex flex-col px-6 py-6 flex-1 min-h-0"
            style={{ width: "55%" }}
          >
            <div>{backBtn}</div>
            <div className="mt-6">
              {title}
              {subtitle}
            </div>
            <div className="flex-1 overflow-y-auto mt-6 flex flex-col gap-4 pb-2">
              {codeInput}
              {infoBanner}
              <div className="flex justify-center">{helpLink}</div>
            </div>
            <div
              className="pt-3"
              style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
            >
              {ctaButton}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 login-bg flex flex-col overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-30 pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full w-full max-w-md mx-auto px-6 pt-6">
        <div className="mb-5">{backBtn}</div>
        {title}
        {subtitle}
        <div className="flex-1 overflow-y-auto mt-6 flex flex-col gap-4 pb-4">
          {codeInput}
          {infoBanner}
        </div>
        <div
          className="pt-2 pb-4 flex flex-col gap-3"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          {ctaButton}
          <div className="flex justify-center">{helpLink}</div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingAppActivate;
