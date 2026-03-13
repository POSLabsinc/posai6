

## Fix: Display Order Number and Check Number on Ticket Cards

**Problem**: Both `orderId` and `checkId` on `MobileTicketCard` currently show the same value (`guest.check.slice(-3)`). They should show distinct values: the order number and the check number.

**Data**:
- `guest.id` = UUID like `00000000-0000-0000-0000-000000000003` → order number "003"
- `guest.check` = check number like `123443` or `--`

### Change

**`src/pages/Tickets.tsx` (~line 2898-2899)**

```tsx
// FROM:
orderId={guest.check === "--" ? "--" : guest.check.slice(-3)}
checkId={guest.check === "--" ? "000" : guest.check.slice(-3)}

// TO:
orderId={guest.id.slice(-3)}
checkId={guest.check === "--" ? "--" : guest.check}
```

This shows:
- **Big number** (orderId): last 3 digits of the UUID (e.g., "003", "008")
- **Small text** (checkId): the full check number (e.g., "123443") or "--"

The `MobileTicketCard` component already has `truncate` on both spans, so longer check numbers will be handled gracefully.

