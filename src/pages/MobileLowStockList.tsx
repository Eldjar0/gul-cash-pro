import { MobileLayout } from '@/components/mobile/MobileLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/hooks/useProducts';
import { Package, TrendingUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';

export default function MobileLowStockList() {
  const { data: products, isLoading } = useProducts();
  const navigate = useNavigate();

  // Filtrer et trier: rupture ou presque rupture (stock <= min_stock ou stock <= 10)
  const criticalStockProducts = useMemo(() => {
    if (!products) return [];
    
    return products
      .filter(p => {
        const minStock = p.min_stock || 10;
        return p.stock !== undefined && p.stock <= minStock;
      })
      .sort((a, b) => {
        // Trier par stock croissant (0 → plus haut)
        const stockA = a.stock || 0;
        const stockB = b.stock || 0;
        return stockA - stockB;
      });
  }, [products]);

  if (isLoading) {
    return (
      <MobileLayout title="Stock Critique">
        <div className="p-3 sm:p-4 space-y-2">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout 
      title="Stock Critique"
      actions={
        <Badge variant="destructive" className="text-xs">
          {criticalStockProducts.length}
        </Badge>
      }
    >
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="p-3 sm:p-4 space-y-2 pb-20">
          {criticalStockProducts.length === 0 ? (
            <Card className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Aucun produit en rupture ou stock critique
              </p>
            </Card>
          ) : (
            <>
              <div className="mb-4 p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground text-center">
                  Produits triés du stock le plus bas au plus élevé
                </p>
              </div>

              {criticalStockProducts.map((product) => {
                const stock = product.stock || 0;
                const minStock = product.min_stock || 10;
                const isOutOfStock = stock === 0;
                const isCritical = stock > 0 && stock <= minStock;

                return (
                  <Card
                    key={product.id}
                    className="p-3 sm:p-4 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => navigate(`/mobile/product/${product.id}`)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`shrink-0 p-2 rounded-lg ${
                        isOutOfStock ? 'bg-destructive/10' : 'bg-orange-500/10'
                      }`}>
                        <Package className={`h-4 w-4 ${
                          isOutOfStock ? 'text-destructive' : 'text-orange-500'
                        }`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-foreground truncate">
                            {product.name}
                          </h3>
                          <Badge 
                            variant={isOutOfStock ? 'destructive' : 'outline'} 
                            className={`text-xs shrink-0 ${
                              !isOutOfStock ? 'border-orange-500 text-orange-500' : ''
                            }`}
                          >
                            {isOutOfStock ? 'RUPTURE' : 'CRITIQUE'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{product.barcode || 'Sans code-barres'}</span>
                          <span>•</span>
                          <span className="font-medium">
                            Stock: <span className={isOutOfStock ? 'text-destructive' : 'text-orange-500'}>
                              {stock}
                            </span>
                          </span>
                          {!isOutOfStock && (
                            <>
                              <span>•</span>
                              <span>Min: {minStock}</span>
                            </>
                          )}
                        </div>

                        {product.price && (
                          <div className="flex items-center gap-2 mt-2">
                            <TrendingUp className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs font-medium text-foreground">
                              {product.price.toFixed(2)} €
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </>
          )}
        </div>
      </ScrollArea>
    </MobileLayout>
  );
}
