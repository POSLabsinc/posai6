
# Split Check Ticket-by-Ticket Payment Flow

## Overview
Implement a proper payment flow for the "Split Evenly" (and other split modes) in Split Check where each ticket goes through the full payment method selection process before being marked as paid.

## Current Behavior
Currently, clicking "Pay" on a ticket in Split Check immediately marks it as paid without showing any payment method options. The `handlePayCheck()` function directly updates `paidChecks` and `paymentHistory`.

## Proposed Solution

### New State Variables
Add state to track which check is currently being paid:
```text
activePayingCheck: number | null  // The check number currently being processed
splitCheckPaymentStep: 'tickets' | 'payment' | 'complete'  // Current step in split check flow
```

### Flow Diagram
```text
┌─────────────────────────────────────────────────────────────────┐
│                     SPLIT CHECK VIEW                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ Check 1a │  │ Check 1b │  │ Check 1c │                      │
│  │ $25.00   │  │ $25.00   │  │ $25.00   │                      │
│  │  [Pay]   │  │  [Pay]   │  │  [Pay]   │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
└─────────────────────────────────────────────────────────────────┘
                           │
                     User clicks "Pay"
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PAYMENT METHODS SCREEN                        │
│  Amount: $25.00 (Check 1a)                                      │
│                                                                 │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                   │
│  │Loyalty │ │  Card  │ │  Cash  │ │Gift Card│                   │
│  └────────┘ └────────┘ └────────┘ └────────┘                   │
│                                                                 │
│  [← Back to Split Check]              [CHARGE $25.00]          │
└─────────────────────────────────────────────────────────────────┘
                           │
                     Payment processed
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SPLIT CHECK VIEW                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ Check 1a │  │ Check 1b │  │ Check 1c │                      │
│  │  PAID    │  │ $25.00   │  │ $25.00   │                      │
│  │ [Paid]   │  │  [Pay]   │  │  [Pay]   │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation Steps

#### Step 1: Add New State Variables
Add to existing state declarations (around line 175-179):
- `activePayingCheck` - tracks which check is being paid (null when viewing tickets)
- `splitCheckPaymentStep` - controls whether we show tickets or payment methods

#### Step 2: Modify `handlePayCheck` Function
Change the function to transition to payment method selection instead of immediately marking as paid:
- Set `activePayingCheck` to the selected check number
- Set `splitCheckPaymentStep` to 'payment'
- Set `paymentAmount` to the check's total
- Exit split-check mode temporarily (set `selectedPaymentMethod` to 'cash')

#### Step 3: Create Payment Completion Handler for Split Check
Add new function `handleSplitCheckPaymentComplete()`:
- Mark the `activePayingCheck` as paid (add to `paidChecks`)
- Record the payment in `paymentHistory` with the selected method
- Reset `activePayingCheck` to null
- Return to split-check view (`selectedPaymentMethod` = 'split-check')
- If all checks are paid, show final receipt

#### Step 4: Add Back Button to Payment Screen
When in split-check payment mode, show a "Back to Split Check" button:
- Allows user to cancel payment and return to ticket selection
- Resets the temporary payment state

#### Step 5: Modify Charge Button Behavior
Update `handleChargePayment()` to detect split-check payment mode:
- If `activePayingCheck` is set, call the new completion handler
- Otherwise, use existing payment logic

#### Step 6: Update Header Display
When paying a specific check, show which check is being paid:
- Header: "Pay Check 1a - $25.00" instead of generic "Total Due"

#### Step 7: Reset States on Dialog Close
Ensure all new state variables are reset when dialog opens/closes.

---

## Technical Details

### Files to Modify
- `src/components/PaymentDialog.tsx` - All changes are in this single file

### State Changes Summary
```text
// New states to add:
const [activePayingCheck, setActivePayingCheck] = useState<number | null>(null);
const [splitCheckPaymentStep, setSplitCheckPaymentStep] = useState<'tickets' | 'payment'>('tickets');
```

### Key Logic Points

1. **When "Pay" is clicked on a ticket:**
   - Store the check number in `activePayingCheck`
   - Set `splitCheckPaymentStep` to 'payment'
   - Change `selectedPaymentMethod` to 'cash' (default)
   - Set `paymentAmount` to check total

2. **When payment is charged (for a split check):**
   - Add check to `paidChecks`
   - Record in `paymentHistory` with actual method used
   - Update `paidAmount`
   - Reset `activePayingCheck` to null
   - Set `selectedPaymentMethod` back to 'split-check'
   - If all checks paid, set `paymentProcessed` to true

3. **"Back" button behavior:**
   - Reset `activePayingCheck` to null
   - Set `selectedPaymentMethod` back to 'split-check'
   - Keep `paidChecks` and `paymentHistory` unchanged

### Conditional Rendering Logic
```text
if (selectedPaymentMethod === 'split-check' && !activePayingCheck):
    → Show Split Check tickets view
    
if (activePayingCheck !== null):
    → Show standard payment methods screen
    → Include "Back to Split Check" button
    → Show check label in header
```

### Edge Cases to Handle
- User closes dialog mid-payment → Reset all states
- User clicks back after partial amount entry → Restore check total
- All payment methods work with split check (Cash, Card, Loyalty, etc.)
- Payment history shows which check was paid: "Cash (Check 1a)"
