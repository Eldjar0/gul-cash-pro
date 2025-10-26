import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ShoppingCart, Package, CheckCircle2, XCircle } from 'lucide-react';
import { useMobileOrders } from '@/hooks/useMobileOrders';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const MobileOrderManager = () => {
  const navigate = useNavigate();
  const { data: orders = [] } = useMobileOrders();
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'outline' as const, label: 'En attente', icon: Package },
      completed: { variant: 'default' as const, label: 'Complété', icon: CheckCircle2 },
      cancelled: { variant: 'destructive' as const, label: 'Annulé', icon: XCircle },
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/mobile')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold flex-1">Commandes</h1>
            <Badge variant="secondary">{orders.length} total</Badge>
          </div>

          {/* Filtres */}
          <Tabs value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="all">Toutes</TabsTrigger>
              <TabsTrigger value="pending">En cours</TabsTrigger>
              <TabsTrigger value="completed">Complétées</TabsTrigger>
              <TabsTrigger value="cancelled">Annulées</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Liste des commandes */}
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="p-4 space-y-3">
          {filteredOrders.length === 0 ? (
            <Card className="p-8 text-center">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {statusFilter === 'all' 
                  ? 'Aucune commande' 
                  : `Aucune commande ${statusFilter === 'pending' ? 'en attente' : statusFilter === 'completed' ? 'complétée' : 'annulée'}`
                }
              </p>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card 
                key={order.id} 
                className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigate(`/mobile/order/${order.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-mono text-sm font-bold text-primary">
                      #{order.order_number}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(order.created_at), 'PPp', { locale: fr })}
                    </div>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                {order.customer_name && (
                  <div className="text-sm mb-2">
                    <span className="text-muted-foreground">Client: </span>
                    <span className="font-medium">{order.customer_name}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-sm text-muted-foreground">
                    {Array.isArray(order.items) ? order.items.length : 0} article(s)
                  </div>
                  <div className="text-lg font-bold text-primary">
                    {order.total_amount.toFixed(2)}€
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MobileOrderManager;
