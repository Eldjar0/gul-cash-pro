-- Create mobile orders table
CREATE TABLE public.mobile_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT,
  customer_phone TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mobile_orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all mobile orders"
ON public.mobile_orders
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create mobile orders"
ON public.mobile_orders
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update mobile orders"
ON public.mobile_orders
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete mobile orders"
ON public.mobile_orders
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create function to generate order numbers
CREATE OR REPLACE FUNCTION public.generate_mobile_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  next_number INTEGER;
  order_no TEXT;
  year_text TEXT;
BEGIN
  year_text := TO_CHAR(CURRENT_DATE, 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 'MOB-[0-9]{4}-([0-9]+)$') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.mobile_orders
  WHERE order_number LIKE 'MOB-' || year_text || '-%';
  order_no := 'MOB-' || year_text || '-' || LPAD(next_number::TEXT, 4, '0');
  RETURN order_no;
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_mobile_orders_updated_at
BEFORE UPDATE ON public.mobile_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_mobile_orders_status ON public.mobile_orders(status);
CREATE INDEX idx_mobile_orders_created_at ON public.mobile_orders(created_at DESC);