import { useState } from 'react';
import { useProductBatches, useExpiringBatches } from '@/hooks/useProductBatches';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, AlertCircle, Package } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const BatchesTab = () => {
  const { data: batches, isLoading } = useProductBatches();
  const { data: expiringBatches } = useExpiringBatches(30);

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = differenceInDays(expiry, today);

    if (daysUntilExpiry < 0) {
      return { label: 'Périmé', variant: 'destructive' as const };
    } else if (daysUntilExpiry <= 7) {
      return { label: `${daysUntilExpiry}j restants`, variant: 'destructive' as const };
    } else if (daysUntilExpiry <= 15) {
      return { label: `${daysUntilExpiry}j restants`, variant: 'outline' as const };
    } else if (daysUntilExpiry <= 30) {
      return { label: `${daysUntilExpiry}j restants`, variant: 'secondary' as const };
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Lots de Produits</h2>
          <p className="text-sm text-muted-foreground">
            Gestion FIFO avec traçabilité et alertes péremption
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Lot
        </Button>
      </div>

      {expiringBatches && expiringBatches.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="text-orange-700 dark:text-orange-400 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Alertes Péremption ({expiringBatches.length})
            </CardTitle>
            <CardDescription>Lots à vérifier ou retirer du stock</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Chargement des lots...
            </div>
          ) : batches && batches.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro de Lot</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Date Réception</TableHead>
                  <TableHead>Date Péremption</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => {
                  const expiryStatus = getExpiryStatus(batch.expiry_date);
                  return (
                    <TableRow key={batch.id}>
                      <TableCell className="font-mono text-sm">{batch.batch_number}</TableCell>
                      <TableCell>{batch.product_id}</TableCell>
                      <TableCell>
                        {format(new Date(batch.received_date), 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        {batch.expiry_date ? (
                          <div className="flex items-center gap-2">
                            {format(new Date(batch.expiry_date), 'dd/MM/yyyy', { locale: fr })}
                            {expiryStatus && (
                              <Badge variant={expiryStatus.variant}>
                                {expiryStatus.label}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          {batch.quantity}
                        </div>
                      </TableCell>
                      <TableCell>
                        {batch.quantity > 0 ? (
                          <Badge variant="default">En stock</Badge>
                        ) : (
                          <Badge variant="secondary">Épuisé</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Aucun lot enregistré
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
