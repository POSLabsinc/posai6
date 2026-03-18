

## Analysis: Guest Book "Add Guest" vs Order Screen "Add Guest"

### Current State

**Guest Book (GuestBookContent.tsx)** — The plus icon opens a minimal modal with only 3 fields:
- Full Name
- Email  
- Phone

**Order Screen (AddGuestForm.tsx)** — A full-featured form with:
- Profile Photo (camera/upload)
- First Name, Middle Name, Last Name
- Email, Phone Number
- Customer Since, Date of Birth, Anniversary (date fields with calendar icons)
- Address (with map pin icon)
- Collapsible Vehicle Details (type, color, brand, license plate)
- Cancel / Save Guest buttons

### What's Missing in Guest Book

The Guest Book's add guest modal is a bare-bones 3-field form. It lacks all the rich functionality from `AddGuestForm.tsx`:
1. Profile photo upload (camera + file upload)
2. Separate first/middle/last name fields
3. Customer Since, Date of Birth, Anniversary date pickers
4. Address field with map pin icon
5. Collapsible vehicle details section
6. Proper form validation (required field indicators)
7. Styled footer with Cancel/Save buttons

### Plan

**Replace the simple modal in GuestBookContent.tsx with the existing `AddGuestForm` component.**

1. **Import `AddGuestForm`** into `GuestBookContent.tsx`
2. **Replace the inline modal** (lines 1499-1522) with a modal wrapper that renders `<AddGuestForm>` inside it
3. **Wire up the `onSave` callback** to:
   - Call `fetchGuests()` to refresh the guest list
   - Auto-select the newly added guest
   - Close the modal
4. **Remove unused state** (`newGuestName`, `newGuestEmail`, `newGuestPhone`) and the old `handleAddGuest` function since `AddGuestForm` handles its own DB insertion
5. **Modal sizing** — Render the form in a fixed-size modal dialog (max-w-md, max-h constrained) to match the reference screenshot's panel aesthetic

### Files Changed
- `src/components/settings/GuestBookContent.tsx` — Replace inline modal with `AddGuestForm`, remove old state/handler

