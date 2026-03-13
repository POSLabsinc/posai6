
-- Drop enums that may have been partially created
DROP TYPE IF EXISTS public.vertical_status CASCADE;
DROP TYPE IF EXISTS public.integration_tier CASCADE;
DROP TYPE IF EXISTS public.plan_tier CASCADE;
DROP TYPE IF EXISTS public.merchant_status CASCADE;
DROP TYPE IF EXISTS public.brand_status CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- ===================== ENUMS =====================

CREATE TYPE public.app_role AS ENUM (
  'super_admin', 'customer_success', 'support', 'finance', 'brand_manager', 'viewer'
);

CREATE TYPE public.brand_status AS ENUM (
  'draft', 'active', 'suspended', 'archived'
);

CREATE TYPE public.merchant_status AS ENUM (
  'active', 'inactive', 'suspended', 'churned'
);

CREATE TYPE public.plan_tier AS ENUM (
  'starter', 'pro', 'enterprise'
);

CREATE TYPE public.integration_tier AS ENUM (
  'core', 'standard', 'premium'
);

CREATE TYPE public.vertical_status AS ENUM (
  'active', 'inactive'
);

-- ===================== 1. USER ROLES (must be before has_role function) =====================

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ===================== SECURITY FUNCTION =====================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS for user_roles (now that has_role exists)
CREATE POLICY "Super admins can manage all roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ===================== 2. VERTICALS =====================

CREATE TABLE public.verticals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  status vertical_status NOT NULL DEFAULT 'active',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.verticals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read verticals"
  ON public.verticals FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage verticals"
  ON public.verticals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_verticals_updated_at
  BEFORE UPDATE ON public.verticals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================== 3. SUB-VERTICALS =====================

CREATE TABLE public.sub_verticals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical_id uuid NOT NULL REFERENCES public.verticals(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  icon text,
  tier integration_tier NOT NULL DEFAULT 'core',
  status vertical_status NOT NULL DEFAULT 'active',
  features jsonb DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vertical_id, slug)
);

ALTER TABLE public.sub_verticals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read sub_verticals"
  ON public.sub_verticals FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage sub_verticals"
  ON public.sub_verticals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX idx_sub_verticals_vertical_id ON public.sub_verticals(vertical_id);

CREATE TRIGGER update_sub_verticals_updated_at
  BEFORE UPDATE ON public.sub_verticals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================== 4. PLANS =====================

CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  tier plan_tier NOT NULL,
  description text,
  base_price numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  billing_cycle text NOT NULL DEFAULT 'monthly',
  max_locations integer,
  max_users integer,
  max_products integer,
  feature_flags jsonb DEFAULT '{}'::jsonb,
  allowed_verticals uuid[] DEFAULT '{}',
  allowed_integration_tiers integration_tier[] DEFAULT '{core}',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read plans"
  ON public.plans FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage plans"
  ON public.plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================== 5. PLATFORM ADD-ONS =====================

CREATE TABLE public.platform_add_ons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  billing_cycle text NOT NULL DEFAULT 'monthly',
  compatible_plans plan_tier[] DEFAULT '{starter,pro,enterprise}',
  feature_flags jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_add_ons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read add_ons"
  ON public.platform_add_ons FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage add_ons"
  ON public.platform_add_ons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_platform_add_ons_updated_at
  BEFORE UPDATE ON public.platform_add_ons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================== 6. INTEGRATIONS =====================

CREATE TABLE public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  category text NOT NULL,
  tier integration_tier NOT NULL DEFAULT 'core',
  controlled_by text NOT NULL DEFAULT 'super_admin' CHECK (controlled_by IN ('super_admin', 'brand')),
  credential_owner text NOT NULL DEFAULT 'platform' CHECK (credential_owner IN ('platform', 'brand')),
  customer_visible boolean NOT NULL DEFAULT false,
  compatible_plans plan_tier[] DEFAULT '{starter,pro,enterprise}',
  config_schema jsonb DEFAULT '{}'::jsonb,
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read integrations"
  ON public.integrations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage integrations"
  ON public.integrations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================== 7. BRANDS =====================

CREATE TABLE public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  brand_type text NOT NULL DEFAULT 'white_label' CHECK (brand_type IN ('white_label', 'internal', 'strategic_reseller')),
  status brand_status NOT NULL DEFAULT 'draft',
  primary_domain text,
  subdomain text,
  logo_light text,
  logo_dark text,
  favicon text,
  theme_mode text DEFAULT 'system' CHECK (theme_mode IN ('light', 'dark', 'system')),
  accent_color text DEFAULT '#212121',
  default_plan_id uuid REFERENCES public.plans(id),
  can_sell_plans plan_tier[] DEFAULT '{starter,pro}',
  brand_markup numeric(5,2) DEFAULT 0,
  billing_owner text NOT NULL DEFAULT 'platform' CHECK (billing_owner IN ('platform', 'brand', 'reseller')),
  can_have_resellers boolean NOT NULL DEFAULT false,
  reseller_permissions jsonb DEFAULT '{}'::jsonb,
  merchant_count integer NOT NULL DEFAULT 0,
  reseller_count integer NOT NULL DEFAULT 0,
  mrr numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read brands"
  ON public.brands FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage brands"
  ON public.brands FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX idx_brands_status ON public.brands(status);

CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================== 8. BRAND–VERTICALS =====================

CREATE TABLE public.brand_verticals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  vertical_id uuid NOT NULL REFERENCES public.verticals(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, vertical_id)
);

ALTER TABLE public.brand_verticals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read brand_verticals"
  ON public.brand_verticals FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage brand_verticals"
  ON public.brand_verticals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX idx_brand_verticals_brand_id ON public.brand_verticals(brand_id);

-- ===================== 9. BRAND–INTEGRATIONS =====================

CREATE TABLE public.brand_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  integration_id uuid NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  configured boolean NOT NULL DEFAULT false,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, integration_id)
);

ALTER TABLE public.brand_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read brand_integrations"
  ON public.brand_integrations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage brand_integrations"
  ON public.brand_integrations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX idx_brand_integrations_brand_id ON public.brand_integrations(brand_id);

CREATE TRIGGER update_brand_integrations_updated_at
  BEFORE UPDATE ON public.brand_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================== 10. RESELLERS =====================

CREATE TABLE public.resellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  contact_email text,
  contact_phone text,
  status brand_status NOT NULL DEFAULT 'active',
  can_manage_merchants boolean NOT NULL DEFAULT true,
  can_assign_plans boolean NOT NULL DEFAULT true,
  can_view_revenue boolean NOT NULL DEFAULT true,
  can_configure_branding boolean NOT NULL DEFAULT false,
  can_configure_integrations boolean NOT NULL DEFAULT false,
  merchant_count integer NOT NULL DEFAULT 0,
  mrr numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, slug)
);

ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read resellers"
  ON public.resellers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage resellers"
  ON public.resellers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX idx_resellers_brand_id ON public.resellers(brand_id);
CREATE INDEX idx_resellers_status ON public.resellers(status);

CREATE TRIGGER update_resellers_updated_at
  BEFORE UPDATE ON public.resellers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================== 11. MERCHANTS =====================

CREATE TABLE public.merchants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  reseller_id uuid REFERENCES public.resellers(id) ON DELETE SET NULL,
  plan_id uuid REFERENCES public.plans(id),
  name text NOT NULL,
  slug text NOT NULL,
  contact_email text,
  contact_phone text,
  status merchant_status NOT NULL DEFAULT 'active',
  vertical_id uuid REFERENCES public.verticals(id),
  sub_vertical_id uuid REFERENCES public.sub_verticals(id),
  location_count integer NOT NULL DEFAULT 1,
  user_count integer NOT NULL DEFAULT 1,
  mrr numeric(12,2) NOT NULL DEFAULT 0,
  onboarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, slug)
);

ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read merchants"
  ON public.merchants FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage merchants"
  ON public.merchants FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX idx_merchants_brand_id ON public.merchants(brand_id);
CREATE INDEX idx_merchants_reseller_id ON public.merchants(reseller_id);
CREATE INDEX idx_merchants_status ON public.merchants(status);
CREATE INDEX idx_merchants_plan_id ON public.merchants(plan_id);

CREATE TRIGGER update_merchants_updated_at
  BEFORE UPDATE ON public.merchants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================== 12. ACTIVITY LOG =====================

CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role app_role,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  entity_name text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can read activity_log"
  ON public.activity_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated can insert activity_log"
  ON public.activity_log FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE INDEX idx_activity_log_entity ON public.activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_actor ON public.activity_log(actor_id);
CREATE INDEX idx_activity_log_created ON public.activity_log(created_at DESC);
