import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuotes } from '@/hooks/useQuotes';
import { useCustomerOrders } from '@/hooks/useCustomerOrders';
import { FileText, ShoppingCart, CheckCircle, Clock, TrendingUp } from 'lucide-react';

export function OrdersStatsCards() {
  const { data: quotes } = useQuotes();
  const { data: orders } = useCustomerOrders();

  const pendingQuotes = quotes?.filter(q => q.status === 'draft' || q.status === 'sent').length || 0;
  const convertedQuotes = quotes?.filter(q => q.status === 'converted').length || 0;
  const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
  const completedOrders = orders?.filter(o => o.status === 'completed').length || 0;

  const quotesTotal = quotes?.reduce((sum, q) => sum + q.total, 0) || 0;
  const ordersTotal = orders?.reduce((sum, o) => sum + o.total, 0) || 0;

  const conversionRate = quotes && quotes.length > 0 
    ? ((convertedQuotes / quotes.length) * 100).toFixed(1) 
    : '0';

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Devis en Attente</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingQuotes}</div>
          <p className="text-xs text-muted-foreground">
            Total: {quotesTotal.toFixed(2)} €
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Commandes en Cours</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingOrders}</div>
          <p className="text-xs text-muted-foreground">
            À préparer
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Commandes Terminées</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedOrders}</div>
          <p className="text-xs text-muted-foreground">
            Total: {ordersTotal.toFixed(2)} €
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taux de Conversion</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{conversionRate}%</div>
          <p className="text-xs text-muted-foreground">
            Devis → Ventes
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
