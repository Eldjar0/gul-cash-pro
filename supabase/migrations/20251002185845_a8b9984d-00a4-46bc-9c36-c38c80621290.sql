-- Ajouter un champ pour l'unité de vente
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'unité';

-- Commentaire pour expliquer les unités possibles
COMMENT ON COLUMN products.unit IS 'Unité de vente: unité, carton, lot, kg, g, litre, ml, m, m2, m3, etc.';
