
# Hide Table-Specific Details for Direct Orders in Payment Dialog Sidebar

## Overview
When creating a direct order from the New Order screen and opening the Payment Dialog, the sidebar currently displays table-specific information (party size, seat numbers) that is not relevant for direct orders. These elements should only appear for table orders.

---

## Current Issues

The sidebar in PaymentDialog shows table-specific UI elements even for direct orders:

| Element | Location | Issue |
|---------|----------|-------|
| Users icon + "4" guests | Header Row 2 | Hardcoded "4" displayed for all orders |
| Seat number badges per item | Item list | Shows Users icon + seat/share indicators for every item |

---

## Solution

Use `orderDetails.partySize` as the conditional check to determine if the order is a table order. This property is:
- **Present** for table orders (passed from TableOrderDetails)
- **Undefined** for direct orders (not passed from Orders page)

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    Sidebar Display Logic                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  TABLE ORDER (partySize defined):                                        │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Guest Name         (555) 123-4567              2:30 PM         │    │
│  │  ┌─────────┐   ┌───────────────┐   ┌─────────────────┐         │    │
│  │  │TABLE T2 │   │ 👥 4    10    │   │ 👤 SERVER       │         │    │
│  │  └─────────┘   └───────────────┘   └─────────────────┘         │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  [1] Margherita Pizza                              $18.99       │    │
│  │      👥 [1] [2]                    ← Seat indicators shown      │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  DIRECT ORDER (partySize undefined):                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Guest Name         (555) 123-4567              2:30 PM         │    │
│  │                     ┌─────────────────┐                         │    │
│  │                     │ 👤 SERVER       │    ← Only server shown  │    │
│  │                     └─────────────────┘                         │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  [1] Margherita Pizza                              $18.99       │    │
│  │                                     ← No seat indicators        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Conditionally Render Party Size Display in Header

Update the header Row 2 to only show the Users/guests section when `partySize` exists:

**Current code (lines 4779-4783):**
```typescript
<div className="flex items-center gap-2 text-neutral-300">
  <Users className="w-3 h-3" />
  <span className="text-xs">4</span>
  <span className="text-white font-medium text-xs ml-1">10</span>
</div>
```

**New code:**
```typescript
{orderDetails.partySize && (
  <div className="flex items-center gap-2 text-neutral-300">
    <Users className="w-3 h-3" />
    <span className="text-xs">{orderDetails.partySize}</span>
  </div>
)}
```

This also fixes the hardcoded "4" to use the actual `partySize` value.

### Step 2: Conditionally Render Seat Indicators on Items

Update the order items mapping to only show seat indicators when `partySize` exists:

**Current code (lines 4869-4883):**
```typescript
{/* Seat indicators */}
<div className="flex items-center gap-0.5 mt-1">
  <Users className="w-2.5 h-2.5 text-neutral-500" />
  {isItemShared ? (
    <span className="w-4 h-4 rounded bg-neutral-700 text-white flex items-center justify-center">
      <Share2 className="w-2.5 h-2.5" />
    </span>
  ) : (
    itemSeats.map(seat => (
      <span key={seat} className="w-4 h-4 rounded bg-neutral-700 text-white text-[9px] font-medium flex items-center justify-center">
        {seat}
      </span>
    ))
  )}
</div>
```

**New code:**
```typescript
{/* Seat indicators - only for table orders */}
{orderDetails.partySize && (
  <div className="flex items-center gap-0.5 mt-1">
    <Users className="w-2.5 h-2.5 text-neutral-500" />
    {isItemShared ? (
      <span className="w-4 h-4 rounded bg-neutral-700 text-white flex items-center justify-center">
        <Share2 className="w-2.5 h-2.5" />
      </span>
    ) : (
      itemSeats.map(seat => (
        <span key={seat} className="w-4 h-4 rounded bg-neutral-700 text-white text-[9px] font-medium flex items-center justify-center">
          {seat}
        </span>
      ))
    )}
  </div>
)}
```

---

## Technical Details

### File to Modify

| File | Changes |
|------|---------|
| `src/components/PaymentDialog.tsx` | Add conditional rendering for party size and seat indicators |

### Code Change Locations

| Lines | Change |
|-------|--------|
| 4779-4783 | Wrap party size display in `orderDetails.partySize &&` conditional |
| 4869-4883 | Wrap seat indicators in `orderDetails.partySize &&` conditional |

---

## Behavior Summary

| Order Type | Table Badge | Party Size | Server | Item Seat Indicators |
|------------|-------------|------------|--------|---------------------|
| Table Order | Shown (if table exists) | Shown (actual value) | Shown | Shown |
| Direct Order | Hidden | Hidden | Shown | Hidden |

---

## Testing Checklist
- Open Payment Dialog from New Order screen (direct order) - no party size or seat indicators shown
- Open Payment Dialog from Table Order screen - party size and seat indicators shown
- Party size displays actual value from `partySize` instead of hardcoded "4"
- Server label remains visible for both order types
- Table badge still shows only when `orderDetails.table` exists
- All payment functionality works correctly after changes
