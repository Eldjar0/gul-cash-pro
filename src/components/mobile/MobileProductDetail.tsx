import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from './MobileLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit, Scan, Plus, Trash2, Star } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useProductBarcodes, useAddProductBarcode, useDeleteProductBarcode, useSetPrimaryBarcode } from '@/hooks/useProductBarcodes';
import { useCategories } from '@/hooks/useCategories';
import { MobileBarcodeScanner } from './MobileBarcodeScanner';
import { toast } from 'sonner';

export const MobileProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: products = [] } = useProducts();
  const { data: barcodes = [] } = useProductBarcodes(id);
  const { data: categories = [] } = useCategories();
  const addBarcode = useAddProductBarcode();
  const deleteBarcode = useDeleteProductBarcode();
  const setPrimary = useSetPrimaryBarcode();
  const [scannerOpen, setScannerOpen] = useState(false);

  const product = products.find(p => p.id === id);
  const category = categories.find(c => c.id === product?.category_id);

  if (!product) {
    return (
      <MobileLayout title="Produit introuvable">
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Ce produit n'existe pas</p>
          <Button onClick={() => navigate('/mobile/products')} className="mt-4">
            Retour aux produits
          </Button>
        </div>
      </MobileLayout>
    );
  }

  const isLowStock = product.stock !== undefined && 
                     product.min_stock !== undefined && 
                     product.stock > 0 &&
                     product.stock <= product.min_stock;
  const isOutOfStock = product.stock === 0;

  const handleAddBarcode = async (barcode: string) => {
    if (!product) return;
    
    if (barcodes.some(b => b.barcode === barcode)) {
      toast.error('Ce code-barres existe déjà pour ce produit');
      return;
    }
    
    await addBarcode.mutateAsync({
      productId: product.id,
      barcode,
      isPrimary: barcodes.length === 0
    });
  };

  const handleDeleteBarcode = async (barcodeId: string) => {
    const barcode = barcodes.find(b => b.id === barcodeId);
    if (barcode?.is_primary && barcodes.length > 1) {
      toast.error('Impossible de supprimer le code-barres principal. Définissez-en un autre d\'abord.');
      return;
    }
    
    await deleteBarcode.mutateAsync({ id: barcodeId, productId: product.id });
  };

  const handleSetPrimary = async (barcodeId: string) => {
    await setPrimary.mutateAsync({ id: barcodeId, productId: product.id });
  };

  return (
    <MobileLayout 
      title={product.name}
      actions={
        <Button 
          size="icon"
          onClick={() => navigate(`/mobile/product/${product.id}/edit`)}
        >
          <Edit className="h-5 w-5" />
        </Button>
      }
    >
      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="p-4 space-y-4">
          {/* Info principale */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{product.name}</h2>
                  {category && (
                    <Badge variant="secondary" className="mt-2">
                      {category.name}
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">
                    {product.price.toFixed(2)}€
                  </div>
                  {product.cost_price && (
                    <div className="text-sm text-muted-foreground">
                      Coût: {product.cost_price.toFixed(2)}€
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Stock</p>
                  <Badge 
                    variant={isOutOfStock ? 'destructive' : isLowStock ? 'outline' : 'default'}
                    className="mt-1"
                  >
                    {product.stock || 0} {product.unit || 'unités'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">TVA</p>
                  <p className="font-semibold">{product.vat_rate}%</p>
                </div>
              </div>

              {product.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm mt-1">{product.description}</p>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Section codes-barres */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">Codes-barres</h3>
              <Button 
                size="sm"
                onClick={() => setScannerOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Scanner
              </Button>
            </div>

            <div className="space-y-2">
              {barcodes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Scan className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Aucun code-barres</p>
                  <p className="text-xs">Scannez un code pour l'ajouter</p>
                </div>
              ) : (
                barcodes.map((barcode) => (
                  <div 
                    key={barcode.id} 
                    className="flex items-center justify-between p-3 bg-accent/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <code className="font-mono text-sm">{barcode.barcode}</code>
                      {barcode.is_primary && (
                        <Badge variant="default" className="text-xs gap-1">
                          <Star className="h-3 w-3" />
                          Principal
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {!barcode.is_primary && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSetPrimary(barcode.id)}
                          title="Définir comme principal"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      {barcodes.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteBarcode(barcode.id)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Actions rapides */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="lg">
              Ajuster Stock
            </Button>
            <Button variant="outline" size="lg">
              Historique
            </Button>
          </div>
        </div>
      </ScrollArea>

      {/* Scanner pour ajouter un code-barres */}
      <MobileBarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onProductFound={(foundProduct) => {
          toast.info('Ce produit existe déjà');
          setScannerOpen(false);
        }}
        onProductNotFound={(barcode) => {
          handleAddBarcode(barcode);
          setScannerOpen(false);
        }}
      />
    </MobileLayout>
  );
};

export default MobileProductDetail;
