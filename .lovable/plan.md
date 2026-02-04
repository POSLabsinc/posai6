
# Fix Reservation Row Right-Edge Content Clipping

## Problem Analysis

Looking at the screenshot and code, the reservation rows show clipped content on the right side:
- Status badges display only "Up" instead of "Upcoming"  
- Table numbers and icons are cramped against the edge

**Root Causes Identified:**

1. **Sheet component has a default Close button** (line 60-63 in `sheet.tsx`) positioned at `right-4 top-4` that may interfere with the layout
2. **Panel width constraint** (`w-[380px]`) combined with dense row content creates overflow
3. **Status Badge takes ~65px** with "Upcoming" text, but competes with other fixed-width elements
4. **The `flex-shrink-0` on all right-side elements** prevents any flexibility in layout

## Solution

### Approach 1: Make Status Badge Abbreviated (Recommended)

Shorten the status labels to save horizontal space:
- "Upcoming" → "Up" or single dot only
- "Seated" → "Seat" 
- "Late" → "Late" (already short)

Or remove the text badge entirely and rely only on the colored status dot (already present).

### Approach 2: Increase Panel Width

Expand the Sheet panel width from 380-400px to 420-450px to accommodate all elements.

### Approach 3: Responsive Layout Adjustments

1. Remove the status text badge entirely (the colored dot already indicates status)
2. Or use single-character abbreviations: U/S/L
3. Reduce gap spacing between elements
4. Make guest name truncate earlier

## Recommended Fix

**Combine approaches for best results:**

1. **Remove the default Sheet close button** - Pass a custom prop to hide it since we want panel dismissal to work differently
2. **Remove the status text badge from card rows** - The colored status dot already provides this information visually; the text badge creates redundancy and horizontal pressure
3. **Increase right padding on the ScrollArea container** to ensure content never touches the edge
4. **Test panel width** - If still cramped, increase from 400px to 420px

## Technical Implementation

### File 1: `src/components/ui/sheet.tsx`

Remove or make optional the default close button in SheetContent.

### File 2: `src/components/ReservationsPanel.tsx`

**ReservationCard component changes:**
- Remove the status Badge entirely from the card row (the dot suffices for timeline scanning)
- Alternatively, abbreviate to single letters (U/S/L)
- Ensure the row has explicit `overflow-hidden` to prevent any spillover

**ScrollArea container:**
- Increase right padding further if needed

### File 3: `src/pages/FullReservationsView.tsx`

Apply same card layout changes for consistency between panel and full view.

## Visual Outcome

After fix:
- All content (time, party size, table ID) fully visible
- Clear dark space between last element and panel edge
- No clipping perception at any viewport size
- Status communicated via color dot (fast, glanceable for POS)

## Files to Modify

1. `src/components/ui/sheet.tsx` - Hide default close button
2. `src/components/ReservationsPanel.tsx` - Update ReservationCard layout
3. `src/pages/FullReservationsView.tsx` - Match card layout changes
