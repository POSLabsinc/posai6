
GRANT SELECT ON public.categories       TO authenticated, anon;
GRANT SELECT ON public.menus            TO authenticated, anon;
GRANT SELECT ON public.menu_categories  TO authenticated, anon;
GRANT ALL    ON public.categories       TO service_role;
GRANT ALL    ON public.menus            TO service_role;
GRANT ALL    ON public.menu_categories  TO service_role;
