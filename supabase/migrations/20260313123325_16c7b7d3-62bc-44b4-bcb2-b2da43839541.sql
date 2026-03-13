
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS merchant_id uuid REFERENCES public.merchants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_merchant_id ON public.orders(merchant_id);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS merchant_id uuid REFERENCES public.merchants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_products_merchant_id ON public.products(merchant_id);

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS merchant_id uuid REFERENCES public.merchants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_categories_merchant_id ON public.categories(merchant_id);

ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS merchant_id uuid REFERENCES public.merchants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_employees_merchant_id ON public.employees(merchant_id);

ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS merchant_id uuid REFERENCES public.merchants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_stores_merchant_id ON public.stores(merchant_id);

ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS merchant_id uuid REFERENCES public.merchants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_guests_merchant_id ON public.guests(merchant_id);

ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS merchant_id uuid REFERENCES public.merchants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_merchant_id ON public.reservations(merchant_id);

ALTER TABLE public.cash_drawer_sessions ADD COLUMN IF NOT EXISTS merchant_id uuid REFERENCES public.merchants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_cash_drawer_merchant_id ON public.cash_drawer_sessions(merchant_id);

ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS merchant_id uuid REFERENCES public.merchants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_menus_merchant_id ON public.menus(merchant_id);

ALTER TABLE public.discounts ADD COLUMN IF NOT EXISTS merchant_id uuid REFERENCES public.merchants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_discounts_merchant_id ON public.discounts(merchant_id);

ALTER TABLE public.guest_feedback ADD COLUMN IF NOT EXISTS merchant_id uuid REFERENCES public.merchants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_guest_feedback_merchant_id ON public.guest_feedback(merchant_id);

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS merchant_id uuid REFERENCES public.merchants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_merchant_id ON public.order_items(merchant_id);
