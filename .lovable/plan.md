
# Fix: Open Price Status Indicator — Mobile Portrait & View Item Flow

## Root Cause Analysis

There are two separate bugs to fix, both in `src/pages/Orders.tsx`.

---

## Bug 1 — Mobile Portrait Order Panel Shows "Custom" Instead of "Open Price" Pill

### Where
Line 7377 in the mobile portrait order item row:

```tsx
{item.isOpenPrice && <span className="text-[8px] text-orange-400/70 font-medium">Custom</span>}
```

This is inconsistent with:
- **Landscape view** (line 7839/7857): renders the correct orange gradient pill badge labeled "Open Price"
- **Desktop sidebar** (line 8471): renders the correct orange gradient pill badge labeled "Open Price"

### Fix
Replace the plain text `"Custom"` span with the same orange gradient pill used in landscape and desktop:

```tsx
{item.isOpenPrice && (
  <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-[8px] font-semibold text-white whitespace-nowrap">
    Open Price
  </span>
)}
```

---

## Bug 2 — Open Price Flag Not Set When Adding via View Item

### Where
The `addToCartWithModifiers` function (lines 6537–6547) builds the new order item object but does NOT include `isOpenPrice`:

```tsx
// Current — isOpenPrice is MISSING
return [...prev, {
  id: Date.now(),
  qty: quantity,
  name: item.name,
  price: totalPrice / quantity,
  modifiers: ...,
  notes: ...,
  assignedSeats: ...,
  discountName: ...,
  discountAmount: ...
}];
```

The quick-add flow (line 8912) correctly sets `isOpenPrice: true`, but the view-item flow calls `addToCartWithModifiers` which silently drops the flag.

### Fix — Two-part

**Part A**: Update the `addToCartWithModifiers` function signature to accept an optional `isOpenPrice` parameter:

The `item` parameter already has the shape `{ id: number; name: string; price: number }`. Since `openPriceItem` has `isOpenPrice: true`, when `setSelectedItemForCustomization(itemWithPrice)` is called (line 8916), `itemWithPrice` carries `isOpenPrice: true`. The function just needs to pass it through.

Update the item object construction inside `addToCartWithModifiers` to include:
```tsx
isOpenPrice: (item as any).isOpenPrice || false,
```

This means the MenuItem shape already carries `isOpenPrice`, so reading `item.isOpenPrice` (after updating the type parameter to include it) propagates the flag automatically when the view-item flow passes `itemWithPrice` to the customization dialog, which then calls `onAddToCart` → `addToCartWithModifiers`.

**Part B**: Update the TypeScript type of the `item` parameter in `addToCartWithModifiers` to include `isOpenPrice?: boolean`:

```tsx
const addToCartWithModifiers = (item: {
  id: number;
  name: string;
  price: number;
  isOpenPrice?: boolean;   // ← add this
}, quantity: number, ...) => {
```

---

## Files to Edit

Only `src/pages/Orders.tsx` — three targeted changes:

### Change 1 — Fix mobile portrait "Custom" label (line 7377)

```tsx
// Before
{item.isOpenPrice && <span className="text-[8px] text-orange-400/70 font-medium">Custom</span>}

// After
{item.isOpenPrice && (
  <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-[8px] font-semibold text-white whitespace-nowrap">
    Open Price
  </span>
)}
```

### Change 2 — Add `isOpenPrice?` to `addToCartWithModifiers` item type (line 6525–6529)

```tsx
// Before
const addToCartWithModifiers = (item: {
  id: number;
  name: string;
  price: number;
}, quantity: number, ...

// After
const addToCartWithModifiers = (item: {
  id: number;
  name: string;
  price: number;
  isOpenPrice?: boolean;
}, quantity: number, ...
```

### Change 3 — Include `isOpenPrice` in the new cart item object (line 6537–6547)

```tsx
// After other fields, add:
isOpenPrice: item.isOpenPrice || false,
```

---

## Consistency Matrix After Fix

| View | Trigger | Badge shown |
|---|---|---|
| Mobile portrait order panel | Quick Add | Open Price pill (orange gradient) |
| Mobile portrait order panel | View Item | Open Price pill (orange gradient) ← fixed |
| Landscape order panel | Quick Add | Open Price pill (orange gradient) |
| Landscape order panel | View Item | Open Price pill (orange gradient) ← fixed |
| Desktop sidebar | Quick Add | Open Price pill (orange gradient) |
| Desktop sidebar | View Item | Open Price pill (orange gradient) ← fixed |

---

## Summary

- **1 label fix**: Replace `"Custom"` text with the proper orange gradient "Open Price" pill badge in the mobile portrait order item row.
- **2 logic fixes**: Extend the `addToCartWithModifiers` type signature and cart item constructor to carry the `isOpenPrice` flag through the view-item flow, so the badge appears regardless of how the item was added.
