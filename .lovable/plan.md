

## Plan: Reposition AI Chat Panel as Overlay on Menu Panel

### Current Behavior
The AI chat panel renders as a **separate flex column** between the menu panel and order panel, pushing content and taking up additional horizontal space.

### Desired Behavior
The AI chat panel should **overlay on top of the menu panel** from the right side, matching the order panel's width. It should not take extra space — it slides over the menu.

### Changes

**File: `src/pages/Orders.tsx`**

1. **Change the AI panel container** (lines ~2678-2737) from a flex sibling to an **absolute-positioned overlay** anchored to the right edge of the menu panel area:
   - Remove it from the flex flow (no `md:order-*`, no `flex-shrink-0`)
   - Position it absolutely within the menu panel's container, aligned to the right
   - Match the order panel's width: `w-[280px] lg:w-[345px]` (or `w-[350px] lg:w-[415px]` when sidebar is open)
   - Full height, with a solid background so it covers the menu beneath it
   - Add a subtle left border or shadow for visual separation

2. **Wrap the menu panel** in a `relative` container so the AI overlay positions correctly within it

3. **Remove the order-shifting logic** — the order panel no longer needs `md:order-3` when AI is open since the AI panel doesn't affect flex ordering

4. **Add backdrop** — a semi-transparent overlay on the menu panel behind the AI chat for visual depth

### Technical Details

```text
Before:
┌──────────┐ ┌──────────┐ ┌──────────┐
│   Menu   │ │ AI Chat  │ │  Order   │
│  Panel   │ │  Panel   │ │  Panel   │
└──────────┘ └──────────┘ └──────────┘

After:
┌──────────────────┐ ┌──────────┐
│   Menu Panel     │ │  Order   │
│        ┌─────────┤ │  Panel   │
│        │AI Chat  │ │          │
│        │(overlay)│ │          │
│        └─────────┤ │          │
└──────────────────┘ └──────────┘
```

The AI panel width will match the order panel width dynamically (280-415px depending on sidebar state).

