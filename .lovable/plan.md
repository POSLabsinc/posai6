
## Fix: Synchronize Spacing Between Split Check Sub-Tickets and Main Tickets

### Problem
The spacing between split check sub-tickets and their parent order, as well as between sub-tickets themselves, doesn't match the spacing between main order tickets:

- **Main tickets spacing**: `space-y-2` (8px) from parent container
- **Sub-tickets current spacing**: `space-y-3` (12px) between sub-tickets, and `mt-3` (12px) gap from parent in mobile only (desktop/tablet have no margin)

### Solution
Update all three viewport layouts (mobile, desktop, tablet) to use consistent `space-y-2 mt-2` for the split check container, matching the main ticket spacing.

### Changes Required

**File: `src/pages/TableOrderDetails.tsx`**

1. **Mobile layout (around line 1299)**
   - Change: `space-y-3 mt-3` → `space-y-2 mt-2`

2. **Desktop layout (around line 1592)**  
   - Change: `space-y-3` → `space-y-2 mt-2`
   - Add `mt-2` to create consistent gap from parent ticket

3. **Tablet layout (around line 2208)**
   - Change: `space-y-3` → `space-y-2 mt-2`
   - Add `mt-2` to create consistent gap from parent ticket

### Visual Result
After this fix:
- Gap between main tickets = 8px
- Gap between main ticket and first sub-ticket = 8px  
- Gap between sub-tickets = 8px

All spacing will be uniform using Tailwind's `space-y-2` (0.5rem = 8px).
