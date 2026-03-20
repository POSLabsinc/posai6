

## Performance Analysis: Why the App is Slow

### Root Cause

The slowness is **not caused by a recent code bug** — it stems from the **accumulated size and complexity** of `Orders.tsx`, which has grown to:

- **3,945 lines** in a single component
- **161 `useState` hooks**
- **48 `useEffect` hooks**
- **106 imports** (including ~40 icon asset imports)

Every state change in this mega-component triggers React's reconciliation across the entire tree. With 161 state variables, even minor interactions cause expensive re-renders.

### Why It Feels Worse "Today vs Yesterday"

Each time new features are added (guest forms, drive-thru vehicles, guest data persistence, etc.), more state and effects are added to this single component. The performance degrades incrementally — it crosses a noticeable threshold after several additions in a short period.

### Plan to Improve Performance

#### Step 1 — Extract Guest Form State into a Custom Hook
Move all 9 guest form state pairs (`showDineInForm`/`dineInGuestData`, `showTakeOutForm`/`takeOutGuestData`, etc.) and their order-type selection logic into a single `useOrderTypeGuests` hook. This removes ~20 `useState` calls and the related effects from the main component.

#### Step 2 — Extract Cart/Order Items Logic into a Hook
Move `orderItems`, `existingItems`, cart manipulation functions (`addItem`, `removeItem`, `updateQty`), and related `useEffect` hooks into a `useCartState` hook.

#### Step 3 — Extract Menu Navigation State into a Hook
Move `activeCategory`, `activeSubcategory`, `selectedMenu`, `menuPosition`, and the 3 sync `useEffect` hooks into a `useMenuNavigation` hook.

#### Step 4 — Memoize Heavy Render Sections
Wrap the menu grid, cart panel, and guest form modals in `React.memo` sub-components so they only re-render when their specific props change, not on every parent state update.

#### Step 5 — Lazy-Load Guest Form Dialogs
The 9 guest form components (DineIn, TakeOut, Delivery, Banquet, DriveThru, CurbSide, Scheduled, PhoneIn, Custom) are all eagerly imported. Wrap them in `React.lazy` so they only load when the user actually opens that order type.

### Expected Impact
- Fewer re-renders per interaction (from 161 state variables down to ~30 in the main component)
- Faster initial load of the Orders page (lazy guest forms)
- More maintainable codebase for future feature additions

### Technical Details

Files to create:
- `src/hooks/useOrderTypeGuests.ts`
- `src/hooks/useCartState.ts`
- `src/hooks/useMenuNavigation.ts`

Files to modify:
- `src/pages/Orders.tsx` (refactor to use new hooks, add React.memo wrappers, lazy-load guest forms)

No database changes needed. No new dependencies.

