import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { RefundDialog } from '@/components/pos/RefundDialog';
import { useRefunds } from '@/hooks/useRefunds';
import { useState } from 'react';
import { Undo2, Search, Calendar, Euro, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Refunds() {
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: refunds = [], isLoading } = useRefunds();

  const filteredRefunds = refunds.filter((refund) =>
    refund.refund_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    refund.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
    refund.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const todayRefunds = refunds.filter((r) => {
    const refundDate = new Date(r.created_at);
    const today = new Date();
    return refundDate.toDateString() === today.toDateString();
  });

  const todayTotal = todayRefunds.reduce((sum, r) => sum + r.total, 0);

  return (
    <ProtectedLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Undo2 className="h-8 w-8" />
              Remboursements
            </h1>
            <p className="text-muted-foreground">Gestion des retours et remboursements</p>
          </div>
          <Button onClick={() => setRefundDialogOpen(true)} size="lg">
            <Undo2 className="h-5 w-5 mr-2" />
            Nouveau Remboursement
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Remboursements aujourd'hui</p>
                <h3 className="text-2xl font-bold mt-1">{todayRefunds.length}</h3>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total remboursé</p>
                <h3 className="text-2xl font-bold mt-1">{todayTotal.toFixed(2)}€</h3>
              </div>
              <div className="p-3 bg-red-500/10 rounded-lg">
                <Euro className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total remboursements</p>
                <h3 className="text-2xl font-bold mt-1">{refunds.length}</h3>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <FileText className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </Card>
        </div>

        {/* Recherche */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un remboursement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Liste des remboursements */}
        <Card>
          <ScrollArea className="h-[600px]">
            {isLoading ? (
              <div className="p-12 text-center text-muted-foreground">Chargement...</div>
            ) : filteredRefunds.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Undo2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun remboursement trouvé</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredRefunds.map((refund) => (
                  <div key={refund.id} className="p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{refund.refund_number}</h3>
                          <Badge variant={refund.refund_type === 'full' ? 'destructive' : 'secondary'}>
                            {refund.refund_type === 'full' ? 'Complet' : 'Partiel'}
                          </Badge>
                          <Badge variant="outline">{refund.payment_method}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {format(new Date(refund.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                        </p>
                        {refund.customers && (
                          <p className="text-sm text-muted-foreground">
                            Client: {refund.customers.name}
                          </p>
                        )}
                        <p className="text-sm mt-2">
                          <span className="font-medium">Raison:</span> {refund.reason}
                        </p>
                        <div className="mt-2 text-xs text-muted-foreground">
                          {refund.refund_items?.length} article{refund.refund_items?.length > 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-destructive">
                          -{refund.total.toFixed(2)}€
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          dont TVA: {refund.total_vat.toFixed(2)}€
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>

      <RefundDialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen} />
    </ProtectedLayout>
  );
}
