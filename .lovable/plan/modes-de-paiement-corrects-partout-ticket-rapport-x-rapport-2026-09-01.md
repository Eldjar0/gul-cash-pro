# Modes de paiement corrects partout : ticket, rapport X, rapport Z, stats

## Problème
Avec un paiement mixte, toute la vente est comptée dans une seule méthode (ex. tout en "Espèces") dans les rapports et statistiques. Une caisse ne peut pas avoir ce genre d'écart : les totaux par mode de paiement doivent refléter le détail réel (`payment_split`), sauvegardé depuis le correctif précédent.

## Solution : une fonction utilitaire unique
Créer `src/lib/paymentUtils.ts` avec une fonction `getSalePaymentAmounts(sale)` qui retourne les montants réels par méthode :
- si `payment_split` existe → répartition exacte (ex. cash 4.00€ + carte 1.98€)
- sinon → repli sur `payment_method` (anciennes ventes)
- normalisation des méthodes (meal_voucher/gift_card → voucher, etc.) pour coller aux montants BDD

Tous les rapports utilisent cette fonction au lieu de filtrer sur `payment_method`.

## Fichiers corrigés
1. **`src/lib/paymentUtils.ts`** (nouveau) — répartition + libellés FR centralisés.
2. **`src/hooks/useDailyReports.ts`** (rapport Z) — totaux Espèces/Carte/Mobile calculés via la répartition réelle, plus uniquement `payment_method`.
3. **`src/components/pos/CloseDayDialog.tsx`** — "Espèces attendues" (tiroir-caisse) basé sur le vrai montant espèces ; réimpression de ticket : libellé et bloc Reçu/Rendu corrects pour les paiements mixtes ; export CSV avec détail des méthodes.
4. **`src/hooks/useAnalytics.ts`** — graphique "ventes par mode de paiement" avec les montants réels (une vente mixte compte dans chaque méthode à hauteur de sa part).
5. **`src/pages/Stats.tsx`** — même logique pour les stats par méthode et les exports (CSV/XML).
6. Vérifier `ReportXDialog.tsx` / `ReportZContent.tsx` : ils lisent les totaux du rapport journalier — automatiquement corrigés via le point 2, sinon ajustement identique.

## Limites connues (à signaler au client)
- Les ventes enregistrées **avant** le correctif (ex. ticket 20260901-0003) n'ont pas de détail en base : elles resteront comptées selon leur méthode principale. Seules les nouvelles ventes ont la répartition exacte.
- Les rapports Z **déjà clôturés** conservent leurs chiffres figés (normal pour une piste d'audit) ; les nouveaux rapports seront corrects.

## Vérification
Compilation TypeScript + test d'une vente mixte (Espèces + CB) : ticket, aperçu, rapport X et Z doivent afficher la même répartition.
