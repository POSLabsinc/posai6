

# Mobile Payment Method Selection Screen

## Overview
Add a new mobile-specific payment selection screen that displays all payment methods in a 3-column grid layout (matching the reference design). When the user taps a payment method, it proceeds to the corresponding payment flow just like on desktop.

---

## Current State vs. Desired State

```text
CURRENT MOBILE LAYOUT:
┌─────────────────────────┐
│ < Total Due   $6.00   X │  ← Header
├─────────────────────────┤
│ [●] [●] [●] [●] [▼]     │  ← 4-column icons + "Other" dropdown
├─────────────────────────┤
│     $6.00  [⌨]          │  ← Amount display
├─────────────────────────┤
│  $1  $2  $5  $10        │  ← Quick amounts / Keypad
│     $20 $50 $100        │
├─────────────────────────┤
│   [ CHARGE $6.00 ]      │  ← Charge button
└─────────────────────────┘

DESIRED MOBILE LAYOUT (Initial Screen):
┌─────────────────────────┐
│ < Total Due   $ 6.00    │  ← Header (red amount)
├─────────────────────────┤
│   Choose Payment Method │  ← Label
├─────────────────────────┤
│  Card    Cash   Gift    │  ← 3-column grid
│  [●]     [●]    Card[●] │
│                         │
│  Split   Pay By  QR     │
│  Check   Link   Code    │
│  [●]     [●]    [●]     │
│                         │
│  Account Loyalty Manual │
│  [●]     [●]    CC [●]  │
│                         │
│  Manual  External Blizzful │
│  Card    CC      [●]    │
│  [●]     [●]            │
└─────────────────────────┘
```

---

## Payment Methods to Display

Based on existing configuration, combined into a single grid:

| Method | Icon | ID |
|--------|------|----|
| Card | CreditCard | card |
| Cash | Banknote | cash |
| Gift Card | Gift | gift-card |
| Split Check | splitCheckIcon | split-check |
| Pay By Link | Link | pay-link |
| QR Code | QrCode | qr-code |
| Account | User | account |
| Loyalty | Tag | loyalty |
| Manual CC | CreditCard | manual-cc |
| Manual Card | Clipboard | manual-card |
| External CC | ExternalLink | external-cc |
| 3rd Party Delivery | Truck | third-party-delivery |

---

## Implementation Steps

### Step 1: Add Mobile Payment Selection State

Add a new state variable to track whether the user is in the mobile payment selection screen:

```typescript
const [mobilePaymentSelectionActive, setMobilePaymentSelectionActive] = useState(true);
```

Reset this state when dialog opens.

### Step 2: Create All Mobile Payment Methods Array

Combine all payment methods for the mobile grid display:

```typescript
const allMobilePaymentMethods: PaymentMethodType[] = [
  { id: 'card', name: 'Card', icon: CreditCard },
  { id: 'cash', name: 'Cash', icon: Banknote },
  { id: 'gift-card', name: 'Gift Card', icon: Gift },
  { id: 'split-check', name: 'Split Check', icon: () => <img src={splitCheckIcon} ... /> },
  { id: 'pay-link', name: 'Pay By Link', icon: Link },
  { id: 'qr-code', name: 'QR Code', icon: QrCode },
  { id: 'account', name: 'Account', icon: User },
  { id: 'loyalty', name: 'Loyalty', icon: Tag },
  { id: 'manual-cc', name: 'Manual CC', icon: CreditCard },
  { id: 'manual-card', name: 'Manual Card', icon: Clipboard },
  { id: 'external-cc', name: 'External CC', icon: ExternalLink },
  { id: 'third-party-delivery', name: 'Blizzful', icon: Truck }, // or "3rd Party"
];
```

### Step 3: Create Mobile Payment Selection Screen

New conditional render for mobile when `mobilePaymentSelectionActive` is true:

```tsx
{isMobile && mobilePaymentSelectionActive && !paymentProcessed && (
  <div className="flex-1 flex flex-col">
    {/* Header */}
    <div className="flex items-center p-4 border-b border-neutral-700">
      <button onClick={() => onOpenChange(false)}>
        <ChevronLeft />
      </button>
      <div className="flex-1 text-center">
        <span className="text-white">Total Due</span>
        <span className="text-red-500 font-bold ml-2">${total.toFixed(2)}</span>
      </div>
    </div>
    
    {/* Label */}
    <div className="text-center text-neutral-400 py-4">
      Choose Payment Method
    </div>
    
    {/* Payment Methods Grid - 3 columns */}
    <div className="grid grid-cols-3 gap-4 px-4 pb-4">
      {allMobilePaymentMethods.map((method) => (
        <button
          onClick={() => handleMobilePaymentMethodSelect(method.id)}
          className="flex flex-col items-center gap-2"
        >
          <div className="w-14 h-14 rounded-full border border-neutral-600 ...">
            <method.icon />
          </div>
          <span className="text-white text-xs">{method.name}</span>
        </button>
      ))}
    </div>
  </div>
)}
```

### Step 4: Handle Mobile Payment Method Selection

Create handler that transitions to appropriate screen:

```typescript
const handleMobilePaymentMethodSelect = (methodId: string) => {
  setSelectedPaymentMethod(methodId);
  setMobilePaymentSelectionActive(false);
  
  // Trigger appropriate flow based on method
  if (methodId === 'card') {
    setManualCCStep('tap-card');
  } else if (methodId === 'cash') {
    // Show keypad for cash entry
  } else if (methodId === 'gift-card') {
    setGiftCardStep('enter-card');
  } else if (methodId === 'split-check') {
    // Split check flow
  } else if (methodId === 'pay-link') {
    setPayByLinkStep('select-guest');
  }
  // ... etc for all methods
};
```

### Step 5: Add Back Navigation

When user is in a payment flow (not selection screen), add back button to return to the payment selection grid:

```typescript
// In method-specific screens, add back button:
<button onClick={() => setMobilePaymentSelectionActive(true)}>
  <ArrowLeft />
</button>
```

### Step 6: Update Existing Mobile Flow Logic

Modify existing conditionals to check `!mobilePaymentSelectionActive` before showing current mobile payment UI (keypad, quick amounts, etc).

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/PaymentDialog.tsx` | Add mobile payment selection screen, new state, and flow logic |

---

## Visual Styling Details

From the reference image:
- Dark background (neutral-900)
- Red header stripe at top (matching current)
- Back button (chevron-left) on left
- "Total Due" in white, amount in red
- "Choose Payment Method" label centered in neutral-400
- Payment icons in rounded circles with neutral-600 border
- Icon color: red/coral outline style (matching reference)
- Label below each icon in white text

---

## Flow Preservation

All existing payment flows remain unchanged:
- Selecting a method triggers the same logic as desktop
- Screen-by-screen progression is preserved
- Only the initial method selection screen is different on mobile
- Desktop and tablet views are NOT affected

---

## Testing Checklist

- Verify payment method grid displays correctly on mobile
- Tap each method and confirm it navigates to correct flow
- Confirm back button returns to payment selection grid
- Verify desktop/tablet views remain unchanged
- Test completing a payment end-to-end on mobile
- Verify Split Check flow works on mobile

