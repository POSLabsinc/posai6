# Move the POS App to a LocalStorage-Only Data Layer

## Goal

Stop relying on the Lovable Cloud backend for any runtime data. All menus, categories, products, orders, tickets, guests, settings, employees, and appearance preferences will be read from and written to `localStorage`. The app will behave identically on every device but will no longer sync across devices or require authentication to load data.

## Important Constraint

Lovable Cloud cannot be fully removed from a project once it has been added. What we CAN do is stop using it at runtime: remove every Supabase client call from the app so the backend is dormant. The user will not notice any Cloud presence, and there will be no auth/RLS/GRANT errors like the ones blocking the Orders screen today.

## Scope of Change

### 1. Introduce a single local data layer

Create `src/lib/localDataStore.ts` as the one source of truth for:

- Menus, categories, subcategories, products, modifiers, add-ons
- Orders, tickets, order items, ticket order items
- Guests, guest feedback, reservations
- Employees, shifts, roles, cash drawer sessions
- Settings (control center, appearance, cash management, timed pricing, taxes, service charges, etc.)
- Restaurant tables, floor plans

Each entity gets a versioned `localStorage` key (e.g. `pos.menus.v1`), a typed getter/setter, and a lightweight pub/sub so components re-render when data changes in another tab or component.

Seed data comes from the existing static files (`src/data/orderMenuData.ts`, defaults in `settingsManager.ts`) on first load.

### 2. Remove Supabase from runtime code

- Replace every `import { supabase } from "@/integrations/supabase/client"` usage with the local data layer.
- Delete/short-circuit hooks that fetch from Supabase: `useSupabaseMenus`, `useSupabaseOrders`, `useSupabaseGuests`, etc. They will return data from the local store instead, keeping the same interface so pages don't need major rewrites.
- Remove edge-function calls made from the client. Any AI features that used `ai-settings-chat` / `device-setup-chat` will need a decision (see open question below).
- The auto-generated files `src/integrations/supabase/client.ts` and `types.ts` stay on disk (they are auto-managed) but nothing will import from them.

### 3. Rework authentication

The current onboarding, sign-in, activation, and clock-in flows use Supabase Auth. With no backend:

- Convert auth to a purely local session stored in `localStorage` (device PIN, employee PIN, demo mode flag).
- Remove Google OAuth, email OTP verification, and any `auth.users` dependencies.
- Keep the existing UI screens; only the underlying "who is signed in" state moves to local.

### 4. Fix the Orders screen (the immediate pain point)

Once step 1 is in place, `Orders.tsx` reads categories, subcategories, and products from the local store. No auth required, works in demo mode, works offline. The blank-menu bug goes away completely.

### 5. Settings sync across the app

All settings (Control Center toggles, Appearance theme, Cash Management, Order Hold, Timed Pricing, etc.) already have a `settingsManager` pattern. We extend it so:

- Every settings screen writes to `localStorage` through the same store.
- A `storage` event listener + in-memory event bus makes changes propagate live to every open screen and component in the same browser.

### 6. Cleanup

- Remove Supabase migration files from the working set (they stay in history but won't run).
- Remove `.env` `VITE_SUPABASE_*` reads from any custom code (the auto-generated client file keeps them but is no longer imported).
- Update the AI Assistant, Setup Assistant, and any "sync" language to reflect device-local storage.

## Trade-offs the User Should Know

- **No cross-device sync.** A menu edit on one device stays on that device. A second tablet will start from seed data.
- **No cross-tenant / multi-merchant support** at runtime. Each browser is its own tenant.
- **Data can be lost** if the user clears browser storage or uses a different browser/device.
- **AI features that called edge functions** stop working unless we route them somewhere else.
- **Reports and analytics** become device-local only.

## Technical Notes

- `localStorage` has a ~5–10 MB per-origin limit. For a POS with heavy order history this can be tight; we may need an IndexedDB fallback for `orders` and `tickets`. Recommend using `localStorage` for settings/menu/config and IndexedDB (via a tiny wrapper like `idb-keyval`) for transactional data. Both are fully local.
- Keep a JSON export/import button in Settings so users can back up and move data between devices manually.
- Keep types identical to today's Supabase-generated types so component code doesn't churn.

## Rollout

1. Build `localDataStore` + seed from static data.
2. Swap `useSupabaseMenus` and Orders reads first — this unblocks the current bug.
3. Swap settings screens.
4. Swap orders / tickets / guests / employees.
5. Rip out auth (last, because many screens gate on it).
6. Final pass: remove unused Supabase imports and dead code.

## Open Questions

1. **AI features** — The Setup Assistant, AI Integration screen, and in-app AI chat currently call Lovable AI via edge functions. Do you want to:
   a. Remove AI features entirely, or
   b. Keep them by calling Lovable AI directly from the client (still counts as a Lovable Cloud service), or
   c. Route them through your own separate API when you have one?

2. **Backup / restore** — Should we add an Export/Import JSON in Settings so a device's data can be moved manually?

3. **Multi-user on one device** — Do employee PINs still need to distinguish sessions on the same tablet, or is one device = one shared login?
