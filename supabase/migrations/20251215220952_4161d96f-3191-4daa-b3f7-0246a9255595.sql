
-- Ajouter les produits manquants de la liste complète
INSERT INTO products (barcode, name, price, type, vat_rate, category_id, unit, stock, min_stock, is_active) VALUES
-- AIL
('1078', 'Ail Cello 3 Têtes', 1.99, 'unit', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'paquet', 0, 0, true),
('1079', 'Ail Secs Vrac', 11.95, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
('1080', 'Ail Tressé 1KG', 14.95, 'unit', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'pièce', 0, 0, true),
('1081', 'Ail Tressé 500g', 4.95, 'unit', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'pièce', 0, 0, true),
-- ARTICHAUTS
('1082', 'Artichaut Pièce', 0.95, 'unit', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'pièce', 0, 0, true),
('1083', 'Artichauts Bouquet', 2.99, 'unit', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'pièce', 0, 0, true),
-- AUBERGINES
('1084', 'Aubergines Précoce 500g', 2.99, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
('1085', 'Aubergines Long Turc', 3.99, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
-- BETTERAVES/BETTES
('1086', 'Bette Pays', 1.99, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
('1087', 'Betteraves Fraîches Rouge', 1.99, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
('1088', 'Blette Blanche', 2.99, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
-- BROCOLIS
('1089', 'Brocolis Pièce', 2.99, 'unit', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'pièce', 0, 0, true),
-- CAROTTES
('1090', 'Carottes Extra Pays Sac', 2.99, 'unit', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'sac', 0, 0, true),
('1091', 'Carottes Extra Pesé', 2.99, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
('1092', 'Carottes Fine 3KG Sac', 2.99, 'unit', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'sac', 0, 0, true),
('1093', 'Carottes Violettes', 1.99, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
-- CÉLERI
('1094', 'Céleri Rave Pièce', 0.99, 'unit', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'pièce', 0, 0, true),
('1095', 'Céleri Bouquet', 2.99, 'unit', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'botte', 0, 0, true),
('1096', 'Céleri Vert', 1.39, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
-- CHAMPIGNONS
('1097', 'Champignons Pleurottes', 8.99, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
('1098', 'Champignons 250g', 1.49, 'unit', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'barquette', 0, 0, true),
('1099', 'Champignons 500g', 2.99, 'unit', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'barquette', 0, 0, true),
-- CHOUX
('1100', 'Choux Fleur Pays Extra', 2.99, 'unit', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'pièce', 0, 0, true),
('1101', 'Choux Turc à Farcir', 2.49, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
-- CONCOMBRES
('1102', 'Concombres Mini', 4.49, 'unit', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'pièce', 0, 0, true),
('1103', 'Concombres Pays', 1.49, 'unit', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'pièce', 0, 0, true),
('1104', 'Concombres Extra', 0.99, 'unit', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'pièce', 0, 0, true),
-- COURGETTES
('1105', 'Courgettes Pays', 1.99, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
('1106', 'Courgettes Rondes', 0.99, 'unit', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'pièce', 0, 0, true),
-- ÉCHALOTES
('1107', 'Échalotes Cuisse de Poulet', 2.99, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
('1108', 'Échalotes Filet 500g', 2.49, 'unit', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'sachet', 0, 0, true),
-- ÉPINARDS
('1109', 'Épinards Pays', 4.99, 'unit', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'botte', 0, 0, true),
('1110', 'Épinards Vrac', 2.99, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
-- FÈVES
('1111', 'Fèves', 2.99, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
-- HARICOTS
('1112', 'Haricots Coco', 6.99, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
('1113', 'Haricots Vert Pays', 3.95, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
-- NAVETS
('1114', 'Navet Blanc Marteau', 1.99, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
('1115', 'Navet Noir', 2.99, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
-- OIGNONS
('1116', 'Oignons Vrac', 1.39, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
('1117', 'Oignon Filet 1KG', 1.99, 'unit', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'filet', 0, 0, true),
('1118', 'Oignon Blanc', 2.29, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
-- POIREAUX
('1119', 'Poireaux Botte', 1.49, 'unit', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'botte', 0, 0, true),
('1120', 'Poireaux Botte Plat', 1.99, 'unit', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'botte', 0, 0, true),
('1121', 'Poireaux Vrac', 1.49, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
-- POIVRONS
('1122', 'Poivron Long Rouge 400g', 1.79, 'unit', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'paquet', 0, 0, true),
('1123', 'Poivron Long Blanc 400g', 1.79, 'unit', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'paquet', 0, 0, true),
('1124', 'Poivron Long Jaune', 1.99, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
('1125', 'Poivron Long Rouge', 1.99, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
('1126', 'Poivron Long Vert', 1.99, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
('1127', 'Poivron Turc Vrac', 1.99, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
-- TOMATES
('1128', 'Tomate', 0.99, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
('1129', 'Tomate Cœur de Bœuf', 1.99, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
('1130', 'Tomate Cherrystar Grappe', 3.99, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
('1131', 'Tomate Mini San Marzano', 3.99, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
('1132', 'Tomate Ministar', 3.99, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true),
('1133', 'Tomate San Marzano', 1.99, 'weight', 6, '00c0647b-5af3-4309-9137-ef82cdbc2a5b', 'kg', 0, 0, true);

-- Corriger les prix existants selon la liste
UPDATE products SET price = 1.79 WHERE barcode = '1035' AND name = 'Navet';
UPDATE products SET price = 1.69 WHERE barcode = '1022' AND name = 'Courgette Verte';
UPDATE products SET price = 1.49 WHERE barcode = '1017' AND name = 'Chou Rouge';
UPDATE products SET price = 0.69 WHERE barcode = '1018' AND name LIKE 'Chou Vert%';
UPDATE products SET price = 2.99 WHERE barcode = '1045' AND name = 'Poivron Jaune';
UPDATE products SET price = 2.99 WHERE barcode = '1046' AND name = 'Poivron Rouge';
UPDATE products SET price = 1.99 WHERE barcode = '1059' AND name = 'Tomate Grappe';
