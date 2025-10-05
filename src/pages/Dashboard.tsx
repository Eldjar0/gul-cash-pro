import { Card } from '@/components/ui/card';
import { useSales } from '@/hooks/useSales';
import { useProducts } from '@/hooks/useProducts';
import { useTodayReport } from '@/hooks/useDailyReports';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { TopProductsCard } from '@/components/dashboard/TopProductsCard';
import { LowStockAlert } from '@/components/dashboard/LowStockAlert';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { AdvancedDashboardStats } from '@/components/dashboard/AdvancedDashboardStats';
import { StockAlertsWidget } from '@/components/inventory/StockAlertsWidget';
import { CashierPerformanceCard } from '@/components/dashboard/CashierPerformanceCard';
import { PaymentMethodsCard } from '@/components/dashboard/PaymentMethodsCard';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Euro,
  Package,
  AlertTriangle,
  Users,
  Calendar,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function Dashboard() {
  // Statistiques du jour
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const { data: todaySales = [] } = useSales(today, tomorrow);

  // Hier pour comparaison
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const { data: yesterdaySales = [] } = useSales(yesterday, today);

  // Produits
  const { data: products = [] } = useProducts();

  // Rapport du jour
  const { data: todayReport } = useTodayReport();

  // Calculs
  const todayTotal = todaySales
    .filter((s) => !s.is_cancelled)
    .reduce((sum, s) => sum + s.total, 0);
  const yesterdayTotal = yesterdaySales
    .filter((s) => !s.is_cancelled)
    .reduce((sum, s) => sum + s.total, 0);
  const todayCount = todaySales.filter((s) => !s.is_cancelled).length;
  const yesterdayCount = yesterdaySales.filter((s) => !s.is_cancelled).length;

  const totalPercentChange =
    yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 : 0;
  const countPercentChange =
    yesterdayCount > 0 ? ((todayCount - yesterdayCount) / yesterdayCount) * 100 : 0;

  const avgBasket = todayCount > 0 ? todayTotal / todayCount : 0;

  // Produits en alerte stock
  const lowStockProducts = products.filter(
    (p) => p.stock !== null && p.min_stock !== null && p.stock <= p.min_stock
  );

  // Top 5 produits vendus aujourd'hui
  const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();
  todaySales
    .filter((s) => !s.is_cancelled)
    .forEach((sale) => {
      sale.sale_items?.forEach((item: any) => {
        const current = productSales.get(item.product_id) || {
          name: item.product_name,
          quantity: 0,
          revenue: 0,
        };
        productSales.set(item.product_id, {
          name: item.product_name,
          quantity: current.quantity + item.quantity,
          revenue: current.revenue + item.total,
        });
      });
    });

  const topProducts = Array.from(productSales.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Tableau de Bord</h1>
          <p className="text-sm md:text-base text-muted-foreground">Vue d'ensemble de votre activité en temps réel</p>
        </div>

        {/* Statistiques principales */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="CA du jour"
            value={`${todayTotal.toFixed(2)}€`}
            icon={Euro}
            trend={{
              value: totalPercentChange,
              label: 'vs hier',
              isPositive: totalPercentChange >= 0,
            }}
            iconBgColor="bg-primary/10"
            iconColor="text-primary"
          />

          <StatsCard
            title="Ventes"
            value={todayCount}
            icon={ShoppingCart}
            trend={{
              value: countPercentChange,
              label: 'vs hier',
              isPositive: countPercentChange >= 0,
            }}
            iconBgColor="bg-blue-500/10"
            iconColor="text-blue-500"
          />

          <StatsCard
            title="Panier moyen"
            value={`${avgBasket.toFixed(2)}€`}
            icon={Users}
            iconBgColor="bg-purple-500/10"
            iconColor="text-purple-500"
          >
            <p className="text-xs text-muted-foreground mt-2">Aujourd'hui</p>
          </StatsCard>

          <StatsCard
            title="Alertes stock"
            value={lowStockProducts.length}
            icon={AlertTriangle}
            iconBgColor="bg-orange-500/10"
            iconColor="text-orange-500"
          >
            <p className="text-xs text-muted-foreground mt-2">Produits en alerte</p>
          </StatsCard>
        </div>

        {/* Low Stock Alert Banner */}
        <LowStockAlert />

        {/* Advanced alerts widget */}
        <div className="grid gap-6 md:grid-cols-2">
          <StockAlertsWidget />
          <QuickActions />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Top produits */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Top 5 Produits Vendus</h2>
            </div>
            {topProducts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Aucune vente aujourd'hui</p>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.quantity} unité{product.quantity > 1 ? 's' : ''}
                        </p>
                      </div>
                      <Badge variant="outline">{product.revenue.toFixed(2)}€</Badge>
                    </div>
                    <Progress value={((idx + 1) / topProducts.length) * 100} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Alertes stock */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-semibold">Alertes Stock</h2>
            </div>
            {lowStockProducts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Aucune alerte stock</p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 10).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-orange-500/5 rounded-lg border border-orange-500/20"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Stock actuel: {product.stock} {product.unit}
                      </p>
                    </div>
                    <Badge variant="destructive">
                      Seuil: {product.min_stock}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* État de la caisse */}
        {todayReport && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">État de la Caisse</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Fond de caisse</p>
                <p className="text-xl font-bold mt-1">
                  {todayReport.opening_amount.toFixed(2)}€
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Espèces encaissées</p>
                <p className="text-xl font-bold mt-1">{todayReport.total_cash.toFixed(2)}€</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total carte/mobile</p>
                <p className="text-xl font-bold mt-1">
                  {(todayReport.total_card + todayReport.total_mobile).toFixed(2)}€
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Analytics avancées */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Analytics Avancées</h2>
          
          {/* Graphique revenus */}
          <RevenueChart />

          {/* Top produits et performance caissiers */}
          <div className="grid gap-6 md:grid-cols-2">
            <TopProductsCard />
            <CashierPerformanceCard />
          </div>

          {/* Répartition paiements */}
          <PaymentMethodsCard />
        </div>
      </div>
  );
}
