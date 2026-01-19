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
  Printer,
  FileDown
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCreditNote } from '@/hooks/useCreditNotes';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { downloadCreditNotePDF, previewCreditNotePDF } from '@/utils/generateCreditNotePDF';
import { downloadCreditNoteXML, downloadCreditNoteUBL } from '@/utils/exportCreditNoteXML';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

  const getCreditNoteData = () => {
    if (!creditNote) return null;
    return {
      creditNoteNumber: creditNote.credit_note_number,
      date: new Date(creditNote.created_at),
      validatedAt: creditNote.validated_at ? new Date(creditNote.validated_at) : undefined,
      company: {
        name: company.name,
        address: company.address || '',
        city: company.city || '',
        postalCode: company.postal_code || '',
        vatNumber: company.vat_number || '',
        phone: company.phone,
        email: company.email,
      },
      customer: creditNote.customers ? {
        name: creditNote.customers.name,
        vatNumber: creditNote.customers.vat_number,
        address: creditNote.customers.address,
        city: creditNote.customers.city,
        postalCode: creditNote.customers.postal_code,
      } : undefined,
      items: creditNote.credit_note_items?.map((item: any) => ({
        description: item.product_name,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        vatRate: item.vat_rate,
        subtotal: Number(item.subtotal),
        vatAmount: Number(item.vat_amount),
        total: Number(item.total),
      })) || [],
      reason: creditNote.reason,
      notes: creditNote.notes,
      subtotal: Number(creditNote.subtotal),
      totalVat: Number(creditNote.total_vat),
      total: Number(creditNote.total),
    };
  };

  const handleDownloadPDF = async () => {
    const data = getCreditNoteData();
    if (!data) return;
    try {
      await downloadCreditNotePDF(data);
      toast.success('PDF téléchargé');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handlePreviewPDF = async () => {
    const data = getCreditNoteData();
    if (!data) return;
    try {
      await previewCreditNotePDF(data);
    } catch (error) {
      toast.error('Erreur lors de l\'aperçu');
    }
  };

  const handleDownloadXML = () => {
    if (!creditNote) return;
    try {
      downloadCreditNoteXML(creditNote as any, {
        name: company.name,
        address: company.address,
        city: company.city,
        postalCode: company.postal_code,
        vatNumber: company.vat_number,
      });
      toast.success('XML téléchargé');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleDownloadUBL = () => {
    if (!creditNote) return;
    try {
      downloadCreditNoteUBL(creditNote as any, {
        name: company.name,
        address: company.address,
        city: company.city,
        postalCode: company.postal_code,
        vatNumber: company.vat_number,
      });
      toast.success('UBL Peppol téléchargé');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  if (!creditNoteId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">Note de Crédit</DialogTitle>
              <p className="text-sm text-muted-foreground">Avoir commercial</p>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : creditNote ? (
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 print:space-y-4">
              {/* Header avec numéro et statut */}
              <div className="flex items-start justify-between bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Numéro</p>
                  <h2 className="text-2xl font-bold text-red-600">{creditNote.credit_note_number}</h2>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(creditNote.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}</span>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(creditNote.status)}
                  {creditNote.validated_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Validée le {format(new Date(creditNote.validated_at), 'dd/MM/yyyy', { locale: fr })}
                    </p>
                  )}
                </div>
              </div>

              {/* Émetteur & Destinataire */}
              <div className="grid grid-cols-2 gap-6">
                <Card className="p-4">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    ÉMETTEUR
                  </h3>
                  <div className="text-sm space-y-1">
                    <p className="font-bold text-base">{company.name}</p>
                    {company.address && <p className="text-muted-foreground">{company.address}</p>}
                    {(company.postal_code || company.city) && (
                      <p className="text-muted-foreground">{company.postal_code} {company.city}</p>
                    )}
                    {company.vat_number && (
                      <p className="mt-2 font-mono text-xs bg-muted px-2 py-1 rounded inline-block">
                        TVA: {company.vat_number}
                      </p>
                    )}
                  </div>
                </Card>
                
                <Card className="p-4">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    DESTINATAIRE
                  </h3>
                  {creditNote.customers ? (
                    <div className="text-sm space-y-1">
                      <p className="font-bold text-base">{creditNote.customers.name}</p>
                      {creditNote.customers.address && <p className="text-muted-foreground">{creditNote.customers.address}</p>}
                      {(creditNote.customers.postal_code || creditNote.customers.city) && (
                        <p className="text-muted-foreground">{creditNote.customers.postal_code} {creditNote.customers.city}</p>
                      )}
                      {creditNote.customers.vat_number && (
                        <p className="mt-2 font-mono text-xs bg-muted px-2 py-1 rounded inline-block">
                          TVA: {creditNote.customers.vat_number}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Client non spécifié</p>
                  )}
                </Card>
              </div>

              {/* Motif */}
              <Card className="p-4 border-red-200 bg-red-50/50 dark:bg-red-900/10">
                <h3 className="font-semibold text-sm text-red-600 mb-2">MOTIF DE L'AVOIR</h3>
                <p className="font-medium">{creditNote.reason}</p>
                {creditNote.notes && (
                  <p className="text-sm text-muted-foreground mt-2 italic">{creditNote.notes}</p>
                )}
              </Card>

              {/* Tableau des articles */}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-3">DÉTAIL DES ARTICLES</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Désignation</th>
                        <th className="text-right p-3 font-medium w-20">Qté</th>
                        <th className="text-right p-3 font-medium w-24">P.U. HT</th>
                        <th className="text-right p-3 font-medium w-16">TVA</th>
                        <th className="text-right p-3 font-medium w-24">Montant HT</th>
                        <th className="text-right p-3 font-medium w-28">Total TTC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {creditNote.credit_note_items?.map((item: any, index: number) => (
                        <tr key={item.id || index} className="border-t hover:bg-muted/30">
                          <td className="p-3 font-medium">{item.product_name}</td>
                          <td className="p-3 text-right">{item.quantity}</td>
                          <td className="p-3 text-right">{Number(item.unit_price).toFixed(2)}€</td>
                          <td className="p-3 text-right text-muted-foreground">{item.vat_rate}%</td>
                          <td className="p-3 text-right">{Number(item.subtotal).toFixed(2)}€</td>
                          <td className="p-3 text-right font-semibold">{Number(item.total).toFixed(2)}€</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totaux */}
              <div className="flex justify-end">
                <Card className="p-4 w-72 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sous-total HT</span>
                      <span className="font-medium">{Number(creditNote.subtotal).toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">TVA</span>
                      <span className="font-medium">{Number(creditNote.total_vat).toFixed(2)}€</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-lg">
                      <span className="font-bold text-red-600">AVOIR TTC</span>
                      <span className="font-bold text-red-600">-{Number(creditNote.total).toFixed(2)}€</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 flex items-center justify-center py-12">
            <p className="text-muted-foreground">Note de crédit introuvable</p>
          </div>
        )}

        <DialogFooter className="mt-4 print:hidden flex-wrap gap-2">
          <div className="flex gap-2 flex-1">
            <Button variant="outline" onClick={handlePreviewPDF} className="gap-2">
              <Printer className="h-4 w-4" />
              Aperçu
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <FileDown className="h-4 w-4" />
                  Exporter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-background z-50">
                <DropdownMenuLabel>Format d'export</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDownloadPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadXML}>
                  <Download className="h-4 w-4 mr-2" />
                  XML
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadUBL}>
                  <Download className="h-4 w-4 mr-2" />
                  UBL Peppol
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <Button onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
