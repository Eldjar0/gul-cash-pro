-- Create stock_movements table for tracking inventory changes
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_barcode TEXT,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'sale', 'refund', 'damage', 'transfer')),
  quantity NUMERIC NOT NULL,
  previous_stock NUMERIC NOT NULL,
  new_stock NUMERIC NOT NULL,
  reason TEXT,
  reference_id UUID,
  reference_type TEXT,
  user_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read stock movements"
  ON public.stock_movements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert stock movements"
  ON public.stock_movements
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX idx_stock_movements_created_at ON public.stock_movements(created_at DESC);
CREATE INDEX idx_stock_movements_type ON public.stock_movements(movement_type);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_read ON public.notifications(read);

-- Create function to automatically create stock movement records
CREATE OR REPLACE FUNCTION log_stock_movement()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER stock_movement_trigger
AFTER UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION log_stock_movement();