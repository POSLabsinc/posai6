
# Fix Discount "Access Restricted" MPIN Popup

## What's Wrong (Compared to the Screenshot & Price Override MPIN)

Comparing the user's screenshot with the working `ItemCustomizationDialog.tsx` MPIN, four issues exist in `src/pages/Orders.tsx`:

---

### Issue 1 — Default X Close Button Appearing
The `DialogContent` at line 8998 is missing the `hideCloseButton` prop. This causes Radix UI to render its default X button in the top-right corner, cluttering the header area alongside the custom back button.

**Fix:** Add `hideCloseButton` to `DialogContent`.

---

### Issue 2 — Back Button Navigates to Wrong View
The back button `onClick` at line 9006 does:
```
setDiscountDialogView('discounts')
```
This is backwards — it sends users **into** the discount list when they press back on the MPIN screen. Since MPIN is always the entry point for the Discount dialog, the back button should **close the dialog entirely**:
```
setShowDiscountDialog(false); setDiscountPin(""); setDiscountPinError(false);
```

---

### Issue 3 — Numpad Buttons Are Too Short
All numpad digit buttons use `h-14` (56px height). The screenshot and the reference MPIN in `ItemCustomizationDialog.tsx` both show tall, nearly-square numpad keys. 

**Fix:** Change all numpad buttons from `h-14` to `h-16` to match the taller appearance.

---

### Issue 4 — PIN Boxes Show No Fill Difference
Both the filled and unfilled PIN box states use identical classes:
```
border-neutral-600 bg-neutral-800
```
There's no visual difference when a digit is entered. The `ItemCustomizationDialog.tsx` MPIN (the working reference) uses a brighter border for filled boxes.

**Fix:** Change the filled state to `border-neutral-400 bg-neutral-700` so entered digits stand out clearly.

---

## Technical Changes — `src/pages/Orders.tsx`

| Line | Change |
|------|--------|
| 8998 | Add `hideCloseButton` to `<DialogContent>` |
| 9006 | Fix back button: `setShowDiscountDialog(false)` instead of `setDiscountDialogView('discounts')` |
| 9022–9028 | Fix PIN box filled state: `border-neutral-400 bg-neutral-700` when digit entered |
| 9055 | Change `h-14` → `h-16` for digit buttons (rows 1–3) |
| 9064 | Change `h-14` → `h-16` for backspace button |
| 9085 | Change `h-14` → `h-16` for zero button |
| 9093 | Change `h-14` → `h-16` for C (clear) button |

All other existing logic (PIN validation, shake animation, biometric buttons, discount selection view) remains unchanged.
