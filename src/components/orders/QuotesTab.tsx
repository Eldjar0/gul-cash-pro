import { useQuotes } from '@/hooks/useQuotes';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye } from 'lucide-react';
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

export const QuotesTab = () => {
  const { data: quotes, isLoading } = useQuotes();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      draft: { label: 'Brouillon', variant: 'secondary' },
      sent: { label: 'Envoyé', variant: 'default' },
      accepted: { label: 'Accepté', variant: 'default' },
      rejected: { label: 'Refusé', variant: 'destructive' },
      converted: { label: 'Converti', variant: 'default' },
    };
    const statusInfo = variants[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Devis</h2>
          <p className="text-sm text-muted-foreground">
            Créez et gérez vos devis clients
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Devis
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Chargement des devis...
            </div>
          ) : quotes && quotes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Devis</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Montant Total</TableHead>
                  <TableHead>Validité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-mono">{quote.quote_number}</TableCell>
                    <TableCell>
                      {format(new Date(quote.quote_date), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>{quote.customer_id || 'Non spécifié'}</TableCell>
                    <TableCell className="font-semibold">
                      {quote.total.toFixed(2)} €
                    </TableCell>
                    <TableCell>
                      {quote.valid_until ? (
                        format(new Date(quote.valid_until), 'dd/MM/yyyy', { locale: fr })
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(quote.status)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Aucun devis
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
