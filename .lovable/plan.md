
## Fix: Access Restricted MPIN Popup — Back Button & Padding

### Problem
The screenshot shows the **Price Override MPIN screen** inside `ItemCustomizationDialog.tsx` (`renderMPINView`). Two issues remain unfixed:

1. **Padding issue**: Lines 686 and 720 still have `max-w-[280px] mx-auto` on the numpad grid and biometric button row — this creates large left/right gaps inside the dialog.
2. **No back button**: Lines 661–665 only render a centered title/subtitle block. There is no `ChevronLeft` button to navigate back to the customization view.

---

### Root Cause
The previous fix was applied to the **Discount dialog** inside `Orders.tsx` but NOT to the **`renderMPINView`** function inside `src/components/ItemCustomizationDialog.tsx`, which is a completely separate component that also renders an "Access Restricted" MPIN screen.

---

### Fix Plan

**File: `src/components/ItemCustomizationDialog.tsx`**

**Change 1 — Add back button to header (lines 659–665):**

Replace the plain centered header with a relative container that positions a `ChevronLeft` button on the left, while keeping the title/subtitle centered. Clicking the back button will call `setCurrentView('customization')` to return to the item customization screen.

```
Before:
<div className="text-center mb-6">
  <h3 className="text-foreground font-bold text-xl mb-1">Access Restricted</h3>
  <p className="text-muted-foreground text-sm">Enter Manager PIN to Adjust Price.</p>
</div>

After:
<div className="relative flex items-center justify-center mb-6">
  <button
    onClick={() => setCurrentView('customization')}
    className="absolute left-0 w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
  >
    <ChevronLeft className="w-5 h-5 text-neutral-400" />
  </button>
  <div className="text-center">
    <h3 className="text-foreground font-bold text-xl mb-1">Access Restricted</h3>
    <p className="text-muted-foreground text-sm">Enter Manager PIN to Adjust Price.</p>
  </div>
</div>
```

**Change 2 — Remove `max-w-[280px] mx-auto` from numpad (line 686):**

```
Before:
<div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto w-full">

After:
<div className="grid grid-cols-3 gap-3 w-full">
```

**Change 3 — Remove `max-w-[280px] mx-auto` from biometric row (line 720):**

```
Before:
<div className="flex justify-center gap-3 mt-4 max-w-[280px] mx-auto w-full">

After:
<div className="flex gap-3 mt-4 w-full">
```

**Change 4 — Ensure `ChevronLeft` is imported** in `ItemCustomizationDialog.tsx` (check existing imports and add if missing).

---

### Result
- The numpad and biometric buttons will stretch to fill the full dialog width, eliminating the side padding.
- A `ChevronLeft` back button will appear in the top-left of the header, navigating back to the customization view when tapped.
