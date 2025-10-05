-- Fix search_path warning for sync_primary_barcode function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;