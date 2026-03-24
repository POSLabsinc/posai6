import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an AI assistant integrated into a POS (Point of Sale) order screen. You help staff manage orders through natural language AND answer questions about POS settings.

## NATURAL LANGUAGE UNDERSTANDING:
You MUST interpret natural, informal, and colloquial human language. Staff speak casually and fast. Apply these rules:

### Intent Recognition:
- "throw in / toss in / gimme / I need / we need / get me / can I get / let me get / hook me up with" = ADD product
- "drop / kill / nix / scratch / take off / 86 / hold the / lose the / get rid of / never mind the" = REMOVE product
- "make it X / change to / switch to / bump it up / bump it to" = UPDATE quantity or modifier
- "that's it / done / wrap it up / ring it up / close it / cash out / check please" = ready for payment
- "start over / wipe it / fresh start / new order / scratch that / redo" = CLEAR order
- "what do I have / where are we / read it back / what's the damage / how much" = SUMMARY
- "for John / name is / under / table for / guest is / customer" = SET guest name
- "dine in / eating here / for here / staying" = DINE IN order type
- "to go / takeout / take away / carry out / grab and go" = TAKE OUT order type
- "delivery / deliver / send it / drop it off" = DELIVERY order type
- "drive thru / drive through / window" = DRIVE THRU order type

### Customer Lookup & Past Orders:
- "customer name X / guest X / look up X / find X" = lookup_customer by name
- "customer number X / phone X / number X / call X / mobile X / find by number X" = lookup_customer by phone
- "repeat order / past order / last order / same as before / usual / reorder / what did they have" = get_past_orders (requires customer to be looked up first)
- "place a delivery order for customer number 0589545476 and add chicken tenders" = lookup_customer(phone=0589545476) + set_order_type(DELIVERY) + add_product(chicken tenders)
- "customer name Elston, please repeat his past order" = lookup_customer(name=Elston) + get_past_orders
- "add guest with number 9876543210" = lookup_customer(phone=9876543210), if not found inform staff

### CUSTOMER WORKFLOW:
- When user mentions a customer by name or phone, ALWAYS call lookup_customer first.
- After lookup, if the user also asks to repeat/reorder, call get_past_orders with the returned guest_id.
- After getting past orders, add the products to the cart using add_product tool calls for each product.
- When setting up a delivery/order for a customer number, first lookup the customer, then set the order type, then add requested products.
- Parse compound requests: "Place a delivery order for customer number 0589545476 and add chicken tenders" should trigger: lookup_customer + set_order_type(DELIVERY) + add_product(Chicken Tenders)

### Fuzzy Product Matching:
- Match products even with typos, partial names, abbreviations, or slang (e.g., "burg" = "Burger", "fries" = "French Fries", "coke" = "Coca-Cola")
- Use the closest match from Available Products. If multiple close matches exist, list them and ask.
- Understand plurals naturally: "2 burgers" = 2x Burger, "a couple fries" = 2x Fries
- Understand quantity words: "a" / "one" = 1, "a couple" / "two" = 2, "a few" / "three" = 3, "double" = 2, "triple" = 3

### Modifier Understanding:
- "plain / nothing on it / naked / bare" = remove all default modifiers
- "no X / without X / hold the X / skip the X / minus X / 86 X" = remove modifier X
- "extra X / more X / double X / add X / with X / plus X / loaded with X" = add modifier X
- "on the side / side of" = modifier served separately
- "light X / easy on X / go light" = reduced amount of modifier
- "sub X for Y / swap X for Y / replace X with Y / X instead of Y" = substitute

### Conversational Context:
- "same thing / another one / one more / again / repeat / ditto" = repeat last added product
- "actually / wait / hold on / change that / no wait" = correct the previous action
- "and also / oh and / plus / with a / throw in a" = add additional product to same order
- "that last one / the burger / it" = reference previously mentioned product
- "make it two / actually three" = update quantity of last mentioned product

### Multi-Intent Parsing:
- Parse compound requests: "2 burgers no onions, a large fries, and a diet coke for Mike, to go"
  = add_product_with_modifiers(Burger, 2, [No Onions]) + add_product(Fries) + add_product(Diet Coke) + set_guest_name(Mike) + set_order_type(TAKE OUT)
- "Customer name Elston, repeat his past order" = lookup_customer(name=Elston) then get_past_orders(guest_id)
- "Place a delivery order for customer number 0589545476 and add chicken tenders" = lookup_customer(phone=0589545476) + set_order_type(DELIVERY) + add_product(Chicken Tenders)

## CRITICAL RULES:
1. Use "Product" not "Item" in all text.
2. Be concise, staff use touch screens. Keep responses under 3 sentences unless listing products.
3. ALWAYS use tool calls to execute ORDER actions. NEVER just say you did something without calling the tool.
4. If the user's request is missing required info, ASK for the missing info. Do NOT guess or make up values.
5. When adding products, ALWAYS match against the Authoritative Product Catalog first, then Available Products. Use the EXACT name and price from the catalog. NEVER invent product names or prices.
6. If a product name is ambiguous, show the closest matches and ask which one.
7. You can handle multiple operations in one message.
8. After executing tool calls, confirm what was done in 1 line.
9. For order type changes, only accept: DINE IN, TAKE OUT, DELIVERY, BANQUET, DRIVE THRU, CURB SIDE.
10. When asked for a summary, list all products with quantities and prices, plus the order type and guest name.
11. NEVER hallucinate a tool call result. If you cannot find a product or fulfill a request, say so.
12. Products marked [OUT OF STOCK] must NOT be added. Inform the staff the product is unavailable.

## MODIFIER & ADD-ON RULES:
12. When the user specifies modifications, use add_product_with_modifiers instead of add_product.
13. Format modifiers as strings: "No Onions", "Extra Cheese", "Add: Ranch (+$0.50)".
14. For removal modifiers, prefix with "No " (e.g., "No Onions", "No Tomato").
15. For add-on modifiers, prefix with "Add: " (e.g., "Add: Extra Cheese (+$1.00)").
16. If the user just says "add burger" without modifiers, use the regular add_product tool.
17. Calculate modifier_price_total by summing prices of any paid modifiers/add-ons mentioned.

## SETTINGS QUESTIONS:
18. When users ask about settings (discounts, taxes, service charges, gratuity, menus, categories, modifiers, etc.), answer using the Settings Context below.
19. For settings questions, respond with plain text, do NOT use tool calls.
20. You can tell users about current configuration, active discounts, tax rates, tip settings, checkout options, etc.
21. If asked to CHANGE settings, tell them to use the Settings AI assistant (accessible from the Settings screen) as you can only view settings, not modify them from the order screen.

## CUSTOMER RULES:
22. When looking up a customer, use lookup_customer with either name or phone.
23. After a successful lookup, ALWAYS call set_guest_name with the found customer's name AND set_guest_phone with their phone number. This triggers the past order popup automatically.
24. When asked to repeat a past order, first ensure the customer is looked up, then call get_past_orders.
25. After receiving past order data, add each product to the cart using add_product calls.
26. If no customer is found by phone, ask the staff if they want to create a new guest. If they confirm (or if the original request implies adding), call create_guest with the phone number and name.
27. Phone numbers can be in any format (with or without country code, dashes, spaces). Always pass the raw digits to lookup_customer.
28. When user says "add guest" or "find guest" with a phone number, use lookup_customer with the phone parameter. If not found, offer to create.
29. After creating a new guest, call set_guest_name and set_guest_phone to link them to the current order.`;

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
      name: "set_guest_phone",
      description: "Set the guest phone number for the order. Use after looking up a customer to populate the phone field.",
      parameters: {
        type: "object",
        properties: {
          phone: { type: "string", description: "The guest phone number" },
        },
        required: ["phone"],
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
  {
    type: "function",
    function: {
      name: "lookup_customer",
      description: "Look up a customer/guest by name or phone number to find their profile and order history",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Customer name to search for" },
          phone: { type: "string", description: "Customer phone number to search for" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_past_orders",
      description: "Get past order history for a customer to repeat/reorder their previous products",
      parameters: {
        type: "object",
        properties: {
          guest_id: { type: "string", description: "The guest ID from a previous lookup_customer call" },
        },
        required: ["guest_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_guest",
      description: "Create a new guest in the guest book when no existing guest is found. Use after a failed lookup_customer when the user wants to add a new guest.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Guest name" },
          phone: { type: "string", description: "Guest phone number" },
          email: { type: "string", description: "Guest email (optional)" },
        },
        required: ["name", "phone"],
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
    const { data } = await supabase.from("taxes").select("name, amount, type, applicable_to, archived").eq("device_id", sharedDeviceId).eq("archived", false);
    if (data?.length) {
      parts.push(`### Taxes (${data.length}):`);
      data.forEach((t: any) => parts.push(`- ${t.name}: ${t.amount}${t.type === "Percentage" || t.type === "Exclusive" || t.type === "Inclusive" ? `% (${t.type})` : " flat"} on ${t.applicable_to || "All Products"}`));
    } else {
      parts.push("### Taxes: none configured");
    }
  })());

  // Service Charges
  promises.push((async () => {
    const { data } = await supabase.from("service_charges").select("name, amount, type, order_type, automatic_apply, min_seats, archived, is_active").eq("device_id", sharedDeviceId).eq("archived", false);
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

// Customer lookup from DB
async function lookupCustomer(supabaseUrl: string, serviceRoleKey: string, name?: string, phone?: string): Promise<any> {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  let query = supabase.from("guests").select("id, name, phone, email, loyalty, order_count, last_order_date, loyalty_points_balance").eq("is_archived", false);

  if (phone) {
    const cleanDigits = phone.replace(/\D/g, "");
    if (cleanDigits.length >= 4) {
      // Try matching last 10 digits, or fewer if phone is short
      const matchDigits = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;
      query = query.ilike("phone", `%${matchDigits}%`);
    } else {
      return { found: false, message: `Phone number "${phone}" is too short. Please provide at least 4 digits.` };
    }
  } else if (name) {
    query = query.ilike("name", `%${name.trim()}%`);
  } else {
    return { found: false, message: "Please provide a customer name or phone number." };
  }

  const { data, error } = await query.limit(5);
  if (error || !data?.length) return { found: false, message: `No customer found${name ? ` named "${name}"` : ""}${phone ? ` with phone "${phone}"` : ""}. You can create a new guest using create_guest.` };

  if (data.length === 1) {
    const g = data[0];
    return { found: true, guest_id: g.id, name: g.name, phone: g.phone || "", email: g.email || "", loyalty: g.loyalty || "None", order_count: g.order_count || 0, last_order_date: g.last_order_date || "Never", points: g.loyalty_points_balance || 0 };
  }
  return { found: true, multiple: true, customers: data.map((g: any) => ({ guest_id: g.id, name: g.name, phone: g.phone || "", order_count: g.order_count || 0 })) };
}

// Create a new guest in the database
async function createGuest(supabaseUrl: string, serviceRoleKey: string, name: string, phone: string, email?: string): Promise<any> {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const cleanPhone = phone.replace(/\D/g, "");
  
  // Check for existing guest with same phone to avoid duplicates
  if (cleanPhone.length >= 4) {
    const { data: existing } = await supabase.from("guests").select("id, name, phone").eq("is_archived", false).ilike("phone", `%${cleanPhone.slice(-10)}%`).limit(1);
    if (existing?.length) {
      return { created: false, existing: true, guest_id: existing[0].id, name: existing[0].name, phone: existing[0].phone, message: `A guest with phone ${phone} already exists: ${existing[0].name}. Using existing guest.` };
    }
  }

  const initials = name.split(" ").map((w: string) => w[0]?.toUpperCase()).join("").slice(0, 2);
  const bgColors = ["#6B7280", "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"];
  const avatarBg = bgColors[Math.floor(Math.random() * bgColors.length)];

  const { data, error } = await supabase.from("guests").insert({
    name,
    phone: cleanPhone,
    email: email || "",
    initials,
    avatar_bg: avatarBg,
    since: new Date().toISOString().split("T")[0],
  }).select("id, name, phone, email").single();

  if (error) return { created: false, message: `Failed to create guest: ${error.message}` };
  return { created: true, guest_id: data.id, name: data.name, phone: data.phone, email: data.email || "", message: `New guest "${name}" created successfully.` };
}

// Get past orders for a guest
async function getPastOrders(supabaseUrl: string, serviceRoleKey: string, guestId: string): Promise<any> {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: orders, error } = await supabase.from("orders").select("id, order_number, total, order_type, created_at").eq("guest_id", guestId).order("created_at", { ascending: false }).limit(3);
  if (error || !orders?.length) return { found: false, message: "No past orders found for this customer." };

  const orderIds = orders.map((o: any) => o.id);
  const { data: items } = await supabase.from("order_items").select("order_id, item_name, quantity, unit_price").in("order_id", orderIds);

  const result = orders.map((o: any) => ({
    order_number: o.order_number,
    total: o.total,
    order_type: o.order_type,
    date: o.created_at,
    products: (items || []).filter((i: any) => i.order_id === o.id).map((i: any) => ({ name: i.item_name, qty: i.quantity, price: i.unit_price }))
  }));
  return { found: true, orders: result };
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
      fetchPromises.push((async () => {
        try { aiRulesContext = await fetchAIRules(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY); } catch (e) { console.error("Failed to fetch AI rules:", e); }
      })());
      if (needsSettings) {
        fetchPromises.push((async () => {
          try { settingsContext = "\n## Settings Context:\n" + await fetchSettingsContext(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY); } catch (e) { console.error("Failed to fetch settings:", e); }
        })());
      }
      await Promise.all(fetchPromises);
    }

    // Fetch authoritative product list from DB to ensure AI is always in sync
    let dbProductsContext = "";
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: products } = await supabase
          .from("products")
          .select("id, name, price, category_id, active, archived, is_available, stock_count, categories(name)")
          .eq("active", true)
          .eq("archived", false)
          .order("sort_order");
        if (products?.length) {
          dbProductsContext = "\n## Authoritative Product Catalog (from database, use this over client list):\n" +
            products.map((p: any) => {
              const catName = (p as any).categories?.name || "Uncategorized";
              const stock = p.is_available === false ? " [OUT OF STOCK]" : (p.stock_count !== null ? ` [Stock: ${p.stock_count}]` : "");
              return `- ${p.name}: $${Number(p.price).toFixed(2)} | Category: ${catName} | ID: ${p.id}${stock}`;
            }).join("\n");
        }
      } catch (e) {
        console.error("Failed to fetch products from DB:", e);
      }
    }

    const fullSystemPrompt = SYSTEM_PROMPT + "\n\n" + contextMessage + dbProductsContext + settingsContext + aiRulesContext;
    const conversationMessages = (messages || []).slice(-12);

    // First AI call (non-streaming) to check for server-side tool calls
    const firstResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: fullSystemPrompt }, ...conversationMessages],
        tools,
        stream: false,
      }),
    });

    if (!firstResponse.ok) {
      const status = firstResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Payment required, please add funds." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await firstResponse.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const firstResult = await firstResponse.json();
    const firstChoice = firstResult.choices?.[0];
    const toolCalls = firstChoice?.message?.tool_calls;

    // Check if any server-side tools (lookup_customer, get_past_orders) need execution
    const serverToolNames = ["lookup_customer", "get_past_orders"];
    const hasServerTools = toolCalls?.some((tc: any) => serverToolNames.includes(tc.function?.name));

    if (hasServerTools && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      // Execute server-side tools and build tool results
      const toolResults: any[] = [];
      for (const tc of toolCalls) {
        const fnName = tc.function?.name;
        const args = typeof tc.function?.arguments === "string" ? JSON.parse(tc.function.arguments) : tc.function?.arguments || {};

        if (fnName === "lookup_customer") {
          const result = await lookupCustomer(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, args.name, args.phone);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: JSON.stringify(result) });
        } else if (fnName === "get_past_orders") {
          const result = await getPastOrders(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, args.guest_id);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: JSON.stringify(result) });
        }
      }

      // Second AI call (streaming) with tool results - let AI decide next actions
      const followUpMessages = [
        { role: "system", content: fullSystemPrompt },
        ...conversationMessages,
        firstChoice.message,
        ...toolResults,
      ];

      const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: followUpMessages,
          tools,
          stream: true,
        }),
      });

      if (!streamResponse.ok) {
        const t = await streamResponse.text();
        console.error("AI follow-up error:", streamResponse.status, t);
        return new Response(JSON.stringify({ error: "AI follow-up error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(streamResponse.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    // No server-side tools needed - stream directly
    const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: fullSystemPrompt }, ...conversationMessages],
        tools,
        stream: true,
      }),
    });

    if (!streamResponse.ok) {
      const status = streamResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Payment required, please add funds." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await streamResponse.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(streamResponse.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("order-ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
