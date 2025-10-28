-- Add original_price column to sale_items table to store the product's base price
ALTER TABLE public.sale_items
ADD COLUMN original_price numeric;

-- Set original_price to unit_price for existing records (best effort migration)
UPDATE public.sale_items
SET original_price = unit_price
WHERE original_price IS NULL;