
# Fix: Collapse Summary to One Line When Discount & Service Charge Are $0

## The Problem

The current two-row layout always renders two `<div>` rows regardless of whether Discount and Service Charge are visible:

- **Row 1**: Sub Total (left) | Discount (right, hidden when $0 → leaves gap)
- **Row 2**: Service Charge (left, hidden when $0) | Tax (right, `ml-auto` when no Service Charge)

When both Discount and Service Charge are $0, this results in:
- Row 1: `Sub Total: $8.99` alone on the left
- Row 2: `Tax: $0.18` pushed to the far right via `ml-auto`

These two rows create visual dead space and split logically related info across two lines unnecessarily.

---

## The Fix

Use **conditional layout logic** — render a single row when both Discount and Service Charge are $0, or the existing two rows when at least one of them has a value.

### Logic

```
if (discount === 0 && serviceCharge === 0):
  → Single row: Sub Total (left) | Tax (right)

else:
  → Row 1: Sub Total (left) | Discount (right, if > 0)
  → Row 2: Service Charge (left, if > 0) | Tax (right)
```

### Proposed UI

**When both are $0 (single row):**
```
Sub Total: $8.99                    Tax: $0.18
```

**When Discount is applied (two rows):**
```
Sub Total: $8.99          Discount: -$5.00
                                  Tax: $0.18
```

**When Service Charge is applied (two rows):**
```
Sub Total: $8.99
Service Charge: +$1.50            Tax: $0.18
```

---

## Files to Edit

Two locations in `src/pages/Orders.tsx`:

### Location 1 — Mobile/Landscape summary (lines 7542–7563)

Replace the two unconditional `<div>` rows with a conditional structure:

```tsx
{(discount > 0 || serviceCharge > 0) ? (
  <>
    {/* Row 1: Sub Total + Discount */}
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
    {/* Row 2: Service Charge + Tax */}
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
  </>
) : (
  /* Single row: Sub Total + Tax */
  <div className="flex justify-between gap-2">
    <span className="text-foreground">
      Sub Total: <span className="font-medium">${subtotal.toFixed(2)}</span>
    </span>
    <span className="text-foreground">
      Tax: <span className="font-medium">${tax.toFixed(2)}</span>
    </span>
  </div>
)}
```

### Location 2 — Desktop sidebar summary (lines 8782–8813)

Apply the same conditional logic:

```tsx
{(discount > 0 || serviceCharge > 0) ? (
  <>
    <div className="flex justify-between gap-3">
      <span className="text-foreground">Sub Total: <span className="font-medium">${subtotal.toFixed(2)}</span></span>
      {discount > 0 && (
        <span className="text-red-400 flex items-center gap-1">
          {selectedDiscount ? selectedDiscount.name : 'Discount'}: <span className="font-medium">-${discount.toFixed(2)}</span>
          {selectedDiscount && <button onClick={() => setSelectedDiscountId(null)} className="...">×</button>}
        </span>
      )}
    </div>
    <div className="flex justify-between gap-3">
      {serviceCharge > 0 && (
        <span className="text-foreground flex items-center gap-1">
          {appliedServiceChargeName || 'Service Charge'}: <span className="font-medium text-primary">+${serviceCharge.toFixed(2)}</span>
          {/* × remove button */}
        </span>
      )}
      <span className={`text-foreground ${serviceCharge === 0 ? 'ml-auto' : ''}`}>
        Tax: <span className="font-medium">${tax.toFixed(2)}</span>
      </span>
    </div>
  </>
) : (
  <div className="flex justify-between gap-3">
    <span className="text-foreground">Sub Total: <span className="font-medium">${subtotal.toFixed(2)}</span></span>
    <span className="text-foreground">Tax: <span className="font-medium">${tax.toFixed(2)}</span></span>
  </div>
)}
```

---

## Summary of Changes

| Scenario | Before | After |
|---|---|---|
| No Discount, No Service Charge | 2 rows with gaps | 1 row: Sub Total + Tax |
| Discount applied | 2 rows (correct) | 2 rows (same) |
| Service Charge applied | 2 rows (correct) | 2 rows (same) |
| Both applied | 2 rows (correct) | 2 rows (same) |
