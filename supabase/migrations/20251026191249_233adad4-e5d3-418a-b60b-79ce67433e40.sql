-- Add source column to sales table to distinguish mobile vs POS sales
ALTER TABLE sales ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'pos';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_sales_source ON sales(source);

-- Update existing mobile_orders data if needed (optional migration)
-- This preserves historical mobile orders by converting them to sales
INSERT INTO sales (
  date, 
  total, 
  subtotal, 
  total_vat, 
  total_discount,
  payment_method, 
  cashier_id,
  notes, 
  source, 
  sale_number,
  created_at
)
SELECT 
  created_at as date,
  total_amount as total,
  total_amount as subtotal,
  0 as total_vat,
  0 as total_discount,
  'cash' as payment_method,
  created_by as cashier_id,
  COALESCE('Client: ' || customer_name || E'\nTel: ' || customer_phone || E'\n' || notes, notes) as notes,
  'mobile' as source,
  order_number as sale_number,
  created_at
FROM mobile_orders
WHERE status = 'completed'
AND NOT EXISTS (
  SELECT 1 FROM sales WHERE sale_number = mobile_orders.order_number
);