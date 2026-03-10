CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL DEFAULT '',
  sku TEXT DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  adjusted_price NUMERIC NOT NULL DEFAULT 0,
  timed_price_enabled BOOLEAN NOT NULL DEFAULT false,
  timed_price NUMERIC NOT NULL DEFAULT 0,
  timed_price_start TEXT,
  timed_price_end TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_variants publicly readable" ON public.product_variants FOR SELECT TO public USING (true);
CREATE POLICY "product_variants publicly writable" ON public.product_variants FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "product_variants publicly updatable" ON public.product_variants FOR UPDATE TO public USING (true);
CREATE POLICY "product_variants publicly deletable" ON public.product_variants FOR DELETE TO public USING (true);