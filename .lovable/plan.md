
# Split and Save Order Feature

## Overview
Implement a "split and save" workflow where clicking the Save button in the split payment popup saves the order in split mode, displays a warning message in the order panel, adds a Merge button to re-merge the order, and prevents firing or adding items until the order is merged again.

---

## Feature Requirements Summary

1. **Save button in split payment popup** → Saves split configuration and closes dialog
2. **Order panel warning message** → "This check has been split. Re-merge this ticket if you want to fire it or add products to it."
3. **Merge button in sidebar** → Allows re-merging a split order
4. **Block FIRE action** → Disable when order is split
5. **Block adding items** → Show popup message when attempting to add items to a split order

---

## UI Flow Diagram

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           NORMAL ORDER STATE                            │
│                                                                         │
│  [Order Items]                    Sidebar:                              │
│  ├─ Item 1                        [Transfer Check]                      │
│  ├─ Item 2                        [Gift Card]                           │
│  └─ Item 3                        [Service Charge]                      │
│                                   [Add Guest]                           │
│  [Summary]                        [Voucher]                             │
│                                   [Reopen Check]                        │
│  [Clear] [Save] [FIRE] [CHARGE]                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Click CHARGE → Payment Dialog
                                    │ Select Split Check → Configure
                                    │ Click SAVE icon
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           SPLIT ORDER STATE                             │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ ⚠ This check has been split. Re-merge this ticket if you want to  │ │
│  │   fire it or add products to it.                                   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  [Order Items]                    Sidebar:                              │
│  ├─ Item 1                        [Merge] ← NEW                         │
│  ├─ Item 2                        [Transfer Check]                      │
│  └─ Item 3                        [Gift Card]                           │
│                                   [Service Charge]                      │
│  [Summary]                        [Add Guest]                           │
│                                   [Voucher]                             │
│  [Clear] [Save] [FIRE-disabled] [CHARGE]    [Reopen Check]              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Click "Merge" button
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      BACK TO NORMAL ORDER STATE                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Add State for Split Order in Orders.tsx

Add a new state variable to track if the order is in split mode.

**File:** `src/pages/Orders.tsx` (around line 6154)

**New State:**
```typescript
const [isOrderSplit, setIsOrderSplit] = useState(false);
```

---

### Step 2: Add Split Configuration State

Store the split configuration details for potential display/use.

**File:** `src/pages/Orders.tsx` (around line 6154)

**New State:**
```typescript
const [splitConfiguration, setSplitConfiguration] = useState<{
  mode: 'seat' | 'evenly' | 'custom';
  numberOfChecks: number;
  checkAssignments: Record<number, number>;
} | null>(null);
```

---

### Step 3: Add onSaveSplit Prop to PaymentDialog

Extend the PaymentDialogProps interface to accept a callback for saving split configuration.

**File:** `src/components/PaymentDialog.tsx` (lines 44-52)

**Updated Interface:**
```typescript
export interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderDetails: PaymentDialogOrderDetails;
  subtotal: number;
  tax: number;
  total: number;
  onPaymentComplete?: (paymentHistory: PaymentHistoryItem[]) => void;
  onSaveSplit?: (config: {
    mode: 'seat' | 'evenly' | 'custom';
    numberOfChecks: number;
    checkAssignments: Record<number, number>;
  }) => void;
}
```

---

### Step 4: Update Save Button in PaymentDialog

Modify the Save button's onClick handler to call the new onSaveSplit callback.

**File:** `src/components/PaymentDialog.tsx` (lines 4230-4238)

**Updated Handler:**
```typescript
<button
  onClick={() => {
    onSaveSplit?.({
      mode: splitMode,
      numberOfChecks,
      checkAssignments
    });
    onOpenChange(false); // Close the dialog
  }}
  className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-neutral-800 text-white flex items-center justify-center hover:bg-neutral-700 transition-colors ml-1`}
>
  <Save className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
</button>
```

---

### Step 5: Pass onSaveSplit to PaymentDialog

Update the PaymentDialog usage in Orders.tsx to pass the new callback.

**File:** `src/pages/Orders.tsx` (lines 8936-8961)

**Updated Usage:**
```typescript
<PaymentDialog
  open={showPaymentDialog}
  onOpenChange={setShowPaymentDialog}
  orderDetails={{...}}
  subtotal={subtotal}
  tax={tax}
  total={chargeAmount}
  onPaymentComplete={(history) => {
    console.log("Payment completed:", history);
  }}
  onSaveSplit={(config) => {
    setIsOrderSplit(true);
    setSplitConfiguration(config);
  }}
/>
```

---

### Step 6: Display Warning Message in Order Panel

Add a warning banner above the order summary when the order is split.

**File:** `src/pages/Orders.tsx` (before line 8512, inside the order panel)

**New Component:**
```typescript
{/* Split Order Warning */}
{isOrderSplit && orderItems.length > 0 && (
  <div className="px-2 py-2">
    <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg px-3 py-2">
      <p className="text-amber-400 text-xs leading-relaxed">
        This check has been split. Re-merge this ticket if you want to fire it or add products to it.
      </p>
    </div>
  </div>
)}
```

---

### Step 7: Add Merge Button to Sidebar

Add a Merge button at the top of the sidebar that appears when the order is split.

**File:** `src/pages/Orders.tsx` (lines 8613-8622, inside the sidebar)

**New Button:**
```typescript
{/* Merge - Only show when order is split */}
{isOrderSplit && (
  <button 
    onClick={() => {
      setIsOrderSplit(false);
      setSplitConfiguration(null);
    }}
    className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl hover:bg-sidebar-accent transition-colors"
  >
    <img src={mergeIcon} alt="" className="w-5 h-5" />
    <span className="text-[9px] text-white text-center leading-tight">Merge</span>
  </button>
)}
```

**Note:** Import the merge icon at the top of the file. We'll use the existing `link-merge.png` icon.

---

### Step 8: Disable FIRE Button When Split

Modify the FIRE button to be disabled and styled appropriately when the order is split.

**File:** `src/pages/Orders.tsx` (lines 8582-8587)

**Updated FIRE Button:**
```typescript
<button 
  disabled={isOrderSplit}
  onClick={() => {
    if (!isOrderSplit) {
      // Fire action
    }
  }}
  className={`flex-1 h-8 rounded-full flex items-center justify-center gap-1.5 ${
    isOrderSplit ? 'opacity-50 cursor-not-allowed' : ''
  }`}
  style={{
    background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)'
  }}
>
  <img src={fireIcon} alt="Fire" className="w-4 h-4" />
  <span className="text-white font-semibold text-sm">FIRE</span>
</button>
```

---

### Step 9: Add State for Split Order Alert Dialog

Add state to control showing the split order alert when trying to add items.

**File:** `src/pages/Orders.tsx` (around line 6154)

**New State:**
```typescript
const [showSplitOrderAlert, setShowSplitOrderAlert] = useState(false);
```

---

### Step 10: Block Adding Items to Split Order

Modify the addToCart function to check if the order is split and show an alert instead.

**File:** `src/pages/Orders.tsx` (function addToCart around line 6405)

**Updated Function:**
```typescript
const addToCart = (item: {
  id: number;
  name: string;
  price: number;
}) => {
  // Block adding items if order is split
  if (isOrderSplit) {
    setShowSplitOrderAlert(true);
    return;
  }
  
  // ... existing add to cart logic
};
```

---

### Step 11: Add Split Order Alert Dialog

Add a dialog component to display the split order warning when trying to add items.

**File:** `src/pages/Orders.tsx` (near other dialogs, around line 8900)

**New Dialog:**
```typescript
{/* Split Order Alert Dialog */}
{showSplitOrderAlert && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="bg-neutral-900 rounded-xl border border-neutral-700 w-[90%] max-w-sm mx-4 overflow-hidden animate-scale-in">
      <div className="p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 text-amber-400" />
        </div>
        <h3 className="text-white font-semibold text-lg mb-2">Cannot Add Items</h3>
        <p className="text-neutral-400 text-sm mb-6">
          You cannot add more items to a split order. If you want to add items, please merge the order first.
        </p>
        <button
          onClick={() => setShowSplitOrderAlert(false)}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-amber-400 text-white font-semibold hover:opacity-90 transition-opacity"
        >
          OK
        </button>
      </div>
    </div>
  </div>
)}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Orders.tsx` | Add states (isOrderSplit, splitConfiguration, showSplitOrderAlert), add warning message, add Merge button, disable FIRE, block addToCart, add alert dialog, pass onSaveSplit prop |
| `src/components/PaymentDialog.tsx` | Add onSaveSplit prop to interface, implement Save button handler |

---

## Technical Notes

1. **Icon for Merge Button:** Use existing `link-merge.png` from `src/assets/icons/`
2. **AlertCircle icon:** Already imported in Orders.tsx
3. **State reset on Merge:** Clicking Merge sets `isOrderSplit` to false and clears `splitConfiguration`
4. **Dialog closing:** Save button closes the PaymentDialog after saving the split configuration
5. **Visual consistency:** Warning message uses amber color scheme matching the design screenshot

---

## Testing Checklist

- Add items to cart, click CHARGE to open payment dialog
- Select Split Check payment method
- Configure split (evenly, by seat, or custom)
- Click Save icon button
- Verify dialog closes and warning message appears in order panel
- Verify FIRE button is disabled (grayed out)
- Try to add new items - verify alert dialog appears
- Click OK to dismiss alert
- Verify Merge button appears in sidebar when split
- Click Merge button
- Verify warning message disappears
- Verify FIRE button is enabled again
- Verify items can be added to cart again
