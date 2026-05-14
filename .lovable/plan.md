# Plan: POS AI 6.0 Knowledge & Retrospective Document

## Deliverable
A single file written to `/mnt/documents/POS-AI-6-Knowledge-Base.md` (delivered as a `<presentation-artifact>`), exported as a project-specific, brutally honest retrospective. No code in the repo will be modified.

## Document structure

1. **Purpose & how to use this doc** — one short paragraph; this is the operating manual for any AI session working on POS AI 6.0.

2. **Non-negotiable Core Rules (cheat sheet)** — one-page summary mirroring `mem://index.md` Core: terminology (Product, Point of Sale, PAID), Montserrat, 14px root, Liquid Glass dark-default, `--surface 220 15% 11%`, `SHARED_DEVICE_ID = "shared"`, `dbId` for DB ops, no scrollbars, 1–2 taps, explicit X close icons, save-on-back, lowest-credit approach.

3. **Brutally honest retrospective — what I got wrong**
   Each entry uses: **What went wrong → Root cause → Rule for the future**.
   - Screen Mode icons saga (took 5+ turns to match Account screen)
     - Cause: edited sizing without first reading `SettingsIcon.tsx` to learn the canonical pattern (`bgColor`, rounded-[0.55rem], internal sizing).
     - Rule: when user says "match X screen," read X's component before touching Y.
   - Re-using `<img>` with ad-hoc Tailwind sizes instead of the shared `SettingsIcon` component.
     - Rule: search for an existing primitive before inventing classes.
   - Treating "consistency" as a guess instead of a measurement (kept tweaking `w-4.5 → w-5` blindly).
     - Rule: open both source files side-by-side; copy the exact JSX, do not approximate.
   - Removing dashes ("Self-Service Kiosk" → "Self Service Kiosk") only in some surfaces.
     - Rule: terminology changes are global; grep the whole repo.
   - Asset duplication risk (multiple `screen-mode-*.png` created across attempts).
     - Rule: prefer overwriting via `code--copy` over creating versioned duplicates for icon assets.

4. **POS AI 6.0 conventions that are easy to miss**
   - `SettingsIcon` is the canonical settings row icon (bg `#525252`, rounded-[0.55rem]). Never roll your own wrapper.
   - Account screen is the visual reference for all Settings list rows (icon size, gap-4, `text-lg font-medium text-foreground`).
   - Settings background is `#131316`; panels `#252525`; hover `#1C1C1C`. Do not use Tailwind grays here.
   - `dbId` ≠ truncated display id. DB ops always use `dbId`.
   - `SHARED_DEVICE_ID = "shared"` for global tables (Live/Editor parity).
   - Status tokens are uppercase: PAID (Emerald), UNPAID (Red), ORDERING (Yellow), ORDERED (Orange).
   - Order numbers render as raw digits (no "#", no padding).
   - Overlay z-index ladder: Closing Grace `z-[10001]`, Clock-In `z-[9999]` — respect the ladder.
   - Save-on-back, not Save buttons. Back chevron commits silently.
   - PIN lockout at 10 failed attempts, warn at 7 — only when "Lock After Failed Attempts" is enabled.

5. **Design system rules**
   - Liquid Glass utilities only — no custom `bg-white/10` blur stacks.
   - All colors HSL via semantic tokens in `index.css` / `tailwind.config.ts`. Never hardcode color classes (`text-white`, `bg-black`) in components.
   - Montserrat is the only typeface. Root font 14px (rem math depends on this).
   - Dialog standard: explicit X close icon, no chrome background behind it.
   - Wheel pickers (Apple-style) for date/time everywhere in Settings.
   - Sort icons on every TableHead via `expand-arrows.svg`.

6. **Operational UX rules (POS-specific)**
   - Max 6 KPI cards on dashboards. No charts on operational screens. No visible scrollbars.
   - KPI display order (Rule 6) and attention priority (Rule 7) are independent and both apply.
   - Orders/tables must always show: ID, status, product count, elapsed time.
   - Clock-in CTA: future UI must read "Continue"; existing internal handlers like `handleEnterPOS` stay as-is.
   - Mobile tickets: swipe vs tap disambiguation, 20px swipe threshold, single-open-item rule.

7. **Architecture & data**
   - User roles in a separate `user_roles` table with `has_role` SECURITY DEFINER. Never on profiles.
   - Validation triggers, not CHECK constraints, for time-based rules.
   - Never edit `src/integrations/supabase/{client,types}.ts` or `.env`.
   - Edge functions auto-deploy; don't tell users to deploy.
   - Realtime requires `ALTER PUBLICATION supabase_realtime ADD TABLE …` plus matching RLS.

8. **AI / Lovable AI Gateway rules**
   - Default to Lovable AI Gateway models; pick the cheapest model that meets the bar (Rule 14, lowest-credit-first).
   - Settings AI does not use the chat assistant — it talks to backend APIs directly and only manages settings.
   - Conversational features are embedded in modals, not standalone pages.

9. **Process rules for the AI agent (do/don't)**
   - DO read the file before editing it. Always.
   - DO grep for existing primitives (`SettingsIcon`, `NumericKeypad`, `DialogStandard`, etc.) before writing new ones.
   - DO verify visual changes against the named reference screen, not from memory.
   - DO update `mem://index.md` when conventions change.
   - DON'T re-propose anything in `constraints/*` memory.
   - DON'T introduce new color classes outside semantic tokens.
   - DON'T create versioned asset filenames; overwrite the existing one.
   - DON'T edit `auth`, `storage`, `realtime`, `supabase_functions`, `vault` schemas.
   - DON'T add scrollbars, charts to operational screens, or more than 6 KPIs.

10. **Known contradictions (resolved)**
    - KPI ordering: Rule 6 (display) and Rule 7 (priority) are independent — both kept.
    - "Continue" vs `handleEnterPOS`: rule applies to UI labels only; existing handler names stay.

11. **Glossary** — Product, Point of Sale, PAID, dbId, SettingsIcon, Liquid Glass, save-on-back, SHARED_DEVICE_ID, MPIN, Fire/Un-fire, Closing Grace Period, Cash Drop.

## Length & format
- Markdown, ~600–900 lines, no emojis, code fences for tokens/snippets, tables for status colors and z-index ladder.
- Self-contained — readable without access to the repo or `mem://`.

## Out of scope
- Universal AI/Lovable lessons (you chose project-specific only).
- Any code changes to the repo.
- Any changes to `mem://` memory files (this is a static export).

After approval I will write the file in build mode and emit the `<presentation-artifact>` tag for download.
