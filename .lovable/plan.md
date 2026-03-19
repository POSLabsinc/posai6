

## Plan: Horizontal Two-Column Layout for Send Message to Kitchen Dialog

### Overview
Split the dialog into two side-by-side columns: the **Message section** (left) and the **Link section** (Orders/Tables tabs, right), with action buttons spanning the full width below.

### Changes

**File: `src/components/MessageKitchenDialog.tsx`**

1. Widen the dialog from `max-w-[480px]` to `max-w-[820px]` to accommodate two columns.

2. Replace the current vertical `space-y-4` layout with a two-column grid:
   - **Left column (~45%)**: Message label, textarea, character counter, suggestion chips
   - **Right column (~55%)**: Section title, Orders/Tables tab bar, search input, scrollable list
   - Remove the horizontal divider between sections (replaced by column separation)

3. Keep the Cancel/Send buttons in a full-width row below both columns.

4. Use a vertical divider (`border-r border-neutral-700`) on the left column to visually separate the two sides.

### Layout Structure
```text
┌──────────────────────────────────────────────┐
│  Send Message to Kitchen                     │
├─────────────────────┬────────────────────────┤
│  Message *          │  Choose order/table... │
│  ┌───────────────┐  │  [ Orders ] [ Tables ] │
│  │ textarea      │  │  🔍 Search...          │
│  │               │  │  ┌──────────────────┐  │
│  └───────────────┘  │  │ #23 T2 Mia Jones │  │
│  0/100              │  │ #24 T4 Dustin H  │  │
│  [chip] [chip] ...  │  │ #25 T5 Mia Jones │  │
│                     │  └──────────────────┘  │
├─────────────────────┴────────────────────────┤
│        [ Cancel ]        [ SEND ]            │
└──────────────────────────────────────────────┘
```

