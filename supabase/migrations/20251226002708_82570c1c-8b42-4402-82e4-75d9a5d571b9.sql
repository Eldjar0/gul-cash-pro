-- Mettre à jour tous les produits cigarettes à 0% de TVA
UPDATE products 
SET vat_rate = 0, updated_at = now() 
WHERE is_active = true 
AND (
  LOWER(name) LIKE '%marlboro%' 
  OR LOWER(name) LIKE '%camel%' 
  OR LOWER(name) LIKE '%winston%' 
  OR LOWER(name) LIKE '%lucky strike%' 
  OR LOWER(name) LIKE '%chesterfield%' 
  OR LOWER(name) LIKE '%philip morris%' 
  OR LOWER(name) LIKE '%gauloises%' 
  OR LOWER(name) LIKE '%pall mall%' 
  OR LOWER(name) LIKE '%l&m%' 
  OR LOWER(name) LIKE '%kent%' 
  OR LOWER(name) LIKE '%dunhill%' 
  OR LOWER(name) LIKE '%davidoff%' 
  OR LOWER(name) LIKE '%parliament%' 
  OR LOWER(name) LIKE '%rothmans%' 
  OR LOWER(name) LIKE '%vogue%' 
  OR LOWER(name) LIKE '%jps%' 
  OR LOWER(name) LIKE '%elixyr%'
);