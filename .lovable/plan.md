# Update AI-Based Notification Section

**Target file:** `src/components/settings/SalesInsightDetailView.tsx` (the view rendered for AI-category notifications such as "Sales Pace" in `NotificationsListContent.tsx`).

## New layout

Replace the current single-column stack (chart + KPI strip + Reasons + Suggestions + Weak/Top + inline chat + chips + composer) with a two-column layout:

```text
+---------------------------------------------+-----------------------+
| LEFT (flex-1)                               | RIGHT (380px panel)   |
|                                             |                       |
| [ Today card ]                              | Recommendations  (n)  |
|   - "Today" title + small chart icon        | -------------------   |
|   - Net Sales vs Yesterday header           | • Peak hour ...       |
|   - Hourly bars chart (kept from current)   |   [Staffing] Today    |
|                                             | • Tacos trending ...  |
| [ Metrics row ] (mirrors Dashboard home)    |   [Menu] Today        |
|   Total Sale | Total Tip | Total Hours |    | • Labor cost ...      |
|   Ordering | Ready to Serve | Completed     |   [Labor] Tomorrow    |
|                                             | -------------------   |
|                                             | View all 8 recs >     |
+---------------------------------------------+-----------------------+
```

## Specific changes

1. **Remove from the view (no longer rendered):**
   - The "Why sales are slow" reasons card.
   - The "Actionable suggestions" card.
   - The "Weak categories / Top performers" grid.
   - The inline "Conversation" card.
   - The suggestion chips row and bottom full-width composer.
   - Any period filters present anywhere in this view (Today / Weekly / Monthly / Combined / By Location / Shift / Category). Force-fixed to Today; do not render filter pills.

2. **Left column - Today chart card:**
   - Header: "Today" + small chart icon button (top-right, no action beyond visual).
   - Sub-header row: `Net Sales` (with caret) showing today's total, then `vs` and `Yesterday` (with caret) showing yesterday's total. Pull both from `useReportsData` (today range already in file; add yesterday range).
   - Keep existing `ComposedChart` bars + baseline line (renamed to "Yesterday" series). Remove the dip annotation if it conflicts with the cleaner look; keep tooltip.
   - Card style matches current glass card (`rgba(255,255,255,0.03)` + border).

3. **Left column - Metrics row (below chart):**
   - Reuse Dashboard home semantics: Total Sale, Total Tip, Total Hours, Ordering, Ready to Serve, Completed.
   - Respect Control Center visibility via `SettingsManager.getControlCenterSettings().dashboardMetrics` (same filter logic as `src/pages/Dashboard.tsx` lines 1242-1258).
   - Render as a 6-up grid of compact KPI cards using the same token styling as Dashboard (rounded-2xl, surface, label uppercase tracking-wider, value `text-lg font-semibold`).
   - Source values from `useReportsData` for the Today range (sales, tips proxy, orders by status). Where a value isn't available from reports data, fall back to 0 and add a TODO comment per the API-first rule.

4. **Right column - Recommendations panel:**
   - New local component `RecommendationsPanel` rendered inside this file (no new file required; can be split into a sibling file `RecommendationsPanel.tsx` for clarity).
   - Header: "Recommendations" + small bot icon, count badge.
   - List of recommendation cards (data sourced from a typed array `Recommendation[]` derived from existing AI insights helpers - for now seed from `reasons`/`suggestions` already computed, mapped to `{ id, dotColor, text, category, when }`). Mark with a TODO to wire to a real `recommendations` endpoint later.
   - Each row: colored bullet, two-line text, category pill (Staffing amber, Menu emerald, Labor blue, Finance red, Promo amber) with `When` label on the right.
   - Footer button: `View all N recommendations ->`.

5. **Right-side AI Assistant chat:**
   - Clicking `View all recommendations` swaps the right panel content to an "Ask Maya" chat view (no separate route, in-panel state toggle):
     - Top: back chevron + "Ask Maya".
     - Body: each recommendation rendered as a chat-style card; tapping one auto-sends "Tell me more about: <text>" to the existing `reports-ai` edge function (mode `ask`, context unchanged).
     - Input pinned at bottom (reuse existing `ask()` and chat state already in this component).
   - Clicking an individual recommendation row from the default list also opens the chat panel pre-seeded with that recommendation as the user message.
   - Back chevron returns to the recommendations list; chat history is preserved per session.

6. **Terminology / standards:**
   - Use "Product" not "Item" anywhere new text appears.
   - No em dashes. Replace any with commas, "and", or rewrite.
   - Use semantic tokens (`bg-surface`, `text-foreground`, `text-muted-foreground`) and the existing glass-card pattern; no raw hex except where already present in the file.
   - Touch targets >= 44x44 on the recommendation rows and view-all button.

## Technical details

- **State additions in `SalesInsightDetailView`:**
  - `rightView: "recs" | "chat"`.
  - `seedQuestion: string | null` to pre-fill chat when opening from a recommendation.
- **Yesterday data:** extend `useReportsData` consumer by computing a second range (yesterday 00:00-23:59) and calling the hook twice, or memoizing a derived `yesterdayTotal` from `salesByDay`. Prefer the latter if `salesByDay` already covers it; otherwise call the hook a second time.
- **Layout:** outer wrapper `flex gap-4 min-h-0`, left `flex-1 flex flex-col gap-4 min-w-0`, right `w-[380px] shrink-0 flex flex-col` with its own internal scroll. Remove the current `overflow-y-auto` on the shared inner scroll container; each column scrolls independently with `scrollbar-hide`.
- **Recommendation typing:**
  ```ts
  interface Recommendation {
    id: string;
    text: string;
    category: "Staffing" | "Menu" | "Labor" | "Finance" | "Promo";
    when: string; // "Today" | "In 1 hour" | "Tomorrow" | "Urgent"
    dotColor: string; // tailwind class
  }
  ```
- **Edge function:** keep `supabase.functions.invoke("reports-ai", { body: { mode: "ask", question, context } })`. No backend changes.
- **No other files touched** unless extracting `RecommendationsPanel.tsx`. `NotificationsListContent.tsx` continues to route AI sales notifications here.

## Verification

- Open an AI sales notification: confirm left chart + Net Sales vs Yesterday + 6 KPI cards; right Recommendations panel; no chips, no inline conversation, no extra filter pills.
- Click a recommendation: right panel switches to Ask Maya with that recommendation seeded; AI reply streams in.
- Click "View all recommendations": right panel shows full list inside chat scaffold; tapping items asks the AI.
- Back chevron returns to list; mobile (<768px) stacks columns (chart, metrics, recommendations) vertically.
