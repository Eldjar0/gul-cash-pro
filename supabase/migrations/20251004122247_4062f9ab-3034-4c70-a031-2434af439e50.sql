-- ============================================================================
-- PHASE 3: SYSTÈME DE PERMISSIONS AVANCÉ (FONDATION SÉCURITÉ)
-- ============================================================================

-- Table des permissions granulaires
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  module TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table de mapping rôles -> permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role, permission_id)
);

-- Table des pointages/sessions utilisateurs
CREATE TABLE IF NOT EXISTS public.user_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  clock_in TIMESTAMPTZ NOT NULL DEFAULT now(),
  clock_out TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- PHASE 2: INVENTAIRE AVANCÉ - COMMANDES FOURNISSEURS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT UNIQUE NOT NULL,
  supplier_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  received_date DATE,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_barcode TEXT,
  quantity_ordered NUMERIC(10,2) NOT NULL,
  quantity_received NUMERIC(10,2) DEFAULT 0,
  unit_cost NUMERIC(10,2) NOT NULL,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  subtotal NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- PHASE 2: GESTION DES LOTS ET DATES DE PÉREMPTION
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.product_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  batch_number TEXT NOT NULL,
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit_cost NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_batches_product ON public.product_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON public.product_batches(expiry_date) WHERE expiry_date IS NOT NULL;

-- ============================================================================
-- PHASE 2: INVENTAIRE PHYSIQUE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.inventory_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count_number TEXT UNIQUE NOT NULL,
  count_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'in_progress',
  counted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  validated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  total_variance_value NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.inventory_count_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_count_id UUID REFERENCES public.inventory_counts(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  product_barcode TEXT,
  expected_quantity NUMERIC(10,2) NOT NULL,
  counted_quantity NUMERIC(10,2),
  variance NUMERIC(10,2),
  unit_cost NUMERIC(10,2),
  variance_value NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- PHASE 1: PAIEMENTS AVANCÉS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
  refund_id UUID REFERENCES public.refunds(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  check_number TEXT,
  check_date DATE,
  card_last4 TEXT,
  transaction_reference TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_number TEXT UNIQUE NOT NULL,
  card_type TEXT NOT NULL DEFAULT 'gift_card',
  initial_balance NUMERIC(10,2) NOT NULL,
  current_balance NUMERIC(10,2) NOT NULL,
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gift_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID REFERENCES public.gift_cards(id) ON DELETE CASCADE NOT NULL,
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  balance_after NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_credit_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL UNIQUE,
  credit_limit NUMERIC(10,2) DEFAULT 0,
  current_balance NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  balance_after NUMERIC(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- PHASE 6: DEVIS & COMMANDES CLIENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  subtotal NUMERIC(10,2) NOT NULL,
  total_vat NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  notes TEXT,
  converted_to_sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_barcode TEXT,
  quantity NUMERIC(10,2) NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  vat_rate NUMERIC(5,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  vat_amount NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ready_date DATE,
  completed_date DATE,
  subtotal NUMERIC(10,2) NOT NULL,
  total_vat NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  deposit_paid NUMERIC(10,2) DEFAULT 0,
  remaining_balance NUMERIC(10,2),
  notes TEXT,
  notified BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_order_id UUID REFERENCES public.customer_orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_barcode TEXT,
  quantity NUMERIC(10,2) NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  vat_rate NUMERIC(5,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  vat_amount NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- PHASE 4: PROGRAMME DE FIDÉLITÉ MULTI-NIVEAUX
-- ============================================================================

CREATE TYPE public.loyalty_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');

CREATE TABLE IF NOT EXISTS public.loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier loyalty_tier UNIQUE NOT NULL,
  name TEXT NOT NULL,
  min_spent NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_percentage NUMERIC(5,2) DEFAULT 0,
  points_multiplier NUMERIC(3,1) DEFAULT 1.0,
  color TEXT DEFAULT '#666666',
  benefits TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.loyalty_tiers (tier, name, min_spent, discount_percentage, points_multiplier, color, benefits)
VALUES 
  ('bronze', 'Bronze', 0, 0, 1.0, '#CD7F32', 'Niveau de base'),
  ('silver', 'Argent', 500, 5, 1.5, '#C0C0C0', '5% de remise + 50% de points bonus'),
  ('gold', 'Or', 2000, 10, 2.0, '#FFD700', '10% de remise + 100% de points bonus'),
  ('platinum', 'Platine', 5000, 15, 3.0, '#E5E4E2', '15% de remise + 200% de points bonus + offres VIP')
ON CONFLICT (tier) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL,
  points NUMERIC(10,2) NOT NULL,
  balance_after NUMERIC(10,2) NOT NULL,
  description TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  criteria JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_segment_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID REFERENCES public.customer_segments(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(segment_id, customer_id)
);

CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  campaign_type TEXT NOT NULL,
  segment_id UUID REFERENCES public.customer_segments(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft',
  message_template TEXT,
  discount_code TEXT,
  discount_percentage NUMERIC(5,2),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- PHASE 5: RAPPORTS PERSONNALISÉS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.custom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL,
  configuration JSONB,
  schedule TEXT,
  recipients TEXT[],
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage permissions" ON public.permissions FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "All authenticated can read permissions" ON public.permissions FOR SELECT USING (true);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage role permissions" ON public.role_permissions FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "All authenticated can read role permissions" ON public.role_permissions FOR SELECT USING (true);

ALTER TABLE public.user_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own shifts" ON public.user_shifts FOR ALL USING (user_id = auth.uid() OR is_admin(auth.uid()));

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read audit logs" ON public.audit_logs FOR SELECT USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage purchase orders" ON public.purchase_orders FOR ALL USING (true);

ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage PO items" ON public.purchase_order_items FOR ALL USING (true);

ALTER TABLE public.product_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage batches" ON public.product_batches FOR ALL USING (true);

ALTER TABLE public.inventory_counts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage inventory counts" ON public.inventory_counts FOR ALL USING (true);

ALTER TABLE public.inventory_count_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage count items" ON public.inventory_count_items FOR ALL USING (true);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage payments" ON public.payment_transactions FOR ALL USING (true);

ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage gift cards" ON public.gift_cards FOR ALL USING (true);

ALTER TABLE public.gift_card_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read gift card transactions" ON public.gift_card_transactions FOR ALL USING (true);

ALTER TABLE public.customer_credit_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage credit accounts" ON public.customer_credit_accounts FOR ALL USING (true);

ALTER TABLE public.customer_credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage credit transactions" ON public.customer_credit_transactions FOR ALL USING (true);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage quotes" ON public.quotes FOR ALL USING (true);

ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage quote items" ON public.quote_items FOR ALL USING (true);

ALTER TABLE public.customer_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage customer orders" ON public.customer_orders FOR ALL USING (true);

ALTER TABLE public.customer_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage order items" ON public.customer_order_items FOR ALL USING (true);

ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read loyalty tiers" ON public.loyalty_tiers FOR SELECT USING (true);
CREATE POLICY "Admins can manage loyalty tiers" ON public.loyalty_tiers FOR ALL USING (is_admin(auth.uid()));

ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage loyalty transactions" ON public.loyalty_transactions FOR ALL USING (true);

ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers can manage segments" ON public.customer_segments FOR ALL USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));

ALTER TABLE public.customer_segment_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers can manage segment members" ON public.customer_segment_members FOR ALL USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers can manage campaigns" ON public.marketing_campaigns FOR ALL USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));

ALTER TABLE public.custom_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage custom reports" ON public.custom_reports FOR ALL USING (true);

-- ============================================================================
-- FONCTIONS UTILITAIRES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_po_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  po_no TEXT;
  year_text TEXT;
BEGIN
  year_text := TO_CHAR(CURRENT_DATE, 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(po_number FROM 'PO-[0-9]{4}-([0-9]+)$') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.purchase_orders
  WHERE po_number LIKE 'PO-' || year_text || '-%';
  po_no := 'PO-' || year_text || '-' || LPAD(next_number::TEXT, 4, '0');
  RETURN po_no;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  quote_no TEXT;
  year_text TEXT;
BEGIN
  year_text := TO_CHAR(CURRENT_DATE, 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM 'DEV-[0-9]{4}-([0-9]+)$') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.quotes
  WHERE quote_number LIKE 'DEV-' || year_text || '-%';
  quote_no := 'DEV-' || year_text || '-' || LPAD(next_number::TEXT, 4, '0');
  RETURN quote_no;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_customer_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  order_no TEXT;
  year_text TEXT;
BEGIN
  year_text := TO_CHAR(CURRENT_DATE, 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 'CMD-[0-9]{4}-([0-9]+)$') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.customer_orders
  WHERE order_number LIKE 'CMD-' || year_text || '-%';
  order_no := 'CMD-' || year_text || '-' || LPAD(next_number::TEXT, 4, '0');
  RETURN order_no;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_inventory_count_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  count_no TEXT;
  year_text TEXT;
BEGIN
  year_text := TO_CHAR(CURRENT_DATE, 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(count_number FROM 'INV-[0-9]{4}-([0-9]+)$') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.inventory_counts
  WHERE count_number LIKE 'INV-' || year_text || '-%';
  count_no := 'INV-' || year_text || '-' || LPAD(next_number::TEXT, 4, '0');
  RETURN count_no;
END;
$$;