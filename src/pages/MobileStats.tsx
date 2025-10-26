import { MobileLayout } from '@/components/mobile/MobileLayout';
import { Card } from '@/components/ui/card';
import { useMobileStats } from '@/hooks/useMobileStats';
import { useDailyRevenue } from '@/hooks/useRevenueAnalytics';
import { BarChart3, TrendingUp, ShoppingCart, Euro, CreditCard, Smartphone } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

export default function MobileStats() {
  const { data: stats, isLoading: statsLoading } = useMobileStats();
  const { data: revenueData, isLoading: revenueLoading } = useDailyRevenue(7);

  if (statsLoading || revenueLoading) {
    return (
      <MobileLayout title="Statistiques">
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </MobileLayout>
    );
  }

  const totalWeekRevenue = revenueData?.reduce((sum, day) => sum + day.revenue, 0) || 0;
  const averageDailyRevenue = revenueData && revenueData.length > 0 ? totalWeekRevenue / revenueData.length : 0;

  return (
    <MobileLayout title="Statistiques">
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 pb-20">
          {/* Stats du jour */}
          <div>
            <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 text-foreground">Aujourd'hui</h2>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Card className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Euro className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <span className="text-xs sm:text-sm text-muted-foreground">Chiffre d'affaires</span>
                </div>
                <p className="text-lg sm:text-2xl font-bold text-foreground">
                  {stats?.todayRevenue.toFixed(2)}€
                </p>
              </Card>

              <Card className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <span className="text-xs sm:text-sm text-muted-foreground">Ventes</span>
                </div>
                <p className="text-lg sm:text-2xl font-bold text-foreground">
                  {stats?.todaySalesCount}
                </p>
              </Card>

              <Card className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <span className="text-xs sm:text-sm text-muted-foreground">Panier moyen</span>
                </div>
                <p className="text-lg sm:text-2xl font-bold text-foreground">
                  {stats?.averageBasket.toFixed(2)}€
                </p>
              </Card>

              <Card className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <span className="text-xs sm:text-sm text-muted-foreground">Moy. semaine</span>
                </div>
                <p className="text-lg sm:text-2xl font-bold text-foreground">
                  {averageDailyRevenue.toFixed(2)}€
                </p>
              </Card>
            </div>
          </div>

          {/* Revenus des 7 derniers jours */}
          <div>
            <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 text-foreground">7 derniers jours</h2>
            <Card className="p-3 sm:p-4">
              <div className="space-y-2 sm:space-y-3">
                {revenueData?.slice(0, 7).map((day) => (
                  <div key={day.date} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-xs sm:text-sm font-medium text-foreground">
                        {new Date(day.date).toLocaleDateString('fr-FR', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ({day.sales_count} ventes)
                      </div>
                    </div>
                    <div className="text-sm sm:text-base font-bold text-foreground">
                      {day.revenue.toFixed(2)}€
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Total semaine */}
          <Card className="p-4 sm:p-5 bg-gradient-to-br from-primary/10 to-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total 7 jours</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">
                  {totalWeekRevenue.toFixed(2)}€
                </p>
              </div>
              <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>
          </Card>
        </div>
      </ScrollArea>
    </MobileLayout>
  );
}
