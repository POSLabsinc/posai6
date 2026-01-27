

# Split by Seat Implementation Plan

## Overview
Implement proper "Split by Seat" functionality where:
- Number of tickets automatically equals the party size
- Items are assigned to tickets based on their seat assignments
- Shared items (served to all guests) are split equally across all tickets

---

## Current Behavior (Problem)

When users select "Split by Seat", the current implementation:
- Uses a manually adjustable check counter (unrelated to party size)
- Divides items by array slicing without considering seat assignments
- Does not handle shared items

```text
// Current problematic logic in getItemsForCheck():
if (splitMode === 'seat') {
  const itemsPerCheck = Math.ceil(orderDetails.items.length / numberOfChecks);
  const startIdx = (checkNumber - 1) * itemsPerCheck;
  return orderDetails.items.slice(startIdx, startIdx + itemsPerCheck);
}
```

---

## Solution Architecture

### Data Flow

```text
┌─────────────────────────────────────────────────────────────────┐
│  Order Data (src/data/orders.ts)                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ partySize: 4                                                ││
│  │ items: [                                                    ││
│  │   { name: "Burger", seats: [1, 2], isShared: false }        ││
│  │   { name: "Meatballs", seats: [], isShared: true }          ││
│  │   { name: "Pasta", seats: [3, 4], isShared: false }         ││
│  │ ]                                                           ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                           │
        TableOrderDetails.tsx (mapping with seat data)
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  PaymentDialog (enhanced props)                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ orderDetails: {                                             ││
│  │   partySize: 4,                                             ││
│  │   items: [                                                  ││
│  │     { id: 1, name: "Burger", assignedSeats: [1,2] }         ││
│  │     { id: 2, name: "Meatballs", isShared: true }            ││
│  │     { id: 3, name: "Pasta", assignedSeats: [3,4] }          ││
│  │   ]                                                         ││
│  │ }                                                           ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                           │
           Split by Seat Logic (new implementation)
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Generated Tickets (4 tickets = party size)                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │ Seat 1  │ │ Seat 2  │ │ Seat 3  │ │ Seat 4  │              │
│  │─────────│ │─────────│ │─────────│ │─────────│              │
│  │ Burger  │ │ Burger  │ │ Pasta   │ │ Pasta   │              │
│  │ $12.00  │ │ $12.00  │ │ $8.00   │ │ $8.00   │              │
│  │Meatballs│ │Meatballs│ │Meatballs│ │Meatballs│              │
│  │ $4.00   │ │ $4.00   │ │ $4.00   │ │ $4.00   │              │
│  │─────────│ │─────────│ │─────────│ │─────────│              │
│  │Total:   │ │Total:   │ │Total:   │ │Total:   │              │
│  │ $16.00  │ │ $16.00  │ │ $12.00  │ │ $12.00  │              │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Update PaymentDialog Types

Modify the `PaymentDialogOrderItem` interface to include seat data:

```text
// PaymentDialog.tsx - Lines 15-20
export interface PaymentDialogOrderItem {
  id: number;
  qty: number;
  name: string;
  price: number;
  assignedSeats?: number[];  // NEW: Which seats this item belongs to
  isShared?: boolean;        // NEW: If true, split cost among all seats
}
```

Modify the `PaymentDialogOrderDetails` interface to include party size:

```text
// PaymentDialog.tsx - Lines 22-28
export interface PaymentDialogOrderDetails {
  guest?: string;
  phone?: string;
  table?: string;
  check?: number | string;
  partySize?: number;        // NEW: Number of guests at the table
  items: PaymentDialogOrderItem[];
}
```

### Step 2: Update TableOrderDetails to Pass Seat Data

Modify the PaymentDialog invocation to include seat information:

```text
// TableOrderDetails.tsx - Lines 2309-2315
items: currentSelectedGuest?.items.map((item, index) => ({
  id: index + 1,
  qty: item.qty,
  name: item.name,
  price: item.price * item.qty,
  assignedSeats: item.seats || [],        // NEW
  isShared: item.isShared || false        // NEW
})) || []

// Also add partySize to orderDetails
partySize: currentSelectedGuest?.partySize || 4
```

### Step 3: Auto-Set Check Count for Seat Mode

When user switches to "Split by Seat" mode, automatically set `numberOfChecks` to match `partySize`:

```text
// In split mode tab click handler (around line 4083)
onClick={() => {
  setSplitMode(tab.id);
  if (tab.id === 'seat') {
    // Auto-set checks to party size
    setNumberOfChecks(orderDetails.partySize || 4);
  }
}}
```

### Step 4: Update getItemsForCheck for Seat Mode

Implement proper seat-based item filtering:

```text
const getItemsForCheck = (checkNumber: number): PaymentDialogOrderItem[] => {
  if (splitMode === 'evenly') {
    return orderDetails.items;
  } else if (splitMode === 'seat') {
    // checkNumber corresponds to seat number
    const seatNumber = checkNumber;
    
    return orderDetails.items.filter(item => {
      // Shared items appear on all tickets
      if (item.isShared || (item.assignedSeats?.length === 0)) {
        return true;
      }
      // Item appears on ticket if seat is in assignedSeats
      return item.assignedSeats?.includes(seatNumber);
    });
  } else {
    // Custom mode
    return orderDetails.items.filter(item => checkAssignments[item.id] === checkNumber);
  }
};
```

### Step 5: Update getCheckTotals for Seat Mode

Handle shared item cost splitting:

```text
const getCheckTotals = (checkNumber: number) => {
  if (splitMode === 'evenly') {
    const checkTotal = total / numberOfChecks;
    const checkSubtotal = subtotal / numberOfChecks;
    const checkTax = tax / numberOfChecks;
    return { subtotal: checkSubtotal, tax: checkTax, total: checkTotal };
  } else if (splitMode === 'seat') {
    const seatNumber = checkNumber;
    const partySize = orderDetails.partySize || numberOfChecks;
    
    let checkSubtotal = 0;
    
    orderDetails.items.forEach(item => {
      const isShared = item.isShared || (item.assignedSeats?.length === 0);
      
      if (isShared) {
        // Shared items: divide cost by party size
        checkSubtotal += item.price / partySize;
      } else if (item.assignedSeats?.includes(seatNumber)) {
        // Seat-specific items: divide by number of seats assigned
        const seatsForItem = item.assignedSeats.length;
        checkSubtotal += item.price / seatsForItem;
      }
    });
    
    const checkTax = checkSubtotal * 0.0735;
    return { subtotal: checkSubtotal, tax: checkTax, total: checkSubtotal + checkTax };
  } else {
    // Custom mode - existing logic
    const items = getItemsForCheck(checkNumber);
    const checkSubtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const checkTax = checkSubtotal * 0.0735;
    return { subtotal: checkSubtotal, tax: checkTax, total: checkSubtotal + checkTax };
  }
};
```

### Step 6: Update Ticket Labels for Seat Mode

Change ticket labels from "Check 1a" to "Seat 1" when in seat mode:

```text
// Update getCheckLabel or add conditional logic
const getSeatModeCheckLabel = (seatIndex: number) => `Seat ${seatIndex + 1}`;

// In ticket card rendering, conditionally use:
{splitMode === 'seat' ? `Seat ${checkNum}` : getCheckLabel(checkNum - 1)}
```

### Step 7: Hide Check Counter in Seat Mode

When in seat mode, the check count is determined by party size, so hide the +/- counter:

```text
{/* Check Counter - only show for evenly and custom modes */}
{splitMode !== 'seat' && (
  <div className="flex items-center gap-2">
    {/* existing counter UI */}
  </div>
)}
```

### Step 8: Display Shared Item Indicator on Tickets

When rendering items on seat-based tickets, show that shared items are split:

```text
// In items list rendering for seat mode
{item.isShared && (
  <span className="text-neutral-500 text-[9px] ml-1">(split)</span>
)}
```

---

## Technical Details

### Files to Modify

1. **`src/components/PaymentDialog.tsx`**
   - Update `PaymentDialogOrderItem` interface (add `assignedSeats`, `isShared`)
   - Update `PaymentDialogOrderDetails` interface (add `partySize`)
   - Modify `getItemsForCheck()` function for seat-based filtering
   - Modify `getCheckTotals()` function for proper cost splitting
   - Update split mode tab handler to auto-set check count
   - Conditionally hide check counter in seat mode
   - Update ticket labels for seat mode

2. **`src/pages/TableOrderDetails.tsx`**
   - Update PaymentDialog invocation to pass `partySize`
   - Update item mapping to include `assignedSeats` and `isShared`

---

## Example Calculation

Given an order:
- Party size: 4
- Items:
  - Classic Burger ($24.00 total) - Seats [1, 2]
  - Meatballs ($16.00 total) - Shared (all seats)
  - Pasta ($16.00 total) - Seats [3, 4]

**Seat 1 Ticket:**
- Burger: $24.00 / 2 seats = $12.00
- Meatballs: $16.00 / 4 guests = $4.00
- **Subtotal: $16.00**

**Seat 2 Ticket:**
- Burger: $24.00 / 2 seats = $12.00
- Meatballs: $16.00 / 4 guests = $4.00
- **Subtotal: $16.00**

**Seat 3 Ticket:**
- Pasta: $16.00 / 2 seats = $8.00
- Meatballs: $16.00 / 4 guests = $4.00
- **Subtotal: $12.00**

**Seat 4 Ticket:**
- Pasta: $16.00 / 2 seats = $8.00
- Meatballs: $16.00 / 4 guests = $4.00
- **Subtotal: $12.00**

**Total: $16 + $16 + $12 + $12 = $56.00** (matches original order total)

---

## Testing Checklist
- Selecting "Split by Seat" auto-sets check count to party size
- Check counter is hidden in seat mode
- Items appear only on tickets matching their assigned seats
- Shared items appear on all tickets with divided costs
- Total of all tickets equals original order total
- Ticket labels show "Seat 1", "Seat 2", etc.
- Payment flow works correctly for seat-based tickets
- Switching between split modes resets appropriately

