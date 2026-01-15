import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Printer } from 'lucide-react';
import { ReportData, DailyReport } from '@/hooks/useDailyReports';
import { useCompanySettings } from '@/hooks/useCompanySettings';

interface ReportXDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportData: ReportData;
  todayReport: DailyReport | null;
}

export function ReportXDialog({ open, onOpenChange, reportData, todayReport }: ReportXDialogProps) {
  const expectedCash = todayReport ? todayReport.opening_amount + reportData.totalCash : reportData.totalCash;
  const { settings } = useCompanySettings();

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Veuillez autoriser les popups pour imprimer');
      return;
    }

    const reportContent = document.getElementById('report-x-content');
    if (!reportContent) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rapport X Intermédiaire</title>
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
              line-height: 1.4;
              margin: 0;
              padding: 0;
              width: 80mm;
              max-width: 302px;
              background: white;
              color: black;
            }
            
            #report-x-content {
              width: 100%;
              padding: 8px;
              background: white;
              color: black;
            }
            
            @media print {
              body {
                width: 80mm;
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              #report-x-content {
                page-break-inside: avoid;
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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-white border-2 border-blue-500 p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-blue-600 font-bold text-center">RAPPORT X - CONSULTATION INTERMÉDIAIRE</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div 
            id="report-x-content"
            className="font-mono bg-white text-black"
            style={{ 
              width: '80mm',
              maxWidth: '302px',
              margin: '0 auto',
              fontFamily: "'Barlow Semi Condensed', 'Arial Narrow', Arial, sans-serif",
              fontSize: '16px',
              lineHeight: '1.4',
              padding: '8px',
              paddingRight: '16px',
              fontWeight: '700',
              overflow: 'hidden',
              boxSizing: 'border-box'
            }}
          >
            {/* En-tête société - OBLIGATOIRE */}
            <div className="text-center" style={{ fontSize: '13px', marginBottom: '8px', fontWeight: '700', borderBottom: '2px solid #000', paddingBottom: '4px' }}>
              <div style={{ fontSize: '16px', fontWeight: '900', marginBottom: '2px' }}>{settings.name}</div>
              <div>{settings.address}</div>
              <div>{settings.postal_code} {settings.city}</div>
              <div style={{ marginTop: '2px' }}>N° TVA: {settings.vat_number}</div>
            </div>

      {/* Type de rapport - MENTION OBLIGATOIRE */}
      <div className="text-center" style={{ fontSize: '13px', marginBottom: '8px', fontWeight: '900', backgroundColor: '#E0F2FE', padding: '8px', margin: '0 -8px 8px -8px', border: '2px solid #3B82F6' }}>
        <div style={{ fontSize: '32px', fontWeight: '900', lineHeight: '1', color: '#3B82F6', marginBottom: '4px' }}>
          X
        </div>
        <div style={{ fontSize: '14px', fontWeight: '900', color: '#1E40AF' }}>
          RAPPORT INTERMEDIAIRE
        </div>
        <div style={{ fontSize: '11px', color: '#666', fontWeight: '700', marginTop: '2px' }}>
          Non fiscal - Usage interne
        </div>
      </div>

            {/* Date et heure - OBLIGATOIRE */}
            <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', borderBottom: '1px dashed #000', paddingBottom: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Date:</span>
                <span style={{ fontWeight: '900' }}>{new Date().toLocaleDateString('fr-BE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Heure:</span>
                <span style={{ fontWeight: '900' }}>{new Date().toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
            </div>

            {/* Récapitulatif ventes - OBLIGATOIRE */}
            <div style={{ marginBottom: '8px', paddingRight: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '900', marginBottom: '4px', borderBottom: '1px solid #000' }}>
                RECAPITULATIF VENTES
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '13px' }}>
                <span>Nombre de transactions:</span>
                <span style={{ fontWeight: '900' }}>{reportData.salesCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '900', color: '#3B82F6', borderTop: '1px solid #3B82F6', paddingTop: '4px', marginTop: '4px' }}>
                <span>TOTAL TTC:</span>
                <span style={{ whiteSpace: 'nowrap' }}>{reportData.totalSales.toFixed(2)}€</span>
              </div>
            </div>

            <div style={{ borderTop: '2px solid #000', margin: '8px 0' }}></div>

            {/* Moyens de paiement - OBLIGATOIRE LOI BELGE */}
            <div style={{ marginBottom: '8px', paddingRight: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '900', marginBottom: '4px', borderBottom: '1px solid #000' }}>
                MOYENS DE PAIEMENT
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '13px' }}>
                <span>Espèces:</span>
                <span style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>{reportData.totalCash.toFixed(2)}€</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '13px' }}>
                <span>Carte bancaire:</span>
                <span style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>{reportData.totalCard.toFixed(2)}€</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span>Paiement mobile:</span>
                <span style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>{reportData.totalMobile.toFixed(2)}€</span>
              </div>
            </div>

            <div style={{ borderTop: '2px solid #000', margin: '8px 0' }}></div>

            {/* TVA par taux - OBLIGATOIRE LOI BELGE */}
            <div style={{ marginBottom: '8px', paddingRight: '16px', backgroundColor: '#FEF3C7', padding: '8px', margin: '0 -8px 8px -8px', border: '2px solid #F59E0B' }}>
              <div style={{ fontSize: '14px', fontWeight: '900', marginBottom: '4px', color: '#92400E' }}>
                DETAIL TVA PAR TAUX
              </div>
              {Object.entries(reportData.vatByRate).length === 0 ? (
                <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#666' }}>
                  Aucune vente enregistrée
                </div>
              ) : (
                Object.entries(reportData.vatByRate)
                  .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
                  .map(([rate, amounts]) => (
                    <div key={rate} style={{ marginBottom: '6px', fontSize: '12px' }}>
                      <div style={{ fontWeight: '900', fontSize: '13px', color: '#92400E' }}>
                        TVA {parseFloat(rate).toFixed(2)}%
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px' }}>
                        <span>Base HT:</span>
                        <span style={{ whiteSpace: 'nowrap', fontWeight: '900' }}>{amounts.totalHT.toFixed(2)}€</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px' }}>
                        <span>Montant TVA:</span>
                        <span style={{ whiteSpace: 'nowrap', fontWeight: '900' }}>{amounts.totalVAT.toFixed(2)}€</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px', borderTop: '1px solid #F59E0B', paddingTop: '2px', marginTop: '2px' }}>
                        <span>Total TTC:</span>
                        <span style={{ whiteSpace: 'nowrap', fontWeight: '900' }}>{(amounts.totalHT + amounts.totalVAT).toFixed(2)}€</span>
                      </div>
                    </div>
                  ))
              )}
            </div>

            {/* Totaux généraux - OBLIGATOIRE */}
            <div style={{ marginBottom: '8px', paddingRight: '16px', backgroundColor: '#E0F2FE', padding: '8px', margin: '0 -8px 8px -8px', border: '2px solid #3B82F6' }}>
              <div style={{ fontSize: '14px', fontWeight: '900', marginBottom: '4px', textAlign: 'center', color: '#1E40AF' }}>
                TOTAUX GENERAUX
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '13px' }}>
                <span>Total Hors TVA:</span>
                <span style={{ whiteSpace: 'nowrap', fontWeight: '900' }}>
                  {Object.values(reportData.vatByRate).reduce((sum, amounts) => sum + amounts.totalHT, 0).toFixed(2)}€
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '13px' }}>
                <span>Total TVA:</span>
                <span style={{ whiteSpace: 'nowrap', fontWeight: '900' }}>
                  {Object.values(reportData.vatByRate).reduce((sum, amounts) => sum + amounts.totalVAT, 0).toFixed(2)}€
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '900', borderTop: '2px solid #3B82F6', paddingTop: '4px', marginTop: '4px', color: '#1E40AF' }}>
                <span>TOTAL TTC:</span>
                <span style={{ whiteSpace: 'nowrap' }}>{reportData.totalSales.toFixed(2)}€</span>
              </div>
            </div>

            <div style={{ borderTop: '2px solid #000', margin: '8px 0' }}></div>

            {/* État de caisse actuel */}
            {todayReport && (
              <div style={{ marginBottom: '8px', paddingRight: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: '900', marginBottom: '4px', borderBottom: '1px solid #000' }}>
                  ETAT CAISSE ACTUEL
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '12px' }}>
                  <span>Fond d'ouverture:</span>
                  <span style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>{todayReport.opening_amount.toFixed(2)}€</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '12px' }}>
                  <span>+ Espèces journée:</span>
                  <span style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>{reportData.totalCash.toFixed(2)}€</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '900', borderTop: '1px solid #000', paddingTop: '2px', marginTop: '2px', color: '#16A34A' }}>
                  <span>= Espèces attendues:</span>
                  <span style={{ whiteSpace: 'nowrap' }}>{expectedCash.toFixed(2)}€</span>
                </div>
              </div>
            )}

            <div style={{ borderTop: '3px double #000', margin: '8px 0' }}></div>

            {/* MENTIONS LEGALES - OBLIGATOIRE */}
            <div style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#F3F4F6', padding: '6px', border: '1px solid #666', marginBottom: '8px' }}>
              <div style={{ fontWeight: '900', textAlign: 'center', marginBottom: '4px', color: '#374151' }}>
                ⚠️ RAPPORT NON FISCAL
              </div>
              <div style={{ fontSize: '10px', textAlign: 'center', marginBottom: '2px' }}>
                Usage interne uniquement
              </div>
              <div style={{ fontSize: '10px', textAlign: 'center' }}>
                Ne remplace pas le rapport Z obligatoire
              </div>
            </div>

            {/* Avertissement caisse */}
            <div style={{ fontSize: '10px', fontWeight: '700', backgroundColor: '#DBEAFE', padding: '6px', border: '1px solid #3B82F6', marginBottom: '8px' }}>
              <div style={{ fontWeight: '900', textAlign: 'center', marginBottom: '2px', fontSize: '11px', color: '#1E40AF' }}>
                ℹ️ INFORMATION
              </div>
              <div style={{ fontSize: '10px', textAlign: 'center' }}>
                Ce rapport ne clôture pas la journée
              </div>
              <div style={{ fontSize: '10px', textAlign: 'center' }}>
                Les compteurs ne sont pas remis à zéro
              </div>
            </div>

            {/* Footer */}
            <div style={{ borderTop: '2px dashed #000', marginTop: '8px', paddingTop: '6px' }}>
              <div className="text-center" style={{ fontSize: '9px', color: '#999', fontWeight: '700', marginTop: '2px' }}>
                Document commercial - Usage interne
              </div>
              <div className="text-center" style={{ fontSize: '9px', color: '#999', fontWeight: '700' }}>
                Conservation recommandée 10 ans
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className="p-4 border-t bg-muted/30 flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-12 font-semibold"
          >
            Fermer
          </Button>
          <Button
            onClick={handlePrint}
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold"
          >
            <Printer className="h-5 w-5 mr-2" />
            IMPRIMER
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}