

## Plan: Inline AI Assistant Actions with Business Logic Validation

### Problem
Currently, clicking quick actions (Refund, Void, Discount, etc.) in the TicketAIChatPanel closes the AI chat and opens separate dialogs. The user wants all actions to work **inline within the chat panel**, with proper business logic validation (e.g., can only refund PAID orders, cannot discount PAID orders, must have an order selected).

### Approach
Enhance `TicketAIChatPanel` to handle actions inline with validation messages, and keep the chat open. Actions that require complex UI (like the full RefundDialog or DiscountDialog) will still open their respective dialogs but the AI will first validate and confirm the action is appropriate, showing error messages inline when validation fails.

### Changes

**File: `src/components/TicketAIChatPanel.tsx`**

1. **Add order selection validation** - Before any action, check if `ticketContext` exists. If not, show inline message: "Please select an order first from the ticket list."

2. **Add status-aware validation for each action:**
   - **Refund**: Only allowed for PAID orders. If status is not PAID, show: "This order has not been paid yet. Refunds can only be processed for paid orders."
   - **Void/Cancel**: Only allowed for non-PAID orders. If PAID, show: "This order has already been paid. Use Refund instead."
   - **Discount**: Only allowed for non-PAID orders. If PAID, show: "Cannot apply discount to a paid order."
   - **Transfer**: Only allowed for non-PAID, non-CANCELLED orders.
   - **Receipt**: Allowed for all orders (no restriction).
   - **Message Kitchen**: Allowed for all orders.
   - **Reopen**: Only for PAID/CANCELLED orders.
   - **Summary**: Always allowed (already works inline).

3. **Keep chat open on action execution** - Remove `setIsAIChatOpen(false)` from ticketActions callbacks in Tickets.tsx. The dialogs open on top of the chat overlay.

4. **Add confirmation flow inline** - For destructive actions (Refund, Void), show a confirmation message in chat before triggering the action:
   - AI: "Are you sure you want to refund Order #X ($Y total)? This will process a full refund."
   - User confirms: "Yes" / clicks confirm button rendered inline
   - Then triggers the actual action

5. **Inline action buttons in chat messages** - For confirmation steps, render clickable "Confirm" / "Cancel" buttons within the assistant message bubble.

**File: `src/pages/Tickets.tsx`**

6. **Update ticketActions callbacks** - Remove `setIsAIChatOpen(false)` from all action callbacks so the chat stays open while dialogs appear on top.

7. **Pass additional context** - Add `paid` boolean and `refundedAmount` to `TicketContext` so the panel can make informed validation decisions.

### Technical Details

- New `TicketContext` fields: `paid: boolean`, `refundedAmount: number`, `cancelled: boolean`
- New state in TicketAIChatPanel: `pendingAction` to track confirmation flows
- Validation logic runs in `processTicketCommand` before calling any `ticketActions` callback
- Inline confirmation uses a special message type with action buttons rendered as part of the chat UI
- The `processTicketCommand` function becomes the validation gate, checking `ticketContext.status` before allowing actions

### Files Changed
1. **Edit** `src/components/TicketAIChatPanel.tsx` - Add validation logic, confirmation flows, inline action buttons
2. **Edit** `src/pages/Tickets.tsx` - Update ticketActions callbacks (keep chat open), pass extended context

