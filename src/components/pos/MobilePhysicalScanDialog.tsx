import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit, Plus, X, TrendingUp } from 'lucide-react';
import { Product } from '@/hooks/useProducts';

interface MobilePhysicalScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barcode: string;
  product: Product | null;
  onEditProduct: () => void;
  onAdjustStock: () => void;
  onCreateProduct: () => void;
}

export function MobilePhysicalScanDialog({
  open,
  onOpenChange,
  barcode,
  product,
  onEditProduct,
  onAdjustStock,
  onCreateProduct,
}: MobilePhysicalScanDialogProps) {
  const [countdown, setCountdown] = useState(3);

  // Auto-close and edit product after 3 seconds
  useEffect(() => {
    if (!open || !product) {
      setCountdown(3);
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onEditProduct();
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
  }, [open, product, onEditProduct, onOpenChange]);

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
                  Ouverture automatique dans <span className="text-2xl font-bold text-primary">{countdown}</span> secondes
                </p>
              </div>

              <Button
                size="lg"
                className="w-full gap-2 h-16 text-lg"
                onClick={() => handleAction(onEditProduct)}
              >
                <Edit className="h-6 w-6" />
                Modifier le Produit
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2 h-14"
                onClick={() => handleAction(onAdjustStock)}
              >
                <TrendingUp className="h-5 w-5" />
                Ajuster le Stock
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
