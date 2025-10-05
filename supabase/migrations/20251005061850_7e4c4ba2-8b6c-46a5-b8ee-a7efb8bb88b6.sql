-- Create promotions table
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('buy_x_get_y', 'spend_amount_get_discount', 'cart_percentage', 'cart_fixed', 'product_discount')),
  conditions JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  show_on_display BOOLEAN DEFAULT true,
  customer_type TEXT DEFAULT 'all' CHECK (customer_type IN ('all', 'professional', 'individual')),
  schedule_type TEXT DEFAULT 'always' CHECK (schedule_type IN ('always', 'specific_dates', 'recurring_days', 'date_range')),
  schedule_config JSONB DEFAULT '{}',
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can read promotions"
  ON public.promotions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage promotions"
  ON public.promotions FOR ALL
  TO authenticated
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_promotions_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Delete old promotions from settings
DELETE FROM public.settings WHERE key = 'promotions';