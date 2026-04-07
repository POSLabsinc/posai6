

## Plan: Handle Order Commands Inline in Settings AI Chat

### Problem
When a user types an order-related command (e.g., "create a new order") in the Settings AI chat, the previous plan was to redirect them to the Orders screen. The user wants the order options and responses to appear directly within the Settings AI chat, matching how the Orders AI chat panel works.

### Approach
Detect order-related commands in the Settings AI chat and forward them to the `order-ai-chat` edge function instead of `ai-settings-chat`. Display the responses (including product browsing, order type selection, quick replies) inline in the Settings AI chat panel.

### Implementation Steps

**1. Add order-intent detection in `AISettingsContent.tsx`**
- Before calling `ai-settings-chat`, check if the message matches order keywords ("create order", "new order", "add product", "place order", etc.)
- If detected, call the `order-ai-chat` edge function instead, passing the message with a minimal order context

**2. Add order action UI elements to `AISettingsContent.tsx`**
- Import and reuse the same quick-action buttons from `OrderAIChatPanel` (Browse Menu, Order Type, Notes)
- Add state for order-related browse mode, pending products, and order type selection
- Render product cards, category selectors, and order type chips inline in the chat when in order mode

**3. Handle order tool calls in Settings AI**
- Add `processToolCalls` handling for order-specific tools (`add_product`, `set_order_type`, etc.)
- Since there is no active order panel on the Settings screen, accumulate order data locally and provide a "Go to Orders to finalize" action, or fire a navigation event with the built order data

**4. Add order context state management**
- Track a local `orderItems`, `orderType`, `guestName` state within the Settings AI chat
- Pass this as `orderContext` to the `order-ai-chat` edge function for follow-up messages
- Show a mini order summary card in the chat as products are added

### Files to Modify
- `src/components/settings/AISettingsContent.tsx` - Add order-intent detection, dual edge function routing, order UI elements, local order state
- No new files needed; reuse existing `order-ai-chat` edge function

### Key Detail
The Settings AI chat will act as a lightweight order builder. Once the user finishes building the order, a "Proceed to Orders" button navigates them to the Orders screen with the order data pre-populated via URL params or a shared state store.

