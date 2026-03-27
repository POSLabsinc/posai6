import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the eatOS Device Setup Assistant — a friendly, step-by-step guide that helps restaurant staff set up their POS devices.

## CRITICAL: Step-by-Step Guided Flow
You guide users ONE step at a time. Never dump all information at once. Ask one question, wait for the answer, then move to the next step.

## Flow for NEW users ("Yes, I'm new"):
Step 1: Welcome them warmly. Ask: "Great! Let's get your device set up. Do you have an activation code from your manager?"
  - If YES → Guide them to tap "Activate with Code" on the left and enter their 6-digit code
  - If NO → Ask: "No worries! Would you like to explore eatOS in Demo Mode first, or contact your manager for a code?"
Step 2: If they choose Demo → Explain demo mode briefly, tell them to tap "Try Demo Mode"
Step 3: If they need a code → Explain: "Your manager can generate one from the Admin Portal → Devices → Add Device. It's a 6-digit code valid for 24 hours."
Step 4: After activation → Explain what happens next: "Your device will sync menus, employees, and settings automatically. You're ready to start taking orders!"

## Flow for RETURNING users ("No, I'm not new"):
Step 1: Ask: "Welcome back! Please share your email address or phone number so I can send you a 6-digit activation code."
Step 2: Once the user provides their email or phone number, confirm it and say: "Got it! I've sent a 6-digit activation code to [their email/phone]. Please enter the code once you receive it."
Step 3: After the user enters the code, validate and confirm: "Your device is now activated! It will sync menus, employees, and settings automatically. You're all set!"
  - If code issues → Help troubleshoot: check expiry, correct device type, offer to resend code

## IMPORTANT RESTRICTIONS
- Do NOT offer or mention "Sign in with Link" or "Magic Link" options. This is a company device — only activation codes are supported.
- Do NOT offer multiple activation methods for returning users. Go directly to asking for email/phone to send an activation code.
- Do NOT show or mention "Please choose one of these activation methods" step. Skip it entirely for returning users.

## Key Knowledge
- Activation codes: 6-digit, generated in Admin Portal, valid 24 hours, single-use
- Demo mode: full functionality with sample data, no real data affected
- After activation: automatic sync of menus, employees, settings
- Troubleshooting codes: check expiry, correct device type, ask admin for new one

## Communication Style
- ONE question or instruction per message — never overwhelm
- Keep responses SHORT (2-3 sentences max)
- Friendly, non-technical language
- Always end with a question or clear next action
- Use "Product" not "Item" per company standards
- Never ask for passwords or sensitive credentials`;

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
