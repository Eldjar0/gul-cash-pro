-- Mettre à jour les produits de tabac/cigarettes à 0% TVA (exempté)
UPDATE products 
SET vat_rate = 0, updated_at = now()
WHERE id IN (
  '4c490f2f-e472-4a35-95b4-b831a96ae2c1',  -- Ajja blond red
  'd76fdb49-563f-4466-8c4a-763343a1a009',  -- Ajja blond red 175g
  '6d547560-85dd-478f-90b0-cf12105e46e9',  -- Can nelle zwaar
  '99e8570e-d353-496a-836c-b88e60b464a3',  -- Cigarillos gold original
  'c8ab7934-bb6c-4c2c-b06a-1c5d5e2fbd90'   -- Marlboro red tabac 30g
);