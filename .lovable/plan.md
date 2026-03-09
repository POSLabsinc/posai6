

## Fix KDS Vertical Scroll and Message-Table Matching

### Issues Found

**1. Vertical scroll is blocked**
Line 750 in `KDS.tsx`: the ticket container has `overflow-y-hidden`, which prevents vertical scrolling entirely. Should be `overflow-y-auto`.

**2. Message-table matching fails due to regex order bug**
The `normalizeTableNumber` function (lines 11-18) applies regex in the wrong order:
- First strips `^T\.?\s*` — on "Table 2", this matches just the leading "T", leaving "able 2"
- Then tries `^Table\s*` — but the string is now "able 2", so it doesn't match

This means POS messages with `table_number: "Table 2"` normalize to "ABLE 2" instead of "2", while KDS tickets with `tableNumber: "T2"` normalize to "2". They never match.

**Fix**: Reverse the regex order — strip "Table " first, then "T." prefix.

### Changes (single file: `src/pages/KDS.tsx`)

1. **Fix `normalizeTableNumber`** — swap the two `.replace()` calls so `"Table "` is stripped before `"T."`:
   ```
   .replace(/^Table\s*/i, "")  // first: strip "Table "
   .replace(/^T\.?\s*/i, "")   // then: strip "T." or "T"
   ```

2. **Fix scroll container** — change `overflow-y-hidden` to `overflow-y-auto` on the ticket area div (line 750).

