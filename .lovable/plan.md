

## Problem

The voucher mode fix was applied to `AppSidebar.tsx`, but the **actual sidebar rendered in the Layout** is `DraggableSidebar.tsx`. That's why the "New Order" link still shows as active — `DraggableSidebar.tsx` has no voucher mode logic at all.

## Plan

**File: `src/components/DraggableSidebar.tsx`**

1. Import `useVoucherMode` from the context and `Link` + `useLocation` from react-router-dom
2. Add the same `isOrdersVoucherMode` logic
3. For the Orders nav item (when `isOrdersVoucherMode && item.url === '/orders'`), render a plain `<Link>` instead of `<NavLink>` to suppress the active state — same pattern already applied in `AppSidebar.tsx`

This needs to be applied in the rendering logic around lines 240-265 where the nav items are rendered with `NavLink` and `activeClassName`.

