import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePaymentMethodStats } from '@/hooks/useRevenueAnalytics';
import { CreditCard, Wallet, Smartphone } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

const PAYMENT_ICONS: Record<string, any> = {
  cash: Wallet,
  card: CreditCard,
  mobile: Smartphone,
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Espèces',
  card: 'Carte',
  mobile: 'Mobile',
};

export function PaymentMethodsCard() {
  const { data: paymentStats, isLoading } = usePaymentMethodStats(30);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Répartition Paiements
          </CardTitle>
          <CardDescription>30 derniers jours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
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
          <CreditCard className="h-5 w-5" />
          Répartition Paiements
        </CardTitle>
        <CardDescription>30 derniers jours</CardDescription>
      </CardHeader>
      <CardContent>
        {paymentStats && paymentStats.length > 0 ? (
          <div className="space-y-4">
            {paymentStats.map((stat) => {
              const Icon = PAYMENT_ICONS[stat.method] || Wallet;
              const label = PAYMENT_LABELS[stat.method] || stat.method;

              return (
                <div key={stat.method} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{label}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{stat.total.toFixed(2)} €</p>
                      <p className="text-xs text-muted-foreground">{stat.count} transactions</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Progress value={stat.percentage} />
                    <p className="text-xs text-muted-foreground text-right">
                      {stat.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mb-2 opacity-50" />
            <p>Aucune donnée disponible</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
