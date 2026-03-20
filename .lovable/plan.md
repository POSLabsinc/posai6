

# Workstream 3: Mega-File Decomposition Plan

This is a pure refactor — no behavior changes. Each file will be broken into focused sub-components and data modules. The orchestrator page files will shrink to ~500-800 lines of state management and composition.

Due to the sheer size (~23,000 lines across 3 files), this must be done **one file at a time across multiple implementation passes**.

---

## Pass 1: Orders.tsx (9,954 lines → ~800 line orchestrator)

### Extract static data (lines 106-6043)
**`src/data/orderMenuData.ts`** — All hardcoded constants:
- `foodImages` array (line 127)
- `categorySubcategories` record (lines 130-213)
- `menuItemsData` structure (lines 227-5850)
- `categoryBorderColors`, `categoryBgColors`, `categoryTextColors` records (lines 5851-6026)
- Helper functions: `getCategoryBorderColor`, `getCategoryBgColor`, `getCategoryHoverBgColor`, `getCategoryTextColor`, `getCategoryHoverTextColor` (lines 6027-6043)
- Type exports: `MenuItem`, `SubcategoryItems`, `CategoryItems`, `MenuItemsStructure`

### Extract UI sections from the JSX return (lines 7227-9954)
**`src/components/orders/OrderCartPanel.tsx`** — The right-side cart panel:
- Order type selector dropdown
- Guest info header (name, phone, table info)
- Seat selector bar
- Cart item list with SwipeableCartItem
- Order summary row (subtotal, discount, service charge)
- Action buttons (Clear, Save, Fire, Charge)
- All guest form dialogs (DineIn, TakeOut, Delivery, etc.)

**`src/components/orders/OrderMenuPanel.tsx`** — The left-side menu browsing panel:
- Menu selector dropdown
- Category tabs (horizontal scroll)
- Subcategory tabs
- Product grid (thumbnail and list views)
- Search overlay
- Custom item panel with keyboard

**`src/components/orders/OrderDialogs.tsx`** — All modal/dialog wrappers:
- PaymentDialog
- DiscountDialog + MPIN guard
- GiftCardDialog, ServiceChargeDialog
- VoucherDialog + VoucherOptionsPopup
- PriceOverrideDialog, OpenPriceDialog
- TransferCheckDialog
- MessageKitchenDialog
- Clear order confirmation
- Split order alert
- ItemCustomizationDialog
- No Tax dialog

### What stays in Orders.tsx (~800 lines)
- All `useState` declarations
- All handler functions (addItem, removeItem, fire, clear, etc.)
- URL param parsing and session order logic
- DB product fetching and menu merging logic
- `useMemo` computations (dynamicMenuItems, subtotal, tax, etc.)
- Composition: renders `OrderMenuPanel`, `OrderCartPanel`, `OrderDialogs`

---

## Pass 2: Tickets.tsx (6,440 lines → ~500 line orchestrator)

### Extract helper components (lines 252-423)
**`src/components/tickets/TicketModifierTree.tsx`** — The 3 modifier tree variants:
- `ModifierTree` (desktop non-swipeable)
- `SwipeableModifierTree` (swipeable for refund)
- `SwipeableModifierTreeCart` (swipeable for cart)

### Extract from the JSX return (lines 5980-6440)
**`src/components/tickets/TicketListPanel.tsx`** — Left panel:
- Filter tabs (All, Open, Completed, Paid, Unpaid)
- Search bar
- Ticket card list (mobile and desktop variants)
- Date picker, sort controls

**`src/components/tickets/TicketDetailPanel.tsx`** — Right panel:
- Selected ticket header (guest info, timer)
- Item list with modifiers
- Financial summary (subtotal, discount, tax, tip, total)
- Action buttons (Pay, Refund, Transfer, etc.)
- Inline transfer view

**`src/components/tickets/TicketRefundFlow.tsx`** — Refund modal/sheet:
- Refund step state machine
- Type selection, item selection, confirmation, success
- RefundModalLayout / RefundBottomSheet integration
- Refund allocation logic

### What stays in Tickets.tsx (~500 lines)
- All `useState` and order data conversion
- Handler functions (pay, refund, transfer, tip, discount)
- Filter/sort/search logic
- Composition of sub-components

---

## Pass 3: Login.tsx (6,481 lines → ~400 line orchestrator)

### Extract static data (lines 35-108)
**`src/data/loginData.ts`** — Hardcoded mock data:
- `revenueCenters` record
- `employeePinMapping` record
- `locationEmployees` array
- `getRoleIcon`, `getRoleBadgeStyle`, `getTimeOfDayInfo` helpers

### Extract from the JSX return (lines 6002-6481)
**`src/components/login/CompanyDeviceFlow.tsx`** — Company device screens:
- Device type selection (Company vs Personal)
- Employee grid selection
- PIN entry with NumericKeypad
- Clock-in confirmation and success
- Device activation/setup flow

**`src/components/login/PersonalDeviceFlow.tsx`** — Personal device screens:
- Email/password login form
- 2FA OTP flow (SMS/Email)
- Identity verification
- Clock-in/clock-out for personal device
- Request access flow

**`src/components/login/LoginDemoMode.tsx`** — Demo mode:
- Business type selection
- Demo email verification
- Demo OTP flow

**`src/components/login/LoginForgotPassword.tsx`** — Forgot password:
- Email/phone input
- Reset OTP verification
- New password form

### What stays in Login.tsx (~400 lines)
- All `useState` declarations
- Flow control logic (which screen to show)
- Session clearing on mount
- Composition of sub-components

---

## Execution Order

1. **Orders.tsx** — largest file, highest impact
2. **Tickets.tsx** — second largest
3. **Login.tsx** — third largest

Each pass is independent. After each pass, the app should behave identically — this is a pure structural refactor with no logic changes.

**Estimated new files**: 12-14 component/data files created, 3 page files significantly reduced.

