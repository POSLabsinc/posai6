
-- 1. payment_methods
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  method_id text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (device_id, method_id)
);
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_methods publicly readable" ON public.payment_methods FOR SELECT TO public USING (true);
CREATE POLICY "payment_methods publicly writable" ON public.payment_methods FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "payment_methods publicly updatable" ON public.payment_methods FOR UPDATE TO public USING (true);
CREATE POLICY "payment_methods publicly deletable" ON public.payment_methods FOR DELETE TO public USING (true);
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. gratuity_settings
CREATE TABLE public.gratuity_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL UNIQUE,
  enable_tip boolean NOT NULL DEFAULT true,
  show_on_receipt boolean NOT NULL DEFAULT true,
  allow_custom boolean NOT NULL DEFAULT true,
  disable_tip_on_cfd boolean NOT NULL DEFAULT false,
  preset_type text NOT NULL DEFAULT 'amount',
  tip_presets jsonb NOT NULL DEFAULT '["5","10","15","20"]'::jsonb,
  selected_tip_presets jsonb NOT NULL DEFAULT '["15","20"]'::jsonb,
  auto_close_payment_methods jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gratuity_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gratuity_settings publicly readable" ON public.gratuity_settings FOR SELECT TO public USING (true);
CREATE POLICY "gratuity_settings publicly writable" ON public.gratuity_settings FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "gratuity_settings publicly updatable" ON public.gratuity_settings FOR UPDATE TO public USING (true);
CREATE POLICY "gratuity_settings publicly deletable" ON public.gratuity_settings FOR DELETE TO public USING (true);
CREATE TRIGGER update_gratuity_settings_updated_at BEFORE UPDATE ON public.gratuity_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. discounts
CREATE TABLE public.discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'Percentage',
  archived boolean NOT NULL DEFAULT false,
  applicable_to text DEFAULT 'All Products',
  applicable_products jsonb DEFAULT '[]'::jsonb,
  requires_manager_pin boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "discounts publicly readable" ON public.discounts FOR SELECT TO public USING (true);
CREATE POLICY "discounts publicly writable" ON public.discounts FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "discounts publicly updatable" ON public.discounts FOR UPDATE TO public USING (true);
CREATE POLICY "discounts publicly deletable" ON public.discounts FOR DELETE TO public USING (true);
CREATE TRIGGER update_discounts_updated_at BEFORE UPDATE ON public.discounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. taxes
CREATE TABLE public.taxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'Exclusive',
  archived boolean NOT NULL DEFAULT false,
  applicable_to text,
  applicable_products jsonb DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.taxes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "taxes publicly readable" ON public.taxes FOR SELECT TO public USING (true);
CREATE POLICY "taxes publicly writable" ON public.taxes FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "taxes publicly updatable" ON public.taxes FOR UPDATE TO public USING (true);
CREATE POLICY "taxes publicly deletable" ON public.taxes FOR DELETE TO public USING (true);
CREATE TRIGGER update_taxes_updated_at BEFORE UPDATE ON public.taxes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. service_charges
CREATE TABLE public.service_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'Percentage',
  archived boolean NOT NULL DEFAULT false,
  tax_applicable text,
  order_type text,
  applied_as text,
  automatic_apply boolean NOT NULL DEFAULT false,
  min_seats integer NOT NULL DEFAULT 0,
  requires_manager_pin boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.service_charges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_charges publicly readable" ON public.service_charges FOR SELECT TO public USING (true);
CREATE POLICY "service_charges publicly writable" ON public.service_charges FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "service_charges publicly updatable" ON public.service_charges FOR UPDATE TO public USING (true);
CREATE POLICY "service_charges publicly deletable" ON public.service_charges FOR DELETE TO public USING (true);
CREATE TRIGGER update_service_charges_updated_at BEFORE UPDATE ON public.service_charges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. checkout_options
CREATE TABLE public.checkout_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL UNIQUE,
  enable_quick_amounts boolean NOT NULL DEFAULT true,
  split_check boolean NOT NULL DEFAULT true,
  enable_tips boolean NOT NULL DEFAULT true,
  require_order_type boolean NOT NULL DEFAULT false,
  require_guest_name boolean NOT NULL DEFAULT false,
  guest_notes_enabled boolean NOT NULL DEFAULT true,
  show_save_button boolean NOT NULL DEFAULT true,
  auto_close_ticket boolean NOT NULL DEFAULT false,
  qr_bill_payment boolean NOT NULL DEFAULT false,
  print_receipt boolean NOT NULL DEFAULT true,
  email_receipt boolean NOT NULL DEFAULT true,
  sms_receipt boolean NOT NULL DEFAULT false,
  skip_tip_screen boolean NOT NULL DEFAULT false,
  skip_signature boolean NOT NULL DEFAULT false,
  signature_threshold numeric NOT NULL DEFAULT 25,
  enable_payment_sounds boolean NOT NULL DEFAULT true,
  enable_hold_fire boolean NOT NULL DEFAULT true,
  show_order_summary boolean NOT NULL DEFAULT true,
  show_itemized_tax boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.checkout_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checkout_options publicly readable" ON public.checkout_options FOR SELECT TO public USING (true);
CREATE POLICY "checkout_options publicly writable" ON public.checkout_options FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "checkout_options publicly updatable" ON public.checkout_options FOR UPDATE TO public USING (true);
CREATE POLICY "checkout_options publicly deletable" ON public.checkout_options FOR DELETE TO public USING (true);
CREATE TRIGGER update_checkout_options_updated_at BEFORE UPDATE ON public.checkout_options FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. cash_drawer_sessions
CREATE TABLE public.cash_drawer_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  drawer_name text NOT NULL,
  starting_cash numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open',
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  closing_cash numeric,
  cash_sales numeric NOT NULL DEFAULT 0,
  cash_refunds numeric NOT NULL DEFAULT 0,
  expected_in_drawer numeric NOT NULL DEFAULT 0,
  difference numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cash_drawer_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cash_drawer_sessions publicly readable" ON public.cash_drawer_sessions FOR SELECT TO public USING (true);
CREATE POLICY "cash_drawer_sessions publicly writable" ON public.cash_drawer_sessions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "cash_drawer_sessions publicly updatable" ON public.cash_drawer_sessions FOR UPDATE TO public USING (true);
CREATE POLICY "cash_drawer_sessions publicly deletable" ON public.cash_drawer_sessions FOR DELETE TO public USING (true);
CREATE TRIGGER update_cash_drawer_sessions_updated_at BEFORE UPDATE ON public.cash_drawer_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. cash_transactions
CREATE TABLE public.cash_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.cash_drawer_sessions(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  type text NOT NULL,
  amount numeric NOT NULL,
  reason text NOT NULL,
  note text,
  employee_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cash_transactions publicly readable" ON public.cash_transactions FOR SELECT TO public USING (true);
CREATE POLICY "cash_transactions publicly writable" ON public.cash_transactions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "cash_transactions publicly updatable" ON public.cash_transactions FOR UPDATE TO public USING (true);
CREATE POLICY "cash_transactions publicly deletable" ON public.cash_transactions FOR DELETE TO public USING (true);

-- 9. vouchers
CREATE TABLE public.vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'fixed',
  value numeric NOT NULL DEFAULT 0,
  remaining_balance numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  expiry_date text,
  redemption_limit integer NOT NULL DEFAULT 1,
  times_redeemed integer NOT NULL DEFAULT 0,
  min_order_amount numeric NOT NULL DEFAULT 0,
  buyer_type text NOT NULL DEFAULT 'both',
  redemption_mode text NOT NULL DEFAULT 'both',
  service_fee_type text NOT NULL DEFAULT 'none',
  service_fee_value numeric NOT NULL DEFAULT 0,
  recipient_phone text,
  recipient_email text,
  device_id text,
  selling_price numeric NOT NULL DEFAULT 0,
  customer_name text,
  notes text,
  tags text,
  enable_qr_barcode boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vouchers publicly readable" ON public.vouchers FOR SELECT TO public USING (true);
CREATE POLICY "vouchers publicly writable" ON public.vouchers FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "vouchers publicly updatable" ON public.vouchers FOR UPDATE TO public USING (true);
CREATE POLICY "vouchers publicly deletable" ON public.vouchers FOR DELETE TO public USING (true);
CREATE TRIGGER update_vouchers_updated_at BEFORE UPDATE ON public.vouchers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
