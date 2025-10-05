-- Supprimer l'ancienne contrainte unique sur le code-barres
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_barcode_key;

-- Créer une nouvelle contrainte unique partielle qui ne s'applique qu'aux produits actifs
-- Cela permet de réutiliser les codes-barres des produits supprimés (inactifs)
CREATE UNIQUE INDEX products_barcode_unique_active 
ON public.products (barcode) 
WHERE is_active = true AND barcode IS NOT NULL;