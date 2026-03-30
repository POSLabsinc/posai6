

## Plan: Redesign Kitchen Instruction Notes UI

### What Changes

Three responsive layout variants of the Kitchen Instruction section in `src/pages/Tickets.tsx` (around lines 2203-2242, 3374-3413, 4262-4301) will be updated with the same logic:

### Design

**Case 1: No existing notes (originalNotes is empty/null)**
- Show the input field with placeholder "Add order notes"
- When user types text, show a send arrow icon button **inside** the input box (right-aligned) instead of the separate "Send to kitchen" button below
- The send arrow uses `SendHorizontal` from lucide-react, placed inside the input container div
- Arrow only appears when the input has content AND the order is fired

**Case 2: Existing notes (originalNotes has content)**
- Show the "Add order notes" input field (editable, for adding new notes)
- Below the input, show the existing original notes as a read-only styled text block (smaller text, muted color, with a label like the note emoji)
- The send arrow icon appears inline in the input box when new text is typed and order is fired

### Changes in `src/pages/Tickets.tsx`

For each of the 3 layout blocks:

1. **Move the send button inline**: Replace the separate `<button>Send to kitchen</button>` below the input box with a `SendHorizontal` icon button placed inside the input container div (after the `<input>`)
2. **Add existing notes display**: Below the input container, if `selectedGuest.notes` has content (the original saved notes), render a read-only block showing those notes
3. Import `SendHorizontal` from `lucide-react`

No other files, routes, or components change.

