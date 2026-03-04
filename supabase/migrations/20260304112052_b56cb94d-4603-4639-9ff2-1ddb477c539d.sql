
-- Orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number INTEGER NOT NULL DEFAULT 1,
  order_type TEXT NOT NULL DEFAULT 'Dine In',
  payment_type TEXT NOT NULL DEFAULT 'Card',
  platform TEXT,
  employee_name TEXT,
  customer_name TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  tip_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

-- Order items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);

-- Reservations table
CREATE TABLE public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_name TEXT NOT NULL,
  title TEXT DEFAULT 'Reservation',
  reservation_date TEXT NOT NULL,
  start_time TEXT NOT NULL DEFAULT '7:00 PM',
  end_time TEXT,
  party_size INTEGER NOT NULL DEFAULT 2,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed',
  no_show BOOLEAN NOT NULL DEFAULT false,
  color_category TEXT DEFAULT 'blue',
  total_spent NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to reservations" ON public.reservations FOR ALL USING (true) WITH CHECK (true);

-- Guest feedback table
CREATE TABLE public.guest_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_name TEXT NOT NULL,
  feedback_date TEXT NOT NULL,
  sentiment TEXT NOT NULL DEFAULT 'positive',
  comment TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL DEFAULT 'google',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.guest_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to guest_feedback" ON public.guest_feedback FOR ALL USING (true) WITH CHECK (true);
