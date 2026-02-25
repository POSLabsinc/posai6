

## Fix: Guest Search Selection, Email Search, and Empty Voucher Section

### Issues Found

**1. Phone search results click not updating**
The search results dropdown (lines 230-248) is rendered **outside** the `resultsRef` div (which only wraps the phone+email input row at line 156). When clicking a search result, the `mousedown` event handler (line 53) fires first, detects the click is outside `resultsRef`, and sets `showResults = false` -- hiding the dropdown before the `onClick` on the button can fire.

**2. Email search blocked when phone field has value**
Line 98: `if (!emailQuery.trim() || searchQuery.trim()) return;` -- the email search `useEffect` exits early whenever the phone field contains any text, making email search non-functional if you've typed anything in the phone field first.

**3. "Select Vouchers" section is blank**
After making `purchaseMode` default to `null`, the voucher configuration section (lines 344-397) only renders content when `purchaseMode === 'single'` or `purchaseMode === 'multiple'`. When `null`, nothing renders -- leaving the section empty.

### Fix Plan

**File: `src/components/voucher/CustomerStep.tsx`**

- **Fix 1**: Move the search results dropdown **inside** the `resultsRef` wrapper div so clicks on results are not treated as "outside" clicks.
- **Fix 2**: Remove the `searchQuery.trim()` guard from the email search `useEffect`, allowing email search to work independently of the phone field. Instead, only skip email search if the phone field has already produced an exact match.

**File: `src/components/SellVoucherScreen.tsx`**

- **Fix 3**: Add a placeholder/empty state inside the voucher configuration section when `purchaseMode` is `null`. This will show a brief message like "Select a purchase type above to configure vouchers" so the section is not blank.

### Technical Details

1. **CustomerStep.tsx -- resultsRef fix**: Restructure the JSX so the search results dropdown sits within the same `ref={resultsRef}` container, preventing the mousedown-outside handler from closing it prematurely.

2. **CustomerStep.tsx -- email search fix**: Change the email `useEffect` condition from `if (!emailQuery.trim() || searchQuery.trim()) return;` to `if (!emailQuery.trim() || matchedCustomer) return;` so email search only skips when a customer is already matched, not just because the phone field has text.

3. **SellVoucherScreen.tsx -- empty state**: Add a conditional block when `purchaseMode` is `null` showing a neutral message guiding the user to select a purchase type first.

