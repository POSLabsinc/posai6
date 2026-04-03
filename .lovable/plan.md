

## Plan: Kitchen Message Icon with Chat Thread in Order Panel

### What We Are Building
A message icon in the order panel header (before the server name like "Mia Jones") that:
1. Shows a small envelope/message icon for orders that have been sent kitchen messages
2. Shows a red notification dot when there are unread kitchen replies for that order
3. Opens a chat-style popup showing the full conversation thread (sent messages + kitchen replies) with timestamps, sender names, and device info

### How It Works

**Message Icon Placement**: In the desktop order panel header (line ~3393 in Tickets.tsx), add a clickable message icon before the server name. The icon only appears if there are messages for the selected order.

**Red Notification Dot**: Query `notifications` table for unread "Kitchen Reply" entries matching the order number. If any exist, show a red dot on the message icon.

**Chat Popup**: When clicked, open a dialog/popover showing:
- Each sent message (from POS to kitchen) with: message text, sender name, device/terminal, timestamp
- Each kitchen reply (from notifications) below the corresponding sent message
- Chat bubble style, POS messages on right, kitchen replies on left
- Auto-scroll to latest message

### Technical Details

**Data Sources**:
- **Sent messages**: Query `kds_messages` table filtered by `linked_order_id` matching `selectedGuest.id`
- **Kitchen replies**: Query `notifications` table where `title LIKE 'Kitchen Reply - Order #X'` to get reply text, parsed from the `body` field

**New Component**: `src/components/OrderMessageThread.tsx`
- Props: `orderId`, `orderNumber`, `open`, `onOpenChange`
- Fetches kds_messages for the order + notifications for kitchen replies
- Renders chat-style thread with timestamps and metadata
- Realtime subscription on both tables for live updates

**Files Changed**:
1. **Create** `src/components/OrderMessageThread.tsx` - Chat thread popup component
2. **Edit** `src/pages/Tickets.tsx` - Add message icon with red dot in desktop order panel header (line ~3393) and mobile panel header (line ~2170), add state for thread dialog, wire up data queries

**Icon Behavior**:
- Always visible in header if order has any kds_messages
- Red dot appears when there are unread kitchen reply notifications for that order
- Click opens the `OrderMessageThread` popup
- Clicking the thread marks related notifications as read

