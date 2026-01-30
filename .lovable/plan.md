
# Update Dashboard Payment Module

## Overview
Update the Dashboard page's payment module to match the new order screen's implementation. This includes:
1. Consolidating the four delivery methods (Blizzful, UberEats, DoorDash, Grubhub) into a single "Third Party Delivery" option
2. Adding the Split Check payment method

## Current State
- Dashboard.tsx (5263 lines) has its **own inline payment dialog implementation** (~2000+ lines of payment UI code)
- Still uses the old four separate delivery methods
- Missing the Split Check payment method
- Missing the consolidated "Third Party Delivery" flow

## Recommended Approach: Use Shared PaymentDialog Component

Instead of duplicating the complex payment logic, the Dashboard should use the shared `PaymentDialog` component (`src/components/PaymentDialog.tsx`) which already has:
- Third Party Delivery with partner selection
- Split Check support
- All 13+ payment methods
- Mobile responsive design
- Multi-payment history tracking

---

## Implementation Steps

### Step 1: Import PaymentDialog Component
Add import for the shared PaymentDialog component at the top of Dashboard.tsx.

**File:** `src/pages/Dashboard.tsx`
```typescript
import { PaymentDialog, PaymentDialogOrderDetails, PaymentHistoryItem } from "@/components/PaymentDialog";
```

### Step 2: Add PaymentDialog State
Add state to track payment dialog open/close and prepare order details.

**File:** `src/pages/Dashboard.tsx`
```typescript
const [showPaymentDialog, setShowPaymentDialog] = useState(false);
```

### Step 3: Prepare Order Details for PaymentDialog
Create a function or computed value to format the selected order data for the PaymentDialog interface.

```typescript
const paymentOrderDetails: PaymentDialogOrderDetails = {
  guestName: selectedOrder?.guest || "Guest",
  orderType: selectedOrder?.type || "Dine In",
  orderNumber: selectedOrder?.id || "--",
  serverName: selectedOrder?.server || "Server",
  orderTime: selectedOrder?.arrivedAt || "12:00 PM",
  tableId: selectedOrder?.table,
  partySize: selectedOrder?.seats || 4,
  items: orderItems.map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
    qty: item.qty,
    assignedSeats: item.seats,
    isShared: item.seats.length === (selectedOrder?.seats || 4),
  })),
};
```

### Step 4: Replace Inline Payment Dialog with PaymentDialog Component
Replace the inline payment dialog code in the OrderPanelContent component with the shared PaymentDialog.

**In the OrderPanelContent props interface**, remove all the individual payment method props (gift card, pay link, manual CC, delivery methods, etc.) and replace with simpler state management.

**In the CHARGE button onClick handler:**
```typescript
onClick={() => {
  setShowPaymentDialog(true);
}}
```

### Step 5: Render PaymentDialog in Dashboard Component
Add the PaymentDialog component at the end of the Dashboard render.

```typescript
<PaymentDialog
  open={showPaymentDialog}
  onOpenChange={setShowPaymentDialog}
  orderDetails={paymentOrderDetails}
  subtotal={subtotal}
  tax={tax}
  total={total}
  onPaymentComplete={(paymentHistory) => {
    console.log("Payment completed:", paymentHistory);
    // Handle order completion logic
  }}
  onSaveSplit={(config) => {
    // Handle split and save logic if needed
    console.log("Split saved:", config);
  }}
/>
```

### Step 6: Clean Up Unused State Variables
Remove the following state variables and props that are no longer needed (handled by PaymentDialog internally):
- giftCardStep, giftCardNumber
- payByLinkStep, selectedGuest, guestSearchQuery
- qrCodeStep, qrPhoneNumber, showQrPhoneInput
- loyaltyStep, loyaltySelectedGuest, loyaltyPointsToRedeem
- manualCCStep, externalCCStep, manualCardStep
- doordashStep, doordashReference
- blizzfulStep, blizzfulReference
- ubereatsStep, ubereatsReference
- grubhubStep, grubhubReference
- textReceiptStep, textReceiptPhone
- emailReceiptStep, emailReceiptEmail
- visiblePaymentMethods, dropdownPaymentMethods
- paymentAmount, amountQuantities, showKeypad

### Step 7: Simplify OrderPanelContent Props
Update the OrderPanelContentProps interface to remove all payment-specific props and keep only essential order management props.

### Step 8: Remove Inline Payment Dialog UI
Delete the large inline payment dialog JSX code block (approximately lines 1313-4200 in the current OrderPanelContent) that handles all the payment flows.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Dashboard.tsx` | Import and use PaymentDialog component, remove inline payment dialog implementation, clean up unused state |

---

## Technical Notes

1. **Code Reduction**: This refactor will remove approximately 2500+ lines of duplicated payment code from Dashboard.tsx
2. **Consistency**: Using the shared PaymentDialog ensures Dashboard and Orders pages have identical payment behavior
3. **Maintenance**: Future payment method updates only need to be made in PaymentDialog.tsx
4. **Split Check**: Automatically available through the shared component
5. **Third Party Delivery**: Automatically uses the consolidated partner selection flow

---

## Testing Checklist

- Navigate to Dashboard page
- Select an order from the list
- Click CHARGE button to open payment dialog
- Verify all payment methods are available including Split Check
- Click "Other" dropdown and verify "3rd Party Delivery" appears (not individual delivery apps)
- Select "3rd Party Delivery" and verify partner selection screen shows
- Test payment completion flow
- Verify receipt options work correctly
- Test on mobile viewport
