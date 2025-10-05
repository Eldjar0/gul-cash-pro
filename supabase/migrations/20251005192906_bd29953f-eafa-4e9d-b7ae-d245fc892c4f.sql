-- Créer 9 catégories pour le point de vente
INSERT INTO categories (name, color, icon, display_order) VALUES
  ('Boissons', '#3B82F6', 'Droplets', 1),
  ('Alimentaire', '#EF4444', 'UtensilsCrossed', 2),
  ('Consommables', '#F59E0B', 'Package', 3),
  ('Hygiène', '#10B981', 'Sparkles', 4),
  ('Entretien', '#8B5CF6', 'Spray', 5),
  ('Épicerie', '#EC4899', 'ShoppingBasket', 6),
  ('Fruits & Légumes', '#22C55E', 'Apple', 7),
  ('Produits frais', '#06B6D4', 'Refrigerator', 8),
  ('Bazar', '#6B7280', 'Store', 9)
ON CONFLICT DO NOTHING;