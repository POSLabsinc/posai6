
CREATE TABLE public.closing_time_extensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL DEFAULT 'shared',
  extension_date date NOT NULL DEFAULT CURRENT_DATE,
  original_closing_time text NOT NULL DEFAULT '10:00 PM',
  extension_minutes integer NOT NULL DEFAULT 0,
  new_closing_time text NOT NULL DEFAULT '10:00 PM',
  extended_by text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(device_id, extension_date)
);

ALTER TABLE public.closing_time_extensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "closing_time_extensions publicly readable" ON public.closing_time_extensions FOR SELECT TO public USING (true);
CREATE POLICY "closing_time_extensions publicly writable" ON public.closing_time_extensions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "closing_time_extensions publicly updatable" ON public.closing_time_extensions FOR UPDATE TO public USING (true);
CREATE POLICY "closing_time_extensions publicly deletable" ON public.closing_time_extensions FOR DELETE TO public USING (true);
