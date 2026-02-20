
# Fix Mobile Order Summary Card

## Problem Analysis

In `src/pages/Orders.tsx` (lines 7536–7549), the mobile order summary bar has three issues:

1. **Abbreviated labels**: Shows `Sub:`, `Disc:`, `Svc:` instead of the full `Sub Total:`, `Discount:`, `Service Charge:`
2. **Tax is missing**: The Tax field is completely absent from the mobile summary
3. **Zero-value rows always show**: Discount and Service Charge display even when their values are $0.00

The screenshot the user shared shows the desktop view (which already has proper full labels and a two-row layout). The mobile fix needs to match the same clarity.

---

## Current Mobile Summary Code (lines 7536–7549)

```tsx
{orderItems.length > 0 && <div className="px-2 py-1 border-t border-sidebar-border text-xs flex items-center justify-between gap-2">
  <div className="flex items-center gap-1">
    <span className="text-muted-foreground">Sub:</span>
    <span className="text-foreground">${subtotal.toFixed(2)}</span>
  </div>
  <div className="flex items-center gap-1">
    <span className="text-red-500">{selectedDiscount ? selectedDiscount.name.split(' ')[0] : 'Disc'}:</span>
    <span className="text-red-500">${discount.toFixed(2)}</span>
  </div>
  <div className="flex items-center gap-1">
    <span className="text-muted-foreground">{appliedServiceChargeName ? appliedServiceChargeName.split(' ')[0] : 'Svc'}:</span>
    <span className="text-foreground">${serviceCharge.toFixed(2)}</span>
  </div>
</div>}
```

---

## Proposed Fix

Replace the single-row abbreviated inline bar with a two-row compact grid matching the style of the desktop summary card.

### Row 1: Sub Total | Discount (only if > $0)
### Row 2: Service Charge (only if > $0) | Tax

**Rules:**
- `Sub Total:` — always shown (full label)
- `Discount:` — only shown when `discount > 0`, in red with `-` prefix  
- `Service Charge:` — only shown when `serviceCharge > 0`, with `+` prefix in primary color
- `Tax:` — always shown (was missing before)

The layout will use a two-row flexbox inside the existing glass-style card (same `background: '#7575754D'` and `boxShadow` as the desktop card) to stay visually consistent.

---

## Files to Edit

**`src/pages/Orders.tsx`** — one targeted change at lines 7536–7549:

Replace the current single-row abbreviated summary with a two-row layout:

```tsx
{orderItems.length > 0 && (
  <div className="px-2 py-1.5 border-t border-sidebar-border">
    <div className="text-xs rounded px-2 py-1.5 space-y-0.5" style={{
      background: '#7575754D',
      boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)'
    }}>
      {/* Row 1: Sub Total + Discount (hidden when $0) */}
      <div className="flex justify-between gap-2">
        <span className="text-foreground">
          Sub Total: <span className="font-medium">${subtotal.toFixed(2)}</span>
        </span>
        {discount > 0 && (
          <span className="text-red-400">
            Discount: <span className="font-medium">-${discount.toFixed(2)}</span>
          </span>
        )}
      </div>
      {/* Row 2: Service Charge (hidden when $0) + Tax */}
      <div className="flex justify-between gap-2">
        {serviceCharge > 0 && (
          <span className="text-foreground">
            Service Charge: <span className="font-medium text-primary">+${serviceCharge.toFixed(2)}</span>
          </span>
        )}
        <span className={`text-foreground ${serviceCharge === 0 ? 'ml-auto' : ''}`}>
          Tax: <span className="font-medium">${tax.toFixed(2)}</span>
        </span>
      </div>
    </div>
  </div>
)}
```

This makes the mobile summary:
- Use full label names
- Show Tax (previously missing)
- Hide Discount when $0.00
- Hide Service Charge when $0.00
- Match the glass card styling of the desktop summary panel
