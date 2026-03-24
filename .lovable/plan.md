
## Plan: Make AI Assistant vertical alignment exact (match order content box on every screen)

### Problem observed
A fixed top value (`top-0` or `top-[100px]`) is unstable. It will be wrong on some viewports because the order header/action area height is not truly fixed in all responsive states.

### Implementation approach (single file)
**File:** `src/pages/Orders.tsx`

1. **Add alignment refs**
   - Add a ref on the **menu panel container** (the relative parent where AI overlay is positioned).
   - Add a ref on the **order content start row** (`flex-1 flex gap-2 min-h-0`) — this is the section directly below `Custom Item / Discount / No Tax`.

2. **Calculate top offset dynamically**
   - Add state like `aiOverlayTop`.
   - Compute:  
     `aiOverlayTop = orderContentStartRef.top - menuPanelRef.top` (via `getBoundingClientRect()`).
   - Clamp to `>= 0` and round to avoid subpixel jitter.

3. **Keep offset correct on every layout change**
   - Recalculate on:
     - initial render
     - window resize
     - panel width/layout changes (`isOrderActionsSidebarOpen`, `panelLayout`)
   - Use `ResizeObserver` on the target elements so if header height changes, AI top updates automatically.

4. **Apply calculated top to AI overlay**
   - Replace fixed class top (`top-0`/`top-[100px]`) with dynamic inline style:
     - AI panel: `style={{ top: aiOverlayTop }}` + `bottom-0`
   - Keep existing right/left anchoring and width logic unchanged.
   - Apply same top offset to the dark backdrop region (desktop) so visual overlay starts at the same level as the target order box.

5. **Validation pass (responsive)**
   - Verify on `md` and `lg` widths that AI top is exactly parallel with the order content box (just below action buttons), not above or below.
   - Verify both panel directions (`menu-right` and default).

### Technical details
- Prefer `useLayoutEffect` for measurement to prevent visible jump/flicker.
- No backend/database changes needed.
- This is a UI-only fix confined to `Orders.tsx`.
