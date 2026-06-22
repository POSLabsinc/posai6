import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * /handoff route
 *
 * Receives a short-lived signed token from the separate POSAI Auth project,
 * exchanges it via the `exchange-handoff-token` edge function for a Lovable
 * Cloud session, then forwards the user into the POS app.
 *
 * Expected query params:
 *   token      - JWT minted by the auth project (HS256, 60s TTL)
 *   return_to  - optional path inside POS to navigate to after exchange
 */
export default function Handoff() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"working" | "error">("working");
  const [message, setMessage] = useState("Signing you in...");

  useEffect(() => {
    const token = params.get("token");
    const returnTo = params.get("return_to") || "/";

    if (!token) {
      setStatus("error");
      setMessage("Missing handoff token.");
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          "exchange-handoff-token",
          { body: { token } },
        );

        if (error) throw error;
        if (!data?.access_token || !data?.refresh_token) {
          throw new Error("Invalid handoff response.");
        }

        const { error: setErr } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
        if (setErr) throw setErr;

        navigate(returnTo, { replace: true });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setStatus("error");
        setMessage(`Sign-in failed: ${msg}`);
      }
    })();
  }, [params, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-3">
        <div
          className={
            status === "error"
              ? "text-destructive font-medium"
              : "text-muted-foreground"
          }
        >
          {message}
        </div>
      </div>
    </div>
  );
}
