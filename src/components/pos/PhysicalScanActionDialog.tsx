import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Eye, Plus, X } from 'lucide-react';
import { Product } from '@/hooks/useProducts';
import { ProductInfoCard } from '@/components/products/ProductInfoCard';

interface PhysicalScanActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barcode: string;
  product: Product | null;
  onAddToCart: () => void;
  onViewProduct: () => void;
  onCreateProduct: () => void;
}

export function PhysicalScanActionDialog({
  open,
  onOpenChange,
  barcode,
  product,
  onAddToCart,
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
            Code-barres scanné
          </DialogTitle>
          <DialogDescription className="font-mono text-base">
            {barcode}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 py-4">
          {product ? (
            <>
              {/* Informations détaillées du produit */}
              <ProductInfoCard product={product} variant="full" showImage={true} />

              {/* Countdown */}
              <div className="text-center p-4 bg-primary/5 rounded-lg border-2 border-primary/20 animate-pulse">
                <p className="text-sm text-muted-foreground mb-1">
                  Ajout automatique dans
                </p>
                <p className="text-4xl font-bold text-primary">{countdown}</p>
                <p className="text-xs text-muted-foreground mt-1">secondes</p>
              </div>

              {/* Actions */}
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
                onClick={() => handleAction(onViewProduct)}
              >
                <Eye className="h-5 w-5" />
                Voir / Modifier le Produit
              </Button>
            </>
          ) : (
            <>
              <div className="text-center mb-4 p-6 bg-destructive/10 rounded-lg border-2 border-destructive/20">
                <p className="text-lg text-destructive font-bold mb-2">
                  ⚠️ Produit non trouvé
                </p>
                <p className="text-sm text-muted-foreground">
                  Aucun produit avec ce code-barres
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
