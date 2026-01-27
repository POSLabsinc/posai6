
# Split Check Payment Flow for All Payment Methods

## Problem
The Split Check ticket-by-ticket payment flow currently only works correctly for **Cash** and **Card** payment methods. When using other payment methods like Loyalty, Gift Card, Pay by Link, QR Code, Manual CC, External CC, Manual Card, or delivery services (DoorDash, Blizzful, UberEats, Grubhub), the payment goes directly to the final receipt screen instead of returning to the Split Check ticket grid.

## Root Cause
Each payment method has its own completion logic that calls `setPaymentProcessed(true)` directly, bypassing the `handleSplitCheckPaymentComplete()` function that properly handles:
1. Marking the individual check as paid
2. Recording the payment method with the check label
3. Returning to the Split Check ticket view to process remaining checks
4. Only showing the final receipt when ALL checks are paid

## Solution
Create a centralized helper function that all payment methods will use when completing a payment. This function will detect if we're in Split Check mode (`activePayingCheck !== null`) and route appropriately.

---

## Implementation Steps

### Step 1: Create a Universal Payment Completion Helper
Add a new function `finalizePayment()` that wraps the completion logic:

```text
const finalizePayment = (method: string, amount: number, methodLabel: string) => {
  // If paying a split check ticket, use split check handler
  if (activePayingCheck !== null) {
    // Mark check as paid, record payment with check label, return to tickets
    handleSplitCheckPaymentComplete();
    return;
  }
  
  // Otherwise, proceed with normal payment completion
  setPaymentHistory(prev => [...prev, { method, amount, methodLabel }]);
  setPaidAmount(prev => prev + amount);
  setPaymentProcessed(true);
};
```

### Step 2: Update All Payment Completion Points
Replace all instances of `setPaymentProcessed(true)` with calls to `finalizePayment()`:

**Payment Methods to Update:**

| Payment Method | Completion Points |
|----------------|-------------------|
| **Loyalty** | CONTINUE button after OTP verification |
| **Gift Card** | Continue button after card entry |
| **Pay by Link** | CONTINUE button on payment complete screen |
| **QR Code** | CONTINUE button on payment complete screen |
| **Manual CC** | Print button, NO RECEIPT button |
| **External CC** | Print button, NO RECEIPT button |
| **Manual Card** | Print button, NO RECEIPT button |
| **DoorDash** | Print button, NO RECEIPT button |
| **Blizzful** | Print button, NO RECEIPT button |
| **UberEats** | Print button, NO RECEIPT button |
| **Grubhub** | Print button, NO RECEIPT button |

### Step 3: Handle Text/Email Receipt Flows
Payment methods with receipt options (Manual CC, External CC, Manual Card, delivery services) also have Text and Email receipt flows that lead to payment completion. These "Send" buttons in the text/email receipt screens will also need to call `finalizePayment()`.

### Step 4: Update handleSplitCheckPaymentComplete to Use Current Method
Modify `handleSplitCheckPaymentComplete()` to not hard-code the method from state, but allow passing method info or use the current `selectedPaymentMethod`:

The existing logic already uses `selectedPaymentMethod` correctly, but we need to ensure the payment history is not double-recorded (once by the method's own flow and once by split check completion).

### Step 5: Adjust Special Flows
Some payment methods record to `paymentHistory` before setting `paymentProcessed`. We need to consolidate this so either:
- The method flow does NOT record to history, and `finalizePayment` handles it, OR
- We detect if already recorded and skip duplicate recording

**Recommended approach**: Let each method's completion button call `finalizePayment()` with the method details, and `finalizePayment` handles both split-check and normal flows consistently.

---

## Technical Details

### Files to Modify
- `src/components/PaymentDialog.tsx` - Single file with all changes

### Key Changes Summary

1. **New Helper Function** (add after `handleSplitCheckPaymentComplete`):
```text
const finalizePayment = (methodId: string, amount: number, methodLabel: string) => {
  if (activePayingCheck !== null) {
    const checkLabel = getCheckLabel(activePayingCheck - 1);
    setPaidChecks(prev => [...prev, activePayingCheck]);
    setPaymentHistory(prev => [...prev, { 
      method: methodId, 
      amount, 
      methodLabel: `${methodLabel} (${checkLabel})` 
    }]);
    setPaidAmount(prev => prev + amount);
    
    if (paidChecks.length + 1 >= numberOfChecks) {
      setPaymentProcessed(true);
    } else {
      setActivePayingCheck(null);
      setSplitCheckPaymentStep('tickets');
      setSelectedPaymentMethod('split-check');
      // Reset method-specific states
      resetPaymentMethodStates();
    }
    return;
  }
  
  // Normal payment flow
  setPaymentHistory(prev => [...prev, { method: methodId, amount, methodLabel }]);
  setPaidAmount(prev => prev + amount);
  setPaymentProcessed(true);
};
```

2. **Add Reset Helper for Method States**:
```text
const resetPaymentMethodStates = () => {
  setGiftCardStep('amount');
  setGiftCardNumber('');
  setPayByLinkStep('amount');
  setSelectedGuest(null);
  setQrCodeStep('amount');
  setManualCCStep('amount');
  setExternalCCStep('amount');
  setManualCardStep('amount');
  setDoordashStep('amount');
  setBlizzfulStep('amount');
  setUbereatsStep('amount');
  setGrubhubStep('amount');
  setLoyaltyStep('guest-list');
  setLoyaltySelectedGuest(null);
  setLoyaltyPointsToRedeem('');
  setLoyaltyOtp(['', '', '', '']);
  setTextReceiptStep('receipt');
  setEmailReceiptStep('receipt');
};
```

3. **Update Completion Points** - Replace direct `setPaymentProcessed(true)` with `finalizePayment()`:

   - **Loyalty** (line ~1185): Replace with `finalizePayment('loyalty', pointsValue, 'Loyalty')`
   - **Gift Card** (line ~1275): Replace with `finalizePayment('gift-card', paid, 'Gift Card')`
   - **Pay by Link** (line ~1731): Replace with `finalizePayment('pay-link', amount, 'Pay by Link')`
   - **QR Code** (line ~1934): Replace with `finalizePayment('qr-code', amount, 'QR Code')`
   - **Manual CC** (lines ~2053, ~2087): Replace with `finalizePayment('manual-cc', amount, 'Manual CC')`
   - **External CC** (lines ~2226, ~2260): Replace with `finalizePayment('external-cc', amount, 'External CC')`
   - **Manual Card** (lines ~2488, ~2522): Replace with `finalizePayment('manual-card', amount, 'Manual Card')`
   - **DoorDash** (lines ~2740, ~2776): Replace with `finalizePayment('doordash', amount, 'DoorDash')`
   - **Blizzful** (lines ~2994, ~3030): Replace with `finalizePayment('blizzful', amount, 'Blizzful')`
   - **UberEats** (~3248, ~3284): Replace with `finalizePayment('ubereats', amount, 'UberEats')`
   - **Grubhub** (~3502, ~3538): Replace with `finalizePayment('grubhub', amount, 'Grubhub')`

---

## Expected Behavior After Fix

1. User opens Split Check, selects "Split Evenly" with 3 checks
2. User clicks "Pay" on Check 1a - transitions to payment methods
3. User selects "Loyalty" (or any method) and completes the flow
4. After completion, user returns to Split Check ticket grid
5. Check 1a shows "PAID" stamp, Checks 1b and 1c remain payable
6. User clicks "Pay" on Check 1b, selects "Gift Card", completes
7. Returns to ticket grid, Check 1b now shows "PAID"
8. User clicks "Pay" on Check 1c, selects "Cash", completes
9. All checks paid - shows final receipt screen

---

## Testing Checklist
- [ ] Split Check with Cash payment
- [ ] Split Check with Card payment
- [ ] Split Check with Loyalty payment
- [ ] Split Check with Gift Card payment
- [ ] Split Check with Pay by Link payment
- [ ] Split Check with QR Code payment
- [ ] Split Check with Manual CC payment
- [ ] Split Check with External CC payment
- [ ] Split Check with Manual Card payment
- [ ] Split Check with DoorDash payment
- [ ] Split Check with Blizzful payment
- [ ] Split Check with UberEats payment
- [ ] Split Check with Grubhub payment
- [ ] Verify payment history shows correct check labels
- [ ] Verify all checks paid triggers final receipt
- [ ] Verify "Back to Split Check" button works from all methods
