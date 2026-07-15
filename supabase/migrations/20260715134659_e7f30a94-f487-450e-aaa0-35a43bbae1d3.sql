
CREATE POLICY "Authenticated read menus" ON public.menus FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read categories" ON public.categories FOR SELECT TO authenticated USING (true);
