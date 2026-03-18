

## Plan: Two-Step 100% Discount Reason Selection

### Current Behavior
When a 100% discount (Full Comp) is selected, the reason chips expand inline below the discount row. The Apply button stays as "Apply (1)" but is blocked until a reason is chosen.

### Proposed Change
Remove the inline reason expansion. Instead:

1. **When a 100% discount is selected**: The Apply button changes to **"Select Reason"** (orange/primary style).
2. **Tapping "Select Reason"**: Transitions the dialog content to a **reason selection view** showing the AI Suggested chips, Quick Reason chips, Other option, and comment field — same content as today, just full-screen within the dialog instead of inline.
3. **After selecting a reason**: The button becomes **"Apply (1)"** and tapping it applies the discount with the reason.
4. **Back navigation**: A back chevron in the reason view header returns to the discount list.

### Technical Changes (single file: `src/components/DiscountDialog.tsx`)

1. **Add a `view` state**: `'list' | 'reason'` — controls which content is shown in the dialog.
2. **Remove inline expansion**: When a 100% discount is selected, do NOT set `expandedDiscountId`. Instead, keep the row highlighted with the checkmark.
3. **Update CTA logic**:
   - No discount selected → "Apply"
   - 100% discount selected, no reason yet → "Select Reason"
   - Reason selected (or non-100% discount) → "Apply (N)"
4. **CTA tap behavior**:
   - "Select Reason" → set view to `'reason'`
   - "Apply" → run existing `handleApply()`
5. **Reason view**: Reuse existing `renderReasonSection()` content but rendered as the full dialog body with a header showing "Full Comp — Select Reason" and a back chevron.
6. **On reason selected in reason view**: Auto-return to list view (or stay for comment entry, then user taps Apply).
7. Apply same logic for both mobile Drawer and desktop Dialog.

