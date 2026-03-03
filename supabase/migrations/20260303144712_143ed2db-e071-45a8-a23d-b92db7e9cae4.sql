CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'staff',
  pin text NOT NULL DEFAULT '0000',
  phone text,
  email text,
  avatar_url text,
  hourly_rate numeric NOT NULL DEFAULT 0,
  assigned_job_types text[] NOT NULL DEFAULT ARRAY['Server']::text[],
  revenue_center text NOT NULL DEFAULT 'Dine Center',
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Public access policies (matching existing pattern)
CREATE POLICY "employees publicly readable" ON public.employees FOR SELECT USING (true);
CREATE POLICY "employees publicly writable" ON public.employees FOR INSERT WITH CHECK (true);
CREATE POLICY "employees publicly updatable" ON public.employees FOR UPDATE USING (true);
CREATE POLICY "employees publicly deletable" ON public.employees FOR DELETE USING (true);

-- Updated_at trigger
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();