

# Custom Split Drag-and-Drop Implementation Plan

## Overview
Replace the current "Assign Items to Checks" click-based UI in Custom Split mode with a drag-and-drop interface where users drag items from the right sidebar order panel and drop them onto specific ticket cards.

---

## Current Behavior

When "Custom Split" is selected:
1. Ticket cards are displayed in a 3-column grid
2. Below the grid, an "Assign Items to Checks" section shows all items with numbered buttons
3. Clicking a numbered button assigns that item to the corresponding check

```text
┌─────────────────────────────────────────────────┐
│        Split Payment Dialog (Current)           │
├─────────────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐                  │
│  │Check1│  │Check2│  │Check3│   (Ticket Cards) │
│  └──────┘  └──────┘  └──────┘                  │
│                                                 │
│  ┌─────────────────────────────────────┐       │
│  │ Assign Items to Checks              │ ← REMOVE│
│  │ ┌─────────────────────────────────┐ │       │
│  │ │ Burger        [1] [2] [3]       │ │       │
│  │ │ Pasta         [1] [2] [3]       │ │       │
│  │ └─────────────────────────────────┘ │       │
│  └─────────────────────────────────────┘       │
└─────────────────────────────────────────────────┘
```

---

## New Behavior

```text
┌──────────────────────────────────────────────────────────────┐
│                   Split Payment Dialog (New)                 │
├───────────────────────────────────────────┬──────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │ Order Panel      │
│  │ Check 1  │  │ Check 2  │  │ Check 3  │ │ ┌──────────────┐ │
│  │          │  │          │  │          │ │ │ ≡ Burger     │ │ ← Drag Handle
│  │  DROP    │  │  DROP    │  │  DROP    │ │ │   $24.00     │ │
│  │  HERE    │  │  HERE    │  │  HERE    │ │ ├──────────────┤ │
│  │          │  │          │  │          │ │ │ ≡ Pasta      │ │
│  │ $0.00    │  │ $0.00    │  │ $0.00    │ │ │   $16.00     │ │
│  └──────────┘  └──────────┘  └──────────┘ │ ├──────────────┤ │
│                                           │ │ ≡ Meatballs  │ │
│  (Items assigned via drag & drop from →)  │ │   $18.00     │ │
│                                           │ └──────────────┘ │
└───────────────────────────────────────────┴──────────────────┘
```

---

## Implementation Steps

### Step 1: Add Drag State Management

Add new state variables to track dragging:

```typescript
// Add after line 193
const [draggingItemId, setDraggingItemId] = useState<number | null>(null);
const [dragOverCheckNum, setDragOverCheckNum] = useState<number | null>(null);
```

### Step 2: Remove the "Assign Items to Checks" Section

Remove the current click-based assignment UI (lines 4339-4369):

```typescript
// DELETE this entire block
{splitMode === 'custom' && (
  <div className="mt-4 p-4 bg-neutral-800 rounded-xl">
    <h4 className="text-white font-medium text-sm mb-3">Assign Items to Checks</h4>
    ...
  </div>
)}
```

### Step 3: Make Order Panel Items Draggable in Custom Split Mode

Update the order items rendering (lines 4783-4820) to add drag functionality when in custom split mode:

```typescript
{orderDetails.items.map(item => {
  const itemSeats = item.assignedSeats || [];
  const isItemShared = item.isShared || itemSeats.length === 0;
  const isAssigned = checkAssignments[item.id] !== undefined;
  const assignedCheckNum = checkAssignments[item.id];
  
  return (
    <div 
      key={item.id} 
      draggable={selectedPaymentMethod === 'split-check' && splitMode === 'custom'}
      onDragStart={(e) => {
        e.dataTransfer.setData('itemId', item.id.toString());
        setDraggingItemId(item.id);
      }}
      onDragEnd={() => {
        setDraggingItemId(null);
        setDragOverCheckNum(null);
      }}
      className={`p-2 border border-sidebar-border rounded-lg transition-all ${
        selectedPaymentMethod === 'split-check' && splitMode === 'custom'
          ? 'cursor-grab active:cursor-grabbing hover:border-green-500/50'
          : ''
      } ${
        draggingItemId === item.id ? 'opacity-50 border-green-500' : ''
      } ${
        isAssigned ? 'border-green-500/30 bg-green-500/5' : ''
      }`}
      style={{ background: 'linear-gradient(180deg, #4D4D4D 0%, #616161 100%)' }}
    >
      {/* Drag handle icon */}
      {selectedPaymentMethod === 'split-check' && splitMode === 'custom' && (
        <div className="flex items-center gap-2">
          <GripVertical className="w-3 h-3 text-neutral-500" />
          {/* ... existing item content ... */}
        </div>
      )}
      
      {/* Show assigned check badge */}
      {isAssigned && splitMode === 'custom' && (
        <div className="flex items-center justify-between mt-1">
          <span className="text-green-400 text-[10px]">
            → Check {getCheckLabel(assignedCheckNum - 1).split(' ')[1]}
          </span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              // Remove assignment
              setCheckAssignments(prev => {
                const newAssignments = { ...prev };
                delete newAssignments[item.id];
                return newAssignments;
              });
            }}
            className="text-red-400 hover:text-red-300 text-[10px]"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
})}
```

### Step 4: Make Ticket Cards Droppable

Update the ticket cards (lines 4183-4334) to accept dropped items:

```typescript
<div 
  key={checkNum}
  onDragOver={(e) => {
    if (splitMode === 'custom') {
      e.preventDefault();
      setDragOverCheckNum(checkNum);
    }
  }}
  onDragLeave={() => setDragOverCheckNum(null)}
  onDrop={(e) => {
    if (splitMode === 'custom') {
      e.preventDefault();
      const itemId = parseInt(e.dataTransfer.getData('itemId'));
      if (!isNaN(itemId)) {
        setCheckAssignments(prev => ({ ...prev, [itemId]: checkNum }));
      }
      setDragOverCheckNum(null);
      setDraggingItemId(null);
    }
  }}
  className={`bg-neutral-800 border rounded-lg flex flex-col shadow-md relative overflow-hidden p-1.5 w-full min-w-0 transition-all ${
    isPaid ? 'opacity-60' : ''
  } ${
    splitMode === 'custom' && dragOverCheckNum === checkNum
      ? 'border-green-500 bg-green-500/10 scale-[1.02]'
      : 'border-neutral-700'
  }`}
>
  {/* Existing ticket content */}
  
  {/* Drop indicator when dragging in custom mode */}
  {splitMode === 'custom' && draggingItemId !== null && !isPaid && (
    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity ${
      dragOverCheckNum === checkNum ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className="bg-green-500/20 rounded-lg p-2">
        <span className="text-green-400 text-xs font-medium">Drop here</span>
      </div>
    </div>
  )}
</div>
```

### Step 5: Import GripVertical Icon

Add the `GripVertical` icon import:

```typescript
// Line 2-8 - add to existing imports
import { 
  Check, ChevronDown, X, Tag, CreditCard, User, Gift, Link, QrCode, 
  ArrowRightCircle, Banknote, Grid3X3, Delete, Printer, MessageSquare, 
  Mail, Truck, ShoppingBag, Clipboard, ExternalLink, Utensils, 
  UtensilsCrossed, ArrowLeft, UserPlus, Search, Phone, AlertTriangle, 
  RefreshCw, Send, Zap, Users, Clock, Share2, GripVertical  // ADD GripVertical
} from "lucide-react";
```

### Step 6: Add Helper Instructions When in Custom Split Mode

Add a subtle hint in the right panel header when in custom split mode:

```typescript
{/* Guest Info Header */}
<div className="p-3 border-b border-neutral-600 rounded-t-xl" ...>
  {/* Existing header content */}
  
  {/* Drag instruction for custom split */}
  {selectedPaymentMethod === 'split-check' && splitMode === 'custom' && (
    <div className="mt-2 pt-2 border-t border-neutral-600">
      <p className="text-neutral-400 text-[10px] text-center">
        Drag items to assign them to checks
      </p>
    </div>
  )}
</div>
```

---

## Technical Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/PaymentDialog.tsx` | Add drag state, remove click UI, add drag/drop handlers |

### New State Variables

```typescript
const [draggingItemId, setDraggingItemId] = useState<number | null>(null);
const [dragOverCheckNum, setDragOverCheckNum] = useState<number | null>(null);
```

### Key Changes Summary

1. **Import** `GripVertical` from lucide-react
2. **Add** two new state variables for drag tracking
3. **Remove** the "Assign Items to Checks" click-based UI section (lines 4339-4369)
4. **Update** order panel items to be draggable when in custom split mode
5. **Update** ticket cards to accept drops and show visual feedback
6. **Add** drag instruction hint in the order panel header
7. **Add** "Remove" button on assigned items to allow unassignment

---

## Visual Feedback

**During Drag:**
- Dragged item shows reduced opacity (opacity-50)
- Dragged item border turns green
- Target ticket card shows green border and slight scale

**When Assigned:**
- Item in order panel shows green badge "→ Check 1a"
- Item displays "Remove" button to unassign
- Ticket card shows the assigned item with price

---

## Testing Checklist
- Items in order panel show drag handles in custom split mode only
- Dragging an item shows visual feedback on source item
- Hovering over a ticket card highlights it
- Dropping an item assigns it to that check
- Check total updates after item assignment
- "Remove" button unassigns item from check
- Paid tickets do not accept drops
- Drag instruction appears in order panel when in custom mode
- Switching split modes resets assignments appropriately

