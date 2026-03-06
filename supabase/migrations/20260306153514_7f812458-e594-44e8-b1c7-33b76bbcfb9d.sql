
CREATE TABLE public.employee_stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, store_id)
);

ALTER TABLE public.employee_stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employee_stores publicly readable" ON public.employee_stores FOR SELECT USING (true);
CREATE POLICY "employee_stores publicly writable" ON public.employee_stores FOR INSERT WITH CHECK (true);
CREATE POLICY "employee_stores publicly updatable" ON public.employee_stores FOR UPDATE USING (true);
CREATE POLICY "employee_stores publicly deletable" ON public.employee_stores FOR DELETE USING (true);
