
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS middle_name text DEFAULT '';
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS address text DEFAULT '';
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS license_plate text DEFAULT '';
