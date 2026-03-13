

# Workforce Database Sync — Full Audit & Plan

## Critical Finding: `employee_shifts` Table Does NOT Exist

The entire shift system — clock in/out, shift scheduling, shift cards, calendar views, exports — references a table that was never created. All shift queries silently fail.

## Current State

### `employees` Table — Existing Columns
`id, full_name, role, pin, phone, email, avatar_url, hourly_rate, assigned_job_types, revenue_center, is_archived, created_at, updated_at`

### `employees` — Missing Columns (used in UI but never saved)
| Field | Used In | Status |
|---|---|---|
| `is_on_leave` | EmployeeContent.tsx (status logic) | **NOT in DB** — code references it but column doesn't exist |
| `dashboard_access` | AddEmployeeContent.tsx | **NOT saved** — state exists in form but not persisted |
| `payroll_enabled` | AddEmployeeContent.tsx | **NOT saved** — state exists in form but not persisted |
| `employee_code` | AddEmployeeContent.tsx ("Employee Id" field) | **NOT saved** — state exists in form but not persisted |

### `employee_shifts` Table — Does NOT Exist
The code inserts/queries these columns but the table is missing entirely:

| Column | Used By |
|---|---|
| `id` | All queries |
| `employee_id` | All queries (FK to employees) |
| `shift_date` | All queries |
| `clock_in` / `clock_out` | EmployeeExpanded, useClockIn/useClockOut |
| `break_minutes` | EmployeeExpanded |
| `total_orders` / `total_tips` | EmployeeExpanded stats |
| `shift_type` | AddShiftContent, ShiftCards |
| `start_time` / `end_time` | AddShiftContent, ShiftCards |
| `assign_section` | AddShiftContent |
| `allow_overtime` | AddShiftContent |
| `recurring` | AddShiftContent |
| `job_type` | AddShiftContent, export |
| `pay_rate` | AddShiftContent, export |
| `shift_notes` | AddShiftContent, export |
| `start_date` / `end_date` | AddShiftContent, ShiftCards |

### Open Shifts — localStorage Only
`AddOpenShiftContent` and `ShiftCalendarView` store open shifts in `localStorage` (`pos_open_shifts`). Fields: `shiftName, shiftType, date, selectedDays, daySelectionMode, startTime, endTime, nextDay, recurring, allowOvertime, breaks, shiftNote`. None persisted to database.

---

## Plan

### Phase 1: Database Migration — Create `employee_shifts` Table

```sql
CREATE TABLE public.employee_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  shift_date date NOT NULL,
  clock_in timestamptz,
  clock_out timestamptz,
  break_minutes integer NOT NULL DEFAULT 0,
  total_orders integer NOT NULL DEFAULT 0,
  total_tips numeric NOT NULL DEFAULT 0,
  shift_type text NOT NULL DEFAULT 'Regular',
  start_time text,
  end_time text,
  assign_section text,
  allow_overtime boolean NOT NULL DEFAULT false,
  recurring text NOT NULL DEFAULT 'No',
  job_type text,
  pay_rate numeric NOT NULL DEFAULT 0,
  shift_notes text,
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- RLS + public access policies (matching existing pattern)
-- Index on employee_id + shift_date
```

### Phase 2: Add Missing Columns to `employees`

```sql
ALTER TABLE employees ADD COLUMN is_on_leave boolean NOT NULL DEFAULT false;
ALTER TABLE employees ADD COLUMN dashboard_access boolean NOT NULL DEFAULT false;
ALTER TABLE employees ADD COLUMN payroll_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE employees ADD COLUMN employee_code text;
```

### Phase 3: Create `open_shifts` Table

```sql
CREATE TABLE public.open_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_name text NOT NULL,
  shift_type text NOT NULL,
  shift_date date NOT NULL,
  selected_days text[] DEFAULT '{}',
  day_selection_mode text DEFAULT 'all',
  start_time text,
  end_time text,
  next_day boolean DEFAULT false,
  recurring boolean DEFAULT false,
  allow_overtime boolean DEFAULT false,
  breaks jsonb DEFAULT '[]',
  shift_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### Phase 4: Update `AddEmployeeContent.tsx`
- Save `dashboard_access`, `payroll_enabled`, `employee_code` to the employees table on create/update
- Load these fields in edit mode

### Phase 5: Update `AddOpenShiftContent.tsx` & `ShiftCalendarView.tsx`
- Replace all `localStorage.getItem("pos_open_shifts")` / `setItem` calls with database queries to `open_shifts` table
- Update create, edit, delete, and drag-drop operations

### Phase 6: No Code Changes Needed For
- `EmployeeContent.tsx` — already queries `is_on_leave` from employee data (just needs the column)
- `EmployeeExpanded.tsx` — already queries `employee_shifts` (just needs the table)
- `AddShiftContent.tsx` — already inserts to `employee_shifts` (just needs the table)
- `ShiftContent.tsx` / `use-shift-cards.ts` — already query `employee_shifts` (just needs the table)
- `use-employees.ts` hooks — already reference correct table/columns

### Files to Modify
- **Migration SQL**: Create `employee_shifts`, `open_shifts` tables + alter `employees`
- `src/components/settings/AddEmployeeContent.tsx` — persist 3 new fields
- `src/components/settings/AddOpenShiftContent.tsx` — replace localStorage with DB
- `src/components/settings/ShiftCalendarView.tsx` — replace localStorage with DB

