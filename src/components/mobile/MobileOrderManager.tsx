import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, User, Calendar, ShoppingCart } from 'lucide-react';
import { useMobileOrders } from '@/hooks/useMobileOrders';
import { MobileLayout } from './MobileLayout';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';

export const MobileOrderManager = () => {
  const { goToOrder } = useMobileNavigation();
  const { data: allOrders = [] } = useMobileOrders();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredOrders = statusFilter === 'all' 
    ? allOrders 
    : allOrders.filter(order => order.status === statusFilter);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Complétée
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Annulée
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
    }
  };

  return (
    <MobileLayout title={`Commandes (${allOrders.length})`}>
      <div className="space-y-4">
        {/* Filtres */}
        <div className="p-4 pb-0">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Toutes</TabsTrigger>
              <TabsTrigger value="pending">En attente</TabsTrigger>
              <TabsTrigger value="completed">Complétées</TabsTrigger>
              <TabsTrigger value="cancelled">Annulées</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Liste */}
        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="p-4 pt-0 space-y-3">
            {filteredOrders.length === 0 ? (
              <Card className="p-8 text-center">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Aucune commande
                </p>
              </Card>
            ) : (
              filteredOrders.map((order) => (
                <Card
                  key={order.id}
                  className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => goToOrder(order.id)}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold">{order.order_number}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(order.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>

                    {order.customer_name && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{order.customer_name}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground">
                        {order.items.length} article{order.items.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-xl font-bold text-primary">
                        {order.total_amount.toFixed(2)}€
                      </span>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </MobileLayout>
  );
};

export default MobileOrderManager;
