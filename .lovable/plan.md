

## Plan: Show Order Quick-Action Buttons in Settings AI Chat

### Problem
When the AI responds with order-related options, users must read text and type responses. Instead, options should appear as tappable buttons so users can quickly choose what they want.

### Implementation

**Modify `src/components/settings/AISettingsContent.tsx`:**

1. **Show order quick-action buttons immediately when order mode activates** - Currently the order quick-action bar (Browse Menu, Order Type, Summary, Clear) only shows at the bottom. Make these buttons also appear inline as part of the assistant's first order-mode response message, so users see clickable options right away.

2. **Add quick-reply buttons to order assistant messages** - When `handleOrderMessage` processes a response, parse the AI text for actionable options and attach them as `quickReplies` on the message. For example, after "What would you like to do?", add buttons like "Browse Menu", "Set Order Type", "Add Product", "View Summary".

3. **Auto-inject quick-reply buttons on order mode entry** - When order mode first activates (first order intent detected), the assistant welcome message should include quick-reply buttons: `["Browse Menu", "Order Type", "Add Product", "View Summary", "Go to Orders"]` so users can tap instead of type.

4. **Map quick-reply button taps to actions** - Update the quick-reply click handler to detect order-specific button labels and trigger the corresponding action directly (e.g., "Browse Menu" calls `startOrderBrowse()`, "Order Type" toggles `setShowOrderTypes(true)`, "Go to Orders" calls `goToOrdersWithData()`) instead of sending them as text messages to the AI.

### Files to Modify
- `src/components/settings/AISettingsContent.tsx` - Add quick-reply buttons to order messages, map button clicks to direct actions

