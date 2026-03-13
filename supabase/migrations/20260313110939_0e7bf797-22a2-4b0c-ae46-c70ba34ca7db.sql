
-- ===================== 1. ADD user_id COLUMNS =====================

ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_brands_user_id ON public.brands(user_id);

ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_merchants_user_id ON public.merchants(user_id);

ALTER TABLE public.resellers
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_resellers_user_id ON public.resellers(user_id);

-- ===================== 2. HELPER FUNCTIONS =====================

CREATE OR REPLACE FUNCTION public.owns_brand(_user_id uuid, _brand_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.brands WHERE id = _brand_id AND user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_brand_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.brands WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_user_merchant_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.merchants WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_merchant_of_brand(_user_id uuid, _brand_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.merchants WHERE user_id = _user_id AND brand_id = _brand_id
  )
$$;

-- ===================== 3. ROLE-SCOPED RLS POLICIES =====================

CREATE POLICY "Brand admin reads own brand"
  ON public.brands FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Brand admin updates own brand"
  ON public.brands FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Merchant reads own record"
  ON public.merchants FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Brand admin reads own merchants"
  ON public.merchants FOR SELECT TO authenticated
  USING (brand_id = public.get_user_brand_id(auth.uid()));

CREATE POLICY "Brand admin manages own merchants"
  ON public.merchants FOR ALL TO authenticated
  USING (brand_id = public.get_user_brand_id(auth.uid()))
  WITH CHECK (brand_id = public.get_user_brand_id(auth.uid()));

CREATE POLICY "Brand admin reads own brand_verticals"
  ON public.brand_verticals FOR SELECT TO authenticated
  USING (brand_id = public.get_user_brand_id(auth.uid()));

CREATE POLICY "Merchant reads brand verticals"
  ON public.brand_verticals FOR SELECT TO authenticated
  USING (public.is_merchant_of_brand(auth.uid(), brand_id));

CREATE POLICY "Brand admin reads own brand_integrations"
  ON public.brand_integrations FOR SELECT TO authenticated
  USING (brand_id = public.get_user_brand_id(auth.uid()));

CREATE POLICY "Brand admin manages own brand_integrations"
  ON public.brand_integrations FOR ALL TO authenticated
  USING (brand_id = public.get_user_brand_id(auth.uid()))
  WITH CHECK (brand_id = public.get_user_brand_id(auth.uid()));

CREATE POLICY "Brand admin reads own resellers"
  ON public.resellers FOR SELECT TO authenticated
  USING (brand_id = public.get_user_brand_id(auth.uid()));

CREATE POLICY "Reseller reads own record"
  ON public.resellers FOR SELECT TO authenticated
  USING (user_id = auth.uid());
