import { useCustomerOrders } from '@/hooks/useCustomerOrders';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const CustomerOrdersTab = () => {
  const { data: orders, isLoading } = useCustomerOrders();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      pending: { label: 'En attente', variant: 'secondary' },
      ready: { label: 'Prête', variant: 'default' },
      completed: { label: 'Complétée', variant: 'default' },
      cancelled: { label: 'Annulée', variant: 'destructive' },
    };
    const statusInfo = variants[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Commandes Clients</h2>
          <p className="text-sm text-muted-foreground">
            Commandes avec acompte et notifications
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Commande
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Chargement des commandes...
            </div>
          ) : orders && orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Commande</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Acompte</TableHead>
                  <TableHead>Reste</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono">{order.order_number}</TableCell>
                    <TableCell>
                      {format(new Date(order.order_date), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>{order.customer_id || 'Non spécifié'}</TableCell>
                    <TableCell className="font-semibold">
                      {order.total.toFixed(2)} €
                    </TableCell>
                    <TableCell className="text-green-600">
                      {order.deposit_paid.toFixed(2)} €
                    </TableCell>
                    <TableCell className="font-medium">
                      {(order.remaining_balance || 0).toFixed(2)} €
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {order.status === 'ready' && !order.notified && (
                          <Button variant="ghost" size="sm" title="Notifier le client">
                            <Bell className="h-4 w-4 text-orange-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Aucune commande client
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
