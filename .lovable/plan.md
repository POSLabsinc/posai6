
# Fix Table Grid Spacing and Ready Glow Effect

## Problems Identified

1. **Tables Too Close Together**: The grid currently uses `gap-2` (8px) which is too tight
2. **Glowing Effect Overlapping**: The `ready-glow` CSS animation uses large box-shadow values (up to 80px spread) that bleed over onto adjacent tables

---

## Visual Comparison

```text
CURRENT (gap-2, large glow):
┌────┐ ┌────┐ ┌────┐
│ T7 │░░░T8░░░│ T9 │   <- Glow from T8 covers T7 and T9
└────┘ └────┘ └────┘

PROPOSED (gap-4, contained glow):
┌────┐    ┌────┐    ┌────┐
│ T7 │    │░T8░│    │ T9 │   <- Glow stays within T8's space
└────┘    └────┘    └────┘
```

---

## Implementation Steps

### Step 1: Increase Grid Gap
**File:** `src/pages/TableOrder.tsx` (line 2484)

Change the grid gap from `gap-2` to `gap-4` to increase spacing between table cards from 8px to 16px.

**Before:**
```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
```

**After:**
```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
```

### Step 2: Reduce Glow Effect Spread
**File:** `src/index.css` (lines 173-185)

Reduce the box-shadow spread values in the `readyPulse` animation to keep the glow contained within the card boundaries:
- Reduce maximum spread from 80px to 20px
- Keep the effect visible but more focused on the card itself

**Before:**
```css
@keyframes readyPulse {
  0%, 100% {
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.4), 
                0 0 20px rgba(16, 185, 129, 0.3), 
                0 0 40px rgba(16, 185, 129, 0.2);
  }
  50% {
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.6), 
                0 0 35px rgba(16, 185, 129, 0.5), 
                0 0 60px rgba(16, 185, 129, 0.3),
                0 0 80px rgba(16, 185, 129, 0.15);
  }
}
```

**After:**
```css
@keyframes readyPulse {
  0%, 100% {
    box-shadow: 0 0 4px rgba(16, 185, 129, 0.5), 
                0 0 8px rgba(16, 185, 129, 0.3);
  }
  50% {
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.7), 
                0 0 15px rgba(16, 185, 129, 0.4),
                0 0 20px rgba(16, 185, 129, 0.2);
  }
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/TableOrder.tsx` | Change grid gap from `gap-2` to `gap-4` |
| `src/index.css` | Reduce box-shadow spread values in `readyPulse` animation |

---

## Result

- Tables will have more breathing room with 16px gaps instead of 8px
- The ready glow effect will be more focused and contained within the card area
- Adjacent tables will no longer be visually affected by the glow
- The pulsing animation will still be noticeable but more elegant

---

## Testing Checklist

- Verify increased spacing between all table cards in grid view
- Confirm T8's glow effect no longer bleeds onto T7 or T9
- Ensure the glow is still visible and attention-grabbing on T8
- Check that the ORDER READY badge remains properly positioned
