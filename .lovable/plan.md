

# Transfer Check Feature Implementation

## Overview
Implement a "Transfer Check" popup that allows staff to transfer the current order to another employee/server. When clicking the Transfer Check button in the order actions sidebar, a dark-themed dialog opens with a searchable list of employees. Selecting an employee updates the order's server assignment.

---

## Visual Reference

Based on the provided image, the popup will have:
- Header with "Cancel" (left), "Transfer Check" title (center), "Update" button (right)
- Search bar to filter employees
- Helper text: "Select an employee to transfer the ordering check"
- List of employees with avatar/initials, name, and "Current Owner" indicator with checkmark

```text
┌─────────────────────────────────────────────────────────────┐
│  Cancel          Transfer Check              Update         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🔍  Search                                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Select an employee to transfer the ordering check          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  (AA)  Account Admin                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  (RY)  Rohan Yadav                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  (MJ)  Mia Jones          Current Owner      ✓      │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  (DH)  Dustin H                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  (AM)  Alex M                                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Create Mock Staff Data

Create a new data file for staff/employees that can be reused across the application.

**File:** `src/data/staff.ts`

```typescript
export interface StaffMember {
  id: number;
  name: string;
  initials: string;
  avatar?: string;
  role: 'Server' | 'Manager' | 'Host' | 'Admin';
}

export const staffList: StaffMember[] = [
  { id: 1, name: "Account Admin", initials: "AA", role: "Admin" },
  { id: 2, name: "Rohan Yadav", initials: "RY", role: "Server" },
  { id: 3, name: "Mia Jones", initials: "MJ", role: "Server" },
  { id: 4, name: "Dustin H", initials: "DH", role: "Server" },
  { id: 5, name: "Alex M", initials: "AM", role: "Server" },
  { id: 6, name: "Sarah Wilson", initials: "SW", role: "Host" },
  { id: 7, name: "James Rodriguez", initials: "JR", role: "Manager" },
];
```

### Step 2: Create TransferCheckDialog Component

Create a new dialog component with dark theme styling matching the rest of the application.

**File:** `src/components/TransferCheckDialog.tsx`

**Structure:**
- Props: `isOpen`, `onClose`, `currentServer`, `onTransfer`
- State: `searchQuery`, `selectedEmployee`
- UI Elements:
  - Header with Cancel, Title, Update buttons
  - Search input with search icon
  - Helper text
  - Scrollable list of employees
  - Each employee row shows avatar/initials, name, and current owner indicator

**Styling (Dark Theme):**
- Dialog container: `bg-neutral-900 border-neutral-700`
- Header buttons: Cancel (text), Update (neutral button)
- Search input: `bg-neutral-800 border-neutral-700 text-white`
- Employee rows: `bg-neutral-800/50 hover:bg-neutral-700`
- Selected state: Border highlight or checkmark
- Initials circle: Colored background with white text
- Current Owner label: `text-neutral-400`
- Checkmark: `text-green-500`

### Step 3: Update Orders.tsx State Management

Add state and handler for the Transfer Check dialog.

**New State Variables:**
```typescript
const [showTransferCheckDialog, setShowTransferCheckDialog] = useState(false);
const [currentServerName, setCurrentServerName] = useState("Mia Jones");
```

**Handler Function:**
```typescript
const handleTransferCheck = (newServerName: string) => {
  setCurrentServerName(newServerName);
  setShowTransferCheckDialog(false);
  // Optional: Show success toast
};
```

### Step 4: Connect Transfer Check Button

Update the Transfer Check button to open the dialog.

**Current Code (line 8558):**
```typescript
<button className="flex-1 flex flex-col items-center justify-center...">
```

**Updated Code:**
```typescript
<button 
  onClick={() => setShowTransferCheckDialog(true)}
  className="flex-1 flex flex-col items-center justify-center..."
>
```

### Step 5: Pass Server Name Dynamically

Update the PaymentDialog to use the dynamic server name instead of hardcoded value.

**Current Code (line 8891):**
```typescript
serverName: "Mia Jones",
```

**Updated Code:**
```typescript
serverName: currentServerName,
```

### Step 6: Render the Dialog

Add the TransferCheckDialog component at the end of the Orders component.

```typescript
<TransferCheckDialog
  isOpen={showTransferCheckDialog}
  onClose={() => setShowTransferCheckDialog(false)}
  currentServer={currentServerName}
  onTransfer={handleTransferCheck}
/>
```

---

## Technical Details

### Files to Create

| File | Purpose |
|------|---------|
| `src/data/staff.ts` | Centralized staff/employee data |
| `src/components/TransferCheckDialog.tsx` | Transfer Check popup component |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Orders.tsx` | Add state, handler, button click, dialog render |

### Component Props Interface

```typescript
interface TransferCheckDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentServer: string;
  onTransfer: (newServerName: string) => void;
}
```

---

## Dialog Features

| Feature | Implementation |
|---------|----------------|
| Search | Filter staff by name as user types |
| Current Owner | Show "Current Owner" label + checkmark for active server |
| Selection | Highlight selected employee, enable Update button |
| Cancel | Close dialog without changes |
| Update | Apply transfer and close dialog |
| Dark Theme | Match existing dialog styling (neutral-900/800/700) |
| Scrollable List | ScrollArea for long employee lists |

---

## Testing Checklist

- Open Transfer Check dialog from order actions sidebar
- Search filters employee list correctly
- Current server is marked with "Current Owner" label and checkmark
- Can select a different employee
- Update button transfers the order to selected employee
- Cancel closes dialog without changes
- Server name updates in PaymentDialog after transfer
- Dialog styling matches dark theme of other dialogs
- Dialog works on mobile and tablet views

