-- Créer une séquence pour les numéros fiscaux
CREATE SEQUENCE IF NOT EXISTS fiscal_receipt_sequence START 1;

-- Table pour les numéros fiscaux uniques
CREATE TABLE IF NOT EXISTS public.fiscal_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_number TEXT NOT NULL UNIQUE,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  issue_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  fiscal_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_fiscal_receipts_sale_id ON public.fiscal_receipts(sale_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_receipts_fiscal_number ON public.fiscal_receipts(fiscal_number);
CREATE INDEX IF NOT EXISTS idx_fiscal_receipts_fiscal_year ON public.fiscal_receipts(fiscal_year);

-- Fonction pour générer les numéros fiscaux séquentiels
CREATE OR REPLACE FUNCTION public.generate_fiscal_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  year_suffix TEXT;
  sequence_num TEXT;
  fiscal_no TEXT;
BEGIN
  -- Format: YY-00000001 (ex: 25-00000001)
  year_suffix := TO_CHAR(NOW(), 'YY');
  sequence_num := LPAD(nextval('fiscal_receipt_sequence')::TEXT, 8, '0');
  fiscal_no := year_suffix || '-' || sequence_num;
  
  RETURN fiscal_no;
END;
$$;

-- Fonction RPC pour créer un reçu fiscal lors d'une vente
CREATE OR REPLACE FUNCTION public.create_fiscal_receipt(p_sale_id UUID)
RETURNS TABLE(fiscal_number TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fiscal_number TEXT;
BEGIN
  -- Générer le numéro fiscal
  v_fiscal_number := generate_fiscal_number();
  
  -- Insérer dans la table fiscal_receipts
  INSERT INTO public.fiscal_receipts (fiscal_number, sale_id, issue_date, fiscal_year)
  VALUES (v_fiscal_number, p_sale_id, NOW(), EXTRACT(YEAR FROM NOW()));
  
  -- Retourner le numéro fiscal
  RETURN QUERY SELECT v_fiscal_number;
END;
$$;

-- Activer RLS sur la table fiscal_receipts
ALTER TABLE public.fiscal_receipts ENABLE ROW LEVEL SECURITY;

-- Politique RLS: les utilisateurs authentifiés peuvent lire tous les reçus fiscaux
CREATE POLICY "Authenticated users can read fiscal receipts"
  ON public.fiscal_receipts
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Politique RLS: permettre l'insertion via la fonction RPC
CREATE POLICY "System can insert fiscal receipts"
  ON public.fiscal_receipts
  FOR INSERT
  WITH CHECK (true);

-- Commentaires pour la documentation
COMMENT ON TABLE public.fiscal_receipts IS 'Table des numéros fiscaux uniques pour la conformité légale belge';
COMMENT ON COLUMN public.fiscal_receipts.fiscal_number IS 'Numéro fiscal unique au format YY-00000001';
COMMENT ON COLUMN public.fiscal_receipts.sale_id IS 'Référence à la vente associée';
COMMENT ON COLUMN public.fiscal_receipts.fiscal_year IS 'Année fiscale du reçu';
COMMENT ON FUNCTION public.generate_fiscal_number() IS 'Génère un numéro fiscal séquentiel unique';
COMMENT ON FUNCTION public.create_fiscal_receipt(UUID) IS 'Crée un reçu fiscal pour une vente donnée';