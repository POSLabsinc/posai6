

# Fix QR Code "Share via Text" Scrolling Issue

## Problem
When clicking "SHARE VIA TEXT" in the QR Code payment flow, the phone number input and numeric keypad appear but are cut off at the bottom of the screen. The user cannot scroll to see the full keypad.

---

## Root Cause Analysis

```text
QR Code Payment Flow Layout:
┌─────────────────────────────────────────────────────────┐
│  Header: "Pay by QR" + Amount                           │  <- Fixed height
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────┐  │
│  │  QR Display Screen (flex-1, NO overflow-y-auto)   │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  "Scan to Pay" + Amount                     │  │  │
│  │  │  ┌─────────────────┐                        │  │  │
│  │  │  │   QR Code       │  <- 192px x 192px      │  │  │
│  │  │  │   (w-48 h-48)   │                        │  │  │
│  │  │  └─────────────────┘                        │  │  │
│  │  │  [SHARE QR] [SHARE VIA TEXT]                │  │  │
│  │  │                                             │  │  │
│  │  │  ┌───────────────────────────────┐ ◄──────────────── HIDDEN/CUT OFF
│  │  │  │ Phone Input + Send Button    │          │  │  │
│  │  │  └───────────────────────────────┘          │  │  │
│  │  │  ┌─────┬─────┬─────┐                        │  │  │
│  │  │  │  1  │  2  │  3  │                        │  │  │
│  │  │  ├─────┼─────┼─────┤                        │  │  │
│  │  │  │  4  │  5  │  6  │ ◄──────────────────────────── HIDDEN/CUT OFF
│  │  │  ├─────┼─────┼─────┤                        │  │  │
│  │  │  │  7  │  8  │  9  │                        │  │  │
│  │  │  ├─────┼─────┼─────┤                        │  │  │
│  │  │  │     │  0  │ DEL │                        │  │  │
│  │  │  └─────┴─────┴─────┘                        │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Issue:** The QR Display Screen container (line 2091) has `flex-1` which gives it flexible height, but it lacks `overflow-y-auto` to enable scrolling when content exceeds available space.

---

## Solution

Add `overflow-y-auto scrollbar-hide` to the QR Display Screen container to enable vertical scrolling while hiding the scrollbar for a clean look.

---

## Implementation Steps

### Step 1: Update QR Display Screen Container

**File:** `src/components/PaymentDialog.tsx` (line 2091)

**Current:**
```typescript
<div className="flex-1 flex flex-col items-center px-6 py-6">
```

**Updated:**
```typescript
<div className="flex-1 flex flex-col items-center px-6 py-6 overflow-y-auto scrollbar-hide">
```

This single change enables vertical scrolling within the QR display screen, allowing users to scroll down to see and use the full keypad when "SHARE VIA TEXT" is active.

---

## Additional Improvements (Optional)

To further improve the UX, we can also:

### Step 2: Make QR Code Smaller on Mobile When Keypad is Shown

When the phone input is visible, reduce the QR code size on mobile to fit more content above the fold.

**File:** `src/components/PaymentDialog.tsx` (line 2096)

**Current:**
```typescript
<div className="w-48 h-48 bg-white rounded-xl...">
```

**Updated:**
```typescript
<div className={`${showQrPhoneInput && isMobile ? 'w-32 h-32' : 'w-48 h-48'} bg-white rounded-xl...`}>
```

### Step 3: Reduce Vertical Spacing When Keypad is Shown

Reduce margins between elements when the phone input is active to fit more content.

**File:** `src/components/PaymentDialog.tsx**

**Update margins (lines 2092-2093, 2096, 2113):**
- Change `mb-6` to `mb-3` for amount display when keypad shown
- Change `mb-6` to `mb-3` for QR code when keypad shown
- Change `mb-4` to `mb-2` for action buttons

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/PaymentDialog.tsx` | Add `overflow-y-auto scrollbar-hide` to QR Display Screen container (line 2091), optionally reduce sizes/spacing when keypad is shown |

---

## Testing Checklist

- Open Payment Dialog
- Click "Other" dropdown and select "QR Code" (or navigate to it)
- Verify QR code screen displays correctly
- Click "SHARE VIA TEXT" button
- Verify phone input field appears
- **Verify you can scroll down to see the full numeric keypad**
- Test entering phone number using the keypad
- Test the Send button functionality
- Verify scrolling works smoothly on mobile viewport
- Verify the layout returns to normal when "SHARE VIA TEXT" is toggled off

