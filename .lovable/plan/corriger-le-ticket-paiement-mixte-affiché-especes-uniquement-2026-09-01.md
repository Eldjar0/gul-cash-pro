# Corriger le ticket : paiement mixte affiché "ESPECES" uniquement

## Diagnostic (confirmé dans le code)
- `src/pages/Index.tsx` (ligne ~1400) enregistre la vente avec `payment_method: 'cash'` **en dur**, quel que soit le paiement réel.
- `src/hooks/useSales.ts` (insert lignes 110-125) **ne sauvegarde pas `payment_split`** en base : la colonne n'est pas envoyée dans l'insert.
- Résultat : à la réimpression / aperçu du ticket depuis l'historique, le ticket retombe sur `payment_method = 'cash'` et affiche "ESPECES 5.98€" au lieu du détail Espèces 4.00€ + CB 1.98€.

## Correctifs

1. **Migration** : ajouter la colonne `payment_split jsonb` (nullable) à la table `sales`.
2. **`src/hooks/useSales.ts`** : inclure `payment_split` (et `payment_methods` si colonne existante) dans l'insert de la vente.
3. **`src/pages/Index.tsx`** : ne plus forcer `payment_method: 'cash'` — utiliser la méthode unique s'il n'y a qu'un paiement, sinon garder la méthode principale (plus gros montant) tout en s'appuyant sur `payment_split` pour l'affichage.
4. **`src/components/pos/ThermalReceipt.tsx` + `Receipt.tsx`** :
   - Si `payment_split` existe avec une seule clé, utiliser cette clé pour le libellé (au lieu de `paymentMethod`) — couvre les réimpressions.
   - Pour un paiement mixte contenant des espèces, afficher aussi les lignes "Reçu" / "Rendu".
5. **Vérification** : compiler, puis simuler un ticket mixte (Espèces + CB) et contrôler que l'aperçu/réimpression affiche "PAIEMENT MIXTE" avec les deux lignes.

## Note
Le ticket immédiat après paiement passait déjà par le bon chemin ; ce correctif répare surtout la **réimpression / l'aperçu depuis l'historique** et fiabilise tous les cas.
