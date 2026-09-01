# Récapitulatif des ajouts du jour + captures d'écran

## Objectif
Produire un document récapitulatif (avec captures d'écran) de tout ce qui a été ajouté/modifié aujourd'hui, destiné au client, avec la mention explicite : **ne pas publier, partager uniquement en conversation**.

## Étapes

1. **Captures d'écran** (via Playwright sur le preview local, écran 1280px) :
   - Caisse (POS) : panier avec dernier article surligné en bleu, badge "CR" chèques-repas, produits en rupture cliquables
   - Fenêtre de pesée : clavier numérique intégré, bouton "Peser maintenant", prix modifiable avec case "enregistrer le nouveau prix"
   - Paiement : répartition chèques-repas / autre paiement, ticket avec modes de paiement détaillés (mixte)
   - Réglages > Balance : connexion Dibal, test en direct, calibration, reconnexion auto
   - Produits : TVA par défaut 6 %, gestion multi-codes-barres, option chèques-repas, modification rapide par appui long
   - Documents : factures "en attente" par défaut, 15 lignes par page, recherche client/produit à partir de 2 caractères

2. **Document récapitulatif** : un fichier Markdown (exporté dans /mnt/documents) listant chaque ajout du jour, avec la capture associée et une description simple en français, plus l'avertissement en tête : "Version de démonstration — ne pas publier, à partager uniquement en conversation."

## Contenu du récapitulatif (aujourd'hui)
- Factures nouvelles marquées "en attente" (mode de paiement inconnu)
- Liste des documents : 15 par page, plus de coupure d'affichage
- Recherche client/produit : résultats seulement après 2 caractères, liste vide à l'ouverture
- Balance Dibal : connexion série (COM), modes continu/requête, calibration, test en direct avec données brutes, reconnexion automatique, bouton "Peser maintenant", remplissage auto du poids
- Clavier numérique intégré dans la fenêtre de pesée (plus de clavier virtuel du PC)
- Prix modifiable à la pesée : prix exceptionnel ou enregistrement définitif
- Chèques-repas : détection auto des produits éligibles, option sur la fiche produit, plafond de paiement et répartition mixte, indicateur "CR" panier + ticket
- Ticket : modes de paiement détaillés (mixte cash/carte/chèques-repas…)
- Panier : nouveaux articles en haut, dernier ajouté surligné en bleu renforcé (visible sur petit écran)
- Rupture de stock : ajout au panier possible (grille + scan) avec avertissement de mise à jour du stock
- TVA par défaut 6 % à la création d'un produit
- Multi-codes-barres par produit (fiche produit + modification rapide)
- Modification rapide d'un produit par appui long dans la caisse
