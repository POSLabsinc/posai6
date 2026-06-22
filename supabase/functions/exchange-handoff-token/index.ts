// Exchange a short-lived signed handoff token (minted by the POSAI Auth
// project) for a Lovable Cloud session in this POS project.
//
// Request:  { token: string }
// Response: { access_token, refresh_token, user }
//
// Required secrets:
//   POSAI_HANDOFF_SECRET     - shared HMAC secret (also set in auth project)
//   SUPABASE_URL             - auto-provided
//   SUPABASE_SERVICE_ROLE_KEY - auto-provided
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const enc = new TextEncoder();

function b64urlDecode(s: string): Uint8Array {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

async function verifyJwtHS256(token: string, secret: string) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Malformed token");
  const [h, p, s] = parts;
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    b64urlDecode(s),
    enc.encode(`${h}.${p}`),
  );
  if (!ok) throw new Error("Bad signature");
  const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(p))) as {
    sub?: string;
    email?: string;
    exp?: number;
    aud?: string;
  };
  if (!payload.exp || payload.exp * 1000 < Date.now()) {
    throw new Error("Token expired");
  }
  if (payload.aud && payload.aud !== "posai-pos") {
    throw new Error("Wrong audience");
  }
  if (!payload.email) throw new Error("Token missing email");
  return payload;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const secret = Deno.env.get("POSAI_HANDOFF_SECRET");
    if (!secret) throw new Error("POSAI_HANDOFF_SECRET not configured");

    const { token } = await req.json();
    if (typeof token !== "string" || !token) throw new Error("token required");

    const payload = await verifyJwtHS256(token, secret);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Ensure a local user exists for this email; then mint a session via
    // a magic-link generation flow and exchange the action_link's tokens.
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: payload.email!,
    });
    if (linkErr) throw linkErr;

    // generateLink returns an action_link containing access/refresh tokens in
    // the hash fragment. Parse them out.
    const action = link?.properties?.action_link;
    if (!action) throw new Error("Could not generate session");
    const url = new URL(action);
    const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");

    if (!access_token || !refresh_token) {
      // Fallback: caller must follow the action_link directly
      return new Response(
        JSON.stringify({ action_link: action }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ access_token, refresh_token, email: payload.email }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(
      JSON.stringify({ error: true, message: msg }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
