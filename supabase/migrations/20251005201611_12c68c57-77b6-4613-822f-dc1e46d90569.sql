-- Supprimer la contrainte de vérification du stock pour permettre les stocks négatifs
-- Cela permet de continuer les ventes même si le stock est insuffisant
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_stock_check;