

## Plan: Inline Chat Box for Order Messages (Replace Popup)

### What Changes

Replace the current popup/dialog that opens when clicking the MessageSquare icon in the order panel with an inline chat box that expands directly within the order panel. The chat box will also include a reply input so the user can send messages back to the kitchen from the same place.

### Implementation Steps

**1. Convert OrderMessageThread from Dialog to Inline Panel**
- Remove Dialog/DialogContent wrapper
- Make it a regular div component that renders inline when `open` is true
- Add a text input + send button at the bottom for replying
- Reply sends a new `kds_messages` record (same as MessageKitchenDialog logic)
- Keep all existing data fetching, realtime subscriptions, and mark-as-read logic

**2. Embed Inline Chat in Order Panel (Tickets.tsx)**
- In both order panel layouts (around lines 2186 and 3421), replace `setShowMessageThread(true)` with a toggle (`setShowMessageThread(prev => !prev)`)
- Remove the `<OrderMessageThread>` from the bottom of the file (where it renders as a Dialog)
- Instead, render the inline chat component directly within the order panel content area, below the order info header, when `showMessageThread` is true
- The chat box will slide in/expand below the header, pushing order items down, or overlay on top of them

**3. Reply Functionality in Inline Chat**
- Add a text input and send button at the bottom of the inline chat
- On send, insert a new row into `kds_messages` with:
  - `conversation_id`: order ID
  - `linked_order_id`: current order ID
  - `linked_order_number`: current order number
  - `role: "user"` / `employee_name` from current context
  - `message_text`: the typed reply
- The realtime subscription will automatically pick up the new message

### Files to Modify
- `src/components/OrderMessageThread.tsx` - Convert from Dialog to inline panel, add reply input
- `src/pages/Tickets.tsx` - Embed inline chat in order panel, toggle behavior on icon click

### Visual Behavior
- Click message icon: toggles the chat box open/closed in place
- Chat box appears within the order panel with message bubbles and a reply input at the bottom
- Same styling as current thread (orange bubbles for sent, neutral for kitchen replies)
- Metadata (sender, device, time) shown below each bubble as before

