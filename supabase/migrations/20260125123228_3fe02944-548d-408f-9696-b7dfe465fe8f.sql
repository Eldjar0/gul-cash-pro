-- Mettre à jour les produits tabac/cigarettes et accessoires à 0% TVA (exempté)
UPDATE products 
SET vat_rate = 0, updated_at = now()
WHERE id IN (
  '43f575e3-ea6b-474c-8fc0-73718750ce32',  -- Peter Stuyvesant
  '4aeda5fa-a5c5-41a8-a363-374c6c41b2f3',  -- Smoking blue
  '69ac543c-8420-4bdf-a080-bceb5e7c1676',  -- Smoking brown
  'c74ae1f8-0a57-4894-8d40-a877fdcf65c4',  -- Smoking carton
  '948d1078-deb2-4994-9543-acf53d84025e',  -- Banko filter
  'fd4a137f-2a82-497c-b130-b470330c281f',  -- Dam feuilles
  'e2fdc7e1-f524-4e95-a98c-06e2b6599346',  -- Johnson filter
  'cc0e45ad-08b2-4fe1-b68f-cd05c7057d15',  -- Rizla + bleu
  '52e4daa7-201a-4b84-87ea-9d553d136f73',  -- Rizla + grise
  'e0df27fc-c3aa-4826-b97a-c061a4321c02',  -- Rizla + orange
  '1c3659a7-97b1-4714-9e16-46b1cdec28f5'   -- Top feuilles blanc
);