-- Table pour les réceptions fournisseur
CREATE TABLE public.supplier_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT NOT NULL UNIQUE,
  supplier_id UUID REFERENCES public.customers(id),
  supplier_name TEXT NOT NULL,
  supplier_invoice_number TEXT,
  supplier_invoice_total NUMERIC,
  calculated_total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  has_discrepancy BOOLEAN DEFAULT false,
  notes TEXT,
  received_by UUID,
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Contrainte sur le status
ALTER TABLE public.supplier_receipts ADD CONSTRAINT supplier_receipts_status_check 
CHECK (status = ANY (ARRAY['draft'::text, 'validated'::text, 'cancelled'::text]));

-- Table pour les articles de la réception
CREATE TABLE public.supplier_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES public.supplier_receipts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  product_barcode TEXT,
  quantity NUMERIC NOT NULL,
  expected_unit_cost NUMERIC,
  actual_unit_cost NUMERIC NOT NULL,
  has_price_change BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.supplier_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_receipt_items ENABLE ROW LEVEL SECURITY;

-- Policies pour supplier_receipts
CREATE POLICY "Authenticated users can manage supplier receipts"
ON public.supplier_receipts FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Policies pour supplier_receipt_items
CREATE POLICY "Authenticated users can manage supplier receipt items"
ON public.supplier_receipt_items FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger pour updated_at
CREATE TRIGGER update_supplier_receipts_updated_at
BEFORE UPDATE ON public.supplier_receipts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour générer le numéro de réception
CREATE OR REPLACE FUNCTION public.generate_supplier_receipt_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_number INTEGER;
  receipt_no TEXT;
  year_text TEXT;
BEGIN
  year_text := TO_CHAR(CURRENT_DATE, 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM 'REC-[0-9]{4}-([0-9]+)$') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.supplier_receipts
  WHERE receipt_number LIKE 'REC-' || year_text || '-%';
  receipt_no := 'REC-' || year_text || '-' || LPAD(next_number::TEXT, 4, '0');
  RETURN receipt_no;
END;
$$;