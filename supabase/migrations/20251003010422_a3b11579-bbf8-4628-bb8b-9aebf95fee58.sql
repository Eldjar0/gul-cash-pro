-- Insérer 10 produits de test
INSERT INTO public.products (name, barcode, price, cost_price, category_id, vat_rate, stock, min_stock, is_active, type, unit, description)
VALUES
  -- Boissons
  ('Coca-Cola 1.5L', '5449000000996', 2.50, 1.20, 'e933c7ac-d6f4-4145-952e-cca8041a75de', 21.00, 50, 10, true, 'unit', 'unité', 'Boisson gazeuse'),
  ('Eau Minérale 1L', '3274080005003', 0.80, 0.40, 'e933c7ac-d6f4-4145-952e-cca8041a75de', 5.50, 100, 20, true, 'unit', 'unité', 'Eau plate'),
  
  -- Boulangerie
  ('Pain Complet', '3250391234567', 1.80, 0.90, '9a829a05-cdb5-4224-a52c-6a3b4d5e3356', 5.50, 30, 5, true, 'unit', 'unité', 'Pain frais'),
  ('Croissant', '3250391234574', 1.20, 0.60, '9a829a05-cdb5-4224-a52c-6a3b4d5e3356', 5.50, 40, 10, true, 'unit', 'unité', 'Viennoiserie'),
  
  -- Fruits
  ('Pommes Golden', '3017760001014', 2.99, 1.50, '73c13a1c-09d4-4d53-a031-d1e69163cd0c', 5.50, 0, 0, true, 'weight', 'kg', 'Pommes fraîches'),
  ('Bananes', '3017760001021', 1.99, 1.00, '73c13a1c-09d4-4d53-a031-d1e69163cd0c', 5.50, 0, 0, true, 'weight', 'kg', 'Bananes mûres'),
  
  -- Légumes
  ('Tomates', '3017760001038', 3.50, 1.80, 'ccd874c0-86a3-4e55-9458-c365e7737e8e', 5.50, 0, 0, true, 'weight', 'kg', 'Tomates fraîches'),
  ('Carottes', '3017760001045', 1.50, 0.75, 'ccd874c0-86a3-4e55-9458-c365e7737e8e', 5.50, 0, 0, true, 'weight', 'kg', 'Carottes bio'),
  
  -- Produits laitiers
  ('Lait Demi-Écrémé 1L', '3250391234581', 1.30, 0.70, 'b6d383f5-6c3e-4276-adcd-3da961294fa5', 5.50, 60, 15, true, 'unit', 'unité', 'Lait frais'),
  
  -- Épicerie
  ('Pâtes 500g', '3017620422003', 1.80, 0.90, 'd1a9da42-6200-4a73-95a8-556c316f1f21', 5.50, 80, 20, true, 'unit', 'unité', 'Pâtes alimentaires')
ON CONFLICT (barcode) DO NOTHING;