

# Preserve Ticket Count When Switching Split Modes

## Overview
Currently, when switching between split modes in the payment dialog:
1. **Split Evenly** → Starts with 2 tickets (default)
2. **Split by Seat** → Automatically sets tickets to match party size (correct behavior)
3. **Back to Split Evenly/Custom** → Tickets remain at party size instead of restoring the previous value

The user wants the manually set ticket count from "Split Evenly" or "Custom Split" to be preserved when temporarily switching to "Split by Seat" and then back.

---

## Solution

Add a new state variable to remember the manually set ticket count for non-seat modes. When switching away from seat mode, restore this saved value.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    Split Mode Flow (Fixed)                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Start in "Split Evenly" with 2 tickets (default)                    │
│     └─→ savedNonSeatChecks = 2                                          │
│                                                                          │
│  2. User changes to 5 tickets manually                                  │
│     └─→ savedNonSeatChecks = 5                                          │
│                                                                          │
│  3. User clicks "Split by Seat" (party size = 4)                        │
│     └─→ numberOfChecks = 4 (from partySize)                             │
│     └─→ savedNonSeatChecks remains 5                                    │
│                                                                          │
│  4. User clicks "Split Evenly" or "Custom Split"                        │
│     └─→ numberOfChecks = savedNonSeatChecks (5) ← RESTORED!            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Add State to Track Non-Seat Ticket Count

Add a new state variable to preserve the ticket count for evenly/custom modes:

```typescript
// After line 180
const [savedNonSeatChecks, setSavedNonSeatChecks] = useState(2);
```

### Step 2: Update Mode Switching Logic

Modify the tab click handler to:
1. Save current ticket count when switching TO seat mode
2. Restore saved count when switching FROM seat mode

**Current code (lines 4130-4135):**
```typescript
onClick={() => {
  setSplitMode(tab.id);
  if (tab.id === 'seat') {
    // Auto-set checks to party size
    setNumberOfChecks(orderDetails.partySize || 4);
  }
}}
```

**New code:**
```typescript
onClick={() => {
  const previousMode = splitMode;
  setSplitMode(tab.id);
  
  if (tab.id === 'seat') {
    // Save current count before switching to seat mode
    if (previousMode !== 'seat') {
      setSavedNonSeatChecks(numberOfChecks);
    }
    // Auto-set checks to party size
    setNumberOfChecks(orderDetails.partySize || 4);
  } else if (previousMode === 'seat') {
    // Restore saved count when leaving seat mode
    setNumberOfChecks(savedNonSeatChecks);
  }
}}
```

### Step 3: Update Manual Counter to Save Changes

Update the +/- buttons to also update `savedNonSeatChecks`:

**Current code (lines 4152 and 4160):**
```typescript
onClick={() => setNumberOfChecks(prev => Math.max(2, prev - 1))}
...
onClick={() => setNumberOfChecks(prev => Math.min(10, prev + 1))}
```

**New code:**
```typescript
onClick={() => {
  setNumberOfChecks(prev => {
    const newVal = Math.max(2, prev - 1);
    setSavedNonSeatChecks(newVal);
    return newVal;
  });
}}
...
onClick={() => {
  setNumberOfChecks(prev => {
    const newVal = Math.min(10, prev + 1);
    setSavedNonSeatChecks(newVal);
    return newVal;
  });
}}
```

### Step 4: Reset Saved State When Dialog Opens

Add reset for the new state in the useEffect (line 227):

```typescript
// Reset split check states
setSplitMode('evenly');
setNumberOfChecks(2);
setSavedNonSeatChecks(2);  // Add this line
```

---

## Technical Details

### File to Modify

| File | Changes |
|------|---------|
| `src/components/PaymentDialog.tsx` | Add state, update mode switching, update manual counter |

### New State Variable

```typescript
const [savedNonSeatChecks, setSavedNonSeatChecks] = useState(2);
```

### Code Change Locations

| Line | Change |
|------|--------|
| ~181 | Add `savedNonSeatChecks` state |
| ~227 | Reset `savedNonSeatChecks` to 2 on dialog open |
| 4130-4135 | Update mode switching logic to save/restore |
| 4152, 4160 | Update +/- buttons to save changes |

---

## Behavior Summary

| Action | numberOfChecks | savedNonSeatChecks |
|--------|---------------|-------------------|
| Dialog opens | 2 | 2 |
| User clicks + to 5 | 5 | 5 |
| Switch to "Split by Seat" (party=4) | 4 | 5 (preserved) |
| Switch to "Split Evenly" | 5 (restored) | 5 |
| Switch to "Custom Split" | 5 (stays) | 5 |

---

## Testing Checklist
- Start in "Split Evenly" with 2 tickets
- Change to 5 tickets manually
- Switch to "Split by Seat" → shows party size tickets
- Switch back to "Split Evenly" → shows 5 tickets (restored)
- Switch to "Custom Split" → shows 5 tickets (preserved)
- Close and reopen dialog → resets to 2 tickets

