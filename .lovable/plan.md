

# Split Check Per-Ticket Receipt Flow

## Overview
Add a receipt option after each individual split check ticket payment, allowing each customer to receive their own receipt (Print, Text, Email) before returning to the ticket grid to process remaining checks.

## Current Behavior
After a split check ticket is paid:
1. Payment is recorded with check label (e.g., "Cash (Check 1a)")
2. User immediately returns to the Split Check ticket grid
3. No receipt option is shown for the individual check

## Proposed Solution
Insert a receipt step between payment completion and returning to the ticket grid.

### Flow Diagram
```text
┌─────────────────────────────────────────────────────────────────┐
│                     SPLIT CHECK TICKETS                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ Check 1a │  │ Check 1b │  │ Check 1c │                      │
│  │  [Pay]   │  │  [Pay]   │  │  [Pay]   │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
└─────────────────────────────────────────────────────────────────┘
                           │
                     Click "Pay" on Check 1a
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PAYMENT METHODS SCREEN                        │
│  Select payment method for Check 1a ($25.00)                   │
└─────────────────────────────────────────────────────────────────┘
                           │
                     Complete payment
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                 RECEIPT SCREEN (NEW STEP)                       │
│                                                                 │
│  ✓ Payment Successful - Check 1a - $25.00                      │
│                                                                 │
│  ┌────────┐ ┌────────┐ ┌────────┐                              │
│  │ Print  │ │  Text  │ │ Email  │                              │
│  └────────┘ └────────┘ └────────┘                              │
│                                                                 │
│           [ NO RECEIPT ]                                        │
└─────────────────────────────────────────────────────────────────┘
                           │
                  Select receipt option or skip
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SPLIT CHECK TICKETS                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ Check 1a │  │ Check 1b │  │ Check 1c │                      │
│  │  [PAID]  │  │  [Pay]   │  │  [Pay]   │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Expand State Type
Update the `splitCheckPaymentStep` state to include a receipt step:

```text
// Change from:
const [splitCheckPaymentStep, setSplitCheckPaymentStep] = 
  useState<'tickets' | 'payment'>('tickets');

// To:
const [splitCheckPaymentStep, setSplitCheckPaymentStep] = 
  useState<'tickets' | 'payment' | 'receipt'>('tickets');
```

### Step 2: Update Completion Functions
Modify both `handleSplitCheckPaymentComplete()` and `finalizePayment()` to transition to receipt step instead of directly returning to tickets:

**In `handleSplitCheckPaymentComplete` (around line 331-338):**
```text
// Instead of returning to tickets immediately:
if (paidChecks.length + 1 >= numberOfChecks) {
  setPaymentProcessed(true);
} else {
  // Show receipt screen first, then return to tickets
  setSplitCheckPaymentStep('receipt');
  // Keep activePayingCheck set so we know which check's receipt to show
}
```

**In `finalizePayment` (around line 399-409):**
```text
// Same change - transition to receipt step:
if (paidChecks.length + 1 >= numberOfChecks) {
  setPaymentProcessed(true);
} else {
  setSplitCheckPaymentStep('receipt');
  // Keep activePayingCheck, reset payment method states
  resetPaymentMethodStates();
}
```

### Step 3: Add Receipt Handling Function
Create a new function to handle returning to the ticket grid after receipt:

```text
const handleSplitCheckReceiptComplete = () => {
  // Reset receipt states
  setTextReceiptStep('receipt');
  setTextReceiptPhone('');
  setEmailReceiptStep('receipt');
  setEmailReceiptEmail('');
  
  // Now return to ticket grid
  setActivePayingCheck(null);
  setSplitCheckPaymentStep('tickets');
  setSelectedPaymentMethod('split-check');
};
```

### Step 4: Add Receipt UI for Split Check
Add a new conditional rendering block for `splitCheckPaymentStep === 'receipt'`. This will display:

- Success icon and confirmation message with check label
- The payment amount for that specific check
- Print, Text, Email buttons (reusing existing patterns)
- NO RECEIPT button to skip

The UI will closely match the existing `paymentProcessed` receipt screen but:
- Show "Check 1a Paid" instead of generic success
- Call `handleSplitCheckReceiptComplete()` instead of `handleComplete()`
- Display the individual check amount, not total order

### Step 5: Update Dialog Reset
Ensure the new receipt step state is properly reset when the dialog opens (in the existing `useEffect` that resets on open).

---

## Technical Details

### File to Modify
- `src/components/PaymentDialog.tsx` - Single file with all changes

### Key Changes Summary

1. **State type expansion** (line ~183):
   - Add `'receipt'` to `splitCheckPaymentStep` type

2. **handleSplitCheckPaymentComplete modification** (lines ~331-338):
   - Transition to `'receipt'` step instead of immediately going to `'tickets'`
   - Keep `activePayingCheck` set (don't clear it yet)

3. **finalizePayment modification** (lines ~399-409):
   - Same change: go to `'receipt'` step instead of `'tickets'`

4. **New function `handleSplitCheckReceiptComplete`**:
   - Called after user selects a receipt option or clicks "No Receipt"
   - Resets receipt states, clears `activePayingCheck`, returns to tickets

5. **New UI block for receipt step** (insert in left panel rendering logic):
   - Conditional check for `splitCheckPaymentStep === 'receipt'`
   - Render success message with check label
   - Print, Text, Email buttons calling `handleSplitCheckReceiptComplete` on completion
   - Support for phone and email input flows with keypads
   - NO RECEIPT button

---

## Receipt UI Structure

The receipt screen for individual split checks will include:

```text
┌─────────────────────────────────────────────┐
│                                             │
│              ✓ (success icon)               │
│                                             │
│         Check 1a Paid Successfully          │
│              $25.00                         │
│                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │  Print  │ │  Text   │ │  Email  │       │
│  │   🖨    │ │   💬    │ │   ✉    │       │
│  └─────────┘ └─────────┘ └─────────┘       │
│                                             │
│           [  NO RECEIPT  ]                  │
│                                             │
│  Powered by eatOS                          │
└─────────────────────────────────────────────┘
```

When Text or Email is selected:
- Phone input with numeric keypad (same as existing)
- Email input with QWERTY keyboard (same as existing)
- SEND button completes and calls `handleSplitCheckReceiptComplete()`

---

## Expected Behavior After Implementation

1. User opens Split Check, creates 3 checks using "Split Evenly"
2. User clicks "Pay" on Check 1a → goes to payment methods
3. User selects Cash and completes payment
4. **NEW**: Receipt screen appears showing "Check 1a Paid - $25.00"
5. User selects Print/Text/Email or clicks "No Receipt"
6. User returns to Split Check ticket grid
7. Check 1a shows "PAID" stamp
8. User repeats for Check 1b and Check 1c
9. After last check receipt is handled, final order receipt appears

---

## Testing Checklist
- [ ] Pay first ticket with Cash → verify receipt screen appears
- [ ] Select Print → verify returns to ticket grid
- [ ] Pay second ticket with Card → verify receipt screen appears
- [ ] Select Text, enter phone → verify returns to ticket grid
- [ ] Pay third ticket with Loyalty → verify receipt screen appears
- [ ] Select Email, enter email → verify final receipt screen appears
- [ ] Verify each receipt shows correct check label and amount
- [ ] Verify "No Receipt" works at each step
- [ ] Verify dialog reset clears all states properly

