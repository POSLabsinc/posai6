
-- ===================== ticket_orders table =====================
CREATE TABLE public.ticket_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL DEFAULT 'Guest',
  phone text NOT NULL DEFAULT '',
  party_size integer NOT NULL DEFAULT 1,
  time text NOT NULL DEFAULT '',
  timer text NOT NULL DEFAULT '00:00',
  server text NOT NULL DEFAULT 'Staff',
  check_number text NOT NULL DEFAULT '--',
  payment_type text NOT NULL DEFAULT '--',
  payments jsonb DEFAULT '[]'::jsonb,
  revenue_center text NOT NULL DEFAULT 'Main',
  status text NOT NULL DEFAULT 'ORDERING',
  notes text NOT NULL DEFAULT '',
  table_id text NOT NULL DEFAULT '--',
  order_type text NOT NULL DEFAULT 'Dine-In',
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  service_charge numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  tip numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  paid_amount text DEFAULT NULL,
  payment_status text DEFAULT NULL,
  transfer_info jsonb DEFAULT NULL,
  merged_from jsonb DEFAULT NULL,
  transferred_from jsonb DEFAULT NULL,
  session_id text DEFAULT NULL,
  split_configuration jsonb DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===================== ticket_order_items table =====================
CREATE TABLE public.ticket_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.ticket_orders(id) ON DELETE CASCADE,
  qty integer NOT NULL DEFAULT 1,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  seats integer[] NOT NULL DEFAULT '{}',
  modifiers text[] NOT NULL DEFAULT '{}',
  is_shared boolean NOT NULL DEFAULT false,
  is_fired boolean NOT NULL DEFAULT false,
  no_tax boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===================== Indexes =====================
CREATE INDEX idx_ticket_orders_table_id ON public.ticket_orders(table_id);
CREATE INDEX idx_ticket_orders_status ON public.ticket_orders(status);
CREATE INDEX idx_ticket_orders_session_id ON public.ticket_orders(session_id);
CREATE INDEX idx_ticket_order_items_order_id ON public.ticket_order_items(order_id);

-- ===================== updated_at trigger =====================
CREATE TRIGGER set_ticket_orders_updated_at
  BEFORE UPDATE ON public.ticket_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================== RLS =====================
ALTER TABLE public.ticket_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ticket_orders publicly readable" ON public.ticket_orders FOR SELECT TO public USING (true);
CREATE POLICY "ticket_orders publicly writable" ON public.ticket_orders FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "ticket_orders publicly updatable" ON public.ticket_orders FOR UPDATE TO public USING (true);
CREATE POLICY "ticket_orders publicly deletable" ON public.ticket_orders FOR DELETE TO public USING (true);

CREATE POLICY "ticket_order_items publicly readable" ON public.ticket_order_items FOR SELECT TO public USING (true);
CREATE POLICY "ticket_order_items publicly writable" ON public.ticket_order_items FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "ticket_order_items publicly updatable" ON public.ticket_order_items FOR UPDATE TO public USING (true);
CREATE POLICY "ticket_order_items publicly deletable" ON public.ticket_order_items FOR DELETE TO public USING (true);

-- ===================== Realtime =====================
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_order_items;
