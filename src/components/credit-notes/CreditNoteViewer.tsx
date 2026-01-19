import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  User, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Edit,
  Download,
  Printer
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCreditNote } from '@/hooks/useCreditNotes';
import { useCompanySettings } from '@/hooks/useCompanySettings';

interface CreditNoteViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creditNoteId?: string;
}

export function CreditNoteViewer({ open, onOpenChange, creditNoteId }: CreditNoteViewerProps) {
  const { data: creditNote, isLoading } = useCreditNote(creditNoteId);
  const { settings: company } = useCompanySettings();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Edit className="h-3 w-3 mr-1" />Brouillon</Badge>;
      case 'validated':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Validée</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />Annulée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!creditNoteId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Note de Crédit
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        ) : creditNote ? (
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 print:space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{creditNote.credit_note_number}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(creditNote.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </span>
                  </div>
                </div>
                {getStatusBadge(creditNote.status)}
              </div>

              <Separator />

              {/* Company & Customer */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">ÉMETTEUR</h3>
                  <div className="text-sm">
                    <p className="font-bold">{company.name}</p>
                    {company.address && <p>{company.address}</p>}
                    {(company.postal_code || company.city) && (
                      <p>{company.postal_code} {company.city}</p>
                    )}
                    {company.vat_number && <p className="mt-1">TVA: {company.vat_number}</p>}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">DESTINATAIRE</h3>
                  {creditNote.customers ? (
                    <div className="text-sm">
                      <p className="font-bold">{creditNote.customers.name}</p>
                      {creditNote.customers.address && <p>{creditNote.customers.address}</p>}
                      {(creditNote.customers.postal_code || creditNote.customers.city) && (
                        <p>{creditNote.customers.postal_code} {creditNote.customers.city}</p>
                      )}
                      {creditNote.customers.vat_number && <p className="mt-1">TVA: {creditNote.customers.vat_number}</p>}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Client non spécifié</p>
                  )}
                </div>
              </div>

              {/* Reason */}
              <Card className="p-4 bg-muted/30">
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">MOTIF</h3>
                <p>{creditNote.reason}</p>
                {creditNote.notes && (
                  <p className="text-sm text-muted-foreground mt-2">{creditNote.notes}</p>
                )}
              </Card>

              {/* Items */}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-3">DÉTAIL</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3">Désignation</th>
                        <th className="text-right p-3">Qté</th>
                        <th className="text-right p-3">P.U. HT</th>
                        <th className="text-right p-3">TVA</th>
                        <th className="text-right p-3">Total TTC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {creditNote.credit_note_items?.map((item, index) => (
                        <tr key={item.id || index} className="border-t">
                          <td className="p-3">{item.product_name}</td>
                          <td className="p-3 text-right">{item.quantity}</td>
                          <td className="p-3 text-right">{Number(item.unit_price).toFixed(2)}€</td>
                          <td className="p-3 text-right">{item.vat_rate}%</td>
                          <td className="p-3 text-right font-medium">{Number(item.total).toFixed(2)}€</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <Card className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sous-total HT</span>
                    <span>{Number(creditNote.subtotal).toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TVA</span>
                    <span>{Number(creditNote.total_vat).toFixed(2)}€</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total TTC</span>
                    <span className="text-primary">{Number(creditNote.total).toFixed(2)}€</span>
                  </div>
                </div>
              </Card>

              {creditNote.validated_at && (
                <p className="text-sm text-muted-foreground text-center">
                  Validée le {format(new Date(creditNote.validated_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                </p>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Note de crédit introuvable</p>
          </div>
        )}

        <DialogFooter className="mt-4 print:hidden">
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
