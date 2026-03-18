

## Fix: Back Icon Overlapping "Select Reason" Title

The back button is `absolute left-4` but the title text starts at the left edge, causing overlap. The fix is to add `px-10` padding to the title when in reason view, so the text is pushed away from the back icon.

### Changes (`src/components/DiscountDialog.tsx`)

1. **DrawerTitle (line ~609)**: Add conditional padding `px-10` when `view === 'reason'` so the centered text doesn't overlap the back chevron.
2. **DialogTitle (line ~629)**: Same — add `pl-8` when `view === 'reason'` to leave room for the back icon.

This ensures the back icon and title text never collide regardless of screen size.

