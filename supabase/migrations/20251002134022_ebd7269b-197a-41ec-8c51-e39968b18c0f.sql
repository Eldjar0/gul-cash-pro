-- Insérer des catégories de test
INSERT INTO public.categories (name, icon, color, display_order) VALUES
('Fruits & Légumes', 'apple', '#22C55E', 1),
('Boulangerie', 'croissant', '#F59E0B', 2),
('Boissons', 'glass-water', '#3B82F6', 3),
('Épicerie', 'shopping-basket', '#EF4444', 4),
('Produits Frais', 'milk', '#8B5CF6', 5),
('Snacks', 'candy', '#EC4899', 6)
ON CONFLICT DO NOTHING;

-- Insérer des produits de test
INSERT INTO public.products (name, barcode, price, vat_rate, category_id, type, stock, is_active) 
SELECT 
  'Pomme',
  '3456789012345',
  2.50,
  5.5,
  c.id,
  'unit',
  100,
  true
FROM categories c WHERE c.name = 'Fruits & Légumes'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, barcode, price, vat_rate, category_id, type, stock, is_active) 
SELECT 
  'Tomate (kg)',
  '3456789012346',
  3.80,
  5.5,
  c.id,
  'weight',
  50,
  true
FROM categories c WHERE c.name = 'Fruits & Légumes'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, barcode, price, vat_rate, category_id, type, stock, is_active) 
SELECT 
  'Baguette',
  '3456789012347',
  1.20,
  5.5,
  c.id,
  'unit',
  200,
  true
FROM categories c WHERE c.name = 'Boulangerie'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, barcode, price, vat_rate, category_id, type, stock, is_active) 
SELECT 
  'Croissant',
  '3456789012348',
  1.50,
  5.5,
  c.id,
  'unit',
  150,
  true
FROM categories c WHERE c.name = 'Boulangerie'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, barcode, price, vat_rate, category_id, type, stock, is_active) 
SELECT 
  'Eau 1.5L',
  '3456789012349',
  0.80,
  5.5,
  c.id,
  'unit',
  300,
  true
FROM categories c WHERE c.name = 'Boissons'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, barcode, price, vat_rate, category_id, type, stock, is_active) 
SELECT 
  'Coca Cola 33cl',
  '3456789012350',
  1.50,
  20,
  c.id,
  'unit',
  200,
  true
FROM categories c WHERE c.name = 'Boissons'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, barcode, price, vat_rate, category_id, type, stock, is_active) 
SELECT 
  'Riz 1kg',
  '3456789012351',
  2.20,
  5.5,
  c.id,
  'unit',
  80,
  true
FROM categories c WHERE c.name = 'Épicerie'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, barcode, price, vat_rate, category_id, type, stock, is_active) 
SELECT 
  'Pâtes 500g',
  '3456789012352',
  1.80,
  5.5,
  c.id,
  'unit',
  100,
  true
FROM categories c WHERE c.name = 'Épicerie'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, barcode, price, vat_rate, category_id, type, stock, is_active) 
SELECT 
  'Lait 1L',
  '3456789012353',
  1.10,
  5.5,
  c.id,
  'unit',
  120,
  true
FROM categories c WHERE c.name = 'Produits Frais'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, barcode, price, vat_rate, category_id, type, stock, is_active) 
SELECT 
  'Yaourt Nature x4',
  '3456789012354',
  2.50,
  5.5,
  c.id,
  'unit',
  90,
  true
FROM categories c WHERE c.name = 'Produits Frais'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, barcode, price, vat_rate, category_id, type, stock, is_active) 
SELECT 
  'Chips 150g',
  '3456789012355',
  2.80,
  20,
  c.id,
  'unit',
  150,
  true
FROM categories c WHERE c.name = 'Snacks'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, barcode, price, vat_rate, category_id, type, stock, is_active) 
SELECT 
  'Chocolat Noir 100g',
  '3456789012356',
  3.50,
  20,
  c.id,
  'unit',
  80,
  true
FROM categories c WHERE c.name = 'Snacks'
ON CONFLICT DO NOTHING;