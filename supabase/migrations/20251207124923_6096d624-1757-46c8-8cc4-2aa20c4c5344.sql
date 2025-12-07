-- Add policy to allow authenticated users to delete stock movements
CREATE POLICY "Allow authenticated users to delete stock movements" 
ON public.stock_movements 
FOR DELETE 
USING (true);

-- Add policy to allow authenticated users to update stock movements
CREATE POLICY "Allow authenticated users to update stock movements" 
ON public.stock_movements 
FOR UPDATE 
USING (true);