
# Skip Amount Keypad for Non-Cash Payment Methods

## Overview
Modify the payment method selection behavior so that when a user clicks on any payment method (except Cash), it immediately proceeds to that method's specific flow instead of showing the keypad to enter an amount and requiring another click on the CHARGE button.

---

## Current Behavior vs Desired Behavior

```text
CURRENT FLOW (for Gift Card, Pay Link, Card, QR Code, etc.):
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 1: Click on "Gift Card" icon                                       │
│                           ↓                                              │
│  Step 2: See Amount Keypad (enter amount + click CHARGE)                │
│                           ↓                                              │
│  Step 3: Enter Gift Card Number                                          │
└─────────────────────────────────────────────────────────────────────────┘

DESIRED FLOW (matching Loyalty behavior):
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 1: Click on "Gift Card" icon                                       │
│                           ↓                                              │
│  Step 2: Enter Gift Card Number (skip keypad)                            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Payment Methods to Update

| Method | Current First Step | New First Step |
|--------|-------------------|----------------|
| **Cash** | Amount Keypad | Amount Keypad (NO CHANGE) |
| **Loyalty** | Guest List | Guest List (already correct) |
| **Card** | Amount Keypad | Tap Card screen |
| **Gift Card** | Amount Keypad | Card Entry screen |
| **Pay by Link** | Amount Keypad | Guest Selection screen |
| **QR Code** | Amount Keypad | QR Display screen |
| **Manual CC** | Amount Keypad | Tap Card screen |
| **External CC** | Amount Keypad | Complete/Receipt screen |
| **Manual Card** | Amount Keypad | Card Details screen |
| **Third Party Delivery** | Amount Keypad | Partner Selection screen |
| **Account** | Amount Keypad | (Keep as-is for now) |
| **Split Check** | Split Config | Split Config (already correct) |

---

## Implementation Steps

### Step 1: Update Payment Method Grid onClick Handler

Modify the onClick handler for the payment method buttons in the grid to immediately transition to the appropriate step based on the selected method.

**File:** `src/components/PaymentDialog.tsx` (lines 3775-3786)

**Current:**
```typescript
onClick={() => {
  setSelectedPaymentMethod(method.id);
  // Reset loyalty step when switching to loyalty
  if (method.id === 'loyalty') {
    setLoyaltyStep('guest-list');
    setLoyaltySelectedGuest(null);
    setLoyaltyPointsToRedeem('');
    setLoyaltyOtp(['', '', '', '']);
  }
}}
```

**Updated:**
```typescript
onClick={() => {
  setSelectedPaymentMethod(method.id);
  
  // Direct flow for each payment method (skip keypad except for Cash)
  if (method.id === 'loyalty') {
    setLoyaltyStep('guest-list');
    setLoyaltySelectedGuest(null);
    setLoyaltyPointsToRedeem('');
    setLoyaltyOtp(['', '', '', '']);
  } else if (method.id === 'gift-card') {
    setGiftCardStep('enter-card');
    setGiftCardNumber('');
  } else if (method.id === 'pay-link') {
    setPayByLinkStep('select-guest');
    setSelectedGuest(null);
    setGuestSearchQuery('');
  } else if (method.id === 'card') {
    // Card goes directly to tap card screen
    setManualCCStep('tap-card');
  } else if (method.id === 'qr-code') {
    setQrCodeStep('qr-display');
    setQrPhoneNumber('');
    setShowQrPhoneInput(false);
  }
  // Cash stays on amount keypad (no action needed)
}}
```

### Step 2: Update handleSelectFromDropdown Function

Modify the dropdown selection handler to also immediately transition to the appropriate step for methods selected from the "Other" dropdown.

**File:** `src/components/PaymentDialog.tsx` (lines 554-578)

**Updated:**
```typescript
const handleSelectFromDropdown = (selectedMethod: PaymentMethodType) => {
  const lastVisibleMethod = visiblePaymentMethods[visiblePaymentMethods.length - 1];
  const newDropdownMethods = dropdownPaymentMethods.filter(m => m.id !== selectedMethod.id);
  newDropdownMethods.unshift(lastVisibleMethod);
  const newVisibleMethods = [selectedMethod, ...visiblePaymentMethods.slice(0, -1)];
  
  setVisiblePaymentMethods(newVisibleMethods);
  setDropdownPaymentMethods(newDropdownMethods);
  setSelectedPaymentMethod(selectedMethod.id);
  setShowOtherPayments(false);
  
  // Direct flow for each payment method (skip keypad)
  if (selectedMethod.id === 'manual-cc') {
    setManualCCStep('tap-card');
  } else if (selectedMethod.id === 'external-cc') {
    // External CC goes directly to complete/receipt
    const paid = parseFloat(paymentAmount) || total;
    setPaidAmount(prev => prev + paid);
    setExternalCCStep('complete');
  } else if (selectedMethod.id === 'manual-card') {
    setManualCardStep('card-details');
    setManualCardDetails({ cardNumber: '', cardHolder: '', expiry: '', cvv: '' });
  } else if (selectedMethod.id === 'third-party-delivery') {
    setThirdPartyDeliveryStep('select-partner');
    setSelectedDeliveryPartner(null);
    setDeliveryReference('');
  } else if (selectedMethod.id === 'qr-code') {
    setQrCodeStep('qr-display');
    setQrPhoneNumber('');
    setShowQrPhoneInput(false);
  } else if (selectedMethod.id === 'account') {
    // Account can stay on amount for now or add specific flow
  }
};
```

### Step 3: Ensure Card Method Works Correctly

The "Card" payment method in the main grid should directly transition to the tap-card screen. Need to verify if "card" and "manual-cc" share the same state or are separate.

**Check:** Looking at the code, `card` method doesn't have its own step state. It should use `manualCCStep` to transition to tap-card screen when clicked.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/PaymentDialog.tsx` | Update onClick handlers for payment method grid and dropdown to immediately transition to method-specific flows |

---

## Technical Notes

1. **Cash Exception:** Cash payment should continue to show the keypad since it requires entering the exact cash amount received
2. **Amount Defaulting:** When skipping the keypad, the payment amount should default to the total due (or remaining due in multi-payment scenarios)
3. **State Reset:** Each method should reset its specific states when selected to ensure a clean flow
4. **External CC Special Case:** This method completes immediately since it's processed on an external device
5. **Account Method:** May need to define a specific flow if not already implemented

---

## Testing Checklist

- Click on Loyalty - should go directly to guest list (already works)
- Click on Cash - should show amount keypad (no change)
- Click on Card - should go directly to tap card screen
- Click on Gift Card - should go directly to card entry screen
- Click on Pay by Link - should go directly to guest selection
- Select QR Code from Other dropdown - should go directly to QR display
- Select Manual CC from Other dropdown - should go directly to tap card
- Select External CC from Other dropdown - should go directly to complete/receipt
- Select Manual Card from Other dropdown - should go directly to card details entry
- Select Third Party Delivery from Other dropdown - should go directly to partner selection
- Test all flows complete successfully without requiring the keypad first
