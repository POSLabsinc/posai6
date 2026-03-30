

## Plan: Fix "Add order notes" field not editable

### Problem
The `canEditNotes()` function in `src/pages/Tickets.tsx` (line 1042-1044) restricts note editing to only `"ORDERING"` or `"UNPAID"` statuses. For any other status (e.g., `"SENT"`, `"FIRED"`, `"COMPLETED"`), the field renders as a static `<span>` instead of an `<input>`.

### Solution
Expand `canEditNotes` to allow editing for all statuses except `"PAID"` and `"COMPLETED"` (where operational buttons are already hidden per the system architecture). This aligns with the kitchen instruction requirement where staff can edit instructions after firing and use the "Send to kitchen" button.

### Changes

**File: `src/pages/Tickets.tsx`** (line 1042-1044)
- Change `canEditNotes` from a whitelist (`ORDERING`, `UNPAID`) to a blacklist approach:
  - Allow editing for all statuses **except** `"PAID"` and `"COMPLETED"`
- This enables typing in the notes field for statuses like `SENT`, `FIRED`, `READY`, etc.

No other files or components need changes.

