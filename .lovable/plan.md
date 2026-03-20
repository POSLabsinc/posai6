

# Fix: KDS Kitchen Messages Not Showing

## Problem
The `staleMessageIdsRef` (lines 622-632) captures all message IDs present in `kds_message_queue` localStorage when KDS mounts, then `filterSessionMessages` (lines 681-685) excludes them. Since POS and KDS share the same browser, any message sent before navigating to `/kds` is immediately filtered out.

## Fix
Remove the session boundary filtering. Show **all** messages from localStorage. The existing acknowledge system already handles message lifecycle (pending → acknowledged).

### Changes in `src/pages/KDS.tsx`:
1. **Delete** `staleMessageIdsRef` block (lines 622-632)
2. **Delete** `filterSessionMessages` callback (lines 680-685)
3. **Update message polling** (line 695): use `allMessages` directly instead of `filterSessionMessages(allMessages)`
4. **Update `handleAcknowledgeMessage`** (line 746): set state with `updated` directly instead of wrapping with `filterSessionMessages`
5. **Remove** `staleIds` prop from `KDSMessagesPanel` call site if passed

No new logic added. ~15 lines removed/simplified. Messages (standalone and order-linked) will appear in the sidebar and inline on order cards as designed.

