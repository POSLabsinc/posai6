

# Standardize Mobile Quick Amount Buttons Layout

## Overview
Update the mobile quick amount buttons to have consistent styling and display 3 buttons per row.

---

## Current vs. Proposed Layout

```text
CURRENT MOBILE LAYOUT:
┌─────────────────────────────────┐
│  $23.44   $1   $2   $5         │  ← 4 buttons, first button has different styling
│                                 │     (py-2 text-xs vs py-4 text-base)
│  $10   $20   $50   $100        │  ← 4 buttons in second row
└─────────────────────────────────┘

PROPOSED MOBILE LAYOUT:
┌─────────────────────────────────┐
│  $23.44     $1      $2         │  ← 3 buttons, all same styling (py-4 text-base)
│                                 │
│    $5      $10     $20         │  ← 3 buttons
│                                 │
│   $50     $100                 │  ← 2 buttons (remaining)
└─────────────────────────────────┘
```

---

## Changes to Make

**File:** `src/components/PaymentDialog.tsx` (lines 4160-4244)

### 1. Fix First Button (Total Amount) Styling
- Change from `py-2 text-xs` to `py-4 text-base` on mobile to match other quick amount buttons

### 2. Reorganize Grid Layout for Mobile
- Row 1: Total amount, $1, $2 (3 buttons)
- Row 2: $5, $10, $20 (3 buttons)  
- Row 3: $50, $100 (2 buttons)

### 3. Slice Logic Update
- First row: `quickAmounts.slice(0, 2)` with total = 3 buttons
- Second row: `quickAmounts.slice(2, 5)` = 3 buttons
- Third row: `quickAmounts.slice(5)` = 2 buttons

---

## Code Changes Summary

| Line | Current | Proposed |
|------|---------|----------|
| 4167 | `py-2 text-xs` (mobile) | `py-4 text-base` (mobile) |
| 4176 | `slice(0, 3)` | `slice(0, 2)` for mobile |
| 4211 | `slice(3)` | Split into 2 rows for mobile |

---

## Files to Modify

| File | Lines | Changes |
|------|-------|---------|
| `src/components/PaymentDialog.tsx` | 4160-4244 | Update first button styling and reorganize grid to 3 columns |

