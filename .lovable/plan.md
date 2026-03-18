

## Old UI vs New Table Order Module — Gap Analysis

After analyzing the 3 uploaded screenshots against the current `TableOrder.tsx` (3,322 lines), here is the comparison.

### Already Present in New Module
- **Table grid with cards** showing table number, seat count (chair icon + "1/4"), and status badge ("AVAILABLE")
- **Guest count dropdown** when tapping an available table (numbers 1 through seat count)
- **Floor area filtering** via hamburger menu (service area selector)
- **Multiple view modes** (grid, list, visual, floorplan) via hamburger menu
- **Status filter tabs** (All, Available, Ordering, etc.)
- **Reservations navigation**
- **Floor area management** (add/edit/delete areas)

### Missing Features

**1. Inline Area/Floor Tabs in the Header Bar**
The old UI shows area tabs ("ALL", "knj,k", "kmkm", "jhhjgb") as horizontal clickable tabs directly in the top toolbar, with an underline indicator on the active tab. The new module buries the area selector inside the hamburger menu dropdown. Users cannot quickly switch areas without opening the menu.

- **Scope**: Add a horizontal tab bar in the header (between the area dropdown and view toggles) that shows "ALL" + all floor areas from the database. Clicking a tab filters tables to that area. "ALL" shows all tables.

**2. Grid/Compact View Toggle Buttons in Header**
The old UI has two toggle buttons (grid icon and compact grid icon) visible directly in the top-right header area, allowing instant switching between grid density modes. The new module requires opening the hamburger menu to change view modes.

- **Scope**: Add two icon toggle buttons (Grid and Compact/List) in the header bar, right-aligned. These map to existing `viewMode` states ("grid" and "list").

**3. Staff List Side Panel**
The old UI has a people/staff icon button in the top-right that opens a slide-in right panel titled "Staff List" with a search bar and employees grouped by role (Manager, Account Managers). Each entry shows avatar initials (colored circle) and full name.

- **Scope**: Add a staff icon button in the header. On tap, slide in a right panel fetching employees from the `employees` table, grouped by `role`. Each row shows initials (derived from `full_name`) in a colored circle + name. Include a search bar to filter by name.

### Implementation Plan

1. **Inline Area Tabs** (`TableOrder.tsx`):
   - Extract unique `floor_area` values from `tablePositions`
   - Render "ALL" + area names as horizontal tabs in the header bar (after the area dropdown/hamburger)
   - Filter `filteredTables` by `selectedArea` when not "ALL"

2. **View Toggle Buttons** (`TableOrder.tsx`):
   - Add Grid and Compact icon buttons in the header, right-aligned
   - Wire to existing `setViewMode("grid")` / `setViewMode("list")`

3. **Staff List Panel** (`TableOrder.tsx`):
   - Add `showStaffPanel` state
   - Add staff/people icon button in header
   - Create a slide-in panel that fetches from `employees` table (using existing `supabase` client)
   - Group employees by `role`, display avatar initials + name
   - Include search input filtering by `full_name`

### Files to Edit
- **`src/pages/TableOrder.tsx`**: All 3 features (area tabs, view toggles, staff panel)

