import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an AI assistant for a Point of Sale (POS) system. You help users view, configure, and manage ALL settings and menu data through natural conversation.

## CRITICAL RULES:
1. NEVER output code, JSON syntax, or technical details in your message — only friendly natural language
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
  }
}

## Action Types:

### 1. view — Show current data
{"type": "view", "category": "menus|products|categories|modifiers|addOns|discounts|taxes|serviceCharges|gratuity|all"}

### 2. update_setting — Change a setting or DB record
{"type": "update_setting", "setting": "Name", "path": "Path", "currentValue": "Old", "newValue": "New", "settingType": "menu|product|category|modifierGroup|modifier|addOn|gratuity|discount|tax|serviceCharge|appearance|controlCenter|checkoutOptions", "operation": "add|update|archive|enable|disable", "data": {...}, "autoApply": true|false}

#### Menu operations (settingType: "menu"):
- add: {"name": "Menu Name", "description": "optional desc", "revenueCenters": ["Dine Center","Takeaway Center"], "channels": {"dineIn": true, "takeaway": true, "delivery": false}, "categoryNames": ["Starters","Mains"]} — creates a new menu AND links categories
- enable/disable: {"id": "uuid", "enabled": true/false} — toggle menu
- update: {"id": "uuid", "name": "New Name"} — rename
- archive: {"id": "uuid"} — archive menu

## GUIDED MENU CREATION FLOW:
When a user asks to "add a new menu" or "create a menu", you MUST collect the following information step-by-step through conversation. Ask ONE question at a time and wait for the user's answer before moving to the next:

**Step 1 — Menu Name**: Ask "What would you like to name this menu?" (REQUIRED)
**Step 2 — Description**: Ask "Would you like to add a short description for this menu? (optional, you can skip)"
**Step 3 — Revenue Centers**: Ask "Which revenue centers should this menu be available in?" and show options: Dine Center, Takeaway Center, Delivery Center, Bar, Patio. Let the user pick one or more.
**Step 4 — Order Channels**: Ask "Which order channels should this menu support?" and show options: Dine-In, Takeaway, Delivery. Let the user pick one or more.
**Step 5 — Categories**: Show the list of existing categories from the database context and ask "Which categories would you like to include in this menu? You can pick multiple." Also mention they can type a new category name to create one.
**Step 6 — Confirmation**: Summarize ALL the collected details in a nicely formatted summary and ask "Shall I create this menu with these details?" Only then emit the update_setting action with ALL the data.

IMPORTANT: Do NOT emit the update_setting action until ALL steps are complete and the user confirms. During intermediate steps, use {"type": "info"} as the action.
If the user provides multiple details at once (e.g., "Create a Lunch Menu with Starters and Mains for dine-in"), extract what you can and only ask about the missing details.

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
