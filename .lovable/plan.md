

## Fix: C Button Not Clearing Voucher Products — Comprehensive Solution

### Analysis

After extensive analysis of the 9400+ line `Orders.tsx`, I've identified the following:

- `handleClearOrder` fires correctly (confirmed by console logs showing it fired twice)
- `setOrderItems(() => [])` is called with functional update
- There are exactly **2 rendering locations** for order items: mobile (line 7540) and desktop (line 8727)
- Both are gated by `orderItems.length === 0` ternaries
- No `useEffect` re-populates items after clearing

Despite the code being logically correct, the items persist visually. The most likely root cause is a **stale rendering issue** where the `ScrollArea` component (Radix) retains its previous DOM tree when children change within the same component instance. This can happen when React reconciles the ternary but the ScrollArea's internal viewport doesn't re-measure/re-render properly.

### Plan (single file: `src/pages/Orders.tsx`)

1. **Add a `clearCounter` state** — increment it each time `handleClearOrder` runs

2. **Use `clearCounter` as a `key` on both ScrollArea components** (mobile line 7538, desktop line 8722) — this forces React to completely destroy and recreate the ScrollArea on each clear, guaranteeing no stale DOM

3. **Replace ternary with separate conditional blocks** in both mobile and desktop panels for extra safety:
   ```tsx
   <ScrollArea key={`scroll-${clearCounter}`} ...>
     {orderItems.length === 0 && <div>empty state</div>}
     {orderItems.length > 0 && <div>{items.map(...)}</div>}
   </ScrollArea>
   ```

4. **Also reset `seatFilter` in `handleClearOrder`** — if `isTableOrder` is true, stale `seatFilter` could cause `filteredOrderItems` to return items that don't match, leading to confusion

5. **Fix hardcoded "MIA JONE"** at line 8496 — this should use `guestName` state instead of being hardcoded, which is why "MIA JONE" persists after clearing

These changes are minimal but force a clean DOM rebuild on every clear, eliminating any stale rendering artifacts.

