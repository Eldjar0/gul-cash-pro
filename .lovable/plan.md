
# Plan : Bloquer la fermeture de la facture et demander confirmation

## Probleme identifie

Le composant Dialog de Radix UI a plusieurs mecanismes de fermeture qui contournent la logique de confirmation :
1. Le bouton X natif dans `DialogContent` (meme cache, il reste fonctionnel)
2. L'overlay (`DialogOverlay`) qui ferme au clic
3. Les evenements de fermeture qui passent directement par `onOpenChange`

## Solution technique

### Etape 1 : Modifier le composant Dialog pour supporter le blocage

Ajouter une prop `preventClose` au composant `DialogContent` qui :
- Desactive le bouton X natif
- Bloque la fermeture via l'overlay

### Etape 2 : Gerer tous les vecteurs de fermeture dans InvoiceEditor

1. **Dialog `onOpenChange`** : Toujours appeler `handleCloseAttempt` au lieu de fermer directement
2. **onPointerDownOutside** : Appeler `handleCloseAttempt` au lieu de `preventDefault` seul
3. **onEscapeKeyDown** : Appeler `handleCloseAttempt`
4. **Bouton X personnalise** : Deja configure pour appeler `handleCloseAttempt`

### Etape 3 : Simplifier la logique de confirmation

Le `handleCloseAttempt` doit TOUJOURS afficher la confirmation :
- Si l'utilisateur confirme la sortie, sauvegarder automatiquement en brouillon puis fermer
- Si l'utilisateur veut rester, fermer simplement le dialog de confirmation

```text
+----------------------------------+
|  Utilisateur tente de fermer     |
|  (clic overlay / Escape / X)     |
+----------------------------------+
              |
              v
+----------------------------------+
|  handleCloseAttempt()            |
|  -> showExitConfirm = true       |
+----------------------------------+
              |
              v
+----------------------------------+
|  AlertDialog : "Etes-vous sur    |
|  de vouloir quitter ?"           |
|                                  |
|  [Rester]   [Quitter et          |
|             sauvegarder]         |
+----------------------------------+
              |
    +---------+---------+
    |                   |
    v                   v
 Rester           Sauvegarder brouillon
 (ferme dialog)   puis fermer
```

## Fichiers a modifier

| Fichier | Modification |
|---------|-------------|
| `src/components/ui/dialog.tsx` | Ajouter prop `preventClose` pour desactiver le bouton X natif et bloquer l'overlay |
| `src/components/invoices/InvoiceEditor.tsx` | Utiliser `preventClose`, simplifier `handleCloseAttempt` pour toujours afficher la confirmation |

## Details techniques

### Modification de dialog.tsx

Ajouter une interface pour les props etendues :

```tsx
interface DialogContentProps extends DialogPrimitive.DialogContentProps {
  preventClose?: boolean;
}
```

Conditionner l'affichage du bouton X :

```tsx
{!preventClose && (
  <DialogPrimitive.Close>...</DialogPrimitive.Close>
)}
```

### Modification de InvoiceEditor.tsx

1. Ajouter `preventClose` au DialogContent
2. Modifier `handleCloseAttempt` pour toujours afficher la confirmation (sans condition `hasFormData`)
3. S'assurer que le `Dialog` avec `open` controle ne puisse pas etre ferme directement

```tsx
<Dialog open={open} onOpenChange={() => {
  // Ne jamais fermer directement, toujours passer par confirmation
  handleCloseAttempt();
}}>
  <DialogContent preventClose>
    ...
  </DialogContent>
</Dialog>
```

## Comportement final

- Clic sur l'overlay (espace noir) -> Confirmation
- Touche Escape -> Confirmation  
- Bouton X -> Confirmation
- Quitter -> Sauvegarde automatique en brouillon puis fermeture
