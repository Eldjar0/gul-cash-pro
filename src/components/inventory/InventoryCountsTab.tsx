import { useInventoryCounts, useCreateInventoryCount } from '@/hooks/useInventoryCounts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ClipboardCheck } from 'lucide-react';
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

export const InventoryCountsTab = () => {
  const { data: counts, isLoading } = useInventoryCounts();
  const createCount = useCreateInventoryCount();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      in_progress: { label: 'En cours', variant: 'secondary' },
      completed: { label: 'Terminé', variant: 'default' },
      validated: { label: 'Validé', variant: 'default' },
    };
    const statusInfo = variants[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const handleCreateCount = () => {
    createCount.mutate();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Inventaires Physiques</h2>
          <p className="text-sm text-muted-foreground">
            Comptages avec écarts et ajustements automatiques
          </p>
        </div>
        <Button onClick={handleCreateCount} disabled={createCount.isPending}>
          <Plus className="h-4 w-4 mr-2" />
          {createCount.isPending ? 'Création...' : 'Nouvel Inventaire'}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Chargement des inventaires...
            </div>
          ) : counts && counts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Inventaire</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Compteur</TableHead>
                  <TableHead>Écart Total</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {counts.map((count) => (
                  <TableRow key={count.id}>
                    <TableCell className="font-mono">{count.count_number}</TableCell>
                    <TableCell>
                      {format(new Date(count.count_date), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>{count.counted_by || 'Non assigné'}</TableCell>
                    <TableCell className={count.total_variance_value !== 0 ? 'font-semibold text-orange-600' : ''}>
                      {count.total_variance_value.toFixed(2)} €
                    </TableCell>
                    <TableCell>{getStatusBadge(count.status)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <ClipboardCheck className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Aucun inventaire en cours
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
