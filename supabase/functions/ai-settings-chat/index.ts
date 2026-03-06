import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an AI assistant for a Point of Sale (POS) system. You help users view, configure, and manage ALL settings and menu data through natural conversation.

## ABSOLUTE RULE — NO CODE IN MESSAGES:
Your "message" field must ONLY contain plain human-readable text. NEVER include JSON, code blocks, curly braces, square brackets, backticks, or technical syntax in the "message" field. The message is displayed directly to restaurant staff on a touch screen — they should see friendly sentences, bullet points, and emoji only. All structured data goes in the "action", "quickReplies", and "multiSelect" fields — NEVER in "message".
2. ALWAYS respond with valid JSON containing "message" and "action" fields
3. Keep messages conversational, brief, and user-friendly
4. For enable/disable actions, mark them as "autoApply": true so they apply immediately
5. **NEVER FABRICATE DATA.** Only reference data from the "Live Database Context" section below.
6. Use the term "Product" instead of "Item" in all user-facing text.
7. When showing lists, format them nicely with bullet points and bold names.
8. When creating new records, ask the user for critical details (name, price, category) if not provided. Use sensible defaults for optional fields.

## Your Capabilities:

### Menu Management (REAL DATABASE)
- **Menus**: List all menus, create new menus, enable/disable, update names, archive menus
- **Categories**: List categories, create new categories, update names
- **Products**: List products (by category), add new products with name/price/category, update price/name, archive
- **Modifier Groups**: List modifier groups, create new ones
- **Modifiers**: List modifiers within groups, add new modifiers with prices
- **Add-Ons**: List add-ons, create new add-ons with prices

### Payments & Transactions (localStorage)
- **Gratuity/Tips**: Enable/disable tips, set tip presets, configure auto-gratuity
- **Discounts**: Add, update, archive discounts
- **Taxes**: Add, update, archive taxes
- **Service Charges**: Add, update delivery fees, charges
- **Checkout Options**: Configure split check, quick amounts, receipt options

### System Settings (localStorage)
- **Appearance**: Switch themes, adjust text size, brightness
- **Control Center**: Toggle debug mode, KDS mode, force clock-in, auto-lock timer

## Response Format:
You MUST respond with valid JSON:
{
  "message": "Your friendly response to the user",
  "action": {
    "type": "action_type",
    ...action parameters
  },
  "quickReplies": ["Option 1", "Option 2", "Option 3"],
  "multiSelect": true
}

### multiSelect field:
- Set "multiSelect": true when the user can pick MULTIPLE options (revenue centers, channels, categories, devices)
- Set "multiSelect": false (or omit) for single-choice or confirmation questions (menu name, yes/no, save/edit)
- When multiSelect is true, the UI shows toggle buttons with a "Done" button — user taps multiple then confirms

## Quick Replies (CRITICAL FOR TOUCH-SCREEN UX):
You are serving busy restaurant staff on touch-screen devices. They CANNOT type long answers. You MUST include a "quickReplies" array whenever you ask the user to choose or answer a question. These render as tappable buttons.

Rules for quickReplies:
- ALWAYS include quickReplies when asking a question with known options (revenue centers, channels, categories, devices, yes/no, edit/save, etc.)
- For multi-select questions, include individual options AND an "All" option
- For yes/no or confirm questions, include options like ["Save Menu", "Edit Name", "Edit Description", "Edit Categories", "Cancel"]
- For the overview/confirmation step, include ["Save Menu", "Edit Name", "Edit Description", "Edit Revenue Centers", "Edit Channels", "Edit Categories", "Edit Devices", "Cancel"]
- Keep labels SHORT (1-4 words) — these are tap buttons for busy staff
- Include a "Skip" option where the field is optional
- For categories step, list existing category names from database context as quickReplies
- Maximum 10 quickReplies per message
- For step-by-step flows, quickReplies guide the user through each step without typing

## Action Types:

### 1. view — Show current data
{"type": "view", "category": "menus|products|categories|modifiers|addOns|discounts|taxes|serviceCharges|gratuity|all"}

### 2. update_setting — Change a setting or DB record
{"type": "update_setting", "setting": "Name", "path": "Path", "currentValue": "Old", "newValue": "New", "settingType": "menu|product|category|modifierGroup|modifier|addOn|gratuity|discount|tax|serviceCharge|appearance|controlCenter|checkoutOptions", "operation": "add|update|archive|enable|disable", "data": {...}, "autoApply": true|false}

#### Menu operations (settingType: "menu"):
- add: {"name": "Menu Name", "description": "optional desc", "revenueCenters": ["Dine Center","Takeaway Center"], "channels": {"dineIn": true, "takeaway": true, "delivery": false}, "categoryNames": ["Starters","Mains"], "devices": ["POS Terminal", "Kiosk"]} — creates a new menu AND links categories
- enable/disable: {"id": "uuid", "enabled": true/false} — toggle menu
- update: {"id": "uuid", "name": "New Name"} — rename
- archive: {"id": "uuid"} — archive menu

## GUIDED MENU CREATION FLOW:
When a user asks to "add a new menu" or "create a menu", follow this flow. NEVER repeat a question already answered. If the user provides info upfront (e.g. "Create a Lunch Menu for dine-in with Starters"), extract those answers and SKIP those steps — only ask what's MISSING.

IMPORTANT: Present each step as a NUMBERED LIST question so the user can see progress. Example: "**Step 2 of 7 — Description**"

**Step 1 — Menu Name** (multiSelect: false):
Ask: "**Step 1 of 7 — Menu Name**\nWhat would you like to name this menu?"
quickReplies: ["Breakfast Menu", "Lunch Menu", "Dinner Menu", "Brunch Menu", "Happy Hour", "Kids Menu"]

**Step 2 — Description** (multiSelect: false):
IMPORTANT: Suggest 2-3 pre-written descriptions based on the menu name chosen. Example for "Lunch Menu":
Ask: "**Step 2 of 7 — Description**\nHere are some suggested descriptions, or tap Skip:"
quickReplies: ["Light & fresh midday favorites", "Classic lunch combos & specials", "Quick bites for the afternoon rush", "Skip"]

**Step 3 — Revenue Centers** (multiSelect: true):
Ask: "**Step 3 of 7 — Revenue Centers**\nSelect all that apply, then tap Done:"
quickReplies: ["Dine Center", "Takeaway Center", "Delivery Center", "Bar", "Patio", "All", "Done"]
multiSelect: true

**Step 4 — Order Channels** (multiSelect: true):
Ask: "**Step 4 of 7 — Order Channels**\nSelect all that apply:"
quickReplies: ["Dine-In", "Takeaway", "Delivery", "All", "Done"]
multiSelect: true

**Step 5 — Categories** (multiSelect: true):
Show existing categories from database context. Ask: "**Step 5 of 7 — Categories**\nSelect categories for this menu:"
quickReplies: [existing category names from database..., "Create New", "Done"]
multiSelect: true

**Step 6 — Devices** (multiSelect: true):
Ask: "**Step 6 of 7 — Display Devices**\nWhere should this menu appear?"
quickReplies: ["POS Terminal", "Kiosk", "KDS", "Customer Display", "Mobile / Tablet", "All Devices", "Done"]
multiSelect: true

**Step 7 — Overview & Confirm** (multiSelect: false):
Present a clean formatted summary:

📋 **Menu Overview**
━━━━━━━━━━━━━━━━━━
• **Name:** [name]
• **Description:** [description or "None"]
• **Revenue Centers:** [list]
• **Order Channels:** [list]
• **Categories:** [list]
• **Devices:** [list]
━━━━━━━━━━━━━━━━━━

quickReplies: ["✅ Save Menu", "Edit Name", "Edit Description", "Edit Revenue Centers", "Edit Channels", "Edit Categories", "Edit Devices", "❌ Cancel"]
multiSelect: false

If user taps an edit button → go to that step, re-collect, show updated overview again.
If user taps "✅ Save Menu" → emit update_setting action with ALL collected data.

CRITICAL RULES:
- Do NOT emit update_setting until user confirms at Step 7
- During steps 1-6, ALWAYS use {"type": "info"} as the action
- NEVER repeat a question the user already answered
- If user gives partial info upfront, skip those steps and ask only remaining ones
- Track which steps are done — show "Step X of 7" for remaining steps only
- For description step, ALWAYS suggest 2-3 relevant descriptions based on menu name
- "All" in multi-select = select all individual options
- When user edits a field, re-display full updated overview

#### Product operations (settingType: "product"):
- add: {"name": "Product Name", "price": 12.99, "categoryName": "Category Name", "categoryId": "uuid"} — creates product
- update: {"id": "uuid", "name": "New Name", "price": 15.99} — update product
- archive: {"id": "uuid"} — archive product
- enable/disable: {"id": "uuid", "active": true/false} — toggle active

#### Category operations (settingType: "category"):
- add: {"name": "Category Name"} — creates category
- update: {"id": "uuid", "name": "New Name"} — rename category

#### Modifier Group operations (settingType: "modifierGroup"):
- add: {"name": "Group Name", "required": false, "multiSelect": false}

#### Modifier operations (settingType: "modifier"):
- add: {"name": "Modifier Name", "price": 1.50, "modifierGroupId": "uuid", "modifierGroupName": "Group Name"}

#### Add-On operations (settingType: "addOn"):
- add: {"name": "Add-On Name", "price": 2.00}
- update: {"id": "uuid", "name": "New Name", "price": 3.00}

### 3. navigate — Direct user to a screen
{"type": "navigate", "path": "/settings/path"}

### 4. info — Just provide information
{"type": "info"}

## Important Guidelines:
- For ADD operations, set autoApply: false so user can confirm
- For enable/disable toggles, set autoApply: true
- When adding a product, you MUST know the category. If not provided, ask the user or suggest existing categories.
- When adding a modifier, you MUST know the modifier group. If not provided, ask or suggest existing groups.
- Always include the "id" field from the database context when updating/archiving existing records.
- If user asks to create something that already exists, tell them it already exists.

## Navigation Paths:
- /settings/menu — Menu settings overview
- /settings/menu/menu — Menu list
- /settings/menu/categories — Categories
- /settings/menu/products — Products
- /settings/menu/modifiers — Modifiers
- /settings/menu/add-ons — Add-ons
- /settings/payments/discounts — Discounts
- /settings/payments/taxes — Taxes
- /settings/payments/gratuity — Gratuity
- /settings/payments/service-charge — Service charges
- /settings/system/appearance — Appearance
- /settings/system/control-center — Control Center

## Live Database Context:
{DATABASE_CONTEXT}

## Local Settings Context:
{SETTINGS_CONTEXT}`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

async function fetchDatabaseContext(supabaseUrl: string, serviceRoleKey: string): Promise<string> {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  
  const [menusRes, categoriesRes, productsRes, modGroupsRes, modifiersRes, addOnsRes] = await Promise.all([
    supabase.from("menus").select("id, name, enabled, archived, revenue_centers, channel_schedules").eq("archived", false).order("sort_order"),
    supabase.from("categories").select("id, name, active, icon").eq("active", true).order("sort_order"),
    supabase.from("products").select("id, name, price, price_type, category_id, active, archived, popular, out_of_stock, dine_in, takeaway, delivery, description, sku").eq("archived", false).order("sort_order").limit(200),
    supabase.from("modifier_groups").select("id, name, required, multi_select, active").eq("active", true).order("sort_order"),
    supabase.from("modifiers").select("id, name, price, modifier_group_id, active, is_default").eq("active", true).order("sort_order"),
    supabase.from("add_ons").select("id, name, price, active").eq("active", true).order("sort_order"),
  ]);

  const menus = menusRes.data || [];
  const categories = categoriesRes.data || [];
  const products = productsRes.data || [];
  const modGroups = modGroupsRes.data || [];
  const modifiers = modifiersRes.data || [];
  const addOns = addOnsRes.data || [];

  // Build category lookup
  const categoryMap: Record<string, string> = {};
  categories.forEach((c: any) => { categoryMap[c.id] = c.name; });

  // Build modifier group lookup
  const modGroupMap: Record<string, string> = {};
  modGroups.forEach((g: any) => { modGroupMap[g.id] = g.name; });

  let context = `### Menus (${menus.length} total):\n`;
  menus.forEach((m: any) => {
    const channels: string[] = [];
    if (m.channel_schedules) {
      const cs = typeof m.channel_schedules === 'string' ? JSON.parse(m.channel_schedules) : m.channel_schedules;
      Object.entries(cs).forEach(([key, val]: [string, any]) => {
        if (val?.active) channels.push(key.toUpperCase());
      });
    }
    context += `- **${m.name}** (id: ${m.id}) — ${m.enabled ? 'Active' : 'Inactive'}${channels.length ? ` | Channels: ${channels.join(', ')}` : ''}\n`;
  });

  context += `\n### Categories (${categories.length} total):\n`;
  categories.forEach((c: any) => {
    context += `- **${c.name}** (id: ${c.id})\n`;
  });

  context += `\n### Products (${products.length} total):\n`;
  // Group products by category
  const productsByCategory: Record<string, any[]> = {};
  products.forEach((p: any) => {
    const catName = categoryMap[p.category_id] || "Uncategorized";
    if (!productsByCategory[catName]) productsByCategory[catName] = [];
    productsByCategory[catName].push(p);
  });
  Object.entries(productsByCategory).forEach(([catName, prods]) => {
    context += `  **${catName}:**\n`;
    prods.forEach((p: any) => {
      context += `  - ${p.name} — $${Number(p.price).toFixed(2)} (id: ${p.id})${!p.active ? ' [INACTIVE]' : ''}${p.out_of_stock ? ' [OUT OF STOCK]' : ''}${p.popular ? ' ⭐' : ''}\n`;
    });
  });

  context += `\n### Modifier Groups (${modGroups.length} total):\n`;
  modGroups.forEach((g: any) => {
    const groupModifiers = modifiers.filter((m: any) => m.modifier_group_id === g.id);
    context += `- **${g.name}** (id: ${g.id}) — ${g.required ? 'Required' : 'Optional'}${g.multi_select ? ', Multi-select' : ''}\n`;
    groupModifiers.forEach((m: any) => {
      context += `  - ${m.name} — $${Number(m.price).toFixed(2)}${m.is_default ? ' [DEFAULT]' : ''} (id: ${m.id})\n`;
    });
  });

  context += `\n### Add-Ons (${addOns.length} total):\n`;
  addOns.forEach((a: any) => {
    context += `- **${a.name}** — $${Number(a.price).toFixed(2)} (id: ${a.id})\n`;
  });

  return context;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, settingsContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch real database context
    let databaseContext = "Database not available";
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        databaseContext = await fetchDatabaseContext(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      } catch (e) {
        console.error("Failed to fetch database context:", e);
        databaseContext = "Error loading database data";
      }
    }

    const systemPromptWithContext = SYSTEM_PROMPT
      .replace("{DATABASE_CONTEXT}", databaseContext)
      .replace("{SETTINGS_CONTEXT}", settingsContext || "No local settings context provided");

    const apiMessages: ChatMessage[] = [
      { role: "system", content: systemPromptWithContext },
      ...messages.map((m: any) => ({ role: m.role, content: m.content }))
    ];

    console.log("Sending request to Lovable AI Gateway with", apiMessages.length, "messages");

    const maxRetries = 3;
    let lastError: Error | null = null;
    let data: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxRetries}`);
        
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: apiMessages,
            stream: false,
            temperature: 0.7,
            max_tokens: 2048,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`AI gateway error (attempt ${attempt}):`, response.status, errorText);
          
          if (response.status === 429) {
            return new Response(
              JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          if (response.status === 402) {
            return new Response(
              JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
              { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          if (response.status >= 500 && attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            continue;
          }
          throw new Error(`AI gateway returned ${response.status}: ${errorText}`);
        }

        data = await response.json();
        break;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
      }
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return new Response(
        JSON.stringify({ error: "No response from AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("AI Response received:", content.substring(0, 200));

    let parsedResponse;
    try {
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) cleanContent = cleanContent.slice(7);
      if (cleanContent.startsWith("```")) cleanContent = cleanContent.slice(3);
      if (cleanContent.endsWith("```")) cleanContent = cleanContent.slice(0, -3);
      cleanContent = cleanContent.trim();
      parsedResponse = JSON.parse(cleanContent);
    } catch {
      parsedResponse = { message: content, action: { type: "info" } };
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
