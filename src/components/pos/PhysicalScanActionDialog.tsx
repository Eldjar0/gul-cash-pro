import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Smartphone, Eye, Plus, X } from 'lucide-react';
import { Product } from '@/hooks/useProducts';

interface PhysicalScanActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barcode: string;
  product: Product | null;
  onAddToCart: () => void;
  onAddToRemoteScan: () => void;
  onViewProduct: () => void;
  onCreateProduct: () => void;
}

export function PhysicalScanActionDialog({
  open,
  onOpenChange,
  barcode,
  product,
  onAddToCart,
  onAddToRemoteScan,
  onViewProduct,
  onCreateProduct,
}: PhysicalScanActionDialogProps) {
  const [countdown, setCountdown] = useState(3);

  // Auto-close and add to cart after 3 seconds
  useEffect(() => {
    if (!open || !product) {
      setCountdown(3);
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onAddToCart();
          onOpenChange(false);
          return 3;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      setCountdown(3);
    };
  }, [open, product, onAddToCart, onOpenChange]);

  const handleAction = (action: () => void) => {
    action();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Code-barres scanné: {barcode}
          </DialogTitle>
          <DialogDescription>
            {product 
              ? `Produit trouvé: ${product.name} - ${product.price.toFixed(2)}€`
              : "Produit non trouvé dans la base de données"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 py-4">
          {product ? (
            <>
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Ajout automatique dans <span className="text-2xl font-bold text-primary">{countdown}</span> secondes
                </p>
              </div>

              <Button
                size="lg"
                className="w-full gap-2 h-16 text-lg"
                onClick={() => handleAction(onAddToCart)}
              >
                <ShoppingCart className="h-6 w-6" />
                Ajouter au Panier POS
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2 h-14"
                onClick={() => handleAction(onAddToRemoteScan)}
              >
                <Smartphone className="h-5 w-5" />
                Envoyer au Scanner à Distance
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2 h-14"
                onClick={() => handleAction(onViewProduct)}
              >
                <Eye className="h-5 w-5" />
                Voir / Modifier le Produit
              </Button>
            </>
          ) : (
            <>
              <div className="text-center mb-4 p-4 bg-destructive/10 rounded-lg">
                <p className="text-sm text-destructive font-medium">
                  Aucun produit trouvé avec ce code-barres
                </p>
              </div>

              <Button
                size="lg"
                className="w-full gap-2 h-16 text-lg"
                onClick={() => handleAction(onCreateProduct)}
              >
                <Plus className="h-6 w-6" />
                Créer un Nouveau Produit
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="lg"
            className="w-full gap-2 h-14 mt-2"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
            Annuler
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
