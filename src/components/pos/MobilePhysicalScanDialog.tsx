import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Edit, Plus, X, TrendingUp, Tag, FolderKanban, Barcode, Package } from 'lucide-react';
import { Product } from '@/hooks/useProducts';

interface MobilePhysicalScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barcode: string;
  product: Product | null;
  onEditProduct: () => void;
  onAdjustStock: () => void;
  onCreateProduct: () => void;
  onChangeCategory?: () => void;
  onCreatePromotion?: () => void;
  onChangeBarcode?: () => void;
}

export function MobilePhysicalScanDialog({
  open,
  onOpenChange,
  barcode,
  product,
  onEditProduct,
  onAdjustStock,
  onCreateProduct,
  onChangeCategory,
  onCreatePromotion,
  onChangeBarcode,
}: MobilePhysicalScanDialogProps) {

  const handleAction = (action: () => void) => {
    action();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Barcode className="h-5 w-5" />
            Code-barres: {barcode}
          </DialogTitle>
          <DialogDescription>
            {product 
              ? "Produit trouvé dans la base de données"
              : "Produit non trouvé dans la base de données"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 py-2">
          {product ? (
            <>
              {/* Informations du produit */}
              <Card className="p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-bold">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-lg font-bold px-3 py-1">
                      {product.price.toFixed(2)}€
                    </Badge>
                    <Badge variant="outline">
                      {product.type === 'weight' ? 'Au kilo' : 'À l\'unité'}
                    </Badge>
                    {product.vat_rate && (
                      <Badge variant="outline">TVA {product.vat_rate}%</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Stock actuel</p>
                      <p className="text-lg font-bold flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        {product.stock ?? 0} {product.unit || 'unité'}
                      </p>
                    </div>
                    {product.min_stock !== undefined && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Stock min</p>
                        <p className="text-lg font-semibold text-muted-foreground">
                          {product.min_stock} {product.unit || 'unité'}
                        </p>
                      </div>
                    )}
                  </div>

                  {product.barcode && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Code-barres</p>
                      <Badge variant="secondary" className="font-mono">
                        {product.barcode}
                      </Badge>
                    </div>
                  )}
                </div>
              </Card>

              {/* Actions principales */}
              <div className="space-y-2">
                <Button
                  size="lg"
                  className="w-full gap-2 h-14 text-base bg-primary"
                  onClick={() => handleAction(onEditProduct)}
                >
                  <Edit className="h-5 w-5" />
                  Modifier le Produit
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2 h-12"
                    onClick={() => handleAction(onAdjustStock)}
                  >
                    <TrendingUp className="h-4 w-4" />
                    Stock
                  </Button>

                  {onChangeCategory && (
                    <Button
                      variant="outline"
                      size="lg"
                      className="gap-2 h-12"
                      onClick={() => handleAction(onChangeCategory)}
                    >
                      <FolderKanban className="h-4 w-4" />
                      Catégorie
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {onCreatePromotion && (
                    <Button
                      variant="outline"
                      size="lg"
                      className="gap-2 h-12"
                      onClick={() => handleAction(onCreatePromotion)}
                    >
                      <Tag className="h-4 w-4" />
                      Promo
                    </Button>
                  )}

                  {onChangeBarcode && (
                    <Button
                      variant="outline"
                      size="lg"
                      className="gap-2 h-12"
                      onClick={() => handleAction(onChangeBarcode)}
                    >
                      <Barcode className="h-4 w-4" />
                      Code-barres
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-4 p-6 bg-destructive/10 rounded-lg border-2 border-destructive/20">
                <p className="text-sm text-destructive font-medium mb-2">
                  ⚠️ Aucun produit trouvé
                </p>
                <p className="text-xs text-muted-foreground">
                  Code-barres: <span className="font-mono font-bold">{barcode}</span>
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
            className="w-full gap-2 h-12 mt-2"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
