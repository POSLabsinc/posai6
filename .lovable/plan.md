

## Fix: Show meaningful order number on mobile ticket cards

**Problem**: The `orderId` prop on `MobileTicketCard` receives the full database UUID (`guest.id`), which renders as a long garbled string in the small 48px box.

**Fix**: Use `guest.check` (the check/order number like "10103", "10105") instead of `guest.id` for the `orderId` prop. Extract a short display value from it.

### Changes

**`src/pages/Tickets.tsx` (~line 2898)**
- Change `orderId={guest.id}` to `orderId={guest.check === "--" ? "--" : guest.check.slice(-3)}`
- This shows the last 3 digits of the check number (e.g., "103", "105") — matching what `checkId` already does

**`src/components/MobileTicketCard.tsx`**  
- Since `orderId` and `checkId` would now both show the last 3 chars of `check`, consolidate: show the full check number (last 4-5 chars) as the primary number in the box, and remove the duplicate `checkId` line — or keep both if they represent different data.

**Alternative approach** (cleaner): Pass `guest.check` as-is and let `MobileTicketCard` handle the truncation internally, showing something like the last 4 digits as the order number.

