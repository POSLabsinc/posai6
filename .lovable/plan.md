
# Hide "Split by Seat" Option for Non-Table Orders

## Overview
When making direct orders from the New Order screen and choosing split payment, the "Split by Seat" option should be hidden. This option is only relevant for table orders where guests are seated and items can be assigned to specific seats.

---

## How It Works

The payment dialog receives order details that differ based on the order source:

| Source | `orderDetails.partySize` | Has Seat Data |
|--------|-------------------------|---------------|
| Table Order (TableOrderDetails) | ✅ Passed (e.g., 4) | ✅ Yes |
| New Order (Orders page) | ❌ Not passed | ❌ No |

The "Split by Seat" mode relies on `partySize` to determine the number of tickets and divide items by seat. Without this data, the option is not functional.

---

## Implementation

### Step 1: Filter Split Mode Tabs

Update the split mode tabs array to conditionally include "Split by Seat" only when `partySize` exists:

```text
┌─────────────────────────────────────────────────────────────┐
│                    Split Mode Tabs                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Table Order (partySize defined):                           │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐  │
│  │ Split by Seat  │ │ Split Evenly   │ │ Custom Split   │  │
│  └────────────────┘ └────────────────┘ └────────────────┘  │
│                                                             │
│  New Order (partySize undefined):                           │
│  ┌────────────────┐ ┌────────────────┐                     │
│  │ Split Evenly   │ │ Custom Split   │                     │
│  └────────────────┘ └────────────────┘                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 2: Define Filtered Tabs Array

Replace the static tabs array with a filtered one:

**Current code (lines 4123-4127):**
```typescript
{[
  { id: 'seat' as const, label: 'Split by Seat' },
  { id: 'evenly' as const, label: 'Split Evenly' },
  { id: 'custom' as const, label: 'Custom Split' },
].map(tab => (
```

**New code:**
```typescript
{[
  ...(orderDetails.partySize ? [{ id: 'seat' as const, label: 'Split by Seat' }] : []),
  { id: 'evenly' as const, label: 'Split Evenly' },
  { id: 'custom' as const, label: 'Custom Split' },
].map(tab => (
```

### Step 3: Ensure Default Split Mode is 'evenly'

The default is already set correctly:
- Initial state: `useState<'seat' | 'evenly' | 'custom'>('evenly')`
- Reset on open: `setSplitMode('evenly')`

This ensures that when a new order opens the payment dialog, it defaults to "Split Evenly" mode.

---

## Technical Details

### File to Modify

| File | Changes |
|------|---------|
| `src/components/PaymentDialog.tsx` | Filter "Split by Seat" tab based on `orderDetails.partySize` |

### Code Change Location

**Lines 4123-4127** - Update the tabs array to conditionally include the "Split by Seat" option

---

## Behavior Summary

| Order Type | Split by Seat | Split Evenly | Custom Split |
|------------|---------------|--------------|--------------|
| Table Order | ✅ Visible | ✅ Visible | ✅ Visible |
| New Order (non-table) | ❌ Hidden | ✅ Visible | ✅ Visible |

---

## Testing Checklist
- Open payment from New Order screen → Only "Split Evenly" and "Custom Split" tabs appear
- Open payment from Table Order screen → All three tabs appear including "Split by Seat"
- Default split mode is "Split Evenly" when dialog opens
- Switching between available tabs works correctly
- Payment flow functions normally with reduced tab options
