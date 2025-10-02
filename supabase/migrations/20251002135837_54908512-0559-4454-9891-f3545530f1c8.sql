-- Fix ambiguous reference in generate_sale_number by renaming variable and qualifying column
CREATE OR REPLACE FUNCTION public.generate_sale_number(is_invoice_param boolean DEFAULT false)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_number INTEGER;
  sale_no TEXT;
  year_text TEXT;
BEGIN
  IF is_invoice_param THEN
    -- Invoice numbering: FAC-YEAR-0001
    year_text := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(s.sale_number FROM 'FAC-[0-9]{4}-([0-9]+)$') AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.sales AS s
    WHERE s.sale_number LIKE 'FAC-' || year_text || '-%'
      AND EXTRACT(YEAR FROM s.date) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    sale_no := 'FAC-' || year_text || '-' || LPAD(next_number::TEXT, 4, '0');
  ELSE
    -- Ticket numbering: YYYYMMDD-0001
    SELECT COALESCE(MAX(CAST(SUBSTRING(s.sale_number FROM '[0-9]{8}-([0-9]+)$') AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.sales AS s
    WHERE s.sale_number LIKE TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-%'
      AND s.date::DATE = CURRENT_DATE;
    
    sale_no := TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(next_number::TEXT, 4, '0');
  END IF;
  
  RETURN sale_no;
END;
$function$;