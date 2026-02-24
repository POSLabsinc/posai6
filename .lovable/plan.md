

## Fix: Make Summary Breakdown Scroll with Voucher Cards

### Problem
The voucher cards grid in `MultiVoucherStep.tsx` has its own scroll container (`max-h-[300px] overflow-y-auto` on line 633), creating a separate scroll context. The Summary breakdown card sits **below** this scroll container, so it appears "fixed" in place while the cards scroll independently above it.

### Solution
Remove the independent scroll constraint from the cards grid and let the entire content (cards + summary) scroll together within the parent dialog's scrollable body (`overflow-y-auto` on `VoucherDialog.tsx` line 334).

### Changes

**File: `src/components/voucher/MultiVoucherStep.tsx`**

1. **Remove `max-h-[300px] overflow-y-auto`** from the cards grid container (line 633)
   - Change: `grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto scrollbar-hide p-1`
   - To: `grid grid-cols-1 md:grid-cols-2 gap-2.5 p-1`

This single change ensures the cards grid expands to its natural height, and the summary card flows directly after the cards. The parent dialog body container already handles scrolling for the entire content area.

### What stays the same
- Summary card styling and content unchanged
- Footer (BACK / ADD TO ORDER) remains pinned at the bottom of the dialog
- Search bar and category filters remain at the top
- No changes to SingleVoucherStep or any other file
