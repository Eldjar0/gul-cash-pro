-- Clean up stock movements history
-- This will keep the table structure but remove all historical data
DELETE FROM public.stock_movements WHERE id IS NOT NULL;