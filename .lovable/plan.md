
# Fix: Dynamic Flowing Layout for Order Summary (Mobile & Desktop)

## The Problem

The current layout has a fixed 2-row, 2-column structure:

```text
Row 1: [ Sub Total ]       [ Discount (if > 0) ]
Row 2: [ Service Charge ]  [ Tax               ]
       (if > 0)            (ml-auto when no SC)
```

When Discount is removed, Row 1 shows `Sub Total` alone on the left — the right slot is empty. Service Charge and Tax stay locked in Row 2 and never move up.

The user expects items to **flow dynamically** into a 2-column grid, filling left-to-right, top-to-bottom — like slots being filled:

```text
Slot 1 (top-left):    Sub Total     ← always present
Slot 2 (top-right):   first of: Discount → Service Charge → Tax
Slot 3 (bottom-left): second of the above (if Slot 2 was used by Discount)
Slot 4 (bottom-right): Tax (only if bottom row is needed)
```

## Layout Rules

| Scenario | Row 1 | Row 2 |
|---|---|---|
| No Discount, No Service Charge | Sub Total + Tax | (hidden) |
| Discount only | Sub Total + Discount | Tax alone (right-aligned) |
| Service Charge only | Sub Total + Service Charge | Tax alone (right-aligned) |
| Both Discount + Service Charge | Sub Total + Discount | Service Charge + Tax |

This is the same as the current behavior for single-line and both-present cases. The **fix** is the "Discount only" case — currently Tax stays bottom-right; it should move up to Row 1 right slot, and Row 2 disappears.

Similarly for "Service Charge only" — Tax should appear on the same row as Sub Total (on the right), not on a separate row.

## The Fix

Replace the current fixed two-row structure with conditional slot logic:

```text
// Build a list of items to display (excluding Sub Total):
// items = [Discount (if > 0), Service Charge (if > 0), Tax]
// Tax is always last.

// If items.length === 1 (just Tax):
//   → Single row: Sub Total | Tax

// If items.length === 2 (one of Discount/SC + Tax):
//   → Single row: Sub Total | first-item
//   → Second row: Tax alone (right-aligned)
//     OR: collapse into 1 row with Sub Total | Tax
//     (depends on design choice — see below)

// If items.length === 3 (Discount + SC + Tax):
//   → Row 1: Sub Total | Discount
//   → Row 2: Service Charge | Tax
```

Based on the user's intent:

- **Discount only**: Row 1 = Sub Total + Discount, Row 2 = Tax (right-aligned)
- **Service Charge only**: Row 1 = Sub Total + Service Charge, Row 2 = Tax (right-aligned)  
- **Both**: Row 1 = Sub Total + Discount, Row 2 = Service Charge + Tax
- **Neither**: Row 1 = Sub Total + Tax

## Files to Edit

Only `src/pages/Orders.tsx` — two locations:

### Location 1 — Mobile/Landscape summary (~lines 7543–7608)

Replace the `(discount > 0 || serviceCharge > 0) ? ... : ...` block with:

```tsx
{(discount > 0 || serviceCharge > 0) ? (
  <>
    {/* Row 1: Sub Total + (Discount if present, else Service Charge) */}
    <div className="flex justify-between gap-2">
      <span className="text-foreground">
        Sub Total: <span className="font-medium">${subtotal.toFixed(2)}</span>
      </span>
      {discount > 0 ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-red-400 cursor-default flex items-center gap-1">
                Discount: <span className="font-medium">-${discount.toFixed(2)}</span>
                {selectedDiscount && (
                  <button onClick={() => setSelectedDiscountId(null)} ...>×</button>
                )}
              </span>
            </TooltipTrigger>
            {selectedDiscount && <TooltipContent>{selectedDiscount.name}</TooltipContent>}
          </Tooltip>
        </TooltipProvider>
      ) : (
        // No discount — Service Charge goes to top-right
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-foreground cursor-default flex items-center gap-1">
                Service Charge: <span className="font-medium text-primary">+${serviceCharge.toFixed(2)}</span>
                {appliedServiceCharge > 0 && (
                  <button onClick={() => { setAppliedServiceCharge(0); setAppliedServiceChargeName(''); }} ...>×</button>
                )}
              </span>
            </TooltipTrigger>
            {appliedServiceChargeName && <TooltipContent>{appliedServiceChargeName}</TooltipContent>}
          </Tooltip>
        </TooltipProvider>
      )}
    </div>

    {/* Row 2: (Service Charge if Discount shown) + Tax */}
    <div className="flex justify-between gap-2">
      {discount > 0 && serviceCharge > 0 ? (
        // Both present: SC on left, Tax on right
        <>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-foreground cursor-default flex items-center gap-1">
                  Service Charge: <span className="font-medium text-primary">+${serviceCharge.toFixed(2)}</span>
                  ...remove button
                </span>
              </TooltipTrigger>
              ...
            </Tooltip>
          </TooltipProvider>
          <span className="text-foreground">Tax: <span className="font-medium">${tax.toFixed(2)}</span></span>
        </>
      ) : (
        // Only one of them: Tax alone, right-aligned
        <span className="text-foreground ml-auto">Tax: <span className="font-medium">${tax.toFixed(2)}</span></span>
      )}
    </div>
  </>
) : (
  // Neither — single row
  <div className="flex justify-between gap-2">
    <span className="text-foreground">Sub Total: <span className="font-medium">${subtotal.toFixed(2)}</span></span>
    <span className="text-foreground">Tax: <span className="font-medium">${tax.toFixed(2)}</span></span>
  </div>
)}
```

### Location 2 — Desktop sidebar summary (~lines 8826–8883)

Apply identical slot logic using the same conditional pattern, preserving the existing `gap-3` spacing and tooltip/remove-button implementations already in place for that section.

## Summary

| Scenario | Before | After |
|---|---|---|
| No Discount, No SC | 1 row: Sub Total + Tax | Same |
| Discount only | Row 1: Sub Total + Discount / Row 2: empty-left + Tax | Row 1: Sub Total + Discount / Row 2: Tax (right-aligned) |
| SC only | Row 1: Sub Total + (empty) / Row 2: SC + Tax | Row 1: Sub Total + SC / Row 2: Tax (right-aligned) |
| Both | Row 1: Sub Total + Discount / Row 2: SC + Tax | Same |
