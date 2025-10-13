-- Allow public read access to categories only
DROP POLICY IF EXISTS "Allow authenticated read categories" ON public.categories;
DROP POLICY IF EXISTS "Allow authenticated write categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users read categories" ON public.categories;

CREATE POLICY "Anyone can read categories"
ON public.categories
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage categories"
ON public.categories
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);