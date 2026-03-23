import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an AI assistant integrated into a POS (Point of Sale) order screen. You help staff manage orders through natural language.

## CRITICAL RULES:
1. Use "Product" not "Item" in all text.
2. Be concise - staff use touch screens. Keep responses under 3 sentences unless listing products.
3. ALWAYS use tool calls to execute actions. NEVER just say you did something without calling the tool.
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
17. Calculate modifier_price_total by summing prices of any paid modifiers/add-ons mentioned.`;

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, orderContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + "\n\n" + contextMessage },
          ...messages,
        ],
        tools,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("order-ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
