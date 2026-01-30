
# Enhance Ready Status Visibility on Table T8

## Problem
The "Ready" status on table T8 is showing but lacks the noticeable visual effects. The ready-glow animation and ready-ring effects are only implemented in `DraggableRoundTable` and `DraggableSquareTable` components but not in `MapRoundTable` and `MapSquareTable` components which are used in the floorplan view.

---

## Current vs Proposed Visual

```text
CURRENT (T8 - barely visible):
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│               ┌─────────┐                                               │
│               │   T8    │  <- Just emerald color, no animation          │
│               │  Ready  │                                               │
│               └─────────┘                                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

PROPOSED (T8 - highly visible):
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│           🔔 ORDER READY                                                │
│          (( ┌─────────┐ ))   <- Expanding ring animation                │
│          (  │   T8    │  )   <- Pulsing emerald glow                    │
│             │  Ready  │                                                 │
│             └─────────┘                                                 │
│               13M                                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Add Bell Icon Import
Add the `Bell` icon from lucide-react to use for the ready notification badge.

**File:** `src/pages/TableOrder.tsx` (line 4)

Add `Bell` to the lucide-react imports.

### Step 2: Update MapRoundTable Component
Add the ready-glow, ready-ring animation, and notification bell badge to the MapRoundTable component.

**File:** `src/pages/TableOrder.tsx` (lines 735-766)

Changes:
- Add ready-ring expanding animation element when `config.isReady` is true
- Add `ready-glow` class to the table div when `config.isReady` is true
- Add a floating bell notification badge above the table for ready status
- Update boxShadow to use the glow animation instead of static shadow

### Step 3: Update MapSquareTable Component
Apply the same ready effects to the MapSquareTable component (which is what T8 uses since it's a square table).

**File:** `src/pages/TableOrder.tsx` (lines 875-906)

Changes:
- Add ready-ring expanding animation element when `config.isReady` is true
- Add `ready-glow` class to the table div when `config.isReady` is true
- Add a floating bell notification badge above the table for ready status
- Update boxShadow to use the glow animation instead of static shadow

---

## Visual Effects Applied

| Effect | Description |
|--------|-------------|
| **Pulsing Glow** | Emerald green shadow that pulses from subtle to bright using the `ready-glow` CSS class |
| **Expanding Ring** | An outer ring that continuously expands and fades out using the `ready-ring` CSS class |
| **Bell Notification Badge** | A floating badge above the table with a bell icon and "ORDER READY" text that bounces to grab attention |
| **Enhanced Border** | Slightly thicker border with enhanced glow effect |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/TableOrder.tsx` | Add Bell import, update MapRoundTable and MapSquareTable components with ready effects and notification badge |

---

## CSS Classes Used (Already Exist)

From `src/index.css`:
- `.ready-glow` - Pulsing emerald box-shadow animation
- `.ready-ring` - Expanding ring that fades out

---

## Testing Checklist

- Navigate to /tableorder page
- Look at table T8 in the floorplan view
- Verify the pulsing emerald glow effect is visible
- Verify the expanding ring animation is visible
- Verify the bell notification badge with "ORDER READY" is displayed above the table
- Verify the effect is highly noticeable and attention-grabbing
- Test that other tables without Ready status don't show these effects
