import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Edit, Package, Scan } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { MobileBarcodeScanner } from './MobileBarcodeScanner';
import { MobileLayout } from './MobileLayout';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';

export const MobileProductManager = () => {
  const { goToProduct, goToProductCreate } = useMobileNavigation();
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const [searchTerm, setSearchTerm] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);

  const filteredProducts = products.filter(p => {
    const search = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(search) || 
           p.barcode?.toLowerCase().includes(search);
  });

  return (
    <MobileLayout
      title="Produits"
      actions={
        <>
          <Button 
            size="icon"
            onClick={() => setScannerOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Scan className="h-5 w-5" />
          </Button>
          <Button 
            size="icon"
            onClick={() => goToProductCreate()}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </>
      }
    >
      <div className="p-4 space-y-4">
        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Liste des produits */}
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-3">
            {filteredProducts.length === 0 ? (
              <Card className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'Aucun produit trouvé' : 'Aucun produit'}
                </p>
              </Card>
            ) : (
              filteredProducts.map((product) => {
                const category = categories.find(c => c.id === product.category_id);
                const isLowStock = product.stock !== undefined && 
                                  product.min_stock !== undefined && 
                                  product.stock > 0 &&
                                  product.stock <= product.min_stock;
                const isOutOfStock = product.stock === 0;

                return (
                  <Card 
                    key={product.id} 
                    className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => goToProduct(product.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-base">{product.name}</h3>
                        {category && (
                          <Badge variant="secondary" className="mt-1">
                            {category.name}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          goToProduct(product.id);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Prix:</span>
                        <span className="font-bold text-base">{product.price.toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Stock:</span>
                        <Badge 
                          variant={isOutOfStock ? 'destructive' : isLowStock ? 'outline' : 'default'}
                        >
                          {product.stock || 0} {product.unit || 'unités'}
                        </Badge>
                      </div>
                      {product.barcode && (
                        <div className="text-xs text-muted-foreground font-mono pt-1">
                          {product.barcode}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Scanner */}
      <MobileBarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onProductFound={(product) => {
          setScannerOpen(false);
          goToProduct(product.id);
        }}
        onProductNotFound={(barcode) => {
          setScannerOpen(false);
          goToProductCreate(barcode);
        }}
      />
    </MobileLayout>
  );
};

export default MobileProductManager;

