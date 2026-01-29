

# Redeem Voucher Flow Redesign

## Overview
Update the Voucher Dialog to match the provided design screenshots and integrate the redeemed voucher amount into the order summary, reducing the order value similar to how discounts are displayed.

---

## Current vs. Target Design

### Current Redeem View
- Back arrow navigation
- Numeric keypad for code entry
- Two-step validation flow (Validate → Apply)

### Target Redeem View (from screenshots)
- Header: "Redeem Voucher"
- Text input field with placeholder "ENTER VOUCHER CODE"
- "REDEEM VOUCHER" button
- "SELL VOUCHER" button at bottom to switch views

```text
┌─────────────────────────────────────────────────────────────┐
│                     Redeem Voucher                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            ENTER VOUCHER CODE                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 REDEEM VOUCHER                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  SELL VOUCHER                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Simplify Redeem View in VoucherDialog

Update the redeem view to use a simple text input instead of numeric keypad.

**File:** `src/components/VoucherDialog.tsx`

**Changes:**
- Replace numeric keypad with text input field
- Remove back arrow (use "SELL VOUCHER" button to switch)
- Simple single-button validation ("REDEEM VOUCHER")
- Match field styling to the design (neutral-800 background with border)
- Add "SELL VOUCHER" button below to switch back to sell view

**New Redeem View Structure:**
```typescript
<div className="p-5">
  {/* Header - Centered */}
  <h2 className="text-white text-lg font-semibold text-center mb-6">Redeem Voucher</h2>
  
  {/* Voucher Code Input Field */}
  <div className="mb-5">
    <input
      type="text"
      value={voucherCode}
      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
      placeholder="ENTER VOUCHER CODE"
      className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-4 py-4 
                 text-white text-center text-lg font-mono tracking-wider 
                 placeholder:text-neutral-500 uppercase focus:outline-none focus:border-neutral-500"
    />
  </div>
  
  {/* REDEEM VOUCHER Button */}
  <button
    onClick={handleRedeemVoucher}
    disabled={!voucherCode}
    className="w-full py-3 rounded-lg text-sm font-semibold mb-3 bg-neutral-700 text-white"
  >
    REDEEM VOUCHER
  </button>
  
  {/* SELL VOUCHER Button */}
  <button
    onClick={() => setView('sell')}
    className="w-full py-3 rounded-lg text-sm font-semibold bg-neutral-800 border text-white"
  >
    SELL VOUCHER
  </button>
</div>
```

### Step 2: Update Redeem Handler Logic

Modify the redeem handler to directly validate and apply the voucher.

**Current flow:** Enter code → Validate → Show balance → Apply
**New flow:** Enter code → Click REDEEM VOUCHER → Apply (with simulated validation)

**Changes:**
- Remove separate validation step
- Directly apply voucher on button click
- Mock validation returns a balance based on the voucher code

### Step 3: Integrate Voucher Deduction in Order Total

**File:** `src/pages/Orders.tsx`

**Changes to calculation (around line 6647-6658):**
```typescript
// Current total calculation
const total = subtotal - discount + serviceCharge + tax;

// Updated to include voucher deduction
const total = subtotal - discount + serviceCharge + tax - appliedVoucherAmount;

// Update charge amount calculation
const chargeAmount = Math.max(0, baseChargeAmount - appliedGiftCardAmount - appliedVoucherAmount);
```

### Step 4: Display Voucher in Order Summary

**File:** `src/pages/Orders.tsx` (lines 8557-8561 area)

Add voucher display similar to gift card:
```typescript
{appliedGiftCardAmount > 0 && (
  <div className="flex justify-between gap-3 pt-1 border-t border-white/10">
    <span className="text-green-500">Gift Card: <span className="font-medium">-${appliedGiftCardAmount.toFixed(2)}</span></span>
  </div>
)}
{appliedVoucherAmount > 0 && (
  <div className="flex justify-between gap-3">
    <span className="text-green-500 flex items-center gap-1">
      Voucher ({voucherCode}): <span className="font-medium">-${appliedVoucherAmount.toFixed(2)}</span>
      <button 
        onClick={() => {
          setAppliedVoucherAmount(0);
          setVoucherCode('');
        }}
        className="text-red-500 hover:text-red-400 text-xs font-bold ml-0.5"
      >
        ×
      </button>
    </span>
  </div>
)}
```

---

## Technical Summary

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/VoucherDialog.tsx` | Simplify redeem view to text input, remove keypad, add SELL VOUCHER button |
| `src/pages/Orders.tsx` | Update total calculation to subtract voucher, display voucher in summary |

### State Changes

| State Variable | Usage |
|----------------|-------|
| `appliedVoucherAmount` | Already exists - stores redeemed voucher value |
| `voucherCode` | Already exists - stores voucher code for display |

### Calculation Flow

```text
Subtotal (from items)
- Discount (percentage or fixed)
+ Service Charge
+ Tax (on taxable items minus discount)
- Gift Card (if applied)
- Voucher (if redeemed)   ← NEW
= Charge Amount
```

---

## Testing Checklist

- Click Voucher button opens dialog
- Switch to Redeem view shows text input with placeholder
- Type voucher code (converts to uppercase)
- Click REDEEM VOUCHER applies balance to order
- Voucher amount shows in order summary with code
- Order total is reduced by voucher amount
- CHARGE button shows correct reduced amount
- Remove (×) button clears voucher from order
- SELL VOUCHER button switches back to sell view

