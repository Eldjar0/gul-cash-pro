-- Create product_barcodes table for multiple barcodes per product
CREATE TABLE IF NOT EXISTS public.product_barcodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id, barcode)
);

-- Enable RLS
ALTER TABLE public.product_barcodes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can read product barcodes"
  ON public.product_barcodes
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage product barcodes"
  ON public.product_barcodes
  FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Migrate existing barcodes from products table
INSERT INTO public.product_barcodes (product_id, barcode, is_primary)
SELECT id, barcode, true
FROM public.products
WHERE barcode IS NOT NULL AND barcode != '';

-- Create function to sync primary barcode back to products table (for backward compatibility)
CREATE OR REPLACE FUNCTION sync_primary_barcode()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    -- Unset other primary barcodes for this product
    UPDATE product_barcodes 
    SET is_primary = false 
    WHERE product_id = NEW.product_id AND id != NEW.id;
    
    -- Update products table
    UPDATE products 
    SET barcode = NEW.barcode 
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER sync_primary_barcode_trigger
AFTER INSERT OR UPDATE ON public.product_barcodes
FOR EACH ROW
EXECUTE FUNCTION sync_primary_barcode();

-- Create index for faster barcode lookups
CREATE INDEX idx_product_barcodes_barcode ON public.product_barcodes(barcode);
CREATE INDEX idx_product_barcodes_product_id ON public.product_barcodes(product_id);