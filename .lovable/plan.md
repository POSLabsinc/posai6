
Root cause analysis:
- The fix was applied only to the mobile card path (`MobileTicketCard` at `src/pages/Tickets.tsx:2897-2899`).
- Your current viewport is desktop (`1114px`, i.e. `lg`), so the app renders the desktop layout branch, which still hardcodes UUIDs:
  - Left ticket list (desktop): `src/pages/Tickets.tsx:3136`
  - Left ticket list (tablet): `src/pages/Tickets.tsx:4052`
- The right order panel header also still hardcodes UUID in all three responsive variants:
  - `src/pages/Tickets.tsx:2123`, `3342`, `4221`
- So the UI keeps showing UUID even though mobile mapping was corrected.

Plan to fix:
1. Centralize display formatting in `Tickets.tsx` with two helpers (single source of truth):
   - `displayOrderNumber` (short order number derived from `id`, e.g. last 3 chars)
   - `displayCheckNumber` (actual check number from `check`, fallback `--`)
2. Replace all user-facing UUID render points in Tickets page with these helpers:
   - Desktop card ID block (`3136/3137`)
   - Tablet card ID block (`4052/4053`)
   - Right panel order header (`2123`, `3342`, `4221`)
   - Keep existing mobile props aligned to same helper logic to prevent future drift.
3. Add defensive text constraints where needed (desktop/tablet ID boxes):
   - `overflow-hidden`, `truncate`, `max-w-full` on number spans so long values never break layout.
4. Optional consistency pass (same screen):
   - Replace any visible “order #UUID” text with formatted order number in modal/labels where customer-facing.

Technical implementation details:
- File: `src/pages/Tickets.tsx`
- Create helper functions near existing format utilities:
  - `getDisplayOrderNumber(id: string): string`
  - `getDisplayCheckNumber(check: string): string`
- Use helpers in JSX instead of raw `guest.id` / `selectedGuest.id`.
- Do not change backend data model; this is strictly presentation-layer normalization.

Validation checklist (end-to-end):
- Desktop (`lg`): left ticket cards show short order number + check number; no UUID wrapping.
- Tablet (`md`): same behavior.
- Mobile (`sm`): unchanged/correct behavior.
- Right panel header shows formatted order/check values (not UUID).
- Test data cases: numeric check (`123443`), placeholder (`--`), alphanumeric (`BQ-001`).
