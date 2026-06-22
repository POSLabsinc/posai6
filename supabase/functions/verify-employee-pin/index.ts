import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Require an Authorization or apikey header (blocks fully anonymous direct calls
  // from clients that don't ship the Supabase publishable key).
  const auth = req.headers.get("Authorization") || req.headers.get("apikey");
  if (!auth) return json({ error: "Unauthorized" }, 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const action = (body as any)?.action;
  const pin = (body as any)?.pin;
  const employeeId = (body as any)?.employeeId;
  const newPin = (body as any)?.newPin;

  if (action !== "verify" && action !== "update") {
    return json({ error: "Invalid action" }, 400);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "Server misconfigured" }, 500);
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  if (action === "verify") {
    if (typeof pin !== "string" || !/^\d{4,8}$/.test(pin)) {
      return json({ error: "Invalid pin" }, 400);
    }

    const { data, error } = await supabase
      .from("employees")
      .select(
        "id, full_name, role, phone, email, avatar_url, hourly_rate, assigned_job_types, revenue_center"
      )
      .eq("pin", pin)
      .eq("is_archived", false)
      .limit(1);

    if (error) {
      console.error("verify-employee-pin select error:", error);
      return json({ error: "Lookup failed" }, 500);
    }

    if (!data || data.length === 0) return json({ employee: null });
    return json({ employee: data[0] });
  }

  // action === "update"
  if (typeof employeeId !== "string" || employeeId.length === 0) {
    return json({ error: "Invalid employeeId" }, 400);
  }
  if (typeof newPin !== "string" || !/^\d{4,8}$/.test(newPin)) {
    return json({ error: "Invalid pin" }, 400);
  }

  const { error } = await supabase
    .from("employees")
    .update({ pin: newPin })
    .eq("id", employeeId);

  if (error) {
    console.error("verify-employee-pin update error:", error);
    return json({ error: "Update failed" }, 500);
  }
  return json({ success: true });
});
