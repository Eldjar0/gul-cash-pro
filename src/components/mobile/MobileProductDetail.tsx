import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from './MobileLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit, Scan, Plus, Trash2, Star, Package, TrendingUp, AlertTriangle, History, BarChart3, Tag } from 'lucide-react';
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
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 pb-20">
          
          {/* Image et prix principal */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
            <div className="relative p-4 sm:p-6">
              <div className="flex gap-4">
                {product.image ? (
                  <div className="shrink-0">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover border-2 border-primary/20"
                    />
                  </div>
                ) : (
                  <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-muted flex items-center justify-center">
                    <Package className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/30" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold mb-2 line-clamp-2">{product.name}</h2>
                  {category && (
                    <Badge variant="secondary" className="mb-3">
                      <Tag className="h-3 w-3 mr-1" />
                      {category.name}
                    </Badge>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-bold text-primary">
                      {product.price.toFixed(2)}€
                    </span>
                    {product.cost_price && (
                      <span className="text-sm text-muted-foreground">
                        Coût: {product.cost_price.toFixed(2)}€
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-2 gap-3">
            {/* Stock */}
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  isOutOfStock ? 'bg-destructive/10' : isLowStock ? 'bg-orange-500/10' : 'bg-primary/10'
                }`}>
                  <Package className={`h-5 w-5 ${
                    isOutOfStock ? 'text-destructive' : isLowStock ? 'text-orange-500' : 'text-primary'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Stock</p>
                  <p className={`text-lg font-bold ${
                    isOutOfStock ? 'text-destructive' : isLowStock ? 'text-orange-500' : ''
                  }`}>
                    {product.stock || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">{product.unit || 'unités'}</p>
                </div>
              </div>
              {isOutOfStock && (
                <Badge variant="destructive" className="w-full mt-2 justify-center">
                  RUPTURE
                </Badge>
              )}
              {isLowStock && (
                <Badge variant="outline" className="w-full mt-2 justify-center border-orange-500 text-orange-500">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  FAIBLE
                </Badge>
              )}
            </Card>

            {/* Marge */}
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Marge</p>
                  {product.cost_price ? (
                    <>
                      <p className="text-lg font-bold text-green-600">
                        {(((product.price - product.cost_price) / product.price) * 100).toFixed(0)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        +{(product.price - product.cost_price).toFixed(2)}€
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Non défini</p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Informations détaillées */}
          <Card className="p-4">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Détails
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Type</span>
                <Badge variant="outline">
                  {product.type === 'weight' ? 'Au poids' : 'À l\'unité'}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">TVA</span>
                <span className="font-semibold">{product.vat_rate}%</span>
              </div>
              {product.min_stock !== undefined && (
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Stock minimum</span>
                  <span className="font-semibold">{product.min_stock}</span>
                </div>
              )}
              {product.supplier && (
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Fournisseur</span>
                  <span className="font-semibold truncate max-w-[180px]">{product.supplier}</span>
                </div>
              )}
              {product.barcode && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">Code-barres principal</span>
                  <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                    {product.barcode}
                  </code>
                </div>
              )}
            </div>

            {product.description && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{product.description}</p>
              </div>
            )}
          </Card>

          {/* Section codes-barres */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold flex items-center gap-2">
                <Scan className="h-4 w-4" />
                Codes-barres ({barcodes.length})
              </h3>
              <Button 
                size="sm"
                onClick={() => setScannerOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter
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
                    className="flex items-center justify-between p-3 bg-accent/50 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <code className="font-mono text-sm font-semibold truncate">{barcode.barcode}</code>
                      {barcode.is_primary && (
                        <Badge variant="default" className="text-xs gap-1 shrink-0">
                          <Star className="h-3 w-3" />
                          Principal
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {!barcode.is_primary && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
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
                          className="h-8 w-8"
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
            <Button 
              variant="outline" 
              size="lg"
              className="gap-2 h-14"
              onClick={() => toast.info('Fonctionnalité à venir')}
            >
              <Package className="h-5 w-5" />
              <div className="text-left">
                <div className="text-sm font-semibold">Ajuster</div>
                <div className="text-xs text-muted-foreground">Stock</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="gap-2 h-14"
              onClick={() => toast.info('Fonctionnalité à venir')}
            >
              <History className="h-5 w-5" />
              <div className="text-left">
                <div className="text-sm font-semibold">Voir</div>
                <div className="text-xs text-muted-foreground">Historique</div>
              </div>
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
