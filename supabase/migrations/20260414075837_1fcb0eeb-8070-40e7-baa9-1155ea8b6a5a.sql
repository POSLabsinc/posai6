
CREATE TABLE public.cash_drops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.cash_drawer_sessions(id) ON DELETE SET NULL,
  employee_name TEXT NOT NULL DEFAULT '',
  employee_id TEXT,
  device_id TEXT NOT NULL DEFAULT 'default',
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE SET NULL,
  shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_cash_sales NUMERIC NOT NULL DEFAULT 0,
  total_card_sales NUMERIC NOT NULL DEFAULT 0,
  total_cash_tips NUMERIC NOT NULL DEFAULT 0,
  total_card_tips NUMERIC NOT NULL DEFAULT 0,
  tips_payable NUMERIC NOT NULL DEFAULT 0,
  expected_drop_amount NUMERIC NOT NULL DEFAULT 0,
  actual_drop_amount NUMERIC NOT NULL DEFAULT 0,
  variance NUMERIC NOT NULL DEFAULT 0,
  opening_cash NUMERIC NOT NULL DEFAULT 0,
  paid_in_total NUMERIC NOT NULL DEFAULT 0,
  paid_out_total NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_drops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cash_drops publicly readable" ON public.cash_drops FOR SELECT USING (true);
CREATE POLICY "cash_drops publicly writable" ON public.cash_drops FOR INSERT WITH CHECK (true);
CREATE POLICY "cash_drops publicly updatable" ON public.cash_drops FOR UPDATE USING (true);
CREATE POLICY "cash_drops publicly deletable" ON public.cash_drops FOR DELETE USING (true);
