
# Fix: Price Override Triggered for Open Price Items in ItemCustomizationDialog

## Root Cause

There are two places where the fix needs to be applied, both in `src/components/ItemCustomizationDialog.tsx`.

### Why It Happens

When a user views an open price item (via "View Item") and the customization dialog opens (`ItemCustomizationDialog`), tapping the price display calls `handlePriceClick`. This function has **no awareness of open price items** — it blindly opens the MPIN screen, then proceeds to the Price Override flow.

By contrast, the **mobile/inline** path uses `InlineItemCustomization.tsx`, which already correctly guards against this:

```tsx
// InlineItemCustomization.tsx line 241-243 — ALREADY CORRECT
const handlePriceClick = () => {
  if (item.isOpenPrice) return;  // ← guard exists here
  ...
};
```

But `ItemCustomizationDialog.tsx` is missing this guard entirely, and its local `MenuItem` interface does not even include `isOpenPrice`:

```tsx
// ItemCustomizationDialog.tsx lines 53-57 — MISSING isOpenPrice
interface MenuItem {
  id: number;
  name: string;
  price: number;   // isOpenPrice is absent
}
```

```tsx
// ItemCustomizationDialog.tsx lines 409-415 — NO guard
const handlePriceClick = () => {
  if (isManager) {
    setCurrentView('priceOverride');  // ← proceeds even for open price items
  } else {
    setCurrentView('mpin');           // ← same issue
  }
};
```

---

## Files to Edit

Only `src/components/ItemCustomizationDialog.tsx` — two targeted changes.

---

### Change 1 — Add `isOpenPrice` to the local `MenuItem` interface (line 53-57)

```tsx
// Before
interface MenuItem {
  id: number;
  name: string;
  price: number;
}

// After
interface MenuItem {
  id: number;
  name: string;
  price: number;
  isOpenPrice?: boolean;
}
```

This allows the component to read the `isOpenPrice` property from the item passed in from `Orders.tsx` (which already passes `selectedItemForCustomization` with `isOpenPrice: true` for open price items).

---

### Change 2 — Add open price guard to `handlePriceClick` (lines 409-415)

```tsx
// Before
const handlePriceClick = () => {
  if (isManager) {
    setCurrentView('priceOverride');
  } else {
    setCurrentView('mpin');
  }
};

// After
const handlePriceClick = () => {
  if (item?.isOpenPrice) return;   // ← block MPIN/price override for open price items
  if (isManager) {
    setCurrentView('priceOverride');
  } else {
    setCurrentView('mpin');
  }
};
```

---

## Visual Impact on the Price Button

Additionally, the price button in the customization view should visually indicate it is non-interactive for open price items (matching what `InlineItemCustomization.tsx` already does at line 659):

```tsx
// InlineItemCustomization.tsx line 659 — reference for styling
className={`bg-neutral-700 px-2 py-1 rounded-lg transition-colors ${item.isOpenPrice ? 'cursor-default' : 'hover:bg-neutral-600 cursor-pointer'}`}
```

The same conditional styling will be applied to the price button in `ItemCustomizationDialog.tsx` (around line 1052) so the cursor and hover state reflect the non-clickable nature.

---

## Consistency Matrix After Fix

| Customization Path | Price Tap Behavior |
|---|---|
| InlineItemCustomization (mobile) | Blocked for open price items (already correct) |
| ItemCustomizationDialog (desktop/modal) | Blocked for open price items (fixed by this plan) |

---

## Summary

- **1 type fix**: Add `isOpenPrice?: boolean` to the local `MenuItem` interface in `ItemCustomizationDialog.tsx` so the prop flows through.
- **1 logic fix**: Add an early return guard `if (item?.isOpenPrice) return;` at the top of `handlePriceClick` in `ItemCustomizationDialog.tsx`.
- **1 style fix**: Update the price button's `className` to use `cursor-default` (no hover) when the item is open price, matching the inline customization component.
