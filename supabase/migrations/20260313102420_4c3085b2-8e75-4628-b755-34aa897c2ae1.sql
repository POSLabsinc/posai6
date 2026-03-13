
-- Phase 1: Create employee_shifts table
CREATE TABLE public.employee_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
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

CREATE INDEX idx_employee_shifts_employee_date ON public.employee_shifts(employee_id, shift_date);

ALTER TABLE public.employee_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employee_shifts publicly readable" ON public.employee_shifts FOR SELECT TO public USING (true);
CREATE POLICY "employee_shifts publicly writable" ON public.employee_shifts FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "employee_shifts publicly updatable" ON public.employee_shifts FOR UPDATE TO public USING (true);
CREATE POLICY "employee_shifts publicly deletable" ON public.employee_shifts FOR DELETE TO public USING (true);

CREATE TRIGGER update_employee_shifts_updated_at BEFORE UPDATE ON public.employee_shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Phase 2: Add missing columns to employees
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS is_on_leave boolean NOT NULL DEFAULT false;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS dashboard_access boolean NOT NULL DEFAULT false;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS payroll_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS employee_code text;

-- Phase 3: Create open_shifts table
CREATE TABLE public.open_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_name text NOT NULL,
  shift_type text NOT NULL DEFAULT 'Regular',
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

ALTER TABLE public.open_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open_shifts publicly readable" ON public.open_shifts FOR SELECT TO public USING (true);
CREATE POLICY "open_shifts publicly writable" ON public.open_shifts FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "open_shifts publicly updatable" ON public.open_shifts FOR UPDATE TO public USING (true);
CREATE POLICY "open_shifts publicly deletable" ON public.open_shifts FOR DELETE TO public USING (true);
