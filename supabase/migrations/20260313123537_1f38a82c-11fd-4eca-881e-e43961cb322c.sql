
-- Drop existing overly-permissive policies
DROP POLICY IF EXISTS "Allow all access to orders" ON public.orders;
DROP POLICY IF EXISTS "orders publicly readable" ON public.orders;
DROP POLICY IF EXISTS "orders publicly writable" ON public.orders;
DROP POLICY IF EXISTS "orders publicly updatable" ON public.orders;
DROP POLICY IF EXISTS "orders publicly deletable" ON public.orders;

DROP POLICY IF EXISTS "Allow all access to order_items" ON public.order_items;
DROP POLICY IF EXISTS "order_items publicly readable" ON public.order_items;
DROP POLICY IF EXISTS "order_items publicly writable" ON public.order_items;
DROP POLICY IF EXISTS "order_items publicly updatable" ON public.order_items;
DROP POLICY IF EXISTS "order_items publicly deletable" ON public.order_items;

DROP POLICY IF EXISTS "Products are publicly readable" ON public.products;
DROP POLICY IF EXISTS "Products are publicly writable" ON public.products;
DROP POLICY IF EXISTS "Products are publicly updatable" ON public.products;
DROP POLICY IF EXISTS "Products are publicly deletable" ON public.products;
DROP POLICY IF EXISTS "products publicly readable" ON public.products;
DROP POLICY IF EXISTS "products publicly writable" ON public.products;
DROP POLICY IF EXISTS "products publicly updatable" ON public.products;
DROP POLICY IF EXISTS "products publicly deletable" ON public.products;

DROP POLICY IF EXISTS "Categories are publicly readable" ON public.categories;
DROP POLICY IF EXISTS "Categories are publicly writable" ON public.categories;
DROP POLICY IF EXISTS "Categories are publicly updatable" ON public.categories;
DROP POLICY IF EXISTS "Categories are publicly deletable" ON public.categories;

DROP POLICY IF EXISTS "employees publicly readable" ON public.employees;
DROP POLICY IF EXISTS "employees publicly writable" ON public.employees;
DROP POLICY IF EXISTS "employees publicly updatable" ON public.employees;
DROP POLICY IF EXISTS "employees publicly deletable" ON public.employees;

DROP POLICY IF EXISTS "stores publicly readable" ON public.stores;
DROP POLICY IF EXISTS "stores publicly writable" ON public.stores;
DROP POLICY IF EXISTS "stores publicly updatable" ON public.stores;
DROP POLICY IF EXISTS "stores publicly deletable" ON public.stores;

DROP POLICY IF EXISTS "Allow all access to guests" ON public.guests;
DROP POLICY IF EXISTS "guests publicly readable" ON public.guests;
DROP POLICY IF EXISTS "guests publicly writable" ON public.guests;
DROP POLICY IF EXISTS "guests publicly updatable" ON public.guests;
DROP POLICY IF EXISTS "guests publicly deletable" ON public.guests;

DROP POLICY IF EXISTS "reservations publicly readable" ON public.reservations;
DROP POLICY IF EXISTS "reservations publicly writable" ON public.reservations;
DROP POLICY IF EXISTS "reservations publicly updatable" ON public.reservations;
DROP POLICY IF EXISTS "reservations publicly deletable" ON public.reservations;
DROP POLICY IF EXISTS "Allow all access to reservations" ON public.reservations;

DROP POLICY IF EXISTS "cash_drawer_sessions publicly readable" ON public.cash_drawer_sessions;
DROP POLICY IF EXISTS "cash_drawer_sessions publicly writable" ON public.cash_drawer_sessions;
DROP POLICY IF EXISTS "cash_drawer_sessions publicly updatable" ON public.cash_drawer_sessions;
DROP POLICY IF EXISTS "cash_drawer_sessions publicly deletable" ON public.cash_drawer_sessions;

DROP POLICY IF EXISTS "Menus are publicly readable" ON public.menus;
DROP POLICY IF EXISTS "Menus are publicly writable" ON public.menus;
DROP POLICY IF EXISTS "Menus are publicly updatable" ON public.menus;
DROP POLICY IF EXISTS "Menus are publicly deletable" ON public.menus;

DROP POLICY IF EXISTS "discounts publicly readable" ON public.discounts;
DROP POLICY IF EXISTS "discounts publicly writable" ON public.discounts;
DROP POLICY IF EXISTS "discounts publicly updatable" ON public.discounts;
DROP POLICY IF EXISTS "discounts publicly deletable" ON public.discounts;

DROP POLICY IF EXISTS "Allow all access to guest_feedback" ON public.guest_feedback;
DROP POLICY IF EXISTS "guest_feedback publicly readable" ON public.guest_feedback;
DROP POLICY IF EXISTS "guest_feedback publicly writable" ON public.guest_feedback;
DROP POLICY IF EXISTS "guest_feedback publicly updatable" ON public.guest_feedback;
DROP POLICY IF EXISTS "guest_feedback publicly deletable" ON public.guest_feedback;

-- Ensure RLS enabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_drawer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Super Admin read-all (using 'super_admin' enum value)
CREATE POLICY "Super Admin reads all orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super Admin reads all order_items" ON public.order_items FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super Admin reads all products" ON public.products FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super Admin reads all categories" ON public.categories FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super Admin reads all employees" ON public.employees FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super Admin reads all stores" ON public.stores FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super Admin reads all guests" ON public.guests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super Admin reads all reservations" ON public.reservations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super Admin reads all cash_drawer_sessions" ON public.cash_drawer_sessions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super Admin reads all menus" ON public.menus FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super Admin reads all discounts" ON public.discounts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super Admin reads all guest_feedback" ON public.guest_feedback FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- Anon read policies
CREATE POLICY "Anon reads orders" ON public.orders FOR SELECT TO anon USING (true);
CREATE POLICY "Anon reads order_items" ON public.order_items FOR SELECT TO anon USING (true);
CREATE POLICY "Anon reads products" ON public.products FOR SELECT TO anon USING (true);
CREATE POLICY "Anon reads categories" ON public.categories FOR SELECT TO anon USING (true);
CREATE POLICY "Anon reads employees" ON public.employees FOR SELECT TO anon USING (true);
CREATE POLICY "Anon reads stores" ON public.stores FOR SELECT TO anon USING (true);
CREATE POLICY "Anon reads guests" ON public.guests FOR SELECT TO anon USING (true);
CREATE POLICY "Anon reads reservations" ON public.reservations FOR SELECT TO anon USING (true);
CREATE POLICY "Anon reads cash_drawer_sessions" ON public.cash_drawer_sessions FOR SELECT TO anon USING (true);
CREATE POLICY "Anon reads menus" ON public.menus FOR SELECT TO anon USING (true);
CREATE POLICY "Anon reads discounts" ON public.discounts FOR SELECT TO anon USING (true);
CREATE POLICY "Anon reads guest_feedback" ON public.guest_feedback FOR SELECT TO anon USING (true);

-- Anon write policies (maintain current dev functionality)
CREATE POLICY "Anon inserts orders" ON public.orders FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon updates orders" ON public.orders FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon deletes orders" ON public.orders FOR DELETE TO anon USING (true);
CREATE POLICY "Anon inserts order_items" ON public.order_items FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon updates order_items" ON public.order_items FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon deletes order_items" ON public.order_items FOR DELETE TO anon USING (true);
CREATE POLICY "Anon inserts products" ON public.products FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon updates products" ON public.products FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon deletes products" ON public.products FOR DELETE TO anon USING (true);
CREATE POLICY "Anon inserts categories" ON public.categories FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon updates categories" ON public.categories FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon deletes categories" ON public.categories FOR DELETE TO anon USING (true);
CREATE POLICY "Anon inserts employees" ON public.employees FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon updates employees" ON public.employees FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon deletes employees" ON public.employees FOR DELETE TO anon USING (true);
CREATE POLICY "Anon inserts stores" ON public.stores FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon updates stores" ON public.stores FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon deletes stores" ON public.stores FOR DELETE TO anon USING (true);
CREATE POLICY "Anon inserts guests" ON public.guests FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon updates guests" ON public.guests FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon deletes guests" ON public.guests FOR DELETE TO anon USING (true);
CREATE POLICY "Anon inserts reservations" ON public.reservations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon updates reservations" ON public.reservations FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon deletes reservations" ON public.reservations FOR DELETE TO anon USING (true);
CREATE POLICY "Anon inserts cash_drawer_sessions" ON public.cash_drawer_sessions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon updates cash_drawer_sessions" ON public.cash_drawer_sessions FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon deletes cash_drawer_sessions" ON public.cash_drawer_sessions FOR DELETE TO anon USING (true);
CREATE POLICY "Anon inserts menus" ON public.menus FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon updates menus" ON public.menus FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon deletes menus" ON public.menus FOR DELETE TO anon USING (true);
CREATE POLICY "Anon inserts discounts" ON public.discounts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon updates discounts" ON public.discounts FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon deletes discounts" ON public.discounts FOR DELETE TO anon USING (true);
CREATE POLICY "Anon inserts guest_feedback" ON public.guest_feedback FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon updates guest_feedback" ON public.guest_feedback FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon deletes guest_feedback" ON public.guest_feedback FOR DELETE TO anon USING (true);
