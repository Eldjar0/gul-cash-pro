-- ===================================
-- PRIORITÉS HAUTES - MIGRATIONS DB
-- ===================================

-- 1. Table pour les rôles utilisateurs (SÉCURITÉ)
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'cashier', 'viewer');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'cashier',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Fonction sécurisée pour vérifier les rôles (évite la récursion RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Fonction pour vérifier si admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role)
$$;

-- Policies pour user_roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 2. Table pour les paniers sauvegardés
CREATE TABLE public.saved_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cashier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cart_name TEXT NOT NULL,
  cart_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.saved_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own saved carts"
ON public.saved_carts
FOR ALL
TO authenticated
USING (cashier_id = auth.uid());

-- Index pour performance
CREATE INDEX idx_saved_carts_cashier ON public.saved_carts(cashier_id);

-- 3. Table pour les retours/remboursements
CREATE TABLE public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_number TEXT NOT NULL UNIQUE,
  original_sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  cashier_id UUID REFERENCES auth.users(id),
  customer_id UUID REFERENCES public.customers(id),
  reason TEXT NOT NULL,
  refund_type TEXT NOT NULL CHECK (refund_type IN ('full', 'partial')),
  subtotal NUMERIC NOT NULL,
  total_vat NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.refund_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_id UUID NOT NULL REFERENCES public.refunds(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  product_barcode TEXT,
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  vat_rate NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  vat_amount NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage refunds"
ON public.refunds FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage refund items"
ON public.refund_items FOR ALL TO authenticated USING (true);

-- Fonction pour générer un numéro de remboursement
CREATE OR REPLACE FUNCTION public.generate_refund_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  refund_no TEXT;
  year_text TEXT;
BEGIN
  year_text := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(refund_number FROM 'REM-[0-9]{4}-([0-9]+)$') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.refunds
  WHERE refund_number LIKE 'REM-' || year_text || '-%'
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  refund_no := 'REM-' || year_text || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN refund_no;
END;
$$;

-- 4. Amélioration table settings pour les nouvelles config
-- (La table existe déjà, pas de changement de structure)

-- 5. Trigger pour updated_at sur user_roles
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Trigger pour updated_at sur saved_carts
CREATE TRIGGER update_saved_carts_updated_at
BEFORE UPDATE ON public.saved_carts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Ajouter des colonnes de paiement mixte à sales
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS payment_methods JSONB;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS payment_split JSONB;

-- 8. Index pour performance
CREATE INDEX idx_refunds_original_sale ON public.refunds(original_sale_id);
CREATE INDEX idx_refunds_created_at ON public.refunds(created_at);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);