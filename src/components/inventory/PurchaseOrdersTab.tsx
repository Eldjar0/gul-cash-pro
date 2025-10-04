import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText } from 'lucide-react';
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

export const PurchaseOrdersTab = () => {
  const { data: purchaseOrders, isLoading } = usePurchaseOrders();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      draft: { label: 'Brouillon', variant: 'secondary' },
      sent: { label: 'Envoyée', variant: 'default' },
      partial: { label: 'Partiel', variant: 'outline' },
      received: { label: 'Reçue', variant: 'default' },
      cancelled: { label: 'Annulée', variant: 'destructive' },
    };
    const statusInfo = variants[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Commandes Fournisseurs</h2>
          <p className="text-sm text-muted-foreground">
            Bons de commande avec réception et traçabilité
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
          ) : purchaseOrders && purchaseOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Commande</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Montant Total</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-mono">{po.po_number}</TableCell>
                    <TableCell>
                      {format(new Date(po.order_date), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>{po.supplier_id || 'Non spécifié'}</TableCell>
                    <TableCell className="font-semibold">
                      {po.total.toFixed(2)} €
                    </TableCell>
                    <TableCell>{getStatusBadge(po.status)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Aucune commande fournisseur
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
