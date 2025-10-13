-- Drop existing restrictive policies on products
DROP POLICY IF EXISTS "Allow authenticated read products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated write products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users read products" ON public.products;

-- Create new policies: anyone can read active products, only authenticated can write
CREATE POLICY "Anyone can read active products"
ON public.products
FOR SELECT
USING (is_active = true);

CREATE POLICY "Authenticated users can manage products"
ON public.products
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);