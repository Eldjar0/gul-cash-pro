-- Supprimer l'ancienne contrainte
ALTER TABLE promotions DROP CONSTRAINT IF EXISTS promotions_type_check;

-- Ajouter la nouvelle contrainte avec bundle_price
ALTER TABLE promotions ADD CONSTRAINT promotions_type_check 
CHECK (type = ANY (ARRAY['buy_x_get_y'::text, 'spend_amount_get_discount'::text, 'cart_percentage'::text, 'cart_fixed'::text, 'product_discount'::text, 'bundle_price'::text]));