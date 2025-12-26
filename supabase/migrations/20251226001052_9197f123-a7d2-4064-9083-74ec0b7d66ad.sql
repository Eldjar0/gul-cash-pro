-- Supprimer l'ancienne contrainte
ALTER TABLE mobile_orders DROP CONSTRAINT IF EXISTS mobile_orders_status_check;

-- Ajouter la nouvelle contrainte avec 'held'
ALTER TABLE mobile_orders ADD CONSTRAINT mobile_orders_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'cancelled'::text, 'held'::text]));