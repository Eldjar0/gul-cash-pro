
-- Ajouter les produits manquants
INSERT INTO products (barcode, name, price, type, vat_rate, category_id, unit, stock, min_stock, is_active) VALUES
('1073', 'Ail Sec Blanche', 4.95, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
('1074', 'Asperge Blanche', 1.99, 'unit', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'botte', 0, 0, true),
('1075', 'Chou Romanesco', 1.79, 'unit', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'pièce', 0, 0, true),
('1076', 'Cimata', 2.99, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
('1077', 'Courgette Blanc', 3.79, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true);

-- Corriger le prix du Chou Chinois
UPDATE products SET price = 1.39 WHERE barcode = '1014' AND name = 'Chou Chinois';
