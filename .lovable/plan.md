

# Fix: KDS Messages Not Appearing After POS→KDS Navigation

## Root Cause

`PAGE_SESSION_START = Date.now()` is a **module-level constant** inside `KDS.tsx`, which is **lazy-loaded** (`React.lazy(() => import("./pages/KDS"))`).

The module only loads when the user **first visits /kds**. If the user is on POS, sends a message at time T1, then navigates to /kds, the module loads at T2 (where T2 > T1). The filter `timestamp > PAGE_SESSION_START` then rejects the message because T1 < T2.

```text
Timeline:
  App loads → User on POS → Sends message (T1)
                                   ↓
                          Navigates to /kds → Module loads → PAGE_SESSION_START = T2
                                   ↓
                          Filter: T1 > T2? NO → Message hidden!
```

This is why "it was working before" — the session boundary filter was added recently and broke the flow.

## Fix

**Remove the timestamp-based session filter entirely.** Instead, use the original plan of clearing localStorage on mount. But do it **smartly** — only clear once per browser session using `sessionStorage` as a flag:

### Changes in `src/pages/KDS.tsx`

1. **Remove** `PAGE_SESSION_START` constant (line 22)
2. **Replace** `readSessionMessages()` — remove the timestamp filter, keep only parsing + normalization + dedup
3. **Add** a one-time session cleanup in the KDS component mount:

```ts
// Inside KDS component, first useEffect:
useEffect(() => {
  const alreadyCleared = sessionStorage.getItem("kds_session_cleared");
  if (!alreadyCleared) {
    localStorage.removeItem("kds_message_queue");
    sessionStorage.setItem("kds_session_cleared", "true");
  }
}, []);
```

**How this works:**
- On hard refresh / new tab: `sessionStorage` is empty → queue is cleared → fresh start
- On POS→KDS navigation (same session): `sessionStorage` flag exists → queue is NOT cleared → messages persist
- `sessionStorage` automatically resets on tab close/refresh (browser native behavior)

This is 3 lines of logic, no timing edge cases, and matches the user's original request: "delete messages on refresh."

