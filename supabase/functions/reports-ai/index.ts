// AI insights + Q&A for the Reports & Analytics screen.
// Uses Lovable AI Gateway. No DB writes; pure analysis over context the client passes in.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function compactContext(ctx: any): string {
  if (!ctx) return "{}";
  const k = ctx.kpis || {};
  const top = (ctx.topItems || []).slice(0, 6).map((t: any) => `${t.name}: ${t.units}u/£${Number(t.revenue).toFixed(2)}`).join("; ");
  const cats = (ctx.categories || []).slice(0, 6).map((c: any) => `${c.name}: £${Number(c.sales).toFixed(2)}`).join("; ");
  const pays = (ctx.paymentTypes || []).map((p: any) => `${p.type}: £${Number(p.amount).toFixed(2)} (${p.transactions})`).join("; ");
  const hours = (ctx.salesByHour || []).filter((h: any) => h.sales > 0).map((h: any) => `${h.hour}:£${h.sales.toFixed(0)}`).join(", ");
  const days = (ctx.salesByDay || []).slice(-7).map((d: any) => `${d.date}:£${d.sales.toFixed(0)}`).join(", ");
  return [
    `Total sales: £${Number(k.totalSales || 0).toFixed(2)}`,
    `Orders: ${k.orderCount || 0}`,
    `Avg order: £${Number(k.averageOrderValue || 0).toFixed(2)}`,
    `Units: ${k.unitsSold || 0}`,
    top && `Top items: ${top}`,
    cats && `Categories: ${cats}`,
    pays && `Payments: ${pays}`,
    hours && `Hourly sales: ${hours}`,
    days && `Daily sales: ${days}`,
  ].filter(Boolean).join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { mode = "insights", context, question } = await req.json();
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const summary = compactContext(context);

    if (mode === "insights") {
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content:
                "You are a restaurant analytics assistant. Read the sales summary and produce 3-4 short, specific, actionable insights. " +
                "Each insight is one sentence, max ~18 words. Mix observations (peak hour, top item, payment mix) with one suggested action. " +
                "No greetings, no markdown, no bullets in the text.",
            },
            { role: "user", content: `Sales summary:\n${summary}` },
          ],
          tools: [{
            type: "function",
            function: {
              name: "emit",
              description: "Return insight strings",
              parameters: {
                type: "object",
                properties: { insights: { type: "array", items: { type: "string" } } },
                required: ["insights"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "emit" } },
        }),
      });
      if (!aiResp.ok) {
        const t = await aiResp.text();
        console.error("AI error", aiResp.status, t);
        return new Response(JSON.stringify({ insights: [] }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const json = await aiResp.json();
      const tc = json.choices?.[0]?.message?.tool_calls?.[0];
      const args = tc ? JSON.parse(tc.function.arguments) : { insights: [] };
      return new Response(JSON.stringify({ insights: (args.insights || []).slice(0, 4) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "onion") {
      const ctx = context || {};
      const forecastStr = (ctx.forecast || []).map((f: any) => `${f.day}:£${f.price} (${f.change >= 0 ? "+" : ""}${f.change}%)`).join(", ");
      const summary = [
        `Product: ${ctx.product || "Onions"} (${ctx.unit || "£/kg"})`,
        `Today: £${ctx.today}`,
        `Yesterday: £${ctx.yesterday}`,
        `Last week avg: £${ctx.lastWeekAverage}`,
        `Week change: ${ctx.weekChangePct}%`,
        forecastStr && `7-day forecast: ${forecastStr}`,
        ctx.peakDay && `Peak: ${ctx.peakDay.day} £${ctx.peakDay.price}`,
        ctx.lowestDay && `Lowest: ${ctx.lowestDay.day} £${ctx.lowestDay.price}`,
        ctx.reasons?.length && `Reasons: ${ctx.reasons.join("; ")}`,
        ctx.suggestions?.length && `Suggestions: ${ctx.suggestions.join("; ")}`,
        ctx.decision && `Recommendation: ${ctx.decision}`,
      ].filter(Boolean).join("\n");
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: "You answer operator questions about onion wholesale pricing using ONLY the supplied summary. Be concise (2-4 sentences max), specific, and actionable. No markdown. If the summary lacks the data needed, say so briefly." },
            { role: "user", content: `Onion price summary:\n${summary}\n\nQuestion: ${question}` },
          ],
        }),
      });
      if (!aiResp.ok) {
        return new Response(JSON.stringify({ answer: "Sorry, I couldn't generate an answer right now." }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const json = await aiResp.json();
      const answer = json.choices?.[0]?.message?.content || "No answer.";
      return new Response(JSON.stringify({ answer }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (mode === "ask") {
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content:
                "You answer operator questions about restaurant sales using ONLY the supplied summary. " +
                "Be concise (2-4 sentences max), specific, and actionable. No markdown. " +
                "If the summary lacks the data needed, say so briefly.",
            },
            { role: "user", content: `Sales summary:\n${summary}\n\nQuestion: ${question}` },
          ],
        }),
      });
      if (!aiResp.ok) {
        const t = await aiResp.text();
        console.error("AI ask error", aiResp.status, t);
        return new Response(JSON.stringify({ answer: "Sorry, I couldn't generate an answer right now." }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const json = await aiResp.json();
      const answer = json.choices?.[0]?.message?.content || "No answer.";
      return new Response(JSON.stringify({ answer }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "unknown mode" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("reports-ai error", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
