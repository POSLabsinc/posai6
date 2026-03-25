
CREATE TABLE public.write_offs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_loss NUMERIC NOT NULL DEFAULT 0,
  reason TEXT NOT NULL DEFAULT 'Cancelled after fire',
  order_id TEXT,
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.write_offs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "write_offs publicly readable" ON public.write_offs FOR SELECT TO public USING (true);
CREATE POLICY "write_offs publicly writable" ON public.write_offs FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "write_offs publicly deletable" ON public.write_offs FOR DELETE TO public USING (true);
