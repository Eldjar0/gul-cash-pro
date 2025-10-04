import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Package, AlertCircle, Plus, Edit } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';

interface ProductSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProduct: (barcode?: string) => void;
  onEditProduct: (product: any) => void;
}

export function ProductSearchDialog({
  open,
  onOpenChange,
  onCreateProduct,
  onEditProduct,
}: ProductSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: products = [] } = useProducts();

  // Enable barcode scanning when dialog is open
  useBarcodeScanner({
    enabled: open,
    onScan: (barcode) => {
      setSearchTerm(barcode);
    },
    showToast: false,
  });

  const filteredProducts = products.filter((product) => {
    if (!searchTerm) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.barcode?.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower)
    );
  });

  const exactBarcodeMatch = products.find(
    (p) => p.barcode?.toLowerCase() === searchTerm.toLowerCase()
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Rechercher un produit</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 flex flex-col">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Code-barres ou nom du produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Results */}
          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {!searchTerm && (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mb-2 opacity-50" />
                  <p className="text-sm">Scannez ou saisissez un code-barres</p>
                </div>
              )}

              {searchTerm && filteredProducts.length === 0 && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mb-2 opacity-50" />
                    <p className="text-sm font-medium">Produit non trouvé</p>
                    <p className="text-xs">Code-barres: {searchTerm}</p>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => {
                      onCreateProduct(searchTerm);
                      onOpenChange(false);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Créer ce produit
                  </Button>
                </div>
              )}

              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="border rounded-lg p-3 space-y-2 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => {
                    onEditProduct(product);
                    onOpenChange(false);
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{product.name}</h3>
                      {product.barcode && (
                        <p className="text-xs text-muted-foreground font-mono">
                          {product.barcode}
                        </p>
                      )}
                    </div>
                    <Badge variant={product.stock && product.stock > 0 ? 'default' : 'destructive'}>
                      {product.stock || 0} en stock
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-bold">{product.price.toFixed(2)} €</span>
                      <span className="text-muted-foreground ml-2">TVA {product.vat_rate}%</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditProduct(product);
                        onOpenChange(false);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>

                  {product.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
