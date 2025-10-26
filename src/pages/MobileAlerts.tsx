import { MobileLayout } from '@/components/mobile/MobileLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMobileAlerts } from '@/hooks/useMobileAlerts';
import { useProducts } from '@/hooks/useProducts';
import { AlertTriangle, AlertCircle, Info, Package, ArrowRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

export default function MobileAlerts() {
  const { data: alerts, isLoading: alertsLoading } = useMobileAlerts();
  const { data: products } = useProducts();
  const navigate = useNavigate();

  const lowStockProducts = products?.filter(p => p.stock > 0 && p.stock <= 10) || [];
  const outOfStockProducts = products?.filter(p => p.stock === 0) || [];

  if (alertsLoading) {
    return (
      <MobileLayout title="Alertes">
        <div className="p-3 sm:p-4 space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </MobileLayout>
    );
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />;
      default:
        return <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, any> = {
      critical: 'destructive',
      warning: 'default',
      info: 'secondary',
    };
    return variants[severity] || 'default';
  };

  return (
    <MobileLayout title="Alertes">
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 pb-20">
          {/* Alertes générales */}
          {alerts && alerts.length > 0 && (
            <div>
              <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 text-foreground">
                Alertes actives ({alerts.length})
              </h2>
              <div className="space-y-2 sm:space-y-3">
                {alerts.map((alert) => (
                  <Card
                    key={alert.id}
                    className="p-3 sm:p-4 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => alert.actionUrl && navigate(alert.actionUrl)}
                  >
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm sm:text-base font-semibold text-foreground">
                            {alert.title}
                          </h3>
                          <Badge variant={getSeverityBadge(alert.severity)} className="text-xs">
                            {alert.severity === 'critical' ? 'Critique' : alert.severity === 'warning' ? 'Attention' : 'Info'}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {alert.description}
                        </p>
                      </div>
                      {alert.actionUrl && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Produits en rupture */}
          {outOfStockProducts.length > 0 && (
            <div>
              <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 text-foreground">
                Rupture de stock ({outOfStockProducts.length})
              </h2>
              <div className="space-y-2">
                {outOfStockProducts.slice(0, 10).map((product) => (
                  <Card
                    key={product.id}
                    className="p-3 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => navigate(`/mobile/product/${product.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4 text-destructive shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product.barcode || 'Sans code-barres'}
                        </p>
                      </div>
                      <Badge variant="destructive" className="text-xs shrink-0">
                        0 stock
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Produits en stock faible */}
          {lowStockProducts.length > 0 && (
            <div>
              <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 text-foreground">
                Stock faible ({lowStockProducts.length})
              </h2>
              <div className="space-y-2">
                {lowStockProducts.slice(0, 10).map((product) => (
                  <Card
                    key={product.id}
                    className="p-3 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => navigate(`/mobile/product/${product.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4 text-orange-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product.barcode || 'Sans code-barres'}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0 border-orange-500 text-orange-500">
                        {product.stock} restant{product.stock > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {alerts?.length === 0 && outOfStockProducts.length === 0 && lowStockProducts.length === 0 && (
            <Card className="p-8 text-center">
              <Info className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Aucune alerte active
              </p>
            </Card>
          )}
        </div>
      </ScrollArea>
    </MobileLayout>
  );
}
