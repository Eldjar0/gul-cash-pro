-- Insert sample products for testing
INSERT INTO public.products (barcode, name, price, type, category_id, vat_rate, stock) VALUES
  ('5449000000996', 'Coca-Cola 1.5L', 1.99, 'unit', (SELECT id FROM public.categories WHERE name = 'Boissons'), 21, 50),
  ('5410188031409', 'Pain blanc', 1.49, 'unit', (SELECT id FROM public.categories WHERE name = 'Boulangerie'), 6, 30),
  ('5449000214911', 'Sprite 1.5L', 1.89, 'unit', (SELECT id FROM public.categories WHERE name = 'Boissons'), 21, 40),
  ('8712100641091', 'Lait demi-écrémé 1L', 1.19, 'unit', (SELECT id FROM public.categories WHERE name = 'Produits laitiers'), 6, 60),
  ('5410063015009', 'Beurre 250g', 2.49, 'unit', (SELECT id FROM public.categories WHERE name = 'Produits laitiers'), 6, 25)
ON CONFLICT (barcode) DO NOTHING;

-- Insert weight-based products
INSERT INTO public.products (name, price, type, category_id, vat_rate) VALUES
  ('Pommes (kg)', 2.99, 'weight', (SELECT id FROM public.categories WHERE name = 'Fruits'), 6),
  ('Tomates (kg)', 3.49, 'weight', (SELECT id FROM public.categories WHERE name = 'Légumes'), 6),
  ('Bananes (kg)', 1.89, 'weight', (SELECT id FROM public.categories WHERE name = 'Fruits'), 6),
  ('Carottes (kg)', 1.29, 'weight', (SELECT id FROM public.categories WHERE name = 'Légumes'), 6),
  ('Oranges (kg)', 2.49, 'weight', (SELECT id FROM public.categories WHERE name = 'Fruits'), 6)
ON CONFLICT DO NOTHING;