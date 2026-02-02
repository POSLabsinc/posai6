

# Increase Mobile Payment Selection Icon Sizes and Layout

## Overview
Enlarge the payment method icons and adjust the grid layout on the mobile payment selection screen to better utilize the available screen space.

---

## Current vs. Proposed Layout

```text
CURRENT LAYOUT:
┌─────────────────────────┐
│  [⊙]   [⊙]   [⊙]       │  ← Small icons (56px container, 24px icons)
│  Card  Cash  Gift       │  ← Small text (text-xs)
│                         │
│  [⊙]   [⊙]   [⊙]       │  ← Gap-4 (16px gaps)
│  Split Link  QR         │
│                         │
│         ...             │
└─────────────────────────┘

PROPOSED LAYOUT:
┌─────────────────────────┐
│  [●]    [●]    [●]      │  ← Larger icons (72px container, 32px icons)
│  Card   Cash   Gift     │  ← Larger text (text-sm)
│                         │
│  [●]    [●]    [●]      │  ← Gap-6 (24px gaps), more padding
│  Split  Link   QR       │
│                         │
│         ...             │
└─────────────────────────┘
```

---

## Changes to Make

**File:** `src/components/PaymentDialog.tsx` (lines 790-811)

### 1. Increase Grid Gap and Padding
- Change `gap-4 px-6 pb-6` → `gap-6 px-4 pb-8`
- This provides more spacing between buttons and better edge margins

### 2. Increase Icon Container Size
- Change `w-14 h-14` (56px) → `w-[72px] h-[72px]` (72px)
- Larger touch targets and more visual presence

### 3. Increase Icon Size
- Change `w-6 h-6` (24px) → `w-8 h-8` (32px)
- Icons are 33% larger for better visibility

### 4. Increase Label Text Size
- Change `text-xs` → `text-sm`
- More readable payment method names

### 5. Add Button Spacing
- Change gap between icon and label from `gap-2` → `gap-3`
- More breathing room between icon and text

---

## Before & After Code

**Before:**
```tsx
<div className="grid grid-cols-3 gap-4 px-6 pb-6 flex-1 content-start">
  {allMobilePaymentMethods.map((method) => {
    const IconComponent = method.icon;
    return (
      <button
        key={method.id}
        onClick={() => handleMobilePaymentMethodSelect(method.id)}
        className="flex flex-col items-center gap-2"
      >
        <div className="w-14 h-14 rounded-full border border-neutral-600 bg-neutral-800 ...">
          {method.id === 'split-check' ? (
            <img src={splitCheckIcon} alt="Split Check" className="w-6 h-6" />
          ) : (
            <IconComponent className="w-6 h-6 text-red-400" />
          )}
        </div>
        <span className="text-white text-xs text-center">{method.name}</span>
      </button>
    );
  })}
</div>
```

**After:**
```tsx
<div className="grid grid-cols-3 gap-6 px-4 pb-8 flex-1 content-start">
  {allMobilePaymentMethods.map((method) => {
    const IconComponent = method.icon;
    return (
      <button
        key={method.id}
        onClick={() => handleMobilePaymentMethodSelect(method.id)}
        className="flex flex-col items-center gap-3"
      >
        <div className="w-[72px] h-[72px] rounded-full border border-neutral-600 bg-neutral-800 ...">
          {method.id === 'split-check' ? (
            <img src={splitCheckIcon} alt="Split Check" className="w-8 h-8" />
          ) : (
            <IconComponent className="w-8 h-8 text-red-400" />
          )}
        </div>
        <span className="text-white text-sm text-center">{method.name}</span>
      </button>
    );
  })}
</div>
```

---

## Size Comparison

| Element | Current | Proposed | Increase |
|---------|---------|----------|----------|
| Icon Container | 56px | 72px | +29% |
| Icon | 24px | 32px | +33% |
| Gap between buttons | 16px | 24px | +50% |
| Button-to-label gap | 8px | 12px | +50% |
| Label text | xs (12px) | sm (14px) | +17% |

---

## Files to Modify

| File | Lines | Changes |
|------|-------|---------|
| `src/components/PaymentDialog.tsx` | 791-810 | Update grid styling, icon sizes, and label sizes |

---

## Testing Checklist

- Verify larger icons display correctly on mobile
- Confirm all 12 payment methods fit well on screen
- Test touch targets are appropriately sized
- Ensure layout doesn't overflow on smaller mobile screens
- Verify desktop/tablet views remain unchanged

