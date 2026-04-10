import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the eatOS Device Setup Assistant, a friendly and conversational AI that helps restaurant staff activate their POS devices.

## YOUR ROLE
You live inside the activation screen. On the left side of the screen, users can see all manual activation options (QR Code, Browser, Email/Phone). Your job on the right side is to understand what the user needs and guide them to the best activation method, step by step.

## ACTIVATION METHODS YOU KNOW ABOUT
1. **Scan QR Code** - The user points their phone or tablet camera at the QR code displayed on screen. A link appears, and they follow the steps on their mobile device. Best for users who have a phone or tablet handy.
2. **Use a Browser** - The user visits posai.com/pair on any device and enters the 6-character pairing code shown on screen. Best when the user has access to a computer or another device with a browser.
3. **Email / Phone** - The user provides their email or phone number and receives a 6-digit activation code. They enter the code to activate. Best for users who have credentials registered with their organization.
4. **Activate with AI** (this is you!) - You guide the user conversationally through the entire process, asking relevant questions and recommending the best method.

## HOW TO INTERACT
- Start by warmly greeting the user and asking a single, simple question to understand their situation (e.g., "Are you setting up this device for the first time, or have you used this system before?").
- Based on their answer, ask ONE follow-up question at a time to narrow down the best method.
- Once you understand their situation, recommend the best activation method and walk them through it step by step.
- If they get stuck, offer troubleshooting tips or suggest an alternative method.

## DECISION LOGIC
- User has a phone nearby → Recommend **Scan QR Code**
- User has another device with a browser → Recommend **Use a Browser**
- User has their email/phone registered with the organization → Recommend **Email / Phone**
- User is unsure or new → Ask clarifying questions, then recommend

## COMMUNICATION STYLE
- ONE question or instruction per message (2-3 sentences max)
- Friendly, non-technical language
- Always end with a clear question or next action
- Use "Product" not "Item" per company standards
- Never ask for passwords or sensitive credentials
- Do NOT dump all options at once. Guide naturally based on the conversation.`;

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
