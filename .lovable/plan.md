
# Consolidate Delivery Methods into "Third Party Delivery"

## Overview
Replace the four separate delivery payment methods (Blizzful, UberEats, DoorDash, Grubhub) with a single "Third Party Delivery" option. When selected, this will show a list of delivery partners to choose from, followed by the existing reference number input flow.

---

## User Flow

```text
Payment Methods Grid
        │
        ├── [Card] [Cash] [Gift Card] [Pay Link] [Other ▼]
        │                                            │
        │                               ┌────────────┴───────────────┐
        │                               │ Account                    │
        │                               │ QR Code                    │
        │                               │ Manual CC                  │
        │                               │ External CC                │
        │                               │ Manual Card                │
        │                               │ Third Party Delivery  ◄────┼─── NEW (replaces 4 methods)
        │                               └────────────────────────────┘
        │
        ▼ Select "Third Party Delivery"
        │
┌───────┴───────────────────────────────────────────────────────────────┐
│  Step 1: Select Delivery Partner                                       │
│                                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │  [Blizzful]  │ │  [UberEats]  │ │  [DoorDash]  │ │  [Grubhub]   │  │
│  │   (blue)     │ │   (green)    │ │    (red)     │ │  (orange)    │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
│                                                                         │
│  (Partners list can be expanded for other countries/regions)           │
└─────────────────────────────────────────────────────────────────────────┘
        │
        ▼ Select a partner (e.g., UberEats)
        │
┌───────┴───────────────────────────────────────────────────────────────┐
│  Step 2: Enter Reference Number                                        │
│                                                                         │
│              ┌─────────────────────────┐                               │
│              │  [UberEats Logo]        │                               │
│              │       (green)           │                               │
│              └─────────────────────────┘                               │
│                                                                         │
│  Reference Number: [________________]                                   │
│                                                                         │
│  ┌─────┬─────┬─────┐                                                   │
│  │  1  │  2  │  3  │   Numeric Keypad                                  │
│  ├─────┼─────┼─────┤                                                   │
│  │  4  │  5  │  6  │                                                   │
│  ├─────┼─────┼─────┤                                                   │
│  │  7  │  8  │  9  │                                                   │
│  ├─────┼─────┼─────┤                                                   │
│  │  0  │ 00  │  C  │                                                   │
│  └─────┴─────┴─────┘                                                   │
│                                                                         │
│  [CONTINUE]                                                             │
└─────────────────────────────────────────────────────────────────────────┘
        │
        ▼ Enter reference and click CONTINUE
        │
┌───────┴───────────────────────────────────────────────────────────────┐
│  Step 3: Completion / Receipt                                          │
│                                                                         │
│              ✓ Success                                                  │
│                                                                         │
│  $XX.XX has been successfully processed                                │
│  UberEats Ref: 1234 5678                                               │
│                                                                         │
│  [Print] [Text] [Email]                                                │
│                                                                         │
│  [NO RECEIPT]                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Define Delivery Partners Data Structure

Create a new constant for delivery partners that can be easily extended per country.

**File:** `src/components/PaymentDialog.tsx`

**New Constant (near line 107):**
```typescript
interface DeliveryPartner {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;  // Button/accent color
  bgColor: string; // Background color class
}

const deliveryPartners: DeliveryPartner[] = [
  { id: 'blizzful', name: 'Blizzful', icon: Utensils, color: 'bg-blue-500', bgColor: 'hover:bg-blue-500/20' },
  { id: 'ubereats', name: 'UberEats', icon: ShoppingBag, color: 'bg-green-500', bgColor: 'hover:bg-green-500/20' },
  { id: 'doordash', name: 'DoorDash', icon: Truck, color: 'bg-red-500', bgColor: 'hover:bg-red-500/20' },
  { id: 'grubhub', name: 'Grubhub', icon: UtensilsCrossed, color: 'bg-orange-500', bgColor: 'hover:bg-orange-500/20' },
];
```

---

### Step 2: Update Payment Methods Lists

Replace the four individual delivery methods with a single "Third Party Delivery" option.

**File:** `src/components/PaymentDialog.tsx` (lines 95-105)

**Updated:**
```typescript
const initialOtherPaymentMethods: PaymentMethodType[] = [
  { id: 'account', name: 'Account', icon: User },
  { id: 'qr-code', name: 'QR Code', icon: QrCode },
  { id: 'manual-cc', name: 'Manual CC', icon: CreditCard },
  { id: 'external-cc', name: 'External CC', icon: ExternalLink },
  { id: 'manual-card', name: 'Manual card', icon: Clipboard },
  { id: 'third-party-delivery', name: '3rd Party Delivery', icon: Truck },
];
```

---

### Step 3: Add New State Variables

Replace the four individual delivery states with unified states.

**File:** `src/components/PaymentDialog.tsx` (lines 171-179)

**Updated States:**
```typescript
// Third Party Delivery states (replaces individual blizzful/ubereats/doordash/grubhub states)
const [thirdPartyDeliveryStep, setThirdPartyDeliveryStep] = useState<'amount' | 'select-partner' | 'reference' | 'complete'>('amount');
const [selectedDeliveryPartner, setSelectedDeliveryPartner] = useState<DeliveryPartner | null>(null);
const [deliveryReference, setDeliveryReference] = useState('');
```

---

### Step 4: Update Reset Logic

Update the useEffect that resets states when dialog opens.

**File:** `src/components/PaymentDialog.tsx` (lines 214-257)

**Add to reset:**
```typescript
// Reset third party delivery states
setThirdPartyDeliveryStep('amount');
setSelectedDeliveryPartner(null);
setDeliveryReference('');
```

**Remove old resets:**
```typescript
// Remove these lines:
setDoordashStep('amount');
setBlizzfulStep('amount');
setUbereatsStep('amount');
setGrubhubStep('amount');
```

---

### Step 5: Update resetPaymentMethodStates Function

**File:** `src/components/PaymentDialog.tsx` (lines 441-470)

**Update to:**
```typescript
const resetPaymentMethodStates = () => {
  setGiftCardStep('amount');
  setGiftCardNumber('');
  setPayByLinkStep('amount');
  setSelectedGuest(null);
  setQrCodeStep('amount');
  setQrPhoneNumber('');
  setShowQrPhoneInput(false);
  setManualCCStep('amount');
  setExternalCCStep('amount');
  setManualCardStep('amount');
  setManualCardDetails({ cardNumber: '', cardHolder: '', expiry: '', cvv: '' });
  // Third Party Delivery reset
  setThirdPartyDeliveryStep('amount');
  setSelectedDeliveryPartner(null);
  setDeliveryReference('');
  // ... rest unchanged
};
```

---

### Step 6: Update handleSelectFromDropdown

Modify the function to handle the new third-party-delivery method.

**File:** `src/components/PaymentDialog.tsx` (lines 553-588)

**Add:**
```typescript
if (selectedMethod.id === 'third-party-delivery') {
  setThirdPartyDeliveryStep('amount');
  setSelectedDeliveryPartner(null);
  setDeliveryReference('');
}
```

**Remove the blizzful, ubereats, doordash, grubhub handlers.**

---

### Step 7: Update handleChargePayment

Update the charge handler for the new consolidated method.

**File:** `src/components/PaymentDialog.tsx` (lines 596-672)

**Replace the four delivery handlers with:**
```typescript
// Third Party Delivery: transition to partner selection
if (selectedPaymentMethod === 'third-party-delivery' && thirdPartyDeliveryStep === 'amount') {
  setThirdPartyDeliveryStep('select-partner');
  return;
}
```

**Remove the individual doordash, blizzful, ubereats, grubhub handlers.**

---

### Step 8: Update handlePayCheck (Split Check)

**File:** `src/components/PaymentDialog.tsx` (lines 363-383)

**Replace:**
```typescript
// Reset third party delivery states
setThirdPartyDeliveryStep('amount');
setSelectedDeliveryPartner(null);
setDeliveryReference('');
```

**Remove individual delivery step resets.**

---

### Step 9: Create New Third Party Delivery UI Flow

Replace the four separate delivery UI blocks with a single consolidated flow.

**File:** `src/components/PaymentDialog.tsx`

**New UI Section (replaces lines ~2957-4200 approximately):**

```typescript
) : selectedPaymentMethod === 'third-party-delivery' && thirdPartyDeliveryStep !== 'amount' ? (
  /* ============= THIRD PARTY DELIVERY FLOW ============= */
  <>
    {/* Header with Back Button */}
    <div className="flex items-center justify-between p-4 border-b border-neutral-700">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => {
            if (textReceiptStep === 'phone-input') {
              setTextReceiptStep('receipt');
            } else if (emailReceiptStep === 'email-input') {
              setEmailReceiptStep('receipt');
            } else if (thirdPartyDeliveryStep === 'reference') {
              setThirdPartyDeliveryStep('select-partner');
            } else if (thirdPartyDeliveryStep === 'select-partner') {
              setThirdPartyDeliveryStep('amount');
              setSelectedDeliveryPartner(null);
            } else if (thirdPartyDeliveryStep === 'complete') {
              setThirdPartyDeliveryStep('amount');
              setSelectedDeliveryPartner(null);
            }
          }} 
          className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-300" />
        </button>
        <span className="text-white text-lg font-medium">
          {thirdPartyDeliveryStep === 'select-partner' 
            ? 'Select Delivery Partner' 
            : selectedDeliveryPartner 
              ? `Pay by ${selectedDeliveryPartner.name}` 
              : 'Third Party Delivery'}
        </span>
      </div>
    </div>

    {/* Step 1: Partner Selection */}
    {thirdPartyDeliveryStep === 'select-partner' && (
      <div className="flex-1 flex flex-col p-4">
        <p className="text-neutral-400 text-sm mb-4">Choose your delivery partner</p>
        <div className="grid grid-cols-2 gap-3">
          {deliveryPartners.map((partner) => (
            <button
              key={partner.id}
              onClick={() => {
                setSelectedDeliveryPartner(partner);
                setThirdPartyDeliveryStep('reference');
                setDeliveryReference('');
              }}
              className={`flex flex-col items-center gap-3 p-6 rounded-xl border border-neutral-700 bg-neutral-800 ${partner.bgColor} transition-all`}
            >
              <div className={`w-14 h-14 rounded-full ${partner.color} flex items-center justify-center`}>
                <partner.icon className="w-7 h-7 text-white" />
              </div>
              <span className="text-white font-medium">{partner.name}</span>
            </button>
          ))}
        </div>
      </div>
    )}

    {/* Step 2: Reference Number Entry */}
    {thirdPartyDeliveryStep === 'reference' && selectedDeliveryPartner && (
      <div className="flex-1 flex flex-col">
        {/* Partner Logo */}
        <div className="flex justify-center py-6">
          <div className={`w-16 h-16 rounded-full ${selectedDeliveryPartner.color} flex items-center justify-center`}>
            <selectedDeliveryPartner.icon className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Reference Number Label */}
        <div className="px-4 mb-1">
          <span className="text-neutral-400 text-xs">Reference number</span>
        </div>

        {/* Reference Number Input */}
        <div className="px-4 mb-3">
          <div className="bg-neutral-800 rounded-lg px-3 py-2 border border-neutral-700">
            <span className="text-white text-base font-medium">
              {deliveryReference.replace(/(.{4})/g, '$1 ').trim() || 'Enter reference number'}
            </span>
          </div>
        </div>

        {/* Keypad */}
        <div className="flex-1 px-4">
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '00', 'C'].map(key => (
              <button 
                key={key} 
                onClick={() => {
                  if (key === 'C') {
                    setDeliveryReference('');
                  } else {
                    setDeliveryReference(deliveryReference + key);
                  }
                }} 
                className={`h-12 rounded-xl text-lg font-medium transition-colors ${
                  key === 'C' 
                    ? 'bg-neutral-800 border border-neutral-700 text-red-500 hover:bg-neutral-700' 
                    : 'bg-neutral-800 border border-neutral-700 text-white hover:bg-neutral-700 active:bg-neutral-600'
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        {/* Continue Button */}
        <div className="p-4">
          <button 
            onClick={() => {
              const paid = parseFloat(paymentAmount) || 0;
              setPaidAmount(prev => prev + paid);
              setThirdPartyDeliveryStep('complete');
            }} 
            disabled={!deliveryReference} 
            className={`w-full py-3 font-bold rounded-xl transition-colors text-sm ${
              deliveryReference 
                ? `${selectedDeliveryPartner.color.replace('bg-', 'bg-')} hover:opacity-90 text-white` 
                : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
            }`}
          >
            CONTINUE
          </button>
        </div>
      </div>
    )}

    {/* Step 3: Complete / Receipt */}
    {thirdPartyDeliveryStep === 'complete' && selectedDeliveryPartner && (
      <>
        {textReceiptStep === 'receipt' && emailReceiptStep === 'receipt' ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
            <img src={tickSuccessIcon} alt="Success" className="w-16 h-16 mb-4" />
            
            <p className="text-center mb-6">
              <span className="text-green-500 font-bold text-lg">${paidAmount.toFixed(2)}</span>
              <span className="text-neutral-400 text-sm"> has been successfully processed</span>
            </p>
            
            <p className="text-neutral-400 text-sm mb-6">
              {selectedDeliveryPartner.name} Ref: {deliveryReference}
            </p>
            
            <h3 className="text-white text-xl font-semibold mb-6">Receipt</h3>
            
            <div className="flex gap-4 mb-6">
              {/* Print, Text, Email buttons */}
              <button 
                onClick={() => {
                  const amount = parseFloat(paymentAmount) || 0;
                  finalizePayment('third-party-delivery', amount, selectedDeliveryPartner.name);
                }} 
                className="flex flex-col items-center gap-2 p-4 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors min-w-[80px]"
              >
                <Printer className="w-6 h-6 text-neutral-300" />
                <span className="text-neutral-300 text-xs">Print</span>
              </button>
              {/* Text and Email buttons similar pattern */}
            </div>
            
            <button 
              onClick={() => {
                const amount = parseFloat(paymentAmount) || 0;
                finalizePayment('third-party-delivery', amount, selectedDeliveryPartner.name);
              }} 
              className="w-full max-w-xs py-3 border border-neutral-600 text-neutral-300 font-medium rounded-lg hover:bg-neutral-800 transition-colors"
            >
              NO RECEIPT
            </button>
          </div>
        ) : (
          {/* Text/Email receipt input screens - same pattern as existing */}
        )}
      </>
    )}
  </>
)
```

---

### Step 10: Update getMethodLabel Function

**File:** `src/components/PaymentDialog.tsx` (lines 590-594)

Ensure it properly returns the partner name for third-party-delivery payments.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/PaymentDialog.tsx` | Add DeliveryPartner interface and data, replace 4 delivery methods with single option, add new states, update all handlers, create new consolidated UI flow, remove ~800 lines of duplicate code |

---

## Technical Notes

1. **Code Reduction:** This consolidation removes approximately 800+ lines of duplicated code from the four individual delivery flows
2. **Extensibility:** The `deliveryPartners` array can easily be extended with additional partners or filtered by country/region
3. **Dynamic Colors:** Partner-specific colors are maintained through the `color` and `bgColor` properties
4. **Payment Recording:** The `finalizePayment` call will use the partner name (e.g., "UberEats") as the methodLabel for accurate payment history
5. **Split Check Compatibility:** The new flow integrates with the existing split check payment system

---

## Testing Checklist

- Open Payment Dialog
- Click "Other" dropdown and select "3rd Party Delivery"
- Verify partner selection screen shows all 4 partners
- Select a partner (e.g., UberEats)
- Verify the partner logo appears with correct color
- Enter a reference number using the keypad
- Click CONTINUE
- Verify success screen shows correct partner name and reference
- Test Print/Text/Email receipt options
- Test NO RECEIPT flow
- Verify payment history shows partner name correctly
- Test with Split Check flow
- Verify back navigation works at each step
