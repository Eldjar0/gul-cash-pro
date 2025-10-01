-- Drop the old function
DROP FUNCTION IF EXISTS public.generate_sale_number();

-- Create new function that handles both ticket and invoice numbering
CREATE OR REPLACE FUNCTION public.generate_sale_number(is_invoice_param BOOLEAN DEFAULT FALSE)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_number INTEGER;
  sale_number TEXT;
  year_text TEXT;
BEGIN
  IF is_invoice_param THEN
    -- Invoice numbering: FAC-YEAR-0001
    year_text := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(sale_number FROM 'FAC-[0-9]{4}-([0-9]+)$') AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.sales
    WHERE sale_number LIKE 'FAC-' || year_text || '-%'
      AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    sale_number := 'FAC-' || year_text || '-' || LPAD(next_number::TEXT, 4, '0');
  ELSE
    -- Ticket numbering: YYYYMMDD-0001
    SELECT COALESCE(MAX(CAST(SUBSTRING(sale_number FROM '[0-9]{8}-([0-9]+)$') AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.sales
    WHERE sale_number LIKE TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-%'
      AND date::DATE = CURRENT_DATE;
    
    sale_number := TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(next_number::TEXT, 4, '0');
  END IF;
  
  RETURN sale_number;
END;
$$;