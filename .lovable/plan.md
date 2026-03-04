

## Plan: Separate Voucher Type dropdown from Voucher Name field

Based on the screenshot, the voucher name input + quantity controls are inside one bordered container, and the "Fixed Amount" dropdown is a **separate** bordered element next to it — not inside the same container.

### Changes in `src/components/voucher/MultiVoucherStep.tsx`

**Shared Mode (lines 378-411):**
- Move the `<Select>` for `commonVoucherType` **outside** the voucher entry's bordered `div` (the `bg-neutral-800/40 border` container)
- Wrap each entry row in a flex container: `[bordered name+qty box] [separate dropdown]`
- The dropdown should only appear on the **first** entry row (since it's a common/shared setting), or appear once above/beside the entries. Based on the screenshot showing it next to one row, it will render on the first row only.

**Independent Mode (lines ~506-533):**
- Apply the same pattern: move the `<Select>` outside the bordered input container so it sits as a sibling element.

### Layout structure per row:
```text
┌─────────────────────────────────┐  ┌──────────────┐
│ Enter voucher name   [- 1 +]   │  │ Fixed Amount ▾│
└─────────────────────────────────┘  └──────────────┘
```

