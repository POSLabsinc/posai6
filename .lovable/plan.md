# Import New KDS from "POSAI - Kitchen Display System (KDS)"

Source project: [POSAI - Kitchen Display System (KDS)](/projects/3a5eb3d4-e432-4ee8-a856-17d95261c3ac)

## Goal

Bring the new KDS design into this POS project and route the screen-mode switcher to it when the user switches POS into KDS. Keep the existing `src/pages/KDS.tsx` intact as a fallback that can be re-enabled with one line.

## Why this needs isolation

The source KDS is a full standalone app, not a single screen:

- ~30 components in `src/components/kds/`
- 17 hooks (incl. its own `use-mobile`, `use-toast`, `use-theme`, `use-language`, `use-notifications`)
- 30+ pages (main view, settings sub-pages, pin pad, splash, etc.)
- Its own `lib/utils.ts`, `App.tsx`, `NotFound.tsx`
- Multiple required context providers (KDSMode, KDSSettings, Sound, BadgeVisibility, StatusRules, OrderStore, PrinterAssignments, Portrait, KitchenMessages, Notifications, DockLayout, Theme, Language)
- Mock data files and KDS-specific assets

Many filenames collide with this POS project. To prevent breaking the POS, everything is copied into a single sandboxed folder.

## Approach

### 1. Sandbox folder

Create `src/kds-new/` and mirror the source structure inside it:

```text
src/kds-new/
  assets/        (icons, images from source src/assets)
  components/    (kds/, settings/, ui/, NavLink, PosaiLogo)
  contexts/      (none in source; providers live in hooks/)
  data/          (mock-* files)
  hooks/         (all 17 hooks, isolated from POS hooks)
  lib/           (utils, kds-aging, kds-scale, dock-insets, settings-search-index)
  pages/         (Index, settings/, KdsReplyPage, NotFound, etc.)
  types/         (kds, kitchen-message, notification)
  KdsApp.tsx     (new wrapper, replaces source App.tsx)
```

All internal imports inside `src/kds-new/**` keep the `@/...` alias **rewritten** to `@/kds-new/...` so the new KDS only resolves files inside its own folder. Nothing inside `src/kds-new/` imports from the rest of the POS, and nothing in the rest of the POS imports from `src/kds-new/` except the single route entry.

### 2. KdsApp wrapper

`src/kds-new/KdsApp.tsx` replaces the source `App.tsx`:

- Wraps only the providers the new KDS needs (KDSMode, KDSSettings, Sound, BadgeVisibility, StatusRules, OrderStore, PrinterAssignments, Portrait, KitchenMessages, Notifications, DockLayout, Theme, Language) plus `TooltipProvider` and `Sonner`.
- Does NOT mount its own `BrowserRouter` (POS already provides one). Instead it renders the source `Index` page directly and handles the few internal sub-routes via local state or nested `<Routes>` scoped to `/kds/*`.
- Skips the source `QueryClientProvider` (POS already provides one) unless tests show it needs a separate client.

### 3. Routing wiring (POS side)

In `src/App.tsx`:

- Add a lazy import: `const KdsNew = lazyWithImportRecovery(() => import("./kds-new/KdsApp"));`
- Add a route `<Route path="/kds-new/*" element={<KdsNew />} />` outside the POS `Layout` (the new KDS has its own shell).
- Keep the existing `/kds` route untouched as the fallback.

In `src/components/ScreenModeSwitcher.tsx`:

- Change the KDS branch from `navigate("/kds")` to `navigate("/kds-new")`.
- One-line revert if needed.

### 4. Asset copy

Copy these binary/SVG assets into `src/kds-new/assets/`:
- `acknowledged-icon.svg`, `cooking-summary-icon.svg`, `eatos-logo.png`, `fire-icon.png`, `item-ready-icon.svg`, `kitchen-hero.jpg`, `note-bold.svg`, `person-simple-run-bold.svg`, `posai-logo-white.png`, `posai-logo.png`, `preparing-icon.svg`, `seen-icon.svg`, `undo-icon.svg`, `users-bold.svg`, `version-icon.png`, `version-icon.svg`, `icons/restaurant-logo.png`

### 5. Backend / Supabase

The source KDS imports `@/integrations/supabase/client`. POS already has its own Supabase client at the same path, so the import stays valid. No new edge functions or tables are required for the visual/behavioral parity. If specific tables are missing at runtime, we will surface those and address them in a follow-up.

### 6. Files NOT copied

- Source `src/App.tsx`, `src/main.tsx`, `src/index.css`, `tailwind.config.ts`, `vite.config.ts` — POS keeps its own.
- Source `components/ui/*` is copied only for components actually referenced inside `src/kds-new/`; duplicate primitives (button, input, tooltip, sonner, toaster) are copied to keep KDS self-contained and immune to POS shadcn drift.
- Source tests (`__tests__/`) skipped.

## What you'll see after approval

1. Open POS, top-bar screen mode switcher → select Kitchen Display System.
2. POS navigates to `/kds-new` and the new KDS app loads (with its own sidebar, dock, order cards, settings).
3. Switching back to POS from inside the new KDS returns you to the POS shell.
4. The old `/kds` route still works if visited directly, so nothing is lost.

## Risks and mitigations

- **Filename collisions** — eliminated by the `src/kds-new/` sandbox and rewritten `@/kds-new/...` imports.
- **Provider conflicts** — KDS providers are mounted only inside `KdsApp`, scoped to the `/kds-new/*` subtree.
- **Bundle size** — KDS is lazy-loaded; it only downloads when the user switches into KDS mode.
- **Theme / fonts** — KDS uses its own `use-theme`; POS theme is unaffected. Montserrat from POS still applies globally.
- **Supabase data** — Reuses POS's existing client and any tables already in this project; if a table is missing we'll add it as a follow-up migration.

## Out of scope (this pass)

- Merging KDS settings into POS Settings (they remain inside the KDS shell at `/kds-new/full/settings`).
- Removing the old `src/pages/KDS.tsx` (kept as fallback per your instruction).
- Cross-syncing orders between POS and the new KDS in real time beyond what shared Supabase tables already provide.
