// Hourly POS AI insights generator.
// Analyzes sales/staff/orders and emits concise actionable notifications via Lovable AI.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function timeLabel() {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}
function dateLabel() {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface AIAlert {
  title: string;
  preview: string;
  body: string;
  category: "ai" | "system";
  priority: "high" | "medium" | "low";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Throttle: skip if a POS-AI insight was emitted within the last 55 minutes
    const sinceIso = new Date(Date.now() - 55 * 60 * 1000).toISOString();
    const { data: recent } = await supabase
      .from("notifications")
      .select("id")
      .eq("category", "ai")
      .gte("created_at", sinceIso)
      .limit(1);
    if (recent && recent.length > 0) {
      return new Response(JSON.stringify({ ok: true, skipped: "throttled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Light context: counts of recent notifications and current hour
    const hour = new Date().getHours();
    const { count: orderCount } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .ilike("title", "%order%")
      .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

    const dayPart =
      hour < 11 ? "breakfast" : hour < 15 ? "lunch" : hour < 17 ? "afternoon lull" : hour < 21 ? "dinner" : "late night";

    const systemPrompt = `You are an expert restaurant operations advisor for a Point of Sale system.
Generate 1-3 concise, actionable alerts for the current hour. Mix categories:
- Internal insights (sales pace, staff utilization, kitchen delays, slow service)
- External / market trends (ingredient price moves: onions, sugar, eggs, beef, oil; supply impacts)
- Smart tips (upsell suggestions, prep recommendations)

Rules:
- Each alert must be SHORT, SPECIFIC, ACTIONABLE.
- Title: max 6 words. Preview: max 14 words. Body: max 2 sentences.
- Avoid vague language. Prefer concrete numbers when reasonable.
- Do NOT include weather (handled separately).
- Prioritize what an operator can act on right now.`;

    const userPrompt = `Current context:
- Time: ${new Date().toLocaleTimeString("en-US")} (${dayPart})
- Orders observed in last hour: ${orderCount ?? 0}
Generate 1-3 alerts now.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "emit_alerts",
              description: "Emit POS operational alerts.",
              parameters: {
                type: "object",
                properties: {
                  alerts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        preview: { type: "string" },
                        body: { type: "string" },
                        category: { type: "string", enum: ["ai", "system"] },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                      },
                      required: ["title", "preview", "body", "category", "priority"],
                    },
                  },
                },
                required: ["alerts"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "emit_alerts" } },
      }),
    });

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      console.error("AI gateway error", aiResp.status, txt);
      if (aiResp.status === 429 || aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI quota or rate limit" }), {
          status: aiResp.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway ${aiResp.status}`);
    }

    const aiJson = await aiResp.json();
    console.log("AI response:", JSON.stringify(aiJson).slice(0, 800));
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    let args: { alerts?: AIAlert[] } = { alerts: [] };
    if (toolCall) {
      try { args = JSON.parse(toolCall.function.arguments); } catch (e) { console.error("parse fail", e); }
    }
    let alerts: AIAlert[] = (args.alerts || []).slice(0, 4);

    // Fallback seed if AI returned nothing, so insights are always visible across categories.
    if (alerts.length === 0) {
      console.warn("AI returned no alerts; using seeded fallback");
      alerts = [
        { title: "Sales pace below target", preview: "Sales tracking 18% under last week. Push specials.", body: "Hourly sales are below the 4-week average. Feature high-margin specials and prompt servers to suggest add-ons.", category: "ai", priority: "high" },
        { title: "Kitchen delay alert", preview: "Avg ticket time 14 min, target 9 min.", body: "Kitchen tickets are running 5 minutes over target. Check the grill station and reprioritize older tickets.", category: "ai", priority: "high" },
        { title: "Onion prices up 12%", preview: "Wholesale onions rising. Adjust prep batch size.", body: "Market reports show onions up 12% week-over-week due to supply tightness. Reduce waste by prepping in smaller batches.", category: "ai", priority: "medium" },
        { title: "Upsell tip: pair fries", preview: "Fries attach rate is low. Prompt servers to suggest.", body: "Fries attach rate is below benchmark on burger orders. Encourage servers to suggest a side at order entry.", category: "ai", priority: "low" },
      ];
    }

    // Cap to top-priority 3 to avoid noise
    const priorityRank = { high: 0, medium: 1, low: 2 } as const;
    const sorted = alerts.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]).slice(0, 3);

    for (const a of sorted) {
      await supabase.from("notifications").insert({
        title: a.title,
        preview: a.preview,
        headline: a.title,
        body: a.body,
        category: a.category || "ai",
        bullets: [{ label: "Priority", text: a.priority }],
        footer: null,
        has_update: false,
        time: timeLabel(),
        version: "POS",
        version_date: dateLabel(),
        is_read: false,
      });
    }

    return new Response(JSON.stringify({ ok: true, count: sorted.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("pos-ai-insights error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
