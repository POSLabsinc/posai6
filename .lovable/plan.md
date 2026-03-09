

## Redesign KDS Order Card Layout

Based on the reference image, the card layout needs to be restructured. The current layout has time and order number side-by-side in one row. The new layout centers the order number prominently with supporting info arranged around it.

### New Layout Structure

```text
┌──────────────────────────┐
│       DINE IN            │  ← Header (order type, keep existing colors)
├──────────────────────────┤
│ 01:23:42 AM      T. T4  │  ← Time (left), Table (right)
│                          │
│           1              │  ← Large centered order number
│                          │
│ 00:03:37    SIVADEVAN S  │  ← Elapsed timer (left), Server name (right)
├──────────────────────────┤
│     [Product list...]    │  ← Products section (unchanged)
├──────────────────────────┤
│        [ SEEN ]          │  ← Action button (unchanged)
└──────────────────────────┘
```

### Changes (single file: `src/pages/KDS.tsx`)

**Replace the "Time & Order Number" section (lines ~414-434)** with:

1. **Info row**: Order time on the left, table number on the right (formatted as `T. T4`)
2. **Centered order number**: Large, bold, centered in its own block
3. **Bottom info row**: Elapsed timer badge on the left, server/employee name on the right

Key details:
- Table number formatted as `T. {tableNumber}` (short format matching reference)
- Order number stays prominent (large font, centered)
- Elapsed timer moves from beside order number to bottom-left
- Server name added to bottom-right
- The existing timer badge color logic (gray/orange/red) is preserved
- Message cards keep their existing layout (changes only apply to order tickets)
- Product list and action button sections remain unchanged

