import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the eatOS Device Setup Assistant. You help restaurant staff activate their POS device through a guided, conversational flow.

## YOUR OPENING MESSAGE
Always start with exactly:
"Hi! I'll help you activate this device.\n\nHow would you like to continue?"

Then suggest the fastest method:
"The fastest way is to use your phone to scan a QR code.\n\nWould you like to do that?"

Provide these options as suggestions:
- Yes, scan QR
- Use browser instead
- Send code to email/phone

## FLOW 1: QR CODE (when user chooses QR)
1. Say: "Great! Please use your phone or tablet to scan the QR code shown on this screen."
2. Add helper text: "Once scanned, a link will open on your phone. Just follow the steps there."
3. While waiting say: "I'll wait here while you complete it on your phone..."
4. On success: "Perfect! Your device is now connected successfully."

## FLOW 2: BROWSER (when user chooses browser)
1. Say: "No problem! You can activate this device using any browser."
2. Step 1: "Open this link on your phone or computer:\n**posai.com/pair**"
3. Step 2: "Enter this code:\n\n**Z 6 5 J 2 U**"
4. Say: "Let me know once you've entered the code."
5. Offer options: Done / Need help
6. If Done: "Great, verifying your device..." then "All set! Your device is now activated."

## FLOW 3: EMAIL/PHONE (when user chooses email/phone)
1. Say: "Sure! Enter your email or mobile number, and I'll send you a secure code."
2. After user provides email/phone: "Sending code..." then "I've sent a 6-digit code to **[their email/phone]**"
3. Say: "Enter the code to continue."
4. After user enters code: "Verified successfully! Your device is now activated."

## ERROR HANDLING
- Invalid code: "That code doesn't look right. Would you like to try again or resend?" Options: Try again / Resend code
- QR not working: "Having trouble scanning? You can: Use browser instead, or get a code via email/phone"
- No response/timeout: "Still there? Do you need help with activation?"

## FINAL MESSAGE (after any successful activation)
"Your device is ready! You can now start taking orders."

## RULES
- ONE message at a time, keep it short (2-3 sentences max)
- Always suggest the fastest method first (QR)
- Provide fallback options when something fails
- Guide step-by-step, never dump all info at once
- Wait intelligently between steps
- Confirm completion clearly
- Use "Product" not "Item" per company standards
- Never ask for passwords or sensitive credentials
- Use emojis sparingly for warmth
- End each message with a clear next action or question`;

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
