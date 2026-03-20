

# Plan: Clear Messages from localStorage on KDS Refresh

## What
On KDS mount (page load/refresh), clear the `kds_message_queue` from localStorage so old messages are fully deleted, not just hidden.

## Changes in `src/pages/KDS.tsx`

Add a single `localStorage.removeItem("kds_message_queue")` call at component mount, before any polling begins. This goes inside an existing `useEffect` or a new one-time mount effect:

```ts
useEffect(() => {
  localStorage.removeItem("kds_message_queue");
}, []);
```

This ensures:
- On refresh/navigate to KDS, all previous messages are deleted from storage
- New messages sent from POS after KDS opens will be stored fresh and displayed
- No stale messages accumulate in localStorage over time
- The `sessionStartRef` timestamp filter (from the previous plan) becomes unnecessary — can be removed if present

**Single file, ~3 lines added.**

