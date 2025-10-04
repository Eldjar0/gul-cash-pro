import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDailyRevenue } from '@/hooks/useRevenueAnalytics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export function RevenueChart() {
  const { data: revenueData, isLoading } = useDailyRevenue(30);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Évolution du Chiffre d'Affaires
          </CardTitle>
          <CardDescription>30 derniers jours</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Évolution du Chiffre d'Affaires
        </CardTitle>
        <CardDescription>30 derniers jours</CardDescription>
      </CardHeader>
      <CardContent>
        {revenueData && revenueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                className="text-xs"
              />
              <YAxis className="text-xs" />
              <Tooltip
                labelFormatter={(value) => format(new Date(value), 'dd MMMM yyyy')}
                formatter={(value: number) => [`${value.toFixed(2)} €`, 'CA']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <p>Aucune donnée disponible</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
