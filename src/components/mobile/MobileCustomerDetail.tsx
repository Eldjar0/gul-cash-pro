import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from './MobileLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCustomers } from '@/hooks/useCustomers';
import { useCustomerOrdersByCustomerId } from '@/hooks/useCustomerOrders';
import { useCustomerCreditAccount } from '@/hooks/useCustomerCredit';
import { 
  User, Phone, Mail, MapPin, CreditCard, ShoppingCart, 
  Edit, Plus, Clock, CheckCircle, XCircle 
} from 'lucide-react';
import { CustomerCreditManagementDialog } from '@/components/customers/CustomerCreditManagementDialog';
import { toast } from 'sonner';

export function MobileCustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: customers = [] } = useCustomers();
  const { data: orders = [] } = useCustomerOrdersByCustomerId(id);
  const { data: creditData } = useCustomerCreditAccount(id);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);

  const customer = customers.find(c => c.id === id);
  
  if (!customer) {
    return (
      <MobileLayout title="Client introuvable">
        <div className="p-8 text-center">
          <User className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Client non trouvé</p>
        </div>
      </MobileLayout>
    );
  }

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const completedOrders = orders.filter(o => o.status === 'ready' || o.status === 'completed');

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { variant: 'secondary' as const, icon: Clock, label: 'En attente' },
      ready: { variant: 'default' as const, icon: CheckCircle, label: 'Prête' },
      completed: { variant: 'outline' as const, icon: CheckCircle, label: 'Terminée' },
      cancelled: { variant: 'destructive' as const, icon: XCircle, label: 'Annulée' },
    };
    
    const { variant, icon: Icon, label } = config[status as keyof typeof config] || config.pending;
    
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  return (
    <MobileLayout 
      title={customer.name}
      actions={
        <Button size="sm" variant="outline" onClick={() => toast.info('Modifier - à implémenter')}>
          <Edit className="h-4 w-4" />
        </Button>
      }
    >
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 pb-20">
          {/* Infos principales */}
          <Card className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{customer.name}</h2>
                  {customer.loyalty_points !== undefined && customer.loyalty_points > 0 && (
                    <Badge variant="secondary" className="mt-1">
                      {customer.loyalty_points} pts fidélité
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {customer.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${customer.phone}`} className="text-foreground hover:underline">
                    {customer.phone}
                  </a>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${customer.email}`} className="text-foreground hover:underline truncate">
                    {customer.email}
                  </a>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-foreground">
                    {customer.address}
                    {customer.city && `, ${customer.postal_code} ${customer.city}`}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Crédit */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Crédit</h3>
              </div>
              <Button size="sm" variant="outline" onClick={() => setCreditDialogOpen(true)}>
                Gérer
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground mb-1">Limite</p>
                <p className="text-lg font-bold">
                  {creditData?.credit_limit ? `${creditData.credit_limit.toFixed(2)}€` : '0.00€'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground mb-1">Utilisé</p>
                <p className="text-lg font-bold">
                  {creditData?.current_balance ? `${creditData.current_balance.toFixed(2)}€` : '0.00€'}
                </p>
              </div>
            </div>

            {customer.credit_blocked && (
              <Badge variant="destructive" className="mt-2 w-full justify-center">
                Crédit bloqué
              </Badge>
            )}
          </Card>

          {/* Commandes */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Commandes</h3>
              </div>
              <Button 
                size="sm" 
                onClick={() => toast.info('Créer une commande - à implémenter')}
              >
                <Plus className="h-4 w-4 mr-1" />
                Nouvelle
              </Button>
            </div>

            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending">
                  En attente ({pendingOrders.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Terminées ({completedOrders.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-3 space-y-2">
                {pendingOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune commande en attente
                  </p>
                ) : (
                  pendingOrders.map((order) => (
                    <Card key={order.id} className="p-3 cursor-pointer hover:bg-accent/50">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold">#{order.order_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.order_date).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-xs text-muted-foreground">Total</span>
                        <span className="text-sm font-bold">{order.total.toFixed(2)}€</span>
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="completed" className="mt-3 space-y-2">
                {completedOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune commande terminée
                  </p>
                ) : (
                  completedOrders.slice(0, 5).map((order) => (
                    <Card key={order.id} className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold">#{order.order_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.order_date).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-xs text-muted-foreground">Total</span>
                        <span className="text-sm font-bold">{order.total.toFixed(2)}€</span>
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </ScrollArea>

      <CustomerCreditManagementDialog
        open={creditDialogOpen}
        onOpenChange={setCreditDialogOpen}
        customerId={customer.id}
        customerName={customer.name}
      />
    </MobileLayout>
  );
}

export default MobileCustomerDetail;
