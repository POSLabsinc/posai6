

## Analysis: Why Table Sizes Haven't Changed

The root cause is that the `/reservations` page uses a **completely different component** (`src/components/TableMapPanel.tsx`) than the Table Order pages (`src/pages/TableOrder.tsx` / `TableOrderB.tsx`). All previous size increases were applied to the wrong files.

The floor plan tables on the Reservations page are rendered by:
- `FloorPlanCircularTable` -- current radius: 24-36px
- `FloorPlanSquareTable` -- current size: 48px
- Container size for both: 120px

These are significantly smaller than what was intended.

---

## Plan

Update `src/components/TableMapPanel.tsx` to increase table sizes, text, timers, and touch targets -- matching the enhancement requirements.

### Changes to `src/components/TableMapPanel.tsx`

**1. Increase Table Dimensions (~30% larger)**
- Circular tables: `tableRadius` from `24/30/36` to `32/40/48`
- Square tables: `tableSize` from `48` to `65`
- Container size: from `120` to `160`

**2. Increase Chair Sizes**
- Chair dimensions from `w-4 h-2.5` to `w-5 h-3`
- Chair distance adjustments to match larger tables

**3. Increase Text Sizes**
- Table ID: `text-sm` to `text-base font-bold`
- Status label: `text-[8px]` to `text-[11px] font-semibold`
- Timer badge: `text-[9px]` to `text-[11px]`, clock icon from `w-2 h-2` to `w-3 h-3`
- Seat dots: `w-1 h-1` to `w-1.5 h-1.5`

**4. Adjust Table Positions**
- Spread out `x` and `y` coordinates in `defaultTables` to prevent overlap with the larger containers

**5. Touch Optimization**
- Larger container = larger tap area (160px vs 120px)

### Technical Details

Only one file is modified: `src/components/TableMapPanel.tsx`

Components affected:
- `CircularChair` -- increase `chairDistance` and chair element size
- `SquareChair` -- increase offset and chair element size  
- `FloorPlanCircularTable` -- increase radius, container, text sizes
- `FloorPlanSquareTable` -- increase tableSize, container, text sizes
- `defaultTables` array -- adjust x/y positions to add spacing

No changes to interaction logic, colors, or status configurations.
