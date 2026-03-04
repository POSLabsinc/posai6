

## Plan: Move Voucher Type inline with Voucher Name rows

Based on the screenshot, the expected layout is a single row containing: `[Enter voucher name] [- 1 +] [Fixed Amount ▾]` — all inline, no separate header labels.

### Changes in `src/components/voucher/MultiVoucherStep.tsx`

**Shared Mode (lines 376-416):**
- Remove the separate "Voucher Names" / "Voucher Type" header row (lines 377-389)
- Add a simple "Voucher Names" label above the entries
- Inside each voucher name row (`customEntries.map`), append the Voucher Type `<Select>` dropdown after the quantity controls (before the X button), matching the independent mode layout

**Independent Mode (lines 506-533):**
- Already has the correct layout (name + qty + dropdown in one row). No changes needed — it already matches the screenshot.

Both modes will use the same `commonVoucherType` state and render identically styled rows.

