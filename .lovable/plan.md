

## Add More Vouchers in Multi-Voucher Step

### Current Behavior
When selecting "Multiple Vouchers" on Step 2, users pick a fixed quantity (2-10) and then configure each voucher. There is no way to add more vouchers after the initial selection.

### Proposed Solution
Add an **"+ Add Voucher"** button at the bottom of the voucher entries list (before the shared fields section). This button will append a new blank voucher entry to the existing list, allowing users to incrementally add as many vouchers as needed beyond the initial quantity.

### UI Details
- The button will appear below the last voucher card and above the pagination controls
- Styled as a dashed-border button with a "+" icon, matching the dark theme
- Each new voucher gets a unique ID and blank defaults (same as the generated entries)
- The view auto-navigates to the last page so the newly added voucher is visible

### Technical Changes

**File: `src/components/voucher/MultiVoucherStep.tsx`**
- Add a `addEntry` function that appends a new blank `VoucherEntry` to the entries array using `generateVoucherCode()` for the ID
- After adding, auto-set `currentPage` to the last page so the new entry is immediately visible
- Render an "+ Add Voucher" button between the voucher cards and the pagination controls
- Button styled with dashed border (`border-dashed border-neutral-600`) and a Plus icon from lucide-react

