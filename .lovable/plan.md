# POS AI 6.0 — Project Guardrails Document

Create a single, authoritative markdown document that serves as the source of truth for Lovable, Cursor, and any other AI tool working on this project. It will consolidate everything established across the full chat history: design rules, UX standards, technical patterns, recurring mistakes, corrections, and preventive guardrails.

## Deliverable

**File:** `docs/PROJECT_GUARDRAILS.md` (primary, in repo)
**Mirror:** `/mnt/documents/POS_AI_Project_Guardrails.md` (downloadable artifact)

Both files will contain identical content. The `/mnt/documents` copy is delivered as a `<presentation-artifact>` so you can download/share it.

## Document Structure

```text
1.  Purpose & How to Use This Document
2.  Product Vision & Platform Principles
3.  Terminology Standards (Product vs Item, Point of Sale, PAID, etc.)
4.  Design System Rules
      - Liquid Glass theme, dark mode default
      - Semantic tokens only (no hardcoded colors)
      - Typography: Montserrat, 14px root
      - Settings UI: iOS 26 dark theme, #131316 / #252525 / #1C1C1C
      - Status color mapping (ORDERING, ORDERED, PAID, UNPAID, HOLD)
      - Rounded corners, spacing, no scrollbars
5.  UX Operational Rules
      - 1–2 taps for core flows
      - KPI limit (max 6), no analytics on operational screens
      - Order/table visibility (ID, status, count, elapsed time)
      - Save-on-back pattern
      - Explicit X close on modals
6.  Component & Interaction Standards
      - Swipe-to-reveal (single open, 20px threshold)
      - Phone input (auto-detect flag, manual selector)
      - OTP (6 boxes, auto-verify, 300ms delay)
      - Wheel pickers for date/time
      - Custom keyboard system
      - Sort icons (expand-arrows.svg) on every table header
7.  Feature-Specific Guardrails
      - Orders / Quick Order persistence (Fire vs Hold)
      - Order Hold flow (ticket status update, no duplicates)
      - Tickets, split check, transfer, merge
      - KDS, inventory deduct/restore, discounts, vouchers
      - Guests, reservations, workforce, cash management
      - Onboarding (manual + AI parity)
      - Demo mode popup (personal email → read-only)
8.  Architecture Rules
      - dbId for DB ops (not truncated id)
      - SHARED_DEVICE_ID = "shared" for global tables
      - Appearance persistence: DB overrides localStorage
      - Order numbering (max + 1)
      - Dashboard ID mapping
9.  Backend / Lovable Cloud Rules
      - RLS on every public table + GRANT statements
      - Roles in separate table via has_role() SECURITY DEFINER
      - No client-side admin checks
      - Payment finalization must be server-side
      - Never expose service_role or DB password
      - Never say "Supabase" in user-facing copy
10. Security Guardrails (from scan findings)
      - AI API keys never in DB
      - Employee PINs never exposed to client
      - Geolocation via server proxy
      - No localStorage tampering for auth/roles
      - Payments validated server-side
      - Edge functions authenticated by default
11. Onboarding & Auth Guardrails
      - "Activate with AI" prioritized
      - Rounded-full inputs & CTAs throughout signup/signin
      - Back navigation must not loop (explicit routes, not navigate(-1))
      - Personal email → mirror business flow, gate at "Use mode" with demo popup
      - AI chat flow mirrors manual flow, prompt-driven
12. AI Assistant Behavior
      - Settings-only scope, no Lovable AI Assistant coupling
      - Contextual welcomes, inline theme/logo actions
      - Compare-plans bottom sheet in AI signup
13. Credit & Efficiency Guardrails
      - Lowest-credit approach first
      - Reuse existing components (e.g., DeviceSetupAIChat)
      - Prefer search-replace over full rewrites
14. Recurring Mistakes & Corrections (Case Log)
      Chronological table capturing: what went wrong, what you asked for,
      how it was fixed, and the guardrail that now prevents recurrence.
      Examples to include:
        - Mode explanation container left empty → added looping videos
        - Back on "Check your email" looped to type selection → explicit route
        - Personal email blocked signup → mirror flow + demo popup
        - Buttons/inputs inconsistent radii → rounded-full standardized
        - AI signup didn't show Places suggestions → fallback + geo bias
        - Country not auto-detected in AI chat → detectCountry + edit sheet
        - Mode explanation missing after selection → learn step + sheet
        - Payment lacked server validation → 7-phase server-side plan
        - Add Guest UI regressed → legacy component with exact styling
        - Theme preset Apply did nothing → wired to AppearanceContext
        - Theme color burgundy/red default → black/grey defaults
        - Order Hold created duplicate tickets → quickOrderDbId + update
        - Fire/Hold could be double-tapped → lock + cartSignature reset
        - Hold-time dropdown clipped → position:fixed popover
        - eatos.com/dashboard not linked → hyperlink added
        - "Where do I find my code?" placement → moved below info box
        - "AI Integration & Settings" naming → renamed "AI Integration"
        - Guest Book "New Order" color/icon → white + plus icon
        - RLS/GRANT gaps flagged by scanner → policies tightened per table
15. Lessons Learned (Principles distilled from the case log)
16. Definition of Done Checklist
      Pre-merge checks: terminology, tokens, RLS+GRANT, no hardcoded colors,
      rounded-full inputs/CTAs in auth flows, no navigate(-1) loops,
      dbId usage, no duplicate ticket creation, save-on-back respected,
      screenshots verified for visual changes.
17. Change Management
      How to update this document when a new rule is agreed.
```

## Method

1. Sweep the full chat history with `chat_search`/`recall_chat_history` to recover every explicit rule, correction, and rejected idea not already in `mem://index.md`.
2. Merge those findings with the existing memory files (design, features, architecture, auth, security) — memory is already the distilled rule set; the guide will reference and expand it.
3. Write the document in one pass, keeping each rule short and prescriptive ("Do / Don't"), with a "Why" line where the reason isn't obvious.
4. Add the Case Log as a table so mistakes are easy to scan.
5. Save to both paths and emit the artifact tag.

## Scope Notes

- Documentation only. No code, schema, or config changes.
- Content is drawn from prior conversation and existing `mem://` memories — no new product decisions are introduced.
- If, while writing, I find a rule that contradicts another, I'll flag it in a "Conflicts to Resolve" appendix rather than silently pick one.

Approve and I'll generate the document.
