-- Fix security issue: Add search_path to the function
CREATE OR REPLACE FUNCTION log_stock_movement()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if stock changed
  IF (TG_OP = 'UPDATE' AND OLD.stock IS DISTINCT FROM NEW.stock) THEN
    INSERT INTO public.stock_movements (
      product_id,
      product_name,
      product_barcode,
      movement_type,
      quantity,
      previous_stock,
      new_stock,
      reason,
      user_id
    ) VALUES (
      NEW.id,
      NEW.name,
      NEW.barcode,
      'adjustment',
      NEW.stock - OLD.stock,
      OLD.stock,
      NEW.stock,
      'Manual stock adjustment',
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$;