

## Plan: Ticket-Specific AI Assistant Panel

### Problem
The AI assistant on the Tickets screen currently shows New Order actions (Add Product, Order Type, Guest, Note, Summary, Pay, Clear). These are irrelevant on the Tickets screen where users manage existing orders. We need ticket-specific actions.

### Approach
Create a new `TicketAIChatPanel` component specifically for the Tickets screen, with quick actions and AI capabilities tailored to ticket operations.

### Ticket Actions to Include

Based on the existing Tickets screen functionality, the AI assistant will support these quick actions:

1. **Refund** - Initiate refund flow for the selected ticket
2. **Void** - Void/cancel the selected order
3. **Transfer** - Transfer order to another table/order
4. **Receipt** - Print/send receipt for the ticket
5. **Discount** - Apply discount to the ticket
6. **Message Kitchen** - Send message to kitchen
7. **Order Summary** - Show details of the selected ticket
8. **Reopen** - Reopen a closed/paid ticket

### AI Chat Capabilities

The AI will understand natural language commands like:
- "Refund this order"
- "Void order #6"
- "Transfer this to Table 5"
- "Print the receipt"
- "Apply 10% discount"
- "Send a message to the kitchen"
- "Show me the order summary"
- "Reopen this ticket"

### Technical Details

**New file: `src/components/TicketAIChatPanel.tsx`**
- New component modeled after `OrderAIChatPanel` but with ticket-specific logic
- Welcome message updated with ticket-relevant example commands
- Quick action buttons replaced with: Refund, Void, Transfer, Receipt, Discount, Message Kitchen, Summary, Reopen
- `TicketActions` interface with callbacks: `openRefund`, `openVoid`, `openTransfer`, `openReceipt`, `openDiscount`, `openMessageKitchen`, `reopenOrder`
- `TicketContext` interface with: order ID, order number, guest name, status, total, payment type, items, table
- AI chat sends ticket context to the edge function for contextual responses
- Quick actions trigger the corresponding dialogs/flows in the parent Tickets page

**Modified file: `src/pages/Tickets.tsx`**
- Replace `OrderAIChatPanel` import with `TicketAIChatPanel`
- Pass `ticketActions` callbacks that trigger existing state setters (e.g., `setShowRefundConfirmation`, `setShowTransferIntentDialog`, `setIsDiscountDialogOpen`, `setShowMessageKitchen`, `setShowReceiptOptions`)
- Pass `ticketContext` with the selected guest's order data

### Files Changed
1. **Create** `src/components/TicketAIChatPanel.tsx` - New ticket-specific AI panel
2. **Edit** `src/pages/Tickets.tsx` - Swap panel component and wire up callbacks

