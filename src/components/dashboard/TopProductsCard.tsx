import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTopProducts } from '@/hooks/useProductAnalytics';
import { TrendingUp, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function TopProductsCard() {
  const { data: topProducts, isLoading } = useTopProducts(30);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top 10 Produits
          </CardTitle>
          <CardDescription>Meilleurs ventes des 30 derniers jours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Top 10 Produits
        </CardTitle>
        <CardDescription>Meilleurs ventes des 30 derniers jours</CardDescription>
      </CardHeader>
      <CardContent>
        {topProducts && topProducts.length > 0 ? (
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div
                key={product.product_id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors gap-3"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {product.product_image ? (
                    <img 
                      src={product.product_image} 
                      alt={product.product_name}
                      className="w-12 h-12 object-cover rounded shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center shrink-0">
                      <Package className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.total_quantity} unités vendues
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">
                    {product.total_revenue.toFixed(2)} €
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {product.sale_count} ventes
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mb-2 opacity-50" />
            <p>Aucune donnée disponible</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
