-- Allow anonymous users to read categories and products for POS kiosk mode
CREATE POLICY "Allow anon read categories" 
ON public.categories 
FOR SELECT 
TO anon 
USING (true);

CREATE POLICY "Allow anon read products" 
ON public.products 
FOR SELECT 
TO anon 
USING (true);