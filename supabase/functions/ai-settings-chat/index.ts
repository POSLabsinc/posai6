import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Compact system prompt (~60% smaller than original) ──────────────────────
const SYSTEM_PROMPT = `You are an AI assistant for a POS system. Help users manage settings and menu data through conversation.

## RULES:
1. "message" must be plain text only — NO JSON, code, backticks. Staff see this on a touch screen.
2. Respond with valid JSON: {"message","action","quickReplies","multiSelect"}
3. Use "Product" not "Item" in all text.
4. NEVER fabricate data — only reference Live Database Context below.
5. ALWAYS include quickReplies (2-10 options). Staff use touch screens.
6. For enable/disable: autoApply: true. For add: autoApply: false.

## Action Types:
- view: {"type":"view","category":"menus|products|categories|modifiers|addOns|discounts|taxes|serviceCharges|gratuity|all"}
- update_setting: {"type":"update_setting","setting":"Name","path":"Path","currentValue":"Old","newValue":"New","settingType":"menu|product|category|modifierGroup|modifier|addOn|gratuity|discount|tax|serviceCharge|appearance|controlCenter|checkoutOptions|orders","operation":"add|update|archive|enable|disable","data":{...},"autoApply":true|false}
- update_ai_rules: {"type":"update_ai_rules","ruleType":"dos|donts|custom_instructions|restaurant_type|knowledge_base","operation":"add|remove|replace","value":"string or array of strings","autoApply":true}
  Use this when user wants to add/edit/remove AI behavior rules, do's, don'ts, custom instructions, restaurant type, or knowledge base.
  For dos/donts: value is a single rule string for add/remove, or array for replace. For others: value is the full string to set.
- navigate: {"type":"navigate","path":"/settings/path"}
- info: {"type":"info"}

## Menu add data shape:
{"name":"Menu Name","revenueCenters":["Full Service"],"categoryNames":["Cat1"],"categoryOrder":["Cat1"],"channelSchedules":{"pos":{"active":true,"days":["Mon"],"startTime":"11:00 AM","endTime":"10:00 PM"}}}
Device keys: "Point Of Sale"=pos, "Point Of Purchase"=pop, "KIOSK"=kiosk, "Order-OS"=orderos

## Product add: {"name":"Name","price":12.99,"categoryName":"Cat","categoryId":"uuid"}
## Category add: {"name":"Name"}
## ModifierGroup add: {"name":"Name","required":false,"multiSelect":false}
## Modifier add: {"name":"Name","price":1.50,"modifierGroupId":"uuid","modifierGroupName":"Name"}
## AddOn add: {"name":"Name","price":2.00}
## Discount add: {"name":"Name","amount":15,"type":"Percentage","applicableTo":"All Products","requiresManagerPin":false}
## Tax add: {"name":"Name","amount":8.25,"type":"Exclusive"}
## ServiceCharge add: {"name":"Name","amount":5,"type":"Fixed","orderType":"All Orders","automaticApply":false,"minSeats":null,"taxApplicable":"Taxable"}
## Gratuity update: {"tipsEnabled":true,"autoGratuity":true,"autoGratuityPercent":18,"autoGratuityMinGuests":6}
## Appearance update: {"theme":"dark","textSize":"17px","iconSize":"Small","brightness":"100%","boldText":false}
## ControlCenter update: {"debugMode":false,"forceClockIn":true,"autoLockTimer":5}
## CheckoutOptions update: {"splitCheck":true,"skipTipScreen":false,"signatureThreshold":25}
## Orders update: {"orderCreationRules":true,"holdAndRecall":true}

## GUIDED MENU CREATION (7 steps):
Step 1: Name (multiSelect:false) → Step 2: Display Devices (multiSelect:true, options: Point Of Sale/Point Of Purchase/KIOSK/Order-OS/All)
Step 3: Device Schedule — ask days+time for first device, then offer "Copy to All Devices" for rest. Days: Every Day/Weekdays Only/Weekends Only/individual. Time: All Day (24h)/preset ranges/Custom Time.
Step 4: Categories (multiSelect:true) → Step 5: Organize order → Step 6: Revenue Centers (multiSelect:true, Full Service/Quick Service/All) → Step 7: Overview & Confirm.
Use {"type":"info"} for steps 1-6. Only emit update_setting at Step 7 confirmation. Never repeat answered questions.

## GUIDED PRODUCT CREATION (4 steps): Name → Price → Category → Confirm
## GUIDED DISCOUNT CREATION (6 steps): Name → Amount → Type → ApplicableTo → PIN → Confirm
## GUIDED TAX CREATION (4 steps): Name → Rate → Type → Confirm
## GUIDED SERVICE CHARGE (6 steps): Name → Amount → Type → OrderType → AutoApply → Confirm

## Nav Paths: /settings/menu, /settings/menu/menu, /settings/menu/categories, /settings/menu/products, /settings/menu/modifiers, /settings/menu/add-ons, /settings/payments/discounts, /settings/payments/taxes, /settings/payments/gratuity, /settings/payments/service-charge, /settings/system/appearance, /settings/system/control-center

## Live Database Context:
{DATABASE_CONTEXT}

## Local Settings Context:
{SETTINGS_CONTEXT}

## AI Rules & Instructions (Admin-configured behavior guidelines):
{AI_RULES_CONTEXT}`;

const IMAGE_ADDENDUM = `\n\n## IMAGE ANALYSIS:
When user uploads a menu image: extract all items/prices/categories, present organized summary, then offer to create a menu from them. Pre-fill categories and products in the guided flow.`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string | any[];
}

// ── Intent detection: only fetch relevant DB tables ─────────────────────────
type Intent = "menus" | "categories" | "products" | "modifiers" | "addons" | "general";

function detectIntent(messages: any[]): Set<Intent> {
  const intents = new Set<Intent>();
  // Scan last 4 user messages for keywords
  const recentUserMsgs = messages
    .filter((m: any) => m.role === "user")
    .slice(-4)
    .map((m: any) => {
      if (typeof m.content === "string") return m.content.toLowerCase();
      if (Array.isArray(m.content)) {
        return m.content.filter((c: any) => c.type === "text").map((c: any) => c.text).join(" ").toLowerCase();
      }
      return "";
    })
    .join(" ");

  // Also check last assistant message for ongoing flows
  const lastAssistant = [...messages].reverse().find((m: any) => m.role === "assistant");
  const assistantText = typeof lastAssistant?.content === "string" ? lastAssistant.content.toLowerCase() : "";
  const combined = recentUserMsgs + " " + assistantText;

  if (/menu|channel|schedule|device|revenue center|step [1-7]/.test(combined)) intents.add("menus");
  if (/categor/.test(combined)) intents.add("categories");
  if (/product|price|sku|stock/.test(combined)) intents.add("products");
  if (/modifier|mod group/.test(combined)) intents.add("modifiers");
  if (/add.?on/.test(combined)) intents.add("addons");

  // If creating a menu, we need categories too
  if (intents.has("menus")) intents.add("categories");
  // If creating a product, we need categories
  if (intents.has("products")) intents.add("categories");
  // If creating a modifier, we need modifier groups
  if (intents.has("modifiers")) intents.add("modifiers");

  // If nothing detected or it's a general/greeting query
  if (intents.size === 0) intents.add("general");

  return intents;
}

async function fetchDatabaseContext(supabaseUrl: string, serviceRoleKey: string, intents: Set<Intent>): Promise<string> {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const parts: string[] = [];

  const fetchAll = intents.has("general");

  // Always fetch lightweight counts for overview
  const promises: Promise<void>[] = [];

  // Menus — always lightweight (small table)
  if (fetchAll || intents.has("menus")) {
    promises.push((async () => {
      const { data: menus } = await supabase.from("menus").select("id, name, enabled, archived, revenue_centers, channel_schedules").eq("archived", false).order("sort_order");
      if (menus?.length) {
        parts.push(`### Menus (${menus.length}):`);
        menus.forEach((m: any) => {
          const channels: string[] = [];
          if (m.channel_schedules) {
            const cs = typeof m.channel_schedules === "string" ? JSON.parse(m.channel_schedules) : m.channel_schedules;
            Object.entries(cs).forEach(([key, val]: [string, any]) => { if (val?.active) channels.push(key); });
          }
          parts.push(`- ${m.name} (id:${m.id}) ${m.enabled ? "Active" : "Inactive"}${channels.length ? ` [${channels.join(",")}]` : ""}${m.revenue_centers?.length ? ` RC:${m.revenue_centers.join(",")}` : ""}`);
        });
      } else {
        parts.push("### Menus: none");
      }
    })());
  }

  // Categories
  if (fetchAll || intents.has("categories")) {
    promises.push((async () => {
      const { data: categories } = await supabase.from("categories").select("id, name, active").eq("active", true).order("sort_order");
      if (categories?.length) {
        parts.push(`### Categories (${categories.length}): ${categories.map((c: any) => `${c.name}(${c.id})`).join(", ")}`);
      } else {
        parts.push("### Categories: none");
      }
    })());
  }

  // Products — limit to 100, compact format
  if (fetchAll || intents.has("products")) {
    promises.push((async () => {
      const [{ data: products }, { data: categories }] = await Promise.all([
        supabase.from("products").select("id, name, price, category_id, active, out_of_stock, popular").eq("archived", false).order("sort_order").limit(100),
        supabase.from("categories").select("id, name").eq("active", true),
      ]);
      const catMap: Record<string, string> = {};
      (categories || []).forEach((c: any) => { catMap[c.id] = c.name; });
      if (products?.length) {
        const byCategory: Record<string, any[]> = {};
        products.forEach((p: any) => {
          const cat = catMap[p.category_id] || "Other";
          (byCategory[cat] ||= []).push(p);
        });
        parts.push(`### Products (${products.length}):`);
        Object.entries(byCategory).forEach(([cat, prods]) => {
          parts.push(`**${cat}:** ${prods.map((p: any) => `${p.name}=$${Number(p.price).toFixed(2)}(${p.id})${!p.active ? "[OFF]" : ""}${p.out_of_stock ? "[OOS]" : ""}`).join("; ")}`);
        });
      } else {
        parts.push("### Products: none");
      }
    })());
  }

  // Modifiers
  if (fetchAll || intents.has("modifiers")) {
    promises.push((async () => {
      const [{ data: groups }, { data: mods }] = await Promise.all([
        supabase.from("modifier_groups").select("id, name, required, multi_select").eq("active", true).order("sort_order"),
        supabase.from("modifiers").select("id, name, price, modifier_group_id, is_default").eq("active", true).order("sort_order"),
      ]);
      if (groups?.length) {
        parts.push(`### Modifier Groups (${groups.length}):`);
        groups.forEach((g: any) => {
          const gMods = (mods || []).filter((m: any) => m.modifier_group_id === g.id);
          parts.push(`- ${g.name}(${g.id}) ${g.required ? "Req" : "Opt"}${g.multi_select ? ",Multi" : ""}: ${gMods.map((m: any) => `${m.name}=$${Number(m.price).toFixed(2)}(${m.id})`).join("; ") || "none"}`);
        });
      }
    })());
  }

  // Add-Ons
  if (fetchAll || intents.has("addons")) {
    promises.push((async () => {
      const { data: addOns } = await supabase.from("add_ons").select("id, name, price").eq("active", true).order("sort_order");
      if (addOns?.length) {
        parts.push(`### Add-Ons (${addOns.length}): ${addOns.map((a: any) => `${a.name}=$${Number(a.price).toFixed(2)}(${a.id})`).join("; ")}`);
      }
    })());
  }

  await Promise.all(promises);
  return parts.join("\n") || "No relevant data found.";
}

async function fetchAIRules(supabaseUrl: string, serviceRoleKey: string, deviceId: string): Promise<string> {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const ruleKeys = ["ai_rules_dos", "ai_rules_donts", "ai_rules_custom_instructions", "ai_rules_restaurant_type", "ai_rules_knowledge_base"];
  // Use "shared" device_id for global settings, fallback to provided deviceId for backward compatibility
  const sharedDeviceId = "shared";
  
  const { data } = await supabase
    .from("user_preferences")
    .select("preference_key, preference_value")
    .eq("device_id", sharedDeviceId)
    .in("preference_key", ruleKeys);

  if (!data?.length) return "No custom AI rules configured.";

  const prefs: Record<string, string> = {};
  data.forEach((r: any) => { prefs[r.preference_key] = r.preference_value; });

  const parts: string[] = [];

  if (prefs.ai_rules_dos) {
    try {
      const dos = JSON.parse(prefs.ai_rules_dos);
      if (dos.length) parts.push(`**DO:** ${dos.map((d: string) => `• ${d}`).join(" ")}`);
    } catch { /* ignore */ }
  }

  if (prefs.ai_rules_donts) {
    try {
      const donts = JSON.parse(prefs.ai_rules_donts);
      if (donts.length) parts.push(`**DON'T:** ${donts.map((d: string) => `• ${d}`).join(" ")}`);
    } catch { /* ignore */ }
  }

  if (prefs.ai_rules_custom_instructions?.trim()) {
    parts.push(`**Custom Instructions:** ${prefs.ai_rules_custom_instructions.trim()}`);
  }

  if (prefs.ai_rules_restaurant_type?.trim()) {
    parts.push(`**Restaurant Type:** ${prefs.ai_rules_restaurant_type}`);
  }

  if (prefs.ai_rules_knowledge_base?.trim()) {
    parts.push(`**Knowledge Base:** ${prefs.ai_rules_knowledge_base.trim()}`);
  }

  return parts.length ? parts.join("\n") : "No custom AI rules configured.";
}

async function handleUpdateAIRules(
  supabaseUrl: string,
  serviceRoleKey: string,
  deviceId: string,
  ruleType: string,
  operation: string,
  value: any
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  
  const keyMap: Record<string, string> = {
    dos: "ai_rules_dos",
    donts: "ai_rules_donts",
    custom_instructions: "ai_rules_custom_instructions",
    restaurant_type: "ai_rules_restaurant_type",
    knowledge_base: "ai_rules_knowledge_base",
  };

  const prefKey = keyMap[ruleType];
  if (!prefKey) return { success: false, message: `Unknown rule type: ${ruleType}` };

  try {
    // For dos/donts, we work with JSON arrays
    if (ruleType === "dos" || ruleType === "donts") {
      // Fetch current value
      const { data: existing } = await supabase
        .from("user_preferences")
        .select("preference_value")
        .eq("device_id", deviceId)
        .eq("preference_key", prefKey)
        .maybeSingle();

      let currentList: string[] = [];
      if (existing?.preference_value) {
        try { currentList = JSON.parse(existing.preference_value); } catch { currentList = []; }
      }

      if (operation === "add") {
        const newRule = typeof value === "string" ? value : String(value);
        if (!currentList.includes(newRule)) {
          currentList.push(newRule);
        }
      } else if (operation === "remove") {
        const toRemove = typeof value === "string" ? value.toLowerCase() : String(value).toLowerCase();
        currentList = currentList.filter(r => r.toLowerCase() !== toRemove);
      } else if (operation === "replace") {
        currentList = Array.isArray(value) ? value : [value];
      }

      const newValue = JSON.stringify(currentList);
      const { error } = await supabase
        .from("user_preferences")
        .upsert(
          { device_id: deviceId, preference_key: prefKey, preference_value: newValue, updated_at: new Date().toISOString() },
          { onConflict: "device_id,preference_key" }
        );
      if (error) throw error;
      return { success: true, message: `Updated ${ruleType === "dos" ? "Do's" : "Don'ts"} rules successfully.` };
    } else {
      // For text fields (custom_instructions, restaurant_type, knowledge_base)
      const newValue = typeof value === "string" ? value : JSON.stringify(value);
      const { error } = await supabase
        .from("user_preferences")
        .upsert(
          { device_id: deviceId, preference_key: prefKey, preference_value: newValue, updated_at: new Date().toISOString() },
          { onConflict: "device_id,preference_key" }
        );
      if (error) throw error;
      const labelMap: Record<string, string> = { custom_instructions: "Custom Instructions", restaurant_type: "Restaurant Type", knowledge_base: "Knowledge Base" };
      return { success: true, message: `Updated ${labelMap[ruleType] || ruleType} successfully.` };
    }
  } catch (e) {
    console.error("Error updating AI rules:", e);
    return { success: false, message: `Failed to update ${ruleType}: ${e instanceof Error ? e.message : "Unknown error"}` };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, settingsContext, provider, model: requestedModel, deviceId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // ── Determine AI provider and resolve API key ──────────────────────
    let aiEndpoint = "https://ai.gateway.lovable.dev/v1/chat/completions";
    let aiApiKey = LOVABLE_API_KEY;
    let aiModel = "";
    let isExternalProvider = false;

    // Map provider IDs to their API endpoints and model prefixes
    const PROVIDER_ENDPOINTS: Record<string, { url: string; keyPrefix: string }> = {
      openai: { url: "https://api.openai.com/v1/chat/completions", keyPrefix: "sk-" },
      anthropic: { url: "https://api.anthropic.com/v1/messages", keyPrefix: "sk-ant-" },
      google: { url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", keyPrefix: "AIza" },
      maya: { url: "https://api.maya-ai.com/v1/chat/completions", keyPrefix: "maya-" },
    };

    // If a non-platform provider is selected, look up the user's API key
    if (provider && provider !== "platform" && PROVIDER_ENDPOINTS[provider] && deviceId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: keyPref } = await supabaseAdmin
        .from("user_preferences")
        .select("preference_value")
        .eq("device_id", deviceId)
        .eq("preference_key", "ai_integration_api_key")
        .maybeSingle();

      if (keyPref?.preference_value) {
        const provConfig = PROVIDER_ENDPOINTS[provider];
        aiEndpoint = provConfig.url;
        aiApiKey = keyPref.preference_value;
        aiModel = requestedModel || "";
        isExternalProvider = true;
        console.log(`Using external provider: ${provider}, model: ${aiModel}`);
      } else {
        console.log(`No API key found for provider ${provider}, falling back to platform AI`);
      }
    }

    if (!aiApiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured. Please add your API key in AI Integration settings." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Cap conversation history to last 10 messages ──────────────────────
    const recentMessages = Array.isArray(messages)
      ? messages.slice(-10)
      : [];

    // ── Detect intent from recent messages ────────────────────────────────
    const intents = detectIntent(recentMessages);
    console.log("Detected intents:", [...intents].join(", "), "| Messages:", recentMessages.length);

    let databaseContext = "Database not available";
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        databaseContext = await fetchDatabaseContext(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, intents);
      } catch (e) {
        console.error("Failed to fetch database context:", e);
        databaseContext = "Error loading database data";
      }
    }

    // ── Fetch AI Rules & Instructions ─────────────────────────────────────
    let aiRulesContext = "No custom AI rules configured.";
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && deviceId) {
      try {
        aiRulesContext = await fetchAIRules(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, deviceId);
      } catch (e) {
        console.error("Failed to fetch AI rules:", e);
      }
    }

    // Only include local settings context if it's about non-DB settings
    const trimmedSettings = settingsContext && settingsContext.length > 2000
      ? settingsContext.substring(0, 2000) + "\n...(truncated)"
      : (settingsContext || "");

    const systemPromptWithContext = SYSTEM_PROMPT
      .replace("{DATABASE_CONTEXT}", databaseContext)
      .replace("{SETTINGS_CONTEXT}", trimmedSettings)
      .replace("{AI_RULES_CONTEXT}", aiRulesContext);

    // Check for images
    const hasImage = recentMessages.some((m: any) => Array.isArray(m.content) && m.content.some((c: any) => c.type === "image_url"));

    const finalSystemPrompt = hasImage
      ? systemPromptWithContext + IMAGE_ADDENDUM
      : systemPromptWithContext;

    const apiMessages: ChatMessage[] = [
      { role: "system", content: finalSystemPrompt },
      ...recentMessages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    // Determine model to use
    if (!isExternalProvider) {
      aiModel = hasImage ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview";
    }

    console.log("AI request:", apiMessages.length, "msgs,", hasImage ? "with image," : "", "model:", aiModel, "provider:", provider || "platform");

    const maxRetries = 3;
    let data: any = null;

    // ── Build request based on provider ──────────────────────────────────
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        let response: Response;

        if (provider === "anthropic" && isExternalProvider) {
          // Anthropic uses a different API format
          const anthropicMessages = apiMessages
            .filter(m => m.role !== "system")
            .map(m => ({ role: m.role, content: m.content }));
          const systemContent = apiMessages.find(m => m.role === "system")?.content || "";

          response = await fetch(aiEndpoint, {
            method: "POST",
            headers: {
              "x-api-key": aiApiKey!,
              "Content-Type": "application/json",
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: aiModel || "claude-3-5-sonnet-20241022",
              system: systemContent,
              messages: anthropicMessages,
              max_tokens: 2048,
              temperature: 0.7,
            }),
          });
        } else if (provider === "google" && isExternalProvider) {
          // Google Gemini via OpenAI-compatible endpoint
          response = await fetch(`${aiEndpoint}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${aiApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: aiModel || "gemini-2.5-flash",
              messages: apiMessages,
              stream: false,
              temperature: 0.7,
              max_tokens: 2048,
            }),
          });
        } else {
          // OpenAI-compatible format (OpenAI, Maya, Platform)
          response = await fetch(aiEndpoint, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${aiApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: aiModel,
              messages: apiMessages,
              stream: false,
              temperature: 0.7,
              max_tokens: 2048,
            }),
          });
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`AI error (attempt ${attempt}):`, response.status, errorText);

          if (response.status === 401 || response.status === 403) {
            return new Response(
              JSON.stringify({ error: "Invalid API key. Please check your key in AI Integration settings." }),
              { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          if (response.status === 429) {
            return new Response(
              JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          if (response.status === 402) {
            if (attempt < maxRetries) {
              await new Promise(r => setTimeout(r, attempt * 1000));
              continue;
            }
            return new Response(
              JSON.stringify({
                message: "I'm temporarily unable to process your request. Please try again in a moment.",
                action: { type: "info" },
                quickReplies: ["Try Again"],
                multiSelect: false,
              }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          if (response.status >= 500 && attempt < maxRetries) {
            await new Promise(r => setTimeout(r, attempt * 1000));
            continue;
          }
          throw new Error(`AI gateway ${response.status}: ${errorText}`);
        }

        data = await response.json();
        break;
      } catch (error) {
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, attempt * 1000));
        }
      }
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize response across providers
    let content: string | undefined;
    if (provider === "anthropic" && isExternalProvider) {
      // Anthropic response format: { content: [{ type: "text", text: "..." }] }
      content = data.content?.[0]?.text;
    } else {
      // OpenAI-compatible format
      content = data.choices?.[0]?.message?.content;
    }
    
    if (!content) {
      return new Response(
        JSON.stringify({ error: "No response from AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("AI response:", content.substring(0, 150));

    let parsedResponse;
    try {
      let clean = content.trim();
      if (clean.startsWith("```json")) clean = clean.slice(7);
      if (clean.startsWith("```")) clean = clean.slice(3);
      if (clean.endsWith("```")) clean = clean.slice(0, -3);
      parsedResponse = JSON.parse(clean.trim());
    } catch {
      parsedResponse = { message: content, action: { type: "info" } };
    }

    // Sanitize message field
    if (parsedResponse.message && typeof parsedResponse.message === "string") {
      let msg = parsedResponse.message;
      msg = msg.replace(/```json[\s\S]*?```/g, "").replace(/```[\s\S]*?```/g, "").trim();
      msg = msg.replace(/^\s*\{[\s\S]*\}\s*$/m, "").trim();
      msg = msg.replace(/^\s*"(message|action|quickReplies|multiSelect|type)"[\s\S]*$/gm, "").trim();
      msg = msg.replace(/^\s*[\{\}\[\],]\s*$/gm, "").replace(/\n{3,}/g, "\n\n").trim();
      if (!msg) msg = "Got it! What would you like to do next?";
      parsedResponse.message = msg;
    }

    // Ensure quickReplies
    if (!parsedResponse.quickReplies || !Array.isArray(parsedResponse.quickReplies) || parsedResponse.quickReplies.length === 0) {
      const msg = (parsedResponse.message || "").toLowerCase();
      if (msg.includes("menu") && msg.includes("step")) parsedResponse.quickReplies = ["Continue", "Skip", "Cancel"];
      else if (msg.includes("menu")) parsedResponse.quickReplies = ["View Menus", "Add New Menu", "Go to Settings"];
      else if (msg.includes("product")) parsedResponse.quickReplies = ["View Products", "Add Product", "Go to Settings"];
      else if (msg.includes("discount")) parsedResponse.quickReplies = ["View Discounts", "Add Discount", "Go to Settings"];
      else if (msg.includes("tax")) parsedResponse.quickReplies = ["View Taxes", "Add Tax", "Go to Settings"];
      else if (/applied|success|done|created|saved/.test(msg)) parsedResponse.quickReplies = ["View All", "Add Another", "Go to Settings"];
      else parsedResponse.quickReplies = ["View Menus", "View Products", "View Discounts", "Go to Settings"];
    }

    if (parsedResponse.multiSelect === undefined) parsedResponse.multiSelect = false;
    if (!parsedResponse.action) parsedResponse.action = { type: "info" };

    // ── Handle update_ai_rules action server-side ────────────────────────
    if (parsedResponse.action?.type === "update_ai_rules" && deviceId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const { ruleType, operation, value } = parsedResponse.action;
      if (ruleType && operation && value !== undefined) {
        const result = await handleUpdateAIRules(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, deviceId, ruleType, operation, value);
        console.log("AI rules update result:", result);
        if (result.success) {
          parsedResponse.action = { type: "ai_rules_updated", ruleType, operation, value, success: true };
        } else {
          parsedResponse.action = { type: "ai_rules_updated", ruleType, operation, success: false, error: result.message };
          parsedResponse.message = (parsedResponse.message || "") + "\n\n⚠️ " + result.message;
        }
      }
    }

    return new Response(
      JSON.stringify(parsedResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-settings-chat:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
