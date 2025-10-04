import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCashierPerformance } from '@/hooks/useCashierAnalytics';
import { Users, Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function CashierPerformanceCard() {
  const { data: cashiers, isLoading } = useCashierPerformance(30);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Performance Caissiers
          </CardTitle>
          <CardDescription>Statistiques des 30 derniers jours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
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
          <Award className="h-5 w-5" />
          Performance Caissiers
        </CardTitle>
        <CardDescription>Statistiques des 30 derniers jours</CardDescription>
      </CardHeader>
      <CardContent>
        {cashiers && cashiers.length > 0 ? (
          <div className="space-y-3">
            {cashiers.map((cashier, index) => (
              <div
                key={cashier.cashier_id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  {index === 0 && (
                    <Award className="h-6 w-6 text-yellow-500" />
                  )}
                  {index === 1 && (
                    <Award className="h-6 w-6 text-gray-400" />
                  )}
                  {index === 2 && (
                    <Award className="h-6 w-6 text-orange-600" />
                  )}
                  {index > 2 && (
                    <Users className="h-6 w-6 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">{cashier.cashier_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {cashier.total_sales} ventes • Moy: {cashier.avg_sale_amount.toFixed(2)} €
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary text-lg">
                    {cashier.total_revenue.toFixed(2)} €
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mb-2 opacity-50" />
            <p>Aucune donnée disponible</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
