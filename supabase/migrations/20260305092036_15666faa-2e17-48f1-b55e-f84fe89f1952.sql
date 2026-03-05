
-- Create stores table
CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "stores publicly readable" ON public.stores FOR SELECT USING (true);
CREATE POLICY "stores publicly writable" ON public.stores FOR INSERT WITH CHECK (true);
CREATE POLICY "stores publicly updatable" ON public.stores FOR UPDATE USING (true);
CREATE POLICY "stores publicly deletable" ON public.stores FOR DELETE USING (true);

-- Create device_stores table to track which store a device is bound to
CREATE TABLE public.device_stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL UNIQUE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.device_stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "device_stores publicly readable" ON public.device_stores FOR SELECT USING (true);
CREATE POLICY "device_stores publicly writable" ON public.device_stores FOR INSERT WITH CHECK (true);
CREATE POLICY "device_stores publicly updatable" ON public.device_stores FOR UPDATE USING (true);
CREATE POLICY "device_stores publicly deletable" ON public.device_stores FOR DELETE USING (true);

-- Seed some sample stores
INSERT INTO public.stores (name, location, address, phone, email) VALUES
  ('Bollywood Bites', 'Burbank', '42 Kings Road, Chelsea, London SW3 4ND, UK', '+44 20 7946 0958', 'info@bollywoodbites.co.uk'),
  ('Bollywood Bites', 'Hollywood', '8500 Beverly Blvd, Los Angeles, CA 90048', '+1 323-555-0199', 'hollywood@bollywoodbites.com'),
  ('Bollywood Bites', 'Santa Monica', '1234 Ocean Avenue, Santa Monica, CA 90401', '+1 310-555-0177', 'santamonica@bollywoodbites.com');
