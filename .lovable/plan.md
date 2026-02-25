

## Fix: Guest Name Input Issues

### Problems

1. **New guest section appears too early**: After typing just 3 digits with no results, `isNewCustomer` becomes `true`, showing the name fields. The `autoFocus` on the first name input steals focus from the phone/email field, preventing further typing.

2. **Can't enter last name**: The `onBlur` handler on the first name input calls `confirmNewGuest()`, which triggers `onContinue()` (navigates to next step). When clicking/tabbing to the last name field, the blur fires first and saves immediately.

### Solution

**File: `src/components/voucher/CustomerStep.tsx`**

1. **Delay showing new guest section**: Only set `isNewCustomer(true)` when:
   - Phone: the full phone length is entered and no exact match is found (not on partial typing with 0 results)
   - Email: contains both `@` and `.` with no results found
   - Remove the early `results.length === 0` triggers that fire during partial input

2. **Remove `autoFocus` from first name input**: Stop stealing focus from the phone/email fields.

3. **Replace `onBlur` with a "Confirm Guest" button**: Remove both `onBlur` and `onKeyDown` handlers from the name inputs. Add a dedicated button below the name fields that calls `confirmNewGuest()`. This prevents accidental saves when moving between fields.

4. **Keep Enter key on last name only**: Optionally allow Enter on the last name field to confirm, since it's the final input.

### Changes Summary

- Lines 76-77: Remove `if (results.length === 0) setIsNewCustomer(true)` from phone search; keep the existing logic at full phone length
- Lines 107-108: Remove `if (results.length === 0) setIsNewCustomer(true)` from email search; instead set `isNewCustomer(true)` only when email has `@` and `.` with no results
- Line 290: Remove `onBlur={confirmNewGuest}` from first name
- Line 291: Remove `onKeyDown` from first name
- Line 294: Remove `autoFocus` from first name
- Line 300: Remove `onBlur={confirmNewGuest}` from last name
- Line 301: Keep `onKeyDown` Enter on last name only (optional)
- Add a "Confirm Guest" button after the name fields that calls `confirmNewGuest()`

