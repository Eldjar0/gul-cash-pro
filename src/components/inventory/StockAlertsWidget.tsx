import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/hooks/useProducts';
import { useProductBatches } from '@/hooks/useProductBatches';
import { AlertTriangle, Package, Calendar, ExternalLink } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function StockAlertsWidget() {
  const { data: products } = useProducts();
  const { data: batches } = useProductBatches();
  const navigate = useNavigate();

  const lowStockProducts = products?.filter(p => 
    p.stock !== null && p.min_stock !== null && p.stock <= p.min_stock && p.is_active
  ) || [];

  const expiringBatches = batches?.filter(batch => {
    if (!batch.expiry_date) return false;
    const daysUntilExpiry = differenceInDays(parseISO(batch.expiry_date), new Date());
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
  }) || [];

  const outOfStockProducts = products?.filter(p => 
    p.stock !== null && p.stock <= 0 && p.is_active
  ) || [];

  const totalAlerts = lowStockProducts.length + expiringBatches.length + outOfStockProducts.length;

  if (totalAlerts === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-500" />
            Alertes Stock
          </CardTitle>
          <CardDescription>Surveillance automatique des stocks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-6">
            <Package className="h-12 w-12 mx-auto mb-2 text-green-500 opacity-50" />
            <p className="font-medium">Tout est sous contrôle</p>
            <p className="text-sm">Aucune alerte active</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-500/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Alertes Stock
          <Badge variant="destructive" className="ml-auto">{totalAlerts}</Badge>
        </CardTitle>
        <CardDescription>Nécessite votre attention</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {outOfStockProducts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-600 font-medium">
              <Package className="h-4 w-4" />
              Rupture de stock ({outOfStockProducts.length})
            </div>
            <div className="space-y-1 pl-6">
              {outOfStockProducts.slice(0, 3).map(product => (
                <div key={product.id} className="text-sm text-muted-foreground flex items-center justify-between">
                  <span>{product.name}</span>
                  <Badge variant="destructive" className="text-xs">0</Badge>
                </div>
              ))}
              {outOfStockProducts.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{outOfStockProducts.length - 3} autres produits
                </p>
              )}
            </div>
          </div>
        )}

        {lowStockProducts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-orange-600 font-medium">
              <AlertTriangle className="h-4 w-4" />
              Stock faible ({lowStockProducts.length})
            </div>
            <div className="space-y-1 pl-6">
              {lowStockProducts.slice(0, 3).map(product => (
                <div key={product.id} className="text-sm text-muted-foreground flex items-center justify-between">
                  <span>{product.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {product.stock} / {product.min_stock}
                  </Badge>
                </div>
              ))}
              {lowStockProducts.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{lowStockProducts.length - 3} autres produits
                </p>
              )}
            </div>
          </div>
        )}

        {expiringBatches.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-yellow-600 font-medium">
              <Calendar className="h-4 w-4" />
              Lots proches expiration ({expiringBatches.length})
            </div>
            <div className="space-y-1 pl-6">
              {expiringBatches.slice(0, 3).map(batch => {
                const daysLeft = differenceInDays(parseISO(batch.expiry_date!), new Date());
                return (
                  <div key={batch.id} className="text-sm text-muted-foreground flex items-center justify-between">
                    <span>{batch.batch_number}</span>
                    <Badge variant="outline" className="text-xs">
                      {daysLeft}j restants
                    </Badge>
                  </div>
                );
              })}
              {expiringBatches.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{expiringBatches.length - 3} autres lots
                </p>
              )}
            </div>
          </div>
        )}

        <Button 
          onClick={() => navigate('/inventory')} 
          className="w-full"
          variant="outline"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Voir tous les détails
        </Button>
      </CardContent>
    </Card>
  );
}
