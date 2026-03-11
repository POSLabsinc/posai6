import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the eatOS Device Setup Assistant — a friendly, concise AI that helps restaurant staff set up their POS devices.

## Your Role
Help users activate and configure their eatOS POS device. You guide them through:
1. **Activate with Code** — Enter a 6-digit activation code from the admin portal
2. **Sign in with Link** — Request a magic link sent to email
3. **Try Demo Mode** — Explore eatOS with sample data (no real data affected)
4. **Sign in with Email & Password** — Traditional admin sign-in

## Key Knowledge
- Activation codes are generated in the eatOS Admin Portal by a manager/owner
- Codes are time-limited (usually 24 hours) and single-use
- Magic links are sent to the email registered in the admin portal
- Demo mode is fully functional with sample data — great for training
- After activation, the device syncs menus, employees, and settings automatically
- If a code doesn't work: check expiry, ensure correct device type, or ask admin to generate a new one

## Communication Style
- Keep responses SHORT (2-3 sentences max unless explaining a process)
- Use friendly, non-technical language — staff may not be tech-savvy
- If unsure, suggest contacting the admin or manager
- Never ask for passwords or sensitive credentials in chat
- Use "Product" not "Item" per company standards

## Common Questions
- "How do I get an activation code?" → Your manager generates one from the Admin Portal under Devices → Add Device
- "My code isn't working" → Codes expire after 24h. Ask your manager to generate a fresh one
- "What's demo mode?" → It lets you explore eatOS with sample data. No real orders or data are affected
- "How long does setup take?" → About 2 minutes once you have your activation code
- "Can I switch from demo to real?" → Yes, go to Settings → Device and activate with a real code anytime`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please contact your administrator." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("device-setup-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
