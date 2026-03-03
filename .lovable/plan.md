

## Plan: Display Messages as Standard KDS Ticket Cards

**Goal**: Remove the separate `MessagesCard` component and instead render each pending kitchen message as a regular ticket card in the KDS grid, styled consistently with order tickets but with a distinct visual indicator (e.g., violet header instead of time-based colors).

### Changes (single file: `src/pages/KDS.tsx`)

1. **Remove the `MessagesCard` component** entirely.

2. **Convert messages to KDS tickets**: In the main KDS component, poll `kds_message_queue` from localStorage (as currently done in MessagesCard), and map each active message into a `KDSTicket`-compatible object with:
   - `orderNumber`: "MSG" or a short label
   - `type`: "MESSAGE" 
   - A single product entry containing the message text
   - Violet/indigo header color to distinguish from food orders
   - "ACKNOWLEDGE" button in place of "BUMP"

3. **Merge message tickets into the main ticket list**, rendering them alongside real order tickets in the grid using the same `TicketCard` layout (or a slight variant that handles the message type).

4. **Remove the `<MessagesCard />` reference** from the grid JSX.

This keeps the KDS grid uniform — every card follows the same layout pattern — while messages remain visually distinguishable via their header color and "MESSAGE" label.

