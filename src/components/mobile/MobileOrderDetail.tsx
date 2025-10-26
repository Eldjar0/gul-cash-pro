import { useParams } from 'react-router-dom';
import { MobileLayout } from './MobileLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { useMobileOrder, useUpdateMobileOrder } from '@/hooks/useMobileOrders';
import { toast } from 'sonner';

export const MobileOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: order } = useMobileOrder(id);
  const updateOrder = useUpdateMobileOrder();

  if (!order) {
    return (
      <MobileLayout title="Commande introuvable">
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Cette commande n'existe pas</p>
        </div>
      </MobileLayout>
    );
  }

  const handleStatusChange = async (newStatus: 'pending' | 'completed' | 'cancelled') => {
    try {
      await updateOrder.mutateAsync({
        id: order.id,
        status: newStatus,
      });
      toast.success('Statut mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

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
    <MobileLayout title={`Commande ${order.order_number}`}>
      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="p-4 space-y-4">
          {/* En-tête commande */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-2xl font-bold">{order.order_number}</h2>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {getStatusBadge(order.status)}
            </div>

            {order.customer_name && (
              <>
                <Separator className="my-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-semibold">{order.customer_name}</p>
                  {order.customer_phone && (
                    <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                  )}
                </div>
              </>
            )}

            {order.notes && (
              <>
                <Separator className="my-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm">{order.notes}</p>
                </div>
              </>
            )}
          </Card>

          {/* Articles */}
          <Card className="p-4">
            <h3 className="font-bold mb-3">Articles ({order.items.length})</h3>
            <div className="space-y-3">
              {order.items.map((item: any, index: number) => (
                <div key={index}>
                  {index > 0 && <Separator className="my-3" />}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Qté: {item.quantity} × {item.unit_price.toFixed(2)}€
                      </p>
                    </div>
                    <p className="font-bold text-lg">
                      {item.total_price.toFixed(2)}€
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Total */}
          <Card className="p-4 bg-primary/5">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-3xl font-bold text-primary">
                {order.total_amount.toFixed(2)}€
              </span>
            </div>
          </Card>

          {/* Actions */}
          {order.status === 'pending' && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleStatusChange('completed')}
                className="bg-green-600 hover:bg-green-700 h-14"
                disabled={updateOrder.isPending}
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Compléter
              </Button>
              <Button
                onClick={() => handleStatusChange('cancelled')}
                variant="destructive"
                className="h-14"
                disabled={updateOrder.isPending}
              >
                <XCircle className="h-5 w-5 mr-2" />
                Annuler
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </MobileLayout>
  );
};

export default MobileOrderDetail;
