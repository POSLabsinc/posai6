import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an AI assistant integrated into a POS (Point of Sale) order screen. You help staff manage orders through natural language.

## RULES:
1. Use "Product" not "Item" in all text.
2. Be concise - staff use touch screens.
3. When the user asks to add a product, use the add_product tool.
4. When the user asks to remove a product, use the remove_product tool.
5. When the user asks to change quantity, use the update_quantity tool.
6. When the user asks to set/change order type, use the set_order_type tool.
7. When the user asks to set guest name, use the set_guest_name tool.
8. When the user asks to clear/cancel the order, use the clear_order tool.
9. When the user asks to add notes, use the set_order_notes tool.
10. ONLY reference products from the Available Products list provided in context.
11. If a product is not found, suggest similar ones from the available list.
12. For ambiguous product names, ask for clarification with the closest matches.
13. You can handle multiple operations in one message (e.g., "add 2 burgers and a coke").
14. Confirm actions after executing them.
15. When listing products or order summary, format neatly with prices.`;

const tools = [
  {
    type: "function",
    function: {
      name: "add_product",
      description: "Add a product to the current order",
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

    // Build context message with current order state and available products
    const contextMessage = `
## Current Order State:
- Order Type: ${orderContext?.orderType || "DINE IN"}
- Guest Name: ${orderContext?.guestName || "Not set"}
- Products in cart: ${orderContext?.orderItems?.length > 0
      ? orderContext.orderItems.map((i: any) => `${i.name} x${i.qty} ($${i.price.toFixed(2)})`).join(", ")
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
