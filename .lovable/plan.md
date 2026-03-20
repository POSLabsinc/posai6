

## Fix: Stack Acknowledge & Reply Buttons Vertically in Inline Message Cards

**Problem**: The Acknowledge and Reply buttons sit side-by-side horizontally inside the inline message card on order tickets, causing the Reply button to be cut off/hidden.

**Solution**: Change the button container from horizontal (`flex gap-1.5`) to vertical (`flex flex-col gap-1.5`) layout so Acknowledge appears first, Reply below it.

### Changes — `src/pages/KDS.tsx`

**Line 710** — Change the pending state button container:
- From: `<div className="bg-neutral-900 px-3 py-2 flex gap-1.5">`
- To: `<div className="bg-neutral-900 px-3 py-2 flex flex-col gap-1.5">`
- Remove `flex-1` from both buttons since they'll be full-width stacked

This single change affects the inline message buttons when the message is still pending (unacknowledged). The acknowledged state (lines 718-727) already stacks vertically, so no change needed there.

