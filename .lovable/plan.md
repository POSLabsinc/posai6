

## Problem

The "New Order" (Orders) nav link in the left sidebar stays visually active even when in Voucher Mode. The current approach passes an empty `activeClassName` string when in voucher mode, but this doesn't work because React Router's `NavLink` still applies its own active matching — the link is still considered "active" by the router since the URL is `/orders`.

The issue is that `cn(className, true && '')` still leaves the base `className` applied, including `hover:bg-sidebar-accent`. But the real problem may be that the router's own aria-current or internal active state adds some default styling, or that the `activeClassName=""` approach isn't enough to visually distinguish it.

## Root Cause

Looking more carefully: `activeClassName=""` should work to not add extra classes. But the NavLink still gets `aria-current="page"` from React Router, which might trigger browser default styles or Tailwind's `aria-` selectors. Additionally, the sidebar nav items might have a visual active state from another source.

## Plan

1. **In `AppSidebar.tsx`** — Instead of just emptying `activeClassName`, also override the base `className` to explicitly remove any active-looking styles when in voucher mode for the Orders link. Add a forced non-active appearance:

   - When `isOrdersVoucherMode && item.url === '/orders'`:
     - Set `activeClassName` to `''` (already done)
     - Also use a regular `<Link>` instead of `NavLink`, OR add `aria-current={undefined}` to prevent router active styling
     - Alternatively, the simplest fix: use the `end` prop or add explicit `className` override for the active state using the NavLink's function-based className approach directly

2. **Simplest fix**: In `NavLink.tsx` component, when `activeClassName` is empty string and `isActive` is true, explicitly ensure no active styles are applied. Or better: in `AppSidebar.tsx`, for the Orders item when in voucher mode, render a plain `<Link>` instead of `<NavLink>` to completely avoid active state detection.

### Implementation

**File: `src/components/AppSidebar.tsx`** (lines 100-111)

For the Orders menu item when `isOrdersVoucherMode` is true, render a plain `<Link>` (from react-router-dom) instead of `<NavLink>` to completely bypass active state detection:

```tsx
import { Link, useLocation } from "react-router-dom";

// In the render, for the default nav items:
{isOrdersVoucherMode && item.url === '/orders' ? (
  <Link
    to={item.url}
    className="w-full h-full flex items-center justify-center rounded-xl hover:bg-sidebar-accent transition-colors"
  >
    <img src={item.icon as string} alt={item.title} className={imgSize} />
  </Link>
) : (
  <NavLink
    to={item.url}
    className="w-full h-full flex items-center justify-center rounded-xl hover:bg-sidebar-accent transition-colors"
    activeClassName="bg-sidebar-accent text-sidebar-accent-foreground border-2 border-white"
  >
    {/* existing icon rendering */}
  </NavLink>
)}
```

This guarantees no active styling leaks through when the user is in voucher mode.

