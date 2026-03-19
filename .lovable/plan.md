

## Plan: Two-Column Grid Layout for Discount List

### Overview
Change the discount items in `DiscountDialog.tsx` from a single-column vertical list to a 2-column grid layout.

### Changes

**File: `src/components/DiscountDialog.tsx`** (lines 493-494)

1. Replace `<div className="p-3 space-y-2">` with `<div className="p-3 grid grid-cols-2 gap-2">` to render discount items in a 2-column grid.

2. Inside each discount button (line 502), change from horizontal layout (`flex items-center justify-between`) to a more compact vertical/stacked layout suitable for grid cells — stack the icon + name on top, value badge below.

### Layout
```text
┌──────────────────┬──────────────────┐
│ 👤 Employee      │ ❤️ Senior Citizen │
│ 20% off          │ 15% off          │
├──────────────────┼──────────────────┤
│ 🎓 Student       │ 🛡️ Military      │
│ 10% off          │ 15% off          │
├──────────────────┼──────────────────┤
│ ⭐ Loyalty Member │ 🕐 Happy Hour    │
│ 5% off           │ 25% off          │
└──────────────────┴──────────────────┘
```

### Technical Detail
- Change the container from `space-y-2` to `grid grid-cols-2 gap-2`
- Restructure each item button from a horizontal row to a compact card with icon+name on top and value badge below
- Keep all existing selection, toggle, and reason-required badge logic intact

