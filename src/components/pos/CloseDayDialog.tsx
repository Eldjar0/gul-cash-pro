import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Euro, AlertTriangle, FileText, CreditCard, Smartphone, Receipt, Printer, Download, Archive } from 'lucide-react';
import { ReportData, DailyReport } from '@/hooks/useDailyReports';
import { ReportZContent } from './ReportZContent';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { COMPANY_INFO } from '@/data/company';
import logoMarket from '@/assets/logo-market.png';

interface CloseDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (closingAmount: number, archiveAndDelete?: boolean) => void;
  reportData: ReportData;
  todayReport: DailyReport | null;
}

function generateTicketHTML(sale: any): string {
  const isInvoice = sale.is_invoice || false;
  const saleDate = new Date(sale.date);
  
  // Récupérer les produits depuis sale_items
  const items = (sale.sale_items || []).map((item: any) => ({
    product: {
      name: item.product_name || 'Produit',
      price: parseFloat(item.unit_price),
      type: 'unit' as const,
      vat_rate: parseFloat(item.vat_rate)
    },
    quantity: parseFloat(item.quantity),
    discount: item.discount_type ? {
      type: item.discount_type as 'percentage' | 'amount',
      value: parseFloat(item.discount_value || 0)
    } : undefined,
    total: parseFloat(item.total)
  }));

  const itemsHTML = items.map((item: any) => {
    const unitDisplay = item.product.type === 'weight' ? 'kg' : 'pc';
    const qtyDisplay = item.quantity.toFixed(item.product.type === 'weight' ? 3 : 0);
    const pricePerUnit = item.product.price.toFixed(2);
    
    return `
      <div style="margin-bottom: 3px;">
        <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 900; gap: 6px; margin-bottom: 1px;">
          <span style="font-weight: 900; text-transform: uppercase; font-size: 16px; letter-spacing: 0.3px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px;">
            ${item.product.name}
          </span>
          <span style="font-weight: 900; white-space: nowrap; font-size: 13px;">
            ${item.total.toFixed(2)}€
          </span>
        </div>
        <div style="font-size: 11px; font-weight: 800;">
          ${qtyDisplay} ${unitDisplay} x ${pricePerUnit}€
          ${item.discount ? `<span style="font-style: italic; margin-left: 5px;">REM -${item.discount.value}${item.discount.type === 'percentage' ? '%' : '€'}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');

  const customerHTML = isInvoice && sale.customers ? `
    <div style="font-size: 12.3px; margin-bottom: 6px; font-weight: 900; padding-right: 24px;">
      <div style="font-weight: 900; margin-bottom: 2px;">CLIENT:</div>
      <div style="font-weight: 900; word-wrap: break-word;">${sale.customers.name}</div>
      ${sale.customers.vat_number ? `<div style="word-wrap: break-word;">TVA: ${sale.customers.vat_number}</div>` : ''}
      ${sale.customers.address ? `<div style="word-wrap: break-word;">${sale.customers.address}</div>` : ''}
      ${sale.customers.postal_code || sale.customers.city ? `<div>${sale.customers.postal_code || ''} ${sale.customers.city || ''}</div>` : ''}
    </div>
    <div style="border-top: 1.4px dashed #000; margin: 6px 0;"></div>
  ` : '';

  const paymentHTML = sale.payment_method === 'cash' && sale.amount_paid ? `
    <div style="display: flex; justify-content: space-between; font-size: 12.3px; gap: 3px;">
      <span>Reçu</span>
      <span style="white-space: nowrap;">${parseFloat(sale.amount_paid).toFixed(2)}€</span>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 12.3px; font-weight: 900; gap: 3px;">
      <span>Rendu</span>
      <span style="white-space: nowrap;">${parseFloat(sale.change_amount || 0).toFixed(2)}€</span>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${isInvoice ? 'Facture' : 'Ticket'} ${sale.sale_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Barlow Semi Condensed', 'Arial Narrow', Arial, sans-serif;
            background: white;
            color: black;
            width: 80mm;
            max-width: 302px;
            margin: 0 auto;
            padding: 8px;
            padding-right: 24px;
            font-size: 16.4px;
            line-height: 1.3;
            font-weight: 900;
          }
          @media print {
            @page { size: 80mm auto; margin: 0; }
            body { width: 80mm; margin: 0; padding: 8px; }
          }
        </style>
      </head>
      <body>
        <div style="text-align: center; margin-bottom: 8px;">
          <img src="${logoMarket}" alt="Logo" style="width: 180px; height: auto; margin: 0 auto; display: block;" />
        </div>

        <div style="text-align: center; margin-bottom: 8px; font-weight: 900; font-size: 12.3px; line-height: 1.2;">
          <div>${COMPANY_INFO.address}</div>
          <div>${COMPANY_INFO.postalCode} ${COMPANY_INFO.city}</div>
          ${COMPANY_INFO.phone ? `<div>Tel: ${COMPANY_INFO.phone}</div>` : ''}
          <div style="margin-top: 1px;">TVA: ${COMPANY_INFO.vat}</div>
        </div>

        <div style="border-top: 1.4px dashed #000; margin: 6px 0;"></div>

        ${customerHTML}

        <div style="font-size: 12.3px; margin-bottom: 6px; font-weight: 900; padding-right: 24px;">
          <div style="display: flex; justify-content: space-between; font-weight: 900;">
            <span>${isInvoice ? 'FACTURE' : 'TICKET'} N°:</span>
            <span style="font-size: 13.7px;">${sale.sale_number}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 1px;">
            <span>DATE:</span>
            <span style="font-size: 10.9px;">${saleDate.toLocaleString('fr-BE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        <div style="border-top: 1.4px dashed #000; margin: 6px 0;"></div>

        <div style="margin-bottom: 6px; padding-right: 24px;">
          ${itemsHTML}
        </div>

        <div style="border-top: 1.4px solid #000; margin: 6px 0;"></div>

        <div style="font-size: 13.7px; margin-bottom: 4px; font-weight: 900; padding-right: 24px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 1px; gap: 3px;">
            <span>SOUS-TOTAL HT</span>
            <span style="font-weight: 900; white-space: nowrap;">${parseFloat(sale.subtotal).toFixed(2)}€</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 1px; gap: 3px;">
            <span>TVA TOTALE</span>
            <span style="font-weight: 900; white-space: nowrap;">${parseFloat(sale.total_vat).toFixed(2)}€</span>
          </div>
          ${parseFloat(sale.total_discount || 0) > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 1px; gap: 3px;">
            <span>REMISE</span>
            <span style="font-weight: 900; white-space: nowrap;">-${parseFloat(sale.total_discount).toFixed(2)}€</span>
          </div>
          ` : ''}
        </div>

        <div style="border-top: 2.8px solid #000; border-bottom: 2.8px solid #000; padding: 4px 24px; margin: 6px 0;">
          <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 900; gap: 8px;">
            <span>TOTAL</span>
            <span style="white-space: nowrap;">${parseFloat(sale.total).toFixed(2)}€</span>
          </div>
        </div>

        <div style="font-size: 13.7px; margin-top: 6px; margin-bottom: 6px; font-weight: 900; padding-right: 24px;">
          <div style="display: flex; justify-content: space-between; font-weight: 900; margin-bottom: 2px; gap: 3px;">
            <span style="flex: 1; overflow: hidden; text-overflow: ellipsis;">
              ${sale.payment_method === 'cash' ? 'ESPECES' : sale.payment_method === 'card' ? 'CARTE' : 'PAIEMENT'}
            </span>
            <span style="white-space: nowrap;">${parseFloat(sale.total).toFixed(2)}€</span>
          </div>
          ${paymentHTML}
        </div>

        <div style="border-top: 1.4px dashed #000; margin: 7px 0;"></div>

        <div style="text-align: center; margin-top: 7px; font-weight: 900;">
          ${isInvoice ? `
          <div style="font-size: 12.3px;">
            <div style="font-weight: 900; margin-bottom: 2px;">FACTURE</div>
            <div>Payable sous 30 jours</div>
          </div>
          ` : `
          <div>
            <div style="font-size: 17.8px; font-weight: 900; letter-spacing: 0.7px; margin-bottom: 2px;">
              MERCI DE VOTRE VISITE
            </div>
            <div style="font-size: 15px; font-weight: 900;">
              A BIENTOT !
            </div>
          </div>
          `}
          <div style="font-size: 10.9px; margin-top: 6px; color: #666; font-weight: 900;">
            www.JLprod.be
          </div>
          
          <div style="margin-top: 8px; padding-top: 8px; border-top: 2px solid #000; background-color: #F3F4F6; padding: 6px; margin: 8px -8px 0 -8px;">
            <div style="font-size: 11px; font-weight: 900; margin-bottom: 2px;">
              ${isInvoice ? 'DOCUMENT NON-FISCAL' : 'TICKET NON-FISCAL'}
            </div>
            <div style="font-size: 10px; font-weight: 900;">
              POUR INFORMATION UNIQUEMENT
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

async function exportAndArchiveSales() {
  try {
    toast.info('Préparation de l\'archive des ventes...');
    
    // Récupérer toutes les ventes avec leurs items et clients
    const { data: sales, error } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items(*),
        customers(*)
      `)
      .order('date', { ascending: true });

    if (error) throw error;

    const date = new Date().toISOString().split('T')[0];
    
    // Créer un fichier ZIP avec JSZip
    const zip = new JSZip();
    
    // 1. Ajouter l'archive JSON complète
    const archive = {
      export_date: new Date().toISOString(),
      total_sales: sales?.length || 0,
      warning: 'CONSERVATION OBLIGATOIRE - LOI BELGE: Ces données doivent être conservées pendant 7 ans minimum à des fins fiscales et légales.',
      legal_notice: 'Ce fichier contient des données fiscales. Ne pas modifier. En cas de contrôle fiscal, ce fichier doit être présenté aux autorités compétentes.',
      sales: sales || [],
    };

    zip.file('donnees-ventes.json', JSON.stringify(archive, null, 2));

    // 2. Ajouter le fichier CSV pour Excel
    const csvRows: string[] = [];
    csvRows.push('# ARCHIVE VENTES - CONSERVATION OBLIGATOIRE 7 ANS (LOI BELGE)');
    csvRows.push('# Export du: ' + new Date().toISOString());
    csvRows.push('');
    csvRows.push('N° Vente;Date;Type;Client;Articles;Sous-total HT;TVA;Total TTC;Paiement;Statut');
    
    sales?.forEach(sale => {
      const items = sale.sale_items?.length || 0;
      const customer = sale.customers?.name || '';
      const type = sale.is_invoice ? 'Facture' : 'Ticket';
      const status = sale.is_cancelled ? 'ANNULÉE' : 'Valide';
      
      csvRows.push(
        `${sale.sale_number};${new Date(sale.date).toLocaleString('fr-BE')};${type};${customer};${items};${sale.subtotal.toFixed(2)};${sale.total_vat.toFixed(2)};${sale.total.toFixed(2)};${sale.payment_method};${status}`
      );
    });

    zip.file('resume-ventes.csv', '\ufeff' + csvRows.join('\n'));

    // 3. Créer un dossier "tickets" et ajouter chaque ticket en HTML
    const ticketsFolder = zip.folder('tickets');
    
    if (ticketsFolder && sales) {
      for (const sale of sales) {
        const ticketHTML = generateTicketHTML(sale);
        const filename = `${sale.sale_number.replace(/[/\\]/g, '-')}.html`;
        ticketsFolder.file(filename, ticketHTML);
      }
    }

    // 4. Ajouter un fichier README
    const readme = `ARCHIVE DES VENTES
==================

Date d'export: ${new Date().toLocaleString('fr-BE')}
Nombre de ventes: ${sales?.length || 0}

⚖️ OBLIGATION LÉGALE BELGE
---------------------------
Ces données doivent être conservées pendant 7 ans minimum conformément à la législation fiscale belge.
En cas de contrôle du SPF Finances, vous devrez présenter ces archives.

CONTENU DE L'ARCHIVE
---------------------
1. donnees-ventes.json : Données complètes au format JSON
2. resume-ventes.csv : Résumé des ventes au format CSV (pour Excel)
3. tickets/ : Tous les tickets de caisse au format HTML

Pour consulter un ticket, ouvrez le fichier HTML correspondant dans un navigateur web.

IMPORTANT: Ne pas modifier ces fichiers.
`;

    zip.file('LISEZMOI.txt', readme);

    // Générer le ZIP et télécharger
    toast.info('Génération de l\'archive ZIP...');
    
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });

    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `archive-ventes-${date}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Archive ZIP téléchargée avec ${sales?.length || 0} tickets`);
    
    // Supprimer les ventes (sauf celles de la journée en cours)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { error: deleteError } = await supabase
      .from('sales')
      .delete()
      .lt('date', today.toISOString());

    if (deleteError) throw deleteError;

    toast.success('Base de données nettoyée - Espace libéré');
    
    return true;
  } catch (error) {
    console.error('Error archiving sales:', error);
    toast.error('Erreur lors de l\'archivage');
    return false;
  }
}

export function printReportZ() {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Veuillez autoriser les popups pour imprimer');
    return;
  }

  const reportContent = document.getElementById('report-z-content');
  if (!reportContent) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Rapport Z</title>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          @page {
            size: 80mm auto;
            margin: 0;
          }
          
          body {
            font-family: 'Courier New', monospace;
            font-size: 11px;
            line-height: 1.5;
            margin: 0;
            padding: 0;
            width: 80mm;
            max-width: 302px;
            background: white;
            color: black;
          }
          
          #report-z-content {
            width: 100%;
            padding: 8px;
            background: white;
            color: black;
          }
          
          .text-center {
            text-align: center !important;
          }
          
          @media print {
            body {
              width: 80mm;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            #report-z-content {
              page-break-inside: avoid;
            }
            
            .text-center {
              text-align: center !important;
            }
          }
        </style>
      </head>
      <body>
        ${reportContent.innerHTML}
      </body>
    </html>
  `);
  
  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }, 250);
}

export function CloseDayDialog({ open, onOpenChange, onConfirm, reportData, todayReport }: CloseDayDialogProps) {
  const [amount, setAmount] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [archiveAndDelete, setArchiveAndDelete] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const expectedCash = todayReport ? todayReport.opening_amount + reportData.totalCash : reportData.totalCash;
  const difference = amount ? parseFloat(amount) - expectedCash : 0;

  const handleContinue = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return;
    }
    setShowReport(true);
  };

  const handleConfirmClose = async () => {
    const parsedAmount = parseFloat(amount);
    setShowConfirm(false);
    
    if (archiveAndDelete) {
      setIsArchiving(true);
      const success = await exportAndArchiveSales();
      setIsArchiving(false);
      
      if (!success) {
        toast.error('Clôture annulée suite à l\'erreur d\'archivage');
        return;
      }
    }
    
    onConfirm(parsedAmount, archiveAndDelete);
    setAmount('');
    setShowReport(false);
    setArchiveAndDelete(false);
    onOpenChange(false);
  };

  const handlePrint = () => {
    printReportZ();
  };

  if (showReport) {
    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-sm bg-white border-2 border-destructive p-0">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle className="text-destructive font-bold text-center">RAPPORT Z - CLOTURE FISCALE</DialogTitle>
              <DialogDescription className="text-center text-destructive/80">
                ⚠️ Action irréversible
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[70vh]">
              <ReportZContent 
                reportData={reportData}
                todayReport={todayReport}
                closingAmount={parseFloat(amount)}
                difference={difference}
              />
            </ScrollArea>

            <div className="p-4 border-t bg-muted/30 flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReport(false);
                  setAmount('');
                }}
                className="flex-1 h-12 font-semibold"
              >
                Retour
              </Button>
              <Button
                onClick={handlePrint}
                variant="outline"
                className="h-12 px-4"
              >
                <Printer className="h-5 w-5" />
              </Button>
              <Button
                onClick={() => setShowConfirm(true)}
                className="flex-1 h-12 bg-destructive hover:bg-destructive/90 text-white font-bold"
              >
                Clôturer définitivement
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent className="max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Confirmer la clôture
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p>Cette action est irréversible. La journée sera définitivement fermée et le rapport Z sera enregistré.</p>
                
                {difference !== 0 && (
                  <div className={`p-3 rounded ${difference > 0 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                    <p className="font-semibold">
                      Écart de caisse détecté: {difference > 0 ? '+' : ''}{difference.toFixed(2)}€
                    </p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                    <Checkbox 
                      id="archive-delete" 
                      checked={archiveAndDelete}
                      onCheckedChange={(checked) => setArchiveAndDelete(checked as boolean)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor="archive-delete" className="text-sm font-semibold cursor-pointer flex items-center gap-2">
                        <Archive className="h-4 w-4" />
                        Archiver et supprimer les ventes anciennes
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Créer une archive JSON des ventes et libérer de l'espace en base de données (conserve la journée en cours).
                      </p>
                    </div>
                  </div>

                  {archiveAndDelete && (
                    <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-2">
                          <p className="text-sm font-bold text-amber-900">
                            ⚖️ OBLIGATION LÉGALE BELGE
                          </p>
                          <p className="text-xs text-amber-800">
                            Vous devez <strong>conserver ce fichier pendant 7 ans minimum</strong> conformément à la législation fiscale belge. En cas de contrôle du SPF Finances, vous devrez présenter ces archives.
                          </p>
                          <p className="text-xs text-amber-800 font-semibold">
                            📥 Le fichier sera téléchargé sur votre ordinateur. Conservez-le en lieu sûr !
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isArchiving}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmClose}
                disabled={isArchiving}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isArchiving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Archivage en cours...
                  </>
                ) : (
                  <>
                    {archiveAndDelete && <Download className="h-4 w-4 mr-2" />}
                    Confirmer la clôture
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-destructive font-bold text-2xl flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Fermer la journée
          </DialogTitle>
          <DialogDescription>
            Saisissez le montant total des espèces en caisse
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="closing-amount" className="text-base font-semibold">
              Montant de clôture (espèces)
            </Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="closing-amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 text-2xl h-16 font-bold text-center"
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>

          {todayReport && amount && (
            <div className="space-y-2 bg-muted/30 p-4 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Espèces attendues:</span>
                <span className="font-bold">{expectedCash.toFixed(2)}€</span>
              </div>
              <div className={`flex justify-between text-base font-bold ${difference === 0 ? 'text-accent' : difference > 0 ? 'text-primary' : 'text-destructive'}`}>
                <span>Écart:</span>
                <span>{difference > 0 ? '+' : ''}{difference.toFixed(2)}€</span>
              </div>
            </div>
          )}

          <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/30">
            <p className="text-sm text-destructive font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Attention: Action irréversible
            </p>
            <p className="text-xs text-destructive/80 mt-1">
              La clôture de journée génère un rapport Z fiscal qui ne peut pas être annulé.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setAmount('');
            }}
            className="flex-1 h-12 font-semibold"
          >
            Annuler
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!amount || parseFloat(amount) < 0}
            className="flex-1 h-12 bg-destructive hover:bg-destructive/90 text-white font-bold"
          >
            Continuer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
