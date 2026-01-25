-- Mettre à jour les derniers produits de tabac/cigarettes à 0% TVA (exempté)
UPDATE products 
SET vat_rate = 0, updated_at = now()
WHERE id IN (
  '18556b87-169c-4850-bae0-b83ee4db8994',  -- Corset lilas (cigarette)
  '1089b009-d148-401a-aa2b-8a7b4aea69d9'   -- Peter Stuyvesant red (cigarette)
);