-- Table des notes de crédit
CREATE TABLE public.credit_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  credit_note_number TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  customer_id UUID REFERENCES public.customers(id),
  original_invoice_id UUID REFERENCES public.sales(id),
  reason TEXT NOT NULL,
  notes TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  total_vat NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'cancelled')),
  validated_at TIMESTAMP WITH TIME ZONE,
  cashier_id UUID REFERENCES public.profiles(id)
);

-- Table des lignes de notes de crédit
CREATE TABLE public.credit_note_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  credit_note_id UUID NOT NULL REFERENCES public.credit_notes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  product_barcode TEXT,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  vat_rate NUMERIC NOT NULL DEFAULT 21,
  subtotal NUMERIC NOT NULL,
  vat_amount NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_note_items ENABLE ROW LEVEL SECURITY;

-- Policies for credit_notes
CREATE POLICY "Authenticated users can view credit notes"
  ON public.credit_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert credit notes"
  ON public.credit_notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update credit notes"
  ON public.credit_notes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete draft credit notes"
  ON public.credit_notes FOR DELETE
  TO authenticated
  USING (status = 'draft');

-- Policies for credit_note_items
CREATE POLICY "Authenticated users can view credit note items"
  ON public.credit_note_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert credit note items"
  ON public.credit_note_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update credit note items"
  ON public.credit_note_items FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete credit note items"
  ON public.credit_note_items FOR DELETE
  TO authenticated
  USING (true);

-- Function to generate credit note number
CREATE OR REPLACE FUNCTION public.generate_credit_note_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  next_number INTEGER;
  cn_no TEXT;
  year_text TEXT;
BEGIN
  year_text := TO_CHAR(CURRENT_DATE, 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(credit_note_number FROM 'NC-[0-9]{4}-([0-9]+)$') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.credit_notes
  WHERE credit_note_number LIKE 'NC-' || year_text || '-%';
  cn_no := 'NC-' || year_text || '-' || LPAD(next_number::TEXT, 4, '0');
  RETURN cn_no;
END;
$function$;

-- Create indexes for performance
CREATE INDEX idx_credit_notes_customer_id ON public.credit_notes(customer_id);
CREATE INDEX idx_credit_notes_original_invoice_id ON public.credit_notes(original_invoice_id);
CREATE INDEX idx_credit_notes_created_at ON public.credit_notes(created_at DESC);
CREATE INDEX idx_credit_note_items_credit_note_id ON public.credit_note_items(credit_note_id);