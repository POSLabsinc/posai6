# POS AI 6.0 — Project Guardrails

**Single source of truth for Lovable, Cursor, and any AI or human contributor working on this project.**

Last updated: 2026-07-17. When a new rule is agreed in chat, add it here in the same change and update `mem://index.md` if it belongs in Core.

---

## 1. Purpose & How to Use This Document

- Read Sections 2–13 before making any change. They are prescriptive rules ("Do / Don't").
- Section 14 (Case Log) is the historical record of mistakes and corrections. Consult it whenever you touch a related area so the same regression does not happen again.
- Section 16 is the pre-merge checklist. Every change must pass it.
- If a request contradicts this document, stop and ask, do not silently override.

---

## 2. Product Vision & Platform Principles

- POS AI 6 is a multi-vertical commerce platform. Restaurants first, then retail and other verticals. Keep terminology and UX generic, scalable, and enterprise-grade.
- AI is a foundational architectural layer, not a bolt-on. Every workflow has both a UI surface and a conversational (tool-call) surface hitting the same backend.
- Speed and clarity beat analytics. Core operational flows must complete in 1 to 2 taps.

---

## 3. Terminology Standards

**Do**
- Use **Product / Products** everywhere in the UI.
- Use **Point of Sale** in full form, not the acronym.
- Use **Activate** for device setup, **Sign In** for returning users.
- Use **PAID** (uppercase, emerald) as the finalized order status, never "Closed" or "Completed".
- Use **No Sale** for the cash drawer action.
- Use **Continue** on clock-in screens, not "Enter Point of Sale".
- Display order numbers as raw digits only.

**Don't**
- Do not use "Item / Items" anywhere user-facing.
- Do not rename database fields, backend APIs, third-party integrations, accounting exports, historical receipts, or internal variables. Terminology rules apply to UI only.
- Do not say "Supabase" in user copy. Say Lovable Cloud, backend, database, auth, functions, or storage.
- Do not use em dashes anywhere in the product, marketing, code comments, or generated content. Replace with a comma, "and", "or", a hyphen, or rewrite the sentence.

**POS Entity Hierarchy:** Product > Modifier > Product Notes > Order > Ticket.

---

## 4. Design System Rules

**Theme**
- Apple "Liquid Glass" (glassmorphism). Dark mode default. Surface HSL `220 15% 11%`.
- Default theme color is a black or grey shade (`#1C1C1E`), never burgundy or red.
- Default selection color is neutral grey (`#3A3A3C`), never orange.

**Tokens**
- All color, gradient, and shadow values live in `index.css` and `tailwind.config.ts` as semantic tokens.
- Never write raw color utilities in components (`text-white`, `bg-black`, `bg-[#...]`). They bypass theming and break the appearance system.

**Typography**
- Primary font: **Montserrat** across every surface unless a brief explicitly says otherwise.
- Root font size: 14px for rem calculations.

**Settings UI (iOS 26 inspired)**
- Three-section layout: left icon sidebar, middle nav + search panel, right content panel.
- Rounded corners 16 to 24px on panels and components.
- Colors: background `#131316`, panels `#252525`, hover `#1C1C1C`.
- Consistent spacing, minimal borders, smooth hover transitions.

**Status colors**
- ORDERING: Yellow. ORDERED: Orange. PAID: Emerald. UNPAID: Red. HOLD (time): Amber.

**Other**
- Rounded-full inputs and CTAs throughout the signup and signin flow (Onboarding App).
- Scrollbars must not be visible in the POS interface.
- Never place accent lines under titles. They look AI-generated. Use whitespace.

---

## 5. UX Operational Rules

- Core flows in 1 to 2 taps.
- Maximum 6 KPI cards on any operational screen.
- No charts or analytics on operational screens. Analytics lives in Reports.
- Orders and tables must always show ID, status, product count, and elapsed time.
- Operational priority: Ready to Serve / Payment Pending > Active Orders / Tables > Shift Context > Sales / Tips.
- Settings screens use save-on-back (auto-save on header chevron, non-blocking).
- Every modal shows an explicit `X` close icon with no background.

---

## 6. Component & Interaction Standards

- **Swipe to reveal**: one open item at a time, 20px activation threshold. Order type is a global order property, not a per-item swipe.
- **Phone input**: auto-detect country flag from input, support manual selector, apply regional formatting.
- **OTP**: 6 individually focusable boxes, auto-verify on last digit with 300ms delay.
- **Pickers**: Apple-style wheel pickers for date and time.
- **Tables**: every column header sortable by default, using `src/assets/icons/expand-arrows.svg` at 12px 40% opacity via the `sortable` prop on `TableHead`.
- **Custom keyboards**: use the Liquid Glass translucent keyboard system for AI setup and PIN flows.
- **Dialogs**: standardized shadcn dialog with explicit X close.
- **Popovers that could clip inside scrollable containers** (for example the Hold Time dropdown) must render with `position: fixed` and computed coordinates.

---

## 7. Feature-Specific Guardrails

**Orders and Quick Order**
- Quick order state is held locally until Fire is triggered.
- Fire and Hold buttons lock after a tap. They unlock only when the cart signature changes or the order is cleared. Never allow double actions.
- Hold does not create a new ticket. It updates the existing ticket status to `HOLD (time)`. Same rule for Charge, only status changes.
- Use `quickOrderDbId` to correlate the same order across Fire, Hold, and Charge.
- Fire is disabled if the cart is empty or every product has already been fired.

**Order Hold setting (Settings > System > Control Center > Features)**
- Toggle labeled "Order hold" with info: "Holds new orders for a set time before the kitchen sees them."
- When ON, show "Hold time" with options 1, 2, 5, 10, 15, 20, 30 minutes and info: "Sets how long new orders wait before the kitchen sees them."
- When ON, render a Hold (Clock) icon before the Fire button in the right cart panel.

**Tickets**
- Ticket status colors follow Section 4.
- HOLD status shows amber with the configured wait time.
- Right-side ticket message thread panel is 440px with autocomplete.
- Notifications deep-link to `/tickets?orderNumber=[ID]&openChat=true`.

**Split Check, Transfer, Merge**
- Split: Custom, Even, Seat modes. Order is locked while split is open.
- Transfer: blue theme. Amber and grey banners flush against the ticket.
- Merge: preserve original order numbers. Amber and grey banners flush against the ticket.

**KDS**
- Violet gradient banners. Unacknowledged tickets pulse.

**Inventory**
- Deduct on Fire. Restore on Un-fire. Write-Off is optional.

**Discounts**
- `orderDiscountMap` keyed by `dbId`. 100% comps require the Reason panel.

**Vouchers**
- Track `remaining_balance`. Sell Voucher runs inside its own mode context.

**Guests**
- Back chevron only, no other nav element in the header. Smart suggestions. Auto-select disabled on mobile.
- Guest Book: nav pinned left. Right side of the same row has a `+ New Order` button, white background, that opens the New Order screen with the selected guest prefilled via `sessionStorage`.

**Reservations**
- Contextual left panel replaces the timeline.

**Workforce**
- On Leave priority. Card-based schedule UI. Colored role icons on the PIN pad.
- Shift Summary: 4-card metrics grid. Cash Drop matches Tips Payable.

**Cash Management**
- 11-column Cash Log audit trail.
- Expected = Opening + Sales + Tips - Refunds + (In - Out) - Drops.
- CASH DROP shown in amber. Reason options are standardized.

**Onboarding (Manual and AI parity)**
- AI signup flow mirrors the manual flow, with every question prompted rather than typed freely.
- Reuse the existing `DeviceSetupAIChat` component. Do not fork.
- Country auto-detected from browser locale, with an edit icon that opens the same bottom sheet used in manual flow.
- Google Places suggestions must degrade to dummy fallback suggestions and use browser geolocation bias.
- Mode selection uses a "Compare plans" link that opens a bottom sheet with the same comparison used in manual flow plus an AI Q&A input.
- After mode selection, prompt with a Skip button and a "Tell me about [Mode]" button that opens the mode explanation as a bottom sheet, reusing the same looping videos and feature cards from the manual flow.
- Mode explanation screen: "Use this mode" button is anchored at the bottom. Container renders the looping mode video (`mode-standard.mp4`, `mode-quickservice.mp4`, `mode-fullservice.mp4`).

**Personal email in signup**
- Personal email addresses go through the same flow as business emails, not the old restricted path.
- At the last step, tapping "Use this mode" (or any Use Standard / Use Full Service / Use Quick Service button) shows a Demo popup: "Demo mode, read only. Add a business email to unlock full access." with two actions: "Add business email" and "Continue exploring demo".

**Auth alternative methods**
- "Activate with AI" is prioritized. Legacy `posai.com/pair` code sample: `Z 6 5 J 2 U`.
- The "Activate this terminal" screen renders `eatos.com/dashboard` as a hyperlink to `https://www.eatos.com/` in the primary color with underline. "Where do I find my code?" appears directly under the info box, not under the CTA.

**AI Integration**
- Renamed from "AI Integration & Settings" to "AI Integration" everywhere.

---

## 8. Architecture Rules

- Use `dbId` for every database operation, never the truncated display `id`.
- `SHARED_DEVICE_ID = "shared"` for global settings tables.
- Appearance settings: DB-backed `user_preferences` overrides `localStorage`.
- Order numbers auto-derived from `max(orderNumber) + 1`.
- Settings sync uses the global shared identifier for settings tables.
- Menu constraint: max 10 categories per menu.
- Live and Editor environments are unified via `SHARED_DEVICE_ID = "shared"`.

---

## 9. Backend / Lovable Cloud Rules

- Every `CREATE TABLE public.<name>` must be followed in the **same migration** by:
  1. `GRANT` statements matching the intended policies.
  2. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.
  3. `CREATE POLICY ...`.
- Grant `anon` only when a policy actually allows anon reads. Always grant `service_role` for edge-function access.
- Roles live in a separate `user_roles` table with an enum. Never store roles on `profiles`. Check role via `public.has_role(auth.uid(), 'role')` (SECURITY DEFINER, `set search_path = public`).
- Never check admin status from `localStorage`, `sessionStorage`, or hardcoded credentials.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or the database password. They are not accessible on Lovable Cloud. Do not fabricate placeholders.
- Do not touch schemas: `auth`, `storage`, `realtime`, `supabase_functions`, `vault`.
- Do not edit auto-generated files: `src/integrations/supabase/client.ts`, `types.ts`, `.env`, `supabase/config.toml` project-level settings.
- Import the client only via `import { supabase } from "@/integrations/supabase/client"`.
- No anonymous sign-ups. No auto email confirmation unless the user asks.
- Configure Google OAuth the same turn it is added or first sign-in errors "Unsupported provider".
- Social OAuth `redirect_uri` must be a same-origin public URL (for example `window.location.origin`), not a protected route.

---

## 10. Security Guardrails

Enforced findings and rules from the security scanner:

- **AI API keys never in the database.** Store as edge-function secrets.
- **Employee PINs never exposed to the client.** Verify via the `verify-employee-pin` edge function.
- **Geolocation via server proxy** (`geocode-reverse`, Nominatim proxy). No third-party geocoding directly from the browser.
- **No localStorage-based auth or role state.** Server validation only.
- **Payment finalization must be server-side.** Client cannot compute or send final totals. Pricing is recomputed by an edge function.
- **Edge functions are authenticated by default.** Explicit `verify_jwt = true` unless intentionally public.
- **Public schema tables must have RLS + tight policies.** No `merchant_id IS NULL` bypass conditions. Every write path requires `merchant_id = get_user_merchant_id(auth.uid())`.
- **PII tables** (`guests`, `guest_feedback`, `employee_shifts`, `employee_stores`, `write_offs`, `kds_messages`) are authenticated + merchant-scoped only.
- **Third-party APIs** proxied through edge functions with rate limiting.

---

## 11. Onboarding & Auth Guardrails

- Landing: "Welcome to Point of Sale" with New User and Existing User tabs, vertical layout, icon above text.
- New User: 280px QR code left, email or phone input right, 6-digit OTP auto-verifies on last digit, then Device Name step.
- Existing User: QR left, three cards right, "Activate with Code" (amber), "Sign in with Link" (blue), "Try Demo Mode" (emerald). Demo accepts any code. After verification, navigate directly to the clock-in pinpad.
- No back button on the Sign In screen. Heading is "Sign In".
- Rounded-full styling on every input and CTA across the signup and signin flow.
- Never call `navigate(-1)` on onboarding back buttons if the previous route can push a loop. Use explicit routes (for example, "Check your email" back returns to `/onboarding/app/signup/account`).
- Personal email flow mirrors business, ending with the Demo popup gate (see Section 7).
- Onboarding Tutorial: 7-step guided spotlight, `rgba(0,0,0,0.82)` overlay, accent `#F59E0B`.

---

## 12. AI Assistant Behavior

- Scope is settings management only. It does not use the Lovable AI Assistant runtime. Commands are converted to backend API calls.
- Contextual welcomes tailored to the current screen.
- Inline actions for Theme and Logo changes appear directly inside the chat instead of routing away.
- Device Setup Prompt Strategy: 3-path script (QR Code, Browser, Email or Phone).
- Compare plans in AI signup opens a bottom sheet with the manual-flow comparison table plus a Q&A input.

---

## 13. Credit & Efficiency Guardrails

- Always choose the lowest-credit approach that still produces a strong result. Escalate only when a task clearly requires it, and say why.
- Reuse existing components before creating new ones. `DeviceSetupAIChat`, wheel pickers, mode explanation cards, and Liquid Glass keyboards are the canonical implementations.
- Prefer targeted search-replace edits over full-file rewrites.
- Cross-platform: assume web and mobile share logic unless scoped otherwise. Make the smallest complete change that keeps both aligned.
- No hardcoded API or database data in components. Dev placeholders belong in mock or fixture files with TODO comments.
- Define TypeScript API contracts before UI. Components render only from typed responses.

---

## 14. Case Log — Mistakes, Corrections, and Preventive Guardrails

| # | What went wrong | User correction | Resolution | Guardrail now in force |
|---|---|---|---|---|
| 1 | Mode explanation container was empty | Show a video or Lottie | Added looping MP4s (`mode-standard`, `mode-quickservice`, `mode-fullservice`) | Container renders the mode video, always |
| 2 | Back on "Check your email" looped to restaurant type selection | Fix the loop | Replaced `navigate(-1)` with explicit route to `/onboarding/app/signup/account` | Never use `navigate(-1)` when history can loop |
| 3 | Personal email was blocked from full signup | Allow personal email and gate at mode selection | Routed personal email through the standard flow, added Demo popup at "Use this mode" | Personal email mirrors business flow, gate at mode selection |
| 4 | Demo popup only appeared on the mode detail screen | Show on Use Standard / Full Service / Quick Service too | Added the same popup and state to `OnboardingAppSignupMode.tsx` | Any Use Mode button in demo triggers the same popup |
| 5 | Buttons and inputs had inconsistent radii | Round everything | Standardized `rounded-full` on inputs and CTAs across the onboarding flow | Rounded-full is mandatory for onboarding signup and signin |
| 6 | AI signup did not surface Google Places suggestions | Fix it | Added dummy fallback suggestions and geolocation bias | Places must degrade gracefully with fallback data |
| 7 | Country was not auto-detected in AI chat | Auto-detect and allow editing | Added `detectCountry` from locale plus an edit icon that opens the same bottom sheet | Country is always pre-populated with an editable path |
| 8 | Restaurant types and mode reasoning missing in AI chat | Show the same options as manual and explain the best match | Reused `RESTAURANT_TYPES` and added `bestModeFor` logic | AI signup mirrors manual data sources |
| 9 | Inline mode explanations were verbose | Use a "Compare plans" link instead | Added a bottom sheet with the manual comparison plus Q&A input | Long inline explanations replaced by bottom sheets |
| 10 | Mode explanation missing after selection | Prompt to learn more | Added `su-mode-learn` step with Skip and "Tell me about [Mode]" | Every mode selection offers a learn-more sheet |
| 11 | Mode explanation sheet did not match manual flow | Match manually | Reused the same videos and feature cards inside the sheet | Bottom sheets must reuse manual-flow content, not divergent copy |
| 12 | Payment lacked server validation | Guide me to fix | 7-phase plan to move pricing and finalization to edge functions | Payments are always server-validated |
| 13 | Add Guest UI regressed after refactor | Match the reference screenshot exactly | Rebuilt `AddGuestFormLegacy.tsx` with `#1c1c1e`, elevated shadows, depth highlights | Legacy visual regressions require pixel-accurate rebuild, not approximation |
| 14 | Theme Preset "Apply" only fired a toast | Wire it up | Wired to `useAppearance().setThemeColor` and `applyThemeColor` in `ThemePresetsContent.tsx` and `ThemePresets.tsx` | Every Apply/Save button must produce a visible state change |
| 15 | Default theme was burgundy or red | Use black or grey | `DEFAULT_THEME_COLOR = #1C1C1E`, `DEFAULT_SELECTION_COLOR = #3A3A3C` | Default palette is neutral, never red |
| 16 | Order Hold and Charge created duplicate tickets | Only update status | Correlated actions via `quickOrderDbId`, updated tickets in place | Fire, Hold, Charge share one ticket per quick order |
| 17 | Fire and Hold could be tapped twice | Disable after tap | Locked with `orderActionLocked`, unlocks on `cartSignature` change or clear | Fire and Hold always lock post-tap |
| 18 | Hold-time dropdown was clipped | Fix opening | Switched popover to `position: fixed` with computed coordinates | Nested popovers in scrollable containers use fixed positioning |
| 19 | `eatos.com/dashboard` was plain text on Activate | Link to https://www.eatos.com/ | Wrapped in `<a>` with primary color and underline | External references must be real links |
| 20 | "Where do I find my code?" was under the CTA | Move it under the info box | Relocated inside the scrollable content area | Helper links live near the info they clarify, not near the CTA |
| 21 | "AI Integration & Settings" naming | Rename to "AI Integration" | Renamed globally | Feature names stay short and specific |
| 22 | Guest Book "New Order" button used orange | Use white with a `+` icon | Restyled to white background with plus icon | Non-primary CTAs use white, not orange |
| 23 | Guest Book had centered nav | Left-align nav, put "New Order" on the right of the same row | Repositioned in `GuestBookContent.tsx` | Header rows: nav left, action right |
| 24 | Selecting a guest did not prefill the new order | Auto-add guest name and number | Prefill via `sessionStorage` handoff to Orders | Cross-screen selections carry context, never require re-entry |
| 25 | Anonymous CRUD leaked on several public tables | Restrict per scan | Merchant-scoped policies on `activity_log`, `brands`, `categories`, `discounts`, `employees`, `guest_feedback`, `guests`, `menus`, `cash_drawer_sessions`, and more | RLS + GRANT reviewed on every new public table before merging |
| 26 | AI edge functions were world-callable | Harden | Added auth checks to `ai-settings-chat` and `device-setup-chat` | Edge functions authenticated by default |
| 27 | Third-party geocoding hit from the browser | Proxy it | Added Nominatim proxy edge function | Third-party APIs are always server-proxied |
| 28 | Failed dynamic import after a redeploy | Hard refresh | Cache-related, not a code bug | Recommend hard refresh before debugging chunk errors |

---

## 15. Lessons Learned

- **Match the reference exactly.** When a visual is provided, do not approximate colors, shadows, or spacing. Rebuild until it matches.
- **State changes must be wired end to end.** A button that only fires a toast is a bug. Every Apply, Save, Confirm produces a visible change.
- **One ticket per lifecycle.** Fire, Hold, and Charge are status transitions on the same ticket, never new tickets.
- **Lock destructive or duplicate-prone actions.** Then reset locks on a signal the user controls (cart change, clear).
- **Never `navigate(-1)` inside multi-step flows** if any earlier step can push its own back. Use explicit routes.
- **Reuse over re-implement.** Onboarding AI reuses `DeviceSetupAIChat`, manual mode cards, and comparison tables. Do not fork.
- **RLS + GRANT together.** Missing GRANT statements caused permission errors after successful policy work.
- **Ask before removing a user capability.** If a security fix would remove a legitimate feature, ask first.
- **Screenshots are the tiebreaker.** For visual work, verify with an actual render, not the code diff.

---

## 16. Definition of Done Checklist

Before marking any change complete, confirm:

- [ ] Terminology follows Section 3 (Product, Point of Sale, PAID, etc., no em dashes).
- [ ] Colors use semantic tokens from `index.css` and `tailwind.config.ts`. No hardcoded utilities.
- [ ] Typography is Montserrat unless the brief explicitly overrides.
- [ ] Onboarding inputs and CTAs use `rounded-full`.
- [ ] No `navigate(-1)` where a loop is possible.
- [ ] Every DB call uses `dbId`.
- [ ] Fire, Hold, and Charge do not create duplicate tickets.
- [ ] Any new public schema table ships with `GRANT`, `ENABLE RLS`, and `CREATE POLICY` in the same migration.
- [ ] No `merchant_id IS NULL` bypass in any policy.
- [ ] No admin or role checks against localStorage.
- [ ] Payment totals validated server-side.
- [ ] AI signup flow still mirrors manual signup flow.
- [ ] Modals have an explicit `X` close.
- [ ] Save-on-back respected on settings screens.
- [ ] Visual changes verified with an actual render or screenshot, not only code review.
- [ ] Case Log updated if this change fixed a recurring class of mistake.

---

## 17. Change Management

- New rule agreed in chat? Add it here and, if it belongs in Core, update `mem://index.md` in the same commit.
- Rejected an approach? Add it to Section 14 with the reason so it does not resurface.
- Conflicting rules should be flagged in a "Conflicts to Resolve" appendix at the bottom of this file until the owner picks one.

---

## Appendix A — Reserved

_No unresolved conflicts at this time._
