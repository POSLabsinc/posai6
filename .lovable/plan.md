

## Problem

The order summary bar in the Tickets module wraps to two lines because the four values (Sub Total, Discount, Service Charge, Tax) are grouped into two rigid inner `div` containers:

```text
Current structure:
<flex-wrap parent>
  <div> Sub Total | Discount </div>     ← forced pair
  <div> Service Charge | Tax </div>     ← forced pair (always wraps together)
</flex-wrap>
```

This forces "Service Charge" and "Tax" onto a second row even when there's space. The first screenshot (New Order) works correctly because its items flow freely and wrap only when needed.

## Fix

Remove the two inner grouping `div`s so all four summary items are direct children of the `flex-wrap` parent. They'll wrap naturally based on available width, matching the New Order behavior.

```text
Target structure:
<flex-wrap parent>
  Sub Total | Discount | Service Charge | Tax   ← flows naturally, wraps only when needed
</flex-wrap>
```

### Locations in `src/pages/Tickets.tsx`

1. **Desktop layout** (~lines 2620-2647) — Remove inner grouping divs around Sub Total/Discount and Service Charge/Tax
2. **Tablet layout** (~lines 3778-3819) — Same restructure
3. **Mobile layout** (~lines 4624-4651) — Same restructure

No logic changes needed — only the container structure changes so items wrap individually instead of in forced pairs.

