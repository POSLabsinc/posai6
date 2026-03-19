

## Plan: Floating Side Panel for Discount Reasons

### Concept
When a 100% discount (Full Comp) is selected, a floating panel appears to the **right** of the discount dialog (in the area marked in the screenshot) showing the reason selection — no view navigation needed.

```text
┌─────────────────────┐ ┌──────────────────────┐
│  Select Discounts   │ │  Select Reason       │
│                     │ │  Full Comp           │
│  [Happy Hour  15%]  │ │                      │
│  [Senior      10%]  │ │  ⚡ AI Suggested     │
│  [Military    15%]  │ │  [Guest Complaint]   │
│  [Special     50%]  │ │  [Wrong Item]        │
│  [✓ Full Comp 100%] │ │  [Food Cold]         │
│                     │ │                      │
│  1 discount selected│ │  Quick Reasons       │
│  Total: -$XX.XX     │ │  [Long Wait] [Other] │
│                     │ │  [Employee Meal] ... │
│  [ Apply (1) ]      │ │                      │
└─────────────────────┘ │  💬 Comment (opt)    │
                        │  [________________]  │
                        └──────────────────────┘
```

### Changes — `src/components/DiscountDialog.tsx`

1. **Remove view navigation** — eliminate the `view` state toggle and "Select Reason" CTA step. The CTA always says "Apply (N)".

2. **Wrap the Dialog in a flex container** — use a wrapper `div` with `flex` so the discount dialog and the reason panel sit side by side.

3. **Conditionally render a side panel** — when a 100% discount is selected, render the existing `renderReasonSection()` in a second panel (matching width ~280px, same dark styling) positioned to the right of the main dialog.

4. **Keep validation** — "Apply" button still validates that a reason is selected for 100% discounts before applying.

5. **Mobile fallback** — on mobile (Drawer), keep the current two-step navigation since there's no room for a side panel.

6. **Portal container mode** — similarly render side-by-side when `portalContainer` is provided.

### Files to Modify
- `src/components/DiscountDialog.tsx` — restructure dialog layout to support side panel, remove view-based navigation for desktop

