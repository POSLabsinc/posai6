

## Plan: Add Background Color to Reason Section

**What**: Apply a slightly different (lighter) background to the Reason column so the Discount section stands out as the primary/prominent area.

**How**: Add a subtle background color to the reason column container (line 289) — something like `rgba(255,255,255,0.03)` or `rgba(255,255,255,0.025)` — to create visual separation from the main discount list area which stays at the base `#1a1a1e`.

**Technical Details**:
- **File**: `src/components/DiscountDialog.tsx`
- **Change**: On the reason column wrapper (line 289), add a `background` style of approximately `#1d1d22` or `rgba(255,255,255,0.03)` to give it a subtly different tone
- This applies to both the "needs reason" and "no reason required" states
- The left border separator already exists; adding the background will reinforce the visual hierarchy
- Mobile view (reason as separate step) will also get the same background for consistency

