import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an AI assistant integrated into a POS (Point of Sale) order screen. You help staff manage orders through natural language AND answer questions about POS settings.

## CRITICAL RULES:
1. Use "Product" not "Item" in all text.
2. Be concise - staff use touch screens. Keep responses under 3 sentences unless listing products.
3. ALWAYS use tool calls to execute ORDER actions. NEVER just say you did something without calling the tool.
4. If the user's request is missing required info (e.g. "set guest name to" without a name), ASK for the missing info. Do NOT guess or make up values.
5. When adding products, ALWAYS match against the Available Products list. Use the exact name and price from the list.
6. If a product name is ambiguous, show the closest matches and ask which one.
7. You can handle multiple operations in one message (e.g., "add 2 burgers and a coke").
8. After executing tool calls, confirm what was done in 1 line.
9. For order type changes, only accept: DINE IN, TAKE OUT, DELIVERY, BANQUET, DRIVE THRU, CURB SIDE.
10. When asked for a summary, list all products with quantities and prices, plus the order type and guest name.
11. NEVER hallucinate a tool call result. If you cannot find a product or fulfill a request, say so.

## MODIFIER & ADD-ON RULES:
12. When the user specifies modifications (e.g., "no onions", "extra cheese", "with ranch"), use add_product_with_modifiers instead of add_product.
13. Format modifiers as strings: "No Onions", "Extra Cheese", "Add: Ranch (+$0.50)".
14. For removal modifiers, prefix with "No " (e.g., "No Onions", "No Tomato").
15. For add-on modifiers, prefix with "Add: " (e.g., "Add: Extra Cheese (+$1.00)").
16. If the user just says "add burger" without modifiers, use the regular add_product tool.
17. Calculate modifier_price_total by summing prices of any paid modifiers/add-ons mentioned.

## SETTINGS QUESTIONS:
18. When users ask about settings (discounts, taxes, service charges, gratuity, menus, categories, modifiers, etc.), answer using the Settings Context below.
19. For settings questions, respond with plain text - do NOT use tool calls.
20. You can tell users about current configuration, active discounts, tax rates, tip settings, checkout options, etc.
21. If asked to CHANGE settings, tell them to use the Settings AI assistant (accessible from the Settings screen) as you can only view settings, not modify them from the order screen.`;

const tools = [
  {
    type: "function",
    function: {
      name: "add_product",
      description: "Add a product to the current order WITHOUT any modifiers or customizations",
      parameters: {
        type: "object",
        properties: {
          product_name: { type: "string", description: "Exact name of the product to add" },
          quantity: { type: "number", description: "Number of units to add", default: 1 },
          product_id: { type: "string", description: "The product ID if known" },
          price: { type: "number", description: "The product price" },
        },
        required: ["product_name", "quantity", "price"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_product_with_modifiers",
      description: "Add a product WITH modifiers, customizations, or add-ons (e.g. 'burger with no onions and extra cheese')",
      parameters: {
        type: "object",
        properties: {
          product_name: { type: "string", description: "Exact name of the product to add" },
          quantity: { type: "number", description: "Number of units to add", default: 1 },
          price: { type: "number", description: "The base product price (before modifiers)" },
          modifiers: {
            type: "array",
            items: { type: "string" },
            description: "List of modifier strings like 'No Onions', 'Extra Cheese', 'Add: Ranch (+$0.50)'"
          },
          modifier_price_total: { type: "number", description: "Total additional cost from paid modifiers/add-ons", default: 0 },
          notes: { type: "string", description: "Any special notes for this product", default: "" },
        },
        required: ["product_name", "quantity", "price", "modifiers"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "remove_product",
      description: "Remove a product from the current order",
      parameters: {
        type: "object",
        properties: {
          product_name: { type: "string", description: "Name of the product to remove" },
        },
        required: ["product_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_quantity",
      description: "Update the quantity of a product in the current order",
      parameters: {
        type: "object",
        properties: {
          product_name: { type: "string", description: "Name of the product" },
          quantity: { type: "number", description: "New quantity (must be >= 1)" },
        },
        required: ["product_name", "quantity"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_order_type",
      description: "Set the order type (DINE IN, TAKE OUT, DELIVERY, BANQUET, DRIVE THRU, CURB SIDE)",
      parameters: {
        type: "object",
        properties: {
          order_type: {
            type: "string",
            enum: ["DINE IN", "TAKE OUT", "DELIVERY", "BANQUET", "DRIVE THRU", "CURB SIDE"],
            description: "The order type to set",
          },
        },
        required: ["order_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_guest_name",
      description: "Set the guest name for the order",
      parameters: {
        type: "object",
        properties: {
          guest_name: { type: "string", description: "The guest name" },
        },
        required: ["guest_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "clear_order",
      description: "Clear all products from the current order",
      parameters: {
        type: "object",
        properties: {
          reason: { type: "string", description: "Reason for clearing the order" },
        },
        required: ["reason"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_order_notes",
      description: "Set or update notes for the order",
      parameters: {
        type: "object",
        properties: {
          notes: { type: "string", description: "The order notes" },
        },
        required: ["notes"],
      },
    },
  },
];

// Detect if user is asking about settings vs order operations
function isSettingsQuery(messages: any[]): boolean {
  const lastUser = [...messages].reverse().find((m: any) => m.role === "user");
  if (!lastUser) return false;
  const text = (typeof lastUser.content === "string" ? lastUser.content : "").toLowerCase();
  return /setting|discount|tax|gratuity|tip preset|service charge|checkout|payment method|modifier group|add.?on|menu config|how many (menus|categories|products|modifiers)|what (are|is) (the|my|our) (discount|tax|tip|gratuity|service|checkout|menu|categor|modifier|add.?on)/.test(text);
}

// Fetch settings context from database
async function fetchSettingsContext(supabaseUrl: string, serviceRoleKey: string): Promise<string> {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const parts: string[] = [];
  const sharedDeviceId = "shared";

  const promises: Promise<void>[] = [];

  // Discounts
  promises.push((async () => {
    const { data } = await supabase.from("discounts").select("name, amount, type, applicable_to, archived, requires_manager_pin").eq("device_id", sharedDeviceId).eq("archived", false);
    if (data?.length) {
      parts.push(`### Discounts (${data.length}):`);
      data.forEach((d: any) => parts.push(`- ${d.name}: ${d.amount}${d.type === "Percentage" ? "%" : " flat"} on ${d.applicable_to || "All"}${d.requires_manager_pin ? " (PIN required)" : ""}`));
    } else {
      parts.push("### Discounts: none configured");
    }
  })());

  // Taxes
  promises.push((async () => {
    const { data } = await supabase.from("service_charges").select("name, amount, type, order_type, automatic_apply, min_seats, archived, is_active").eq("device_id", sharedDeviceId).eq("archived", false);
    // Note: taxes are stored differently - check for tax-specific tables
    // For now fetch service charges
    if (data?.length) {
      parts.push(`### Service Charges (${data.length}):`);
      data.forEach((sc: any) => parts.push(`- ${sc.name}: ${sc.amount}${sc.type === "Percentage" ? "%" : " flat"}${sc.automatic_apply ? " (auto)" : ""}${sc.order_type ? ` for ${sc.order_type}` : ""}${sc.min_seats > 0 ? ` min ${sc.min_seats} seats` : ""}`));
    } else {
      parts.push("### Service Charges: none configured");
    }
  })());

  // Gratuity
  promises.push((async () => {
    const { data } = await supabase.from("gratuity_settings").select("*").eq("device_id", sharedDeviceId).maybeSingle();
    if (data) {
      parts.push(`### Gratuity Settings:`);
      parts.push(`- Tips: ${data.enable_tip ? "Enabled" : "Disabled"}`);
      parts.push(`- Presets: ${JSON.stringify(data.selected_tip_presets)} (${data.preset_type})`);
      parts.push(`- Custom tip: ${data.allow_custom ? "Allowed" : "Not allowed"}`);
      parts.push(`- Show on receipt: ${data.show_on_receipt ? "Yes" : "No"}`);
    } else {
      parts.push("### Gratuity: not configured");
    }
  })());

  // Checkout Options
  promises.push((async () => {
    const { data } = await supabase.from("checkout_options").select("*").eq("device_id", sharedDeviceId).maybeSingle();
    if (data) {
      parts.push(`### Checkout Options:`);
      parts.push(`- Split check: ${data.split_check ? "Yes" : "No"}`);
      parts.push(`- Tips: ${data.enable_tips ? "Enabled" : "Disabled"}`);
      parts.push(`- Quick amounts: ${data.enable_quick_amounts ? "Yes" : "No"}`);
      parts.push(`- Require order type: ${data.require_order_type ? "Yes" : "No"}`);
      parts.push(`- Require guest name: ${data.require_guest_name ? "Yes" : "No"}`);
      parts.push(`- Print receipt: ${data.print_receipt ? "Yes" : "No"}`);
      parts.push(`- Signature threshold: $${data.signature_threshold}`);
      parts.push(`- Hold & Fire: ${data.enable_hold_fire ? "Enabled" : "Disabled"}`);
    }
  })());

  // Menus overview
  promises.push((async () => {
    const { data: menus } = await supabase.from("menus").select("name, enabled, archived").eq("archived", false);
    if (menus?.length) {
      parts.push(`### Menus (${menus.length}): ${menus.map((m: any) => `${m.name} (${m.enabled ? "Active" : "Inactive"})`).join(", ")}`);
    }
  })());

  // Categories overview
  promises.push((async () => {
    const { data: cats } = await supabase.from("categories").select("name, active").eq("active", true);
    if (cats?.length) {
      parts.push(`### Categories (${cats.length}): ${cats.map((c: any) => c.name).join(", ")}`);
    }
  })());

  // Modifier Groups overview
  promises.push((async () => {
    const [{ data: groups }, { data: mods }] = await Promise.all([
      supabase.from("modifier_groups").select("id, name, required, multi_select").eq("active", true),
      supabase.from("modifiers").select("name, price, modifier_group_id, is_default").eq("active", true),
    ]);
    if (groups?.length) {
      parts.push(`### Modifier Groups (${groups.length}):`);
      groups.forEach((g: any) => {
        const gMods = (mods || []).filter((m: any) => m.modifier_group_id === g.id);
        parts.push(`- ${g.name} ${g.required ? "(Required)" : "(Optional)"}${g.multi_select ? " Multi" : ""}: ${gMods.map((m: any) => `${m.name}${m.price > 0 ? ` $${m.price}` : ""}${m.is_default ? "*" : ""}`).join(", ") || "none"}`);
      });
    }
  })());

  // Add-Ons overview
  promises.push((async () => {
    const { data: addOns } = await supabase.from("add_ons").select("name, price").eq("active", true);
    if (addOns?.length) {
      parts.push(`### Add-Ons (${addOns.length}): ${addOns.map((a: any) => `${a.name} $${a.price}`).join(", ")}`);
    }
  })());

  // Payment Methods
  promises.push((async () => {
    const { data: methods } = await supabase.from("payment_methods").select("method_id, enabled").eq("device_id", sharedDeviceId);
    if (methods?.length) {
      const enabled = methods.filter((m: any) => m.enabled);
      parts.push(`### Payment Methods: ${enabled.map((m: any) => m.method_id).join(", ")} (${enabled.length} enabled of ${methods.length})`);
    }
  })());

  await Promise.all(promises);
  return parts.join("\n") || "No settings data available.";
}

// Fetch AI Rules
async function fetchAIRules(supabaseUrl: string, serviceRoleKey: string): Promise<string> {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const ruleKeys = ["ai_rules_dos", "ai_rules_donts", "ai_rules_custom_instructions", "ai_rules_restaurant_type", "ai_rules_knowledge_base"];
  const { data } = await supabase.from("user_preferences").select("preference_key, preference_value").eq("device_id", "shared").in("preference_key", ruleKeys);
  if (!data?.length) return "";

  const prefs: Record<string, string> = {};
  data.forEach((r: any) => { prefs[r.preference_key] = r.preference_value; });
  const parts: string[] = [];

  if (prefs.ai_rules_dos) { try { const dos = JSON.parse(prefs.ai_rules_dos); if (dos.length) parts.push(`**DO:** ${dos.join(", ")}`); } catch {} }
  if (prefs.ai_rules_donts) { try { const donts = JSON.parse(prefs.ai_rules_donts); if (donts.length) parts.push(`**DON'T:** ${donts.join(", ")}`); } catch {} }
  if (prefs.ai_rules_custom_instructions?.trim()) parts.push(`**Custom Instructions:** ${prefs.ai_rules_custom_instructions.trim()}`);
  if (prefs.ai_rules_restaurant_type?.trim()) parts.push(`**Restaurant Type:** ${prefs.ai_rules_restaurant_type}`);
  if (prefs.ai_rules_knowledge_base?.trim()) parts.push(`**Knowledge Base:** ${prefs.ai_rules_knowledge_base.trim()}`);

  return parts.length ? "\n## AI Rules:\n" + parts.join("\n") : "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, orderContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build order context
    const contextMessage = `
## Current Order State:
- Order Type: ${orderContext?.orderType || "DINE IN"}
- Guest Name: ${orderContext?.guestName || "Not set"}
- Products in cart: ${orderContext?.orderItems?.length > 0
      ? orderContext.orderItems.map((i: any) => {
          const modStr = i.modifiers?.length > 0 ? ` [${i.modifiers.join(", ")}]` : "";
          return `${i.name} x${i.qty} ($${i.price.toFixed(2)})${modStr}`;
        }).join(", ")
      : "Empty"}
- Order Notes: ${orderContext?.orderNotes || "None"}

## Available Products (from menu):
${orderContext?.availableProducts?.map((p: any) => `- ${p.name}: $${p.price.toFixed(2)} (ID: ${p.id})`).join("\n") || "No products loaded"}
`;

    // Fetch settings context and AI rules if DB is available
    let settingsContext = "";
    let aiRulesContext = "";

    const needsSettings = isSettingsQuery(messages || []);
    
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const fetchPromises: Promise<void>[] = [];

      // Always fetch AI rules (lightweight)
      fetchPromises.push((async () => {
        try { aiRulesContext = await fetchAIRules(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY); } catch (e) { console.error("Failed to fetch AI rules:", e); }
      })());

      // Only fetch full settings context when the user is asking about settings
      if (needsSettings) {
        fetchPromises.push((async () => {
          try { settingsContext = "\n## Settings Context:\n" + await fetchSettingsContext(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY); } catch (e) { console.error("Failed to fetch settings:", e); }
        })());
      }

      await Promise.all(fetchPromises);
    }

    const fullSystemPrompt = SYSTEM_PROMPT + "\n\n" + contextMessage + settingsContext + aiRulesContext;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: fullSystemPrompt },
          ...(messages || []).slice(-10),
        ],
        tools,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("order-ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
