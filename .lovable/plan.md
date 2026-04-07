

## Plan: Convert Order Message Thread to Floating Chat Widget

### What Changes
Move the `OrderMessageThread` out of the order panel entirely and render it as a fixed-position floating chat widget (like website live chat boxes), anchored to the bottom-right of the screen viewport.

### Implementation Steps

**1. Update `OrderMessageThread.tsx` positioning**
- Change from `absolute top-0 left-0 right-0` (relative to parent panel) to `fixed bottom-4 right-4` (relative to viewport)
- Set a fixed width (~350px) and max-height (~400px)
- Add rounded corners on all sides, deeper shadow for the floating effect
- Increase z-index to z-[100] to float above all page content

**2. Move rendering location in `Tickets.tsx`**
- Move both `<OrderMessageThread>` instances (lines ~2303 and ~3479) outside of the order panel containers to the top level of the component return, so they are not constrained by the panel's `relative` + `overflow-hidden`
- Only one instance needed at the top level since it is now viewport-fixed

### Files to Modify
- `src/components/OrderMessageThread.tsx` - Fixed positioning, width, rounded corners, elevated z-index
- `src/pages/Tickets.tsx` - Move component rendering to top-level, deduplicate

