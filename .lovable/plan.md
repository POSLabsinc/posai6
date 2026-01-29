
# Voucher Feature Implementation

## Overview
Replace the "Split Check" button in the "more options" sidebar with a "Voucher" button. When clicked, a dark-themed popup opens allowing staff to either sell vouchers (add to cart) or redeem existing vouchers. When a voucher is sold and paid for, it will be shared on the receipt.

---

## Visual Design Reference

Based on the provided images, the popup will have:
- Header: "Sell Voucher" title
- Amount display showing selected value (e.g., "$10.00")
- Preset amount buttons: $10.00, $25.00, $50.00, $100.00
- Numeric keypad (1-9, 0, 00, C for clear)
- "CHARGE $X.XX" button that dynamically updates with selected amount
- "REDEEM VOUCHER" button at the bottom

```text
┌─────────────────────────────────────────────────────────────┐
│                       Sell Voucher                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                         $10.00                              │
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ $10.00  │  │ $25.00  │  │ $50.00  │  │ $100.00 │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                     │
│  │    1    │  │    2    │  │    3    │                     │
│  └─────────┘  └─────────┘  └─────────┘                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                     │
│  │    4    │  │    5    │  │    6    │                     │
│  └─────────┘  └─────────┘  └─────────┘                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                     │
│  │    7    │  │    8    │  │    9    │                     │
│  └─────────┘  └─────────┘  └─────────┘                     │
│  ┌─────────┐  ┌─────────┐  ┌───────────┐                   │
│  │    0    │  │   00    │  │     C     │                   │
│  └─────────┘  └─────────┘  └───────────┘                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 CHARGE $10.00                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 REDEEM VOUCHER                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## User Flow

### Sell Voucher Flow
1. Staff clicks "Voucher" button in more options sidebar
2. Voucher dialog opens with "Sell Voucher" view (default)
3. Staff selects amount via preset buttons or enters custom amount with keypad
4. Staff clicks "CHARGE $X.XX" button
5. Voucher item is added to the cart with selected amount
6. Dialog closes
7. Staff processes payment normally
8. Voucher code is printed/shared on receipt after successful payment

### Redeem Voucher Flow
1. Staff clicks "Voucher" button
2. Staff clicks "REDEEM VOUCHER" button
3. Dialog switches to redemption view with voucher code entry
4. Staff enters/scans voucher code
5. System validates voucher and applies balance to order

---

## Implementation Steps

### Step 1: Create VoucherDialog Component

Create a new dialog component with dark theme styling.

**File:** `src/components/VoucherDialog.tsx`

**Props Interface:**
```typescript
interface VoucherDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVoucher: (amount: number) => void;
  onRedeemVoucher: (voucherCode: string, balance: number) => void;
}
```

**State Variables:**
- `view`: 'sell' | 'redeem' - Current dialog view
- `amount`: string - Amount for selling voucher (keypad input)
- `selectedPreset`: number | null - Currently selected preset amount
- `voucherCode`: string - Code for redeeming voucher
- `isValidating`: boolean - Loading state for redemption
- `validatedBalance`: number | null - Balance after validation

**Styling (Dark Theme):**
- Dialog container: `bg-neutral-900 border-neutral-700 rounded-xl`
- Amount display: Large centered text, white color
- Preset buttons: `bg-neutral-800 border-neutral-600 hover:bg-neutral-700`
- Selected preset: White background with black text
- Keypad buttons: `bg-neutral-800 hover:bg-neutral-700`
- Clear button (C): `bg-red-500/20 text-red-400`
- Charge button: `bg-neutral-800 text-white` (enabled when amount > 0)
- Redeem button: `bg-neutral-800 border-neutral-600 text-white`

### Step 2: Sell Voucher UI

The sell voucher view includes:

**Amount Display:**
- Shows current amount or "$0.00" if none selected
- Large font, centered, white text

**Preset Amount Grid:**
- 4 buttons in a row: $10.00, $25.00, $50.00, $100.00
- Selected state: white background, black text
- Clicking preset sets amount and highlights button

**Numeric Keypad:**
- 4 rows: [1,2,3], [4,5,6], [7,8,9], [0,00,C]
- Clear (C) button has red styling
- Builds amount as string (e.g., "1000" = $10.00)

**Charge Button:**
- Disabled state when amount is $0.00
- Dynamic text: "CHARGE" when $0, "CHARGE $XX.XX" when amount set
- Full width, dark background

**Redeem Button:**
- Full width, bordered style
- Switches to redeem view on click

### Step 3: Redeem Voucher UI (Phase 2)

The redeem view includes:
- Back button to return to sell view
- Voucher code input field
- Keypad for entering code
- Validate button
- After validation: shows balance and "Apply to Order" button

### Step 4: Add State to Orders.tsx

**New State Variables:**
```typescript
const [showVoucherDialog, setShowVoucherDialog] = useState(false);
const [appliedVoucherAmount, setAppliedVoucherAmount] = useState(0);
const [voucherCode, setVoucherCode] = useState('');
```

### Step 5: Update Sidebar Button

Replace the "Split Check" button with "Voucher" button:

**Current (line 8605-8608):**
```typescript
<button className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl hover:bg-sidebar-accent transition-colors">
  <img src={splitCheckIcon} alt="" className="w-5 h-5" />
  <span className="text-[9px] text-white text-center leading-tight">Split<br/>Check</span>
</button>
```

**Updated:**
```typescript
<button 
  onClick={() => setShowVoucherDialog(true)}
  className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl hover:bg-sidebar-accent transition-colors"
>
  <Ticket className="w-5 h-5 text-white" />
  <span className="text-[9px] text-white text-center leading-tight">Voucher</span>
</button>
```

### Step 6: Update Dropdown Menu

Replace the "Split Check" menu item (line 7014-7017):

**Current:**
```typescript
<DropdownMenuItem className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2">
  <img src={splitCheckIcon} alt="" className="w-3.5 h-3.5" />
  Split Check
</DropdownMenuItem>
```

**Updated:**
```typescript
<DropdownMenuItem 
  onClick={() => setShowVoucherDialog(true)}
  className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2"
>
  <Ticket className="w-3.5 h-3.5" />
  Voucher
</DropdownMenuItem>
```

### Step 7: Add Voucher to Cart Handler

```typescript
const handleAddVoucher = (amount: number) => {
  setOrderItems(prev => [...prev, {
    id: Date.now(),
    qty: 1,
    name: `Voucher - $${amount.toFixed(2)}`,
    price: amount,
    itemOrderType: 'VOUCHER'
  }]);
  setShowVoucherDialog(false);
};
```

### Step 8: Redeem Voucher Handler

```typescript
const handleRedeemVoucher = (code: string, balance: number) => {
  setAppliedVoucherAmount(balance);
  setVoucherCode(code);
  setShowVoucherDialog(false);
};
```

### Step 9: Render VoucherDialog

Add at end of Orders component:

```typescript
<VoucherDialog
  isOpen={showVoucherDialog}
  onClose={() => setShowVoucherDialog(false)}
  onAddVoucher={handleAddVoucher}
  onRedeemVoucher={handleRedeemVoucher}
/>
```

---

## Technical Details

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/VoucherDialog.tsx` | Voucher sell/redeem popup component |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Orders.tsx` | Add state, handlers, replace Split Check buttons, render dialog |

### Component Features

| Feature | Implementation |
|---------|----------------|
| Preset Amounts | $10, $25, $50, $100 quick select buttons |
| Custom Amount | Numeric keypad for manual entry |
| Amount Display | Formatted currency display |
| Add to Cart | Creates voucher item with specified amount |
| Redeem Flow | Code entry, validation, apply balance |
| Dark Theme | Matching neutral-900/800/700 styling |

### Cart Item Structure for Voucher

```typescript
{
  id: Date.now(),
  qty: 1,
  name: "Voucher - $25.00",
  price: 25.00,
  itemOrderType: "VOUCHER"
}
```

---

## Receipt Integration

When a voucher is sold:
- The voucher item appears in the cart and on the receipt
- A unique voucher code is generated after payment
- The code is included in the receipt (print/text/email)
- The voucher balance is stored for future redemption

---

## Testing Checklist

- Click Voucher button in sidebar opens dialog
- Click Voucher in dropdown menu opens dialog
- Preset amount buttons update display and highlight correctly
- Keypad allows custom amount entry
- Clear button resets amount
- CHARGE button is disabled when amount is $0.00
- CHARGE button shows correct amount when selected
- Clicking CHARGE adds voucher to cart with correct price
- Dialog closes after adding voucher
- Voucher appears in cart with correct formatting
- REDEEM VOUCHER switches to redemption view
- Dialog styling matches dark theme
