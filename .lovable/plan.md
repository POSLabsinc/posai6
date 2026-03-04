

## Plan: Fix Panel Background Colors to Match Screenshot

The user wants to revert to the original background colors instead of the `--panel-glass` CSS variable approach.

### Target Colors
- **Left Nav Bar & Right Order Panel**: `#7575754D` (semi-transparent grey) with `inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)` box-shadow
- **Right Side 3-Dot Actions Sidebar**: `bg-neutral-800` (#262626) with `border-neutral-700` (#404040)

### Changes

**1. `src/components/DraggableSidebar.tsx` (line 156)**
- Change `style={{ background: 'hsl(var(--panel-glass))', boxShadow: 'var(--panel-glass-shadow)' }}` to `style={{ background: '#7575754D', boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)' }}`

**2. `src/pages/Orders.tsx`**
- **Line 6919** (order content container): Replace `style={{ background: 'hsl(var(--panel-glass))', boxShadow: 'var(--panel-glass-shadow)', border: '1px solid white' }}` with `className` using `bg-[#7575754D] border border-white` and inline box-shadow
- **Lines 8154-8157** (mobile order content): Same change — replace panel-glass with `#7575754D`
- **Lines 8787-8789** (summary section): Same change
- **Lines 8889-8892** (right-side 3-dot actions sidebar): Change from `panel-glass` to `bg-neutral-800 border border-neutral-700` with appropriate styling

**3. `src/index.css`** — Keep the CSS variables as-is (they may still be used elsewhere); the specific components just override them.

