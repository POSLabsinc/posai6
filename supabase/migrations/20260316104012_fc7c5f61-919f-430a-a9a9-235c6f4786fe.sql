
-- 1. restaurant_tables
CREATE TABLE public.restaurant_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number text NOT NULL,
  seats integer NOT NULL DEFAULT 4,
  shape text NOT NULL DEFAULT 'circle',
  status text NOT NULL DEFAULT 'Available',
  x numeric NOT NULL DEFAULT 0,
  y numeric NOT NULL DEFAULT 0,
  guests integer NOT NULL DEFAULT 0,
  occupied_seats jsonb NOT NULL DEFAULT '[]'::jsonb,
  time text NOT NULL DEFAULT '',
  merged_with text,
  is_merge_source boolean NOT NULL DEFAULT false,
  merge_group_id text,
  floor_area text NOT NULL DEFAULT 'Main Dining Room',
  sort_order integer NOT NULL DEFAULT 0,
  merchant_id uuid REFERENCES public.merchants(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "restaurant_tables publicly readable" ON public.restaurant_tables FOR SELECT TO public USING (true);
CREATE POLICY "restaurant_tables publicly writable" ON public.restaurant_tables FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "restaurant_tables publicly updatable" ON public.restaurant_tables FOR UPDATE TO public USING (true);
CREATE POLICY "restaurant_tables publicly deletable" ON public.restaurant_tables FOR DELETE TO public USING (true);

CREATE TRIGGER update_restaurant_tables_updated_at BEFORE UPDATE ON public.restaurant_tables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_restaurant_tables_merchant ON public.restaurant_tables(merchant_id);
CREATE INDEX idx_restaurant_tables_status ON public.restaurant_tables(status);

ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_tables;

-- 2. floor_areas
CREATE TABLE public.floor_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#f59e0b',
  bg_color text NOT NULL DEFAULT 'rgba(245, 158, 11, 0.15)',
  x numeric NOT NULL DEFAULT 0,
  y numeric NOT NULL DEFAULT 0,
  anchor text NOT NULL DEFAULT 'top-left',
  sort_order integer NOT NULL DEFAULT 0,
  merchant_id uuid REFERENCES public.merchants(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.floor_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "floor_areas publicly readable" ON public.floor_areas FOR SELECT TO public USING (true);
CREATE POLICY "floor_areas publicly writable" ON public.floor_areas FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "floor_areas publicly updatable" ON public.floor_areas FOR UPDATE TO public USING (true);
CREATE POLICY "floor_areas publicly deletable" ON public.floor_areas FOR DELETE TO public USING (true);

-- 3. floor_dividers
CREATE TABLE public.floor_dividers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orientation text NOT NULL DEFAULT 'horizontal',
  position numeric NOT NULL DEFAULT 50,
  merchant_id uuid REFERENCES public.merchants(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.floor_dividers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "floor_dividers publicly readable" ON public.floor_dividers FOR SELECT TO public USING (true);
CREATE POLICY "floor_dividers publicly writable" ON public.floor_dividers FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "floor_dividers publicly updatable" ON public.floor_dividers FOR UPDATE TO public USING (true);
CREATE POLICY "floor_dividers publicly deletable" ON public.floor_dividers FOR DELETE TO public USING (true);

-- 4. Seed default 12 tables
INSERT INTO public.restaurant_tables (table_number, seats, shape, status, x, y, guests, occupied_seats, time, sort_order) VALUES
  ('T1', 8, 'circle', 'Available', 80, 60, 0, '[]', '', 1),
  ('T2', 5, 'square', 'Available', 280, 80, 0, '[]', '', 2),
  ('T3', 4, 'circle', 'Available', 480, 50, 0, '[]', '', 3),
  ('T4', 3, 'square', 'Available', 680, 90, 0, '[]', '', 4),
  ('T5', 4, 'circle', 'Available', 120, 220, 0, '[]', '', 5),
  ('T6', 2, 'square', 'Available', 320, 200, 0, '[]', '', 6),
  ('T7', 5, 'circle', 'Available', 520, 240, 0, '[]', '', 7),
  ('T8', 4, 'square', 'Available', 720, 220, 0, '[]', '', 8),
  ('T9', 3, 'circle', 'Available', 80, 380, 0, '[]', '', 9),
  ('T10', 4, 'square', 'Available', 280, 360, 0, '[]', '', 10),
  ('T11', 5, 'circle', 'Available', 480, 400, 0, '[]', '', 11),
  ('T12', 5, 'square', 'Available', 680, 380, 0, '[]', '', 12);

-- 5. Seed default floor areas
INSERT INTO public.floor_areas (name, color, bg_color, x, y, anchor, sort_order) VALUES
  ('Kitchen', '#f59e0b', 'rgba(245, 158, 11, 0.15)', 4, 4, 'top-left', 1),
  ('Bar', '#a855f7', 'rgba(168, 85, 247, 0.15)', 96, 4, 'top-right', 2),
  ('Patio', '#22c55e', 'rgba(34, 197, 94, 0.15)', 4, 96, 'bottom-left', 3),
  ('Entry', '#3b82f6', 'rgba(59, 130, 246, 0.15)', 96, 96, 'bottom-right', 4);

-- 6. Seed default dividers
INSERT INTO public.floor_dividers (orientation, position) VALUES
  ('horizontal', 45),
  ('vertical', 50);
