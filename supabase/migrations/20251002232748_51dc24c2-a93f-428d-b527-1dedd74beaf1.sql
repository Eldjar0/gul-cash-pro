-- Add serial_number column to daily_reports
ALTER TABLE public.daily_reports 
ADD COLUMN serial_number TEXT UNIQUE;

-- Create function to generate sequential Z report serial numbers
CREATE OR REPLACE FUNCTION public.generate_z_serial_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_number INTEGER;
  serial_no TEXT;
BEGIN
  -- Get the highest serial number and increment
  SELECT COALESCE(MAX(CAST(SUBSTRING(serial_number FROM 'Z-([0-9]+)$') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.daily_reports
  WHERE serial_number LIKE 'Z-%';
  
  -- Format as Z-00001, Z-00002, etc.
  serial_no := 'Z-' || LPAD(next_number::TEXT, 5, '0');
  
  RETURN serial_no;
END;
$$;