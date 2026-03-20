

# Fix: KDS Messages Not Showing After Refresh

## Problem
The current `localStorage.removeItem("kds_message_queue")` on mount clears ALL messages every time KDS loads. Since POS and KDS share the same browser tab, the flow is:

1. User opens KDS → localStorage cleared ✓
2. User navigates to POS → sends message → written to localStorage ✓
3. User navigates back to KDS → **localStorage cleared again** ✗ (message deleted!)

## Solution
Replace the blanket clear with a **session timestamp filter**. On KDS mount, record `Date.now()` as the session start. Only display messages whose `timestamp` is **after** the session start. Old messages are effectively hidden without deleting new ones.

### Changes in `src/pages/KDS.tsx`

1. **Replace** the `localStorage.removeItem` mount effect (lines 675-678) with a `sessionStartRef`:
   ```ts
   const sessionStartRef = useRef(Date.now());
   ```

2. **Add timestamp filter** in the polling `load` function (line 686):
   ```ts
   const allMessages = parsed
     .filter(m => new Date(m.timestamp || m.sent_at || 0).getTime() > sessionStartRef.current);
   ```

3. **Same filter** in `handleAcknowledgeMessage` if needed.

This way:
- On refresh, old messages are hidden (filtered by timestamp)
- New messages sent from POS after KDS opens will have a newer timestamp and appear correctly
- No data is deleted from localStorage, so the POS→KDS navigation cycle doesn't destroy messages

**Single file, ~5 lines changed.**

