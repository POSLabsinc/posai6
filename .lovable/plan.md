

# Persist Tip to Database on Add Tip Flow

## Problem
All three pages with "ADD TIP" functionality only update local React state — none persist the tip to the `ticket_orders` table in the database.

- **Tickets.tsx** (`handleTipSelect`): Updates `selectedGuest.tip` via `setSelectedGuest` — no DB call
- **TableOrderDetails.tsx** (`TipDialog onTipSelected`): Just `console.log("Tip selected:", tip)` — no DB call  
- **Dashboard.tsx** (`TipDialog onTipSelected`): Just `console.log("Tip selected:", tip)` — no DB call

## Fix

Wire up `useTicketOrders().updateOrder()` in all three locations to persist tip + recalculated total to the database.

### 1. Tickets.tsx — `handleTipSelect` (~line 1267)

Replace the local-only state update with a DB persist call:
```typescript
const handleTipSelect = async (tipAmount: number) => {
  if (tipAmount > 0) {
    const existingTip = selectedGuest.tip;
    const newTotalTip = existingTip + tipAmount;
    const newTotal = selectedGuest.total + tipAmount; // total includes tip
    
    // Persist to database
    await updateOrder(selectedGuest.id, { 
      tip: newTotalTip, 
      total: newTotal 
    });
    
    // Update local state
    setSelectedGuest(prev => ({ ...prev, tip: newTotalTip, total: newTotal }));
  }
};
```
This file already uses `useTicketOrders` — need to verify and destructure `updateOrder` from it.

### 2. TableOrderDetails.tsx — TipDialog `onTipSelected` (~line 3328)

Replace the `console.log` with actual DB persistence:
```typescript
onTipSelected={async (tip) => {
  if (currentSelectedGuest && tip > 0) {
    const existingTip = currentSelectedGuest.tip || 0;
    const newTotalTip = existingTip + tip;
    const newTotal = currentSelectedGuest.total + tip;
    
    await updateOrder(currentSelectedGuest.id, { 
      tip: newTotalTip, 
      total: newTotal 
    });
  }
}}
```
This file already imports `useTicketOrders` — destructure `updateOrder`.

### 3. Dashboard.tsx — TipDialog `onTipSelected` (~line 1919)

Same pattern — replace `console.log` with DB call using `useTicketOrders().updateOrder()`. Need to add the hook import if not already present.

### What gets persisted
The `ticket_orders` table already has `tip` (numeric) and `total` (numeric) columns. The update writes:
- `tip`: cumulative tip amount
- `total`: recalculated total including the new tip

No schema changes needed.

