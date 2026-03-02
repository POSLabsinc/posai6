
-- =============================================
-- POS AI 6.0 — Menu System Database Schema
-- =============================================

-- 1. MENUS
CREATE TABLE public.menus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT true,
  archived BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Menus are publicly readable" ON public.menus FOR SELECT USING (true);
CREATE POLICY "Menus are publicly writable" ON public.menus FOR INSERT WITH CHECK (true);
CREATE POLICY "Menus are publicly updatable" ON public.menus FOR UPDATE USING (true);
CREATE POLICY "Menus are publicly deletable" ON public.menus FOR DELETE USING (true);

-- 2. CATEGORIES
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are publicly readable" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Categories are publicly writable" ON public.categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Categories are publicly updatable" ON public.categories FOR UPDATE USING (true);
CREATE POLICY "Categories are publicly deletable" ON public.categories FOR DELETE USING (true);

-- 3. MENU ↔ CATEGORIES junction
CREATE TABLE public.menu_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(menu_id, category_id)
);

ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "menu_categories publicly readable" ON public.menu_categories FOR SELECT USING (true);
CREATE POLICY "menu_categories publicly writable" ON public.menu_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "menu_categories publicly updatable" ON public.menu_categories FOR UPDATE USING (true);
CREATE POLICY "menu_categories publicly deletable" ON public.menu_categories FOR DELETE USING (true);

-- 4. PRODUCTS
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_type TEXT NOT NULL DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'open')),
  min_price NUMERIC(10,2),
  max_price NUMERIC(10,2),
  sku TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  archived BOOLEAN NOT NULL DEFAULT false,
  dine_in BOOLEAN NOT NULL DEFAULT true,
  takeaway BOOLEAN NOT NULL DEFAULT true,
  delivery BOOLEAN NOT NULL DEFAULT true,
  out_of_stock BOOLEAN NOT NULL DEFAULT false,
  inventory_tracking BOOLEAN NOT NULL DEFAULT false,
  negative_inventory BOOLEAN NOT NULL DEFAULT false,
  popular BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are publicly readable" ON public.products FOR SELECT USING (true);
CREATE POLICY "Products are publicly writable" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Products are publicly updatable" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Products are publicly deletable" ON public.products FOR DELETE USING (true);

-- 5. MODIFIER GROUPS
CREATE TABLE public.modifier_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT false,
  multi_select BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.modifier_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modifier_groups publicly readable" ON public.modifier_groups FOR SELECT USING (true);
CREATE POLICY "modifier_groups publicly writable" ON public.modifier_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "modifier_groups publicly updatable" ON public.modifier_groups FOR UPDATE USING (true);
CREATE POLICY "modifier_groups publicly deletable" ON public.modifier_groups FOR DELETE USING (true);

-- 6. MODIFIERS (individual options within a group)
CREATE TABLE public.modifiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  modifier_group_id UUID NOT NULL REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.modifiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modifiers publicly readable" ON public.modifiers FOR SELECT USING (true);
CREATE POLICY "modifiers publicly writable" ON public.modifiers FOR INSERT WITH CHECK (true);
CREATE POLICY "modifiers publicly updatable" ON public.modifiers FOR UPDATE USING (true);
CREATE POLICY "modifiers publicly deletable" ON public.modifiers FOR DELETE USING (true);

-- 7. PRODUCT ↔ MODIFIER GROUPS junction
CREATE TABLE public.product_modifier_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  modifier_group_id UUID NOT NULL REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(product_id, modifier_group_id)
);

ALTER TABLE public.product_modifier_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_modifier_groups publicly readable" ON public.product_modifier_groups FOR SELECT USING (true);
CREATE POLICY "product_modifier_groups publicly writable" ON public.product_modifier_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "product_modifier_groups publicly updatable" ON public.product_modifier_groups FOR UPDATE USING (true);
CREATE POLICY "product_modifier_groups publicly deletable" ON public.product_modifier_groups FOR DELETE USING (true);

-- 8. ADD-ONS
CREATE TABLE public.add_ons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.add_ons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "add_ons publicly readable" ON public.add_ons FOR SELECT USING (true);
CREATE POLICY "add_ons publicly writable" ON public.add_ons FOR INSERT WITH CHECK (true);
CREATE POLICY "add_ons publicly updatable" ON public.add_ons FOR UPDATE USING (true);
CREATE POLICY "add_ons publicly deletable" ON public.add_ons FOR DELETE USING (true);

-- 9. PRODUCT ↔ ADD-ONS junction
CREATE TABLE public.product_add_ons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  add_on_id UUID NOT NULL REFERENCES public.add_ons(id) ON DELETE CASCADE,
  UNIQUE(product_id, add_on_id)
);

ALTER TABLE public.product_add_ons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_add_ons publicly readable" ON public.product_add_ons FOR SELECT USING (true);
CREATE POLICY "product_add_ons publicly writable" ON public.product_add_ons FOR INSERT WITH CHECK (true);
CREATE POLICY "product_add_ons publicly updatable" ON public.product_add_ons FOR UPDATE USING (true);
CREATE POLICY "product_add_ons publicly deletable" ON public.product_add_ons FOR DELETE USING (true);

-- 10. AUTO-UPDATE TIMESTAMPS TRIGGER
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_menus_updated_at BEFORE UPDATE ON public.menus FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_modifier_groups_updated_at BEFORE UPDATE ON public.modifier_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_modifiers_updated_at BEFORE UPDATE ON public.modifiers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_add_ons_updated_at BEFORE UPDATE ON public.add_ons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. ENABLE REALTIME for instant cross-device sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.menus;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.modifier_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.modifiers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.add_ons;

-- 12. INDEXES for performance
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_active ON public.products(active, archived);
CREATE INDEX idx_menu_categories_menu_id ON public.menu_categories(menu_id);
CREATE INDEX idx_menu_categories_category_id ON public.menu_categories(category_id);
CREATE INDEX idx_modifiers_group_id ON public.modifiers(modifier_group_id);
CREATE INDEX idx_product_modifier_groups_product_id ON public.product_modifier_groups(product_id);
CREATE INDEX idx_product_add_ons_product_id ON public.product_add_ons(product_id);
