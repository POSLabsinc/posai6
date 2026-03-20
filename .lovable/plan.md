
Goal: fix the real root cause so POS messages reliably appear in KDS after refresh, without reintroducing stale/hardcoded message behavior.

What’s actually broken (core issue)
1) The current message boundary is tied to KDS component mount (`useRef(Date.now())`), not to the browser page session.
2) When you go KDS → POS → KDS, KDS remounts and creates a new timestamp, so the message sent in POS becomes “older than session start” and gets filtered out.
3) KDS has two different message readers:
   - Parent KDS loader (with session filter)
   - `KDSMessagesPanel` internal loader (without same boundary rules)
   This split causes inconsistent behavior between inline cards and right sidebar.
4) Acknowledge flow updates state directly from raw queue and can bypass filtering consistency.

Implementation plan (minimal-credit, high-impact)
1) Replace mount-based boundary with page-lifecycle boundary
   - In `src/pages/KDS.tsx`, create one module-level session start constant (outside component) so it survives route switches but resets on hard browser refresh.
   - This ensures:
     - Refresh starts a new session
     - Navigating between POS and KDS in same tab does not reset the session

2) Create a single shared message-normalization helper in `KDS.tsx`
   - Parse queue safely
   - Normalize status defaults
   - Use timestamp fallback (`timestamp` then `sent_at` if present)
   - Filter by the page session boundary
   - De-duplicate by `message_id`
   - Optionally prune pre-session rows from localStorage once loaded (so old rows are physically removed, matching your “delete old on refresh” intent)

3) Make KDS parent the single source of truth
   - Keep polling only in parent (`kdsMessages` state)
   - Remove duplicate polling logic from `KDSMessagesPanel`
   - Pass `messages` + `onAcknowledge` into panel as props
   - Sidebar count and inline banners now always use the same dataset

4) Fix acknowledge path to stay consistent
   - On ACK: update localStorage queue, then re-read through the shared helper (not raw map directly)
   - This keeps filtering, dedupe, and status logic identical everywhere

5) Protect inline rendering from duplicate attachments
   - Before rendering each ticket’s `attachedMessages`, merge + dedupe by `message_id`
   - Prevent duplicate banner rendering edge cases

Technical details (what changes where)
- Primary file: `src/pages/KDS.tsx`
  - Add module-level session boundary constant
  - Add shared `readSessionMessages()` helper
  - Refactor `KDSMessagesPanel` to controlled props
  - Refactor parent polling + acknowledge to use helper
  - Deduplicate `attachedMessages` per ticket
- No backend/database changes required
- No changes needed in POS send payload format unless timestamp fallback is missing (it already sends ISO timestamp)

Validation checklist (must pass)
1) Hard refresh on `/kds`:
   - old messages are gone (or hidden/pruned per helper), no stale inline/sidebar items
2) Go to POS, send a new linked message, return to KDS (no browser refresh):
   - message appears in right sidebar and inline on correct order card
3) ACK in inline:
   - status updates in inline and sidebar consistently
4) Send table-linked and order-linked messages:
   - table-linked appears on matching table tickets
   - order-linked appears on matching order ticket
5) Repeat POS ↔ KDS navigation multiple times:
   - new messages continue appearing reliably

Success criteria
- After refresh, old messages are not shown.
- New POS messages sent after that refresh always appear in KDS (inline + sidebar), even if sent while user is on POS route before returning to KDS.
- One consistent message source eliminates mismatch bugs.
