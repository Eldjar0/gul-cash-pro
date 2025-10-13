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
          <title>Rapport X</title>
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
      <DialogContent className="max-w-sm bg-white border-2 border-primary p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-primary font-bold text-center">RAPPORT X - CONSULTATION</DialogTitle>
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
              fontSize: '18px',
              lineHeight: '1.3',
              padding: '8px',
              paddingRight: '24px',
              fontWeight: '900',
              overflow: 'hidden',
              boxSizing: 'border-box'
            }}
          >
            {/* Géant X */}
            <div className="text-center mb-2">
              <div style={{ 
                fontSize: '140px',
                fontWeight: '900',
                lineHeight: '1',
                color: '#3B82F6',
                textShadow: '4px 4px 0px rgba(0,0,0,0.1)'
              }}>
                X
              </div>
            </div>

            {/* En-tête société */}
            <div className="text-center" style={{ fontSize: '14px', marginBottom: '6px', fontWeight: '900' }}>
              <div style={{ lineHeight: '1.2' }}>
                <div style={{ fontWeight: '900' }}>{settings.name}</div>
                <div style={{ fontWeight: '900' }}>{settings.address}</div>
                <div style={{ fontWeight: '900' }}>{settings.postal_code} {settings.city}</div>
                {settings.phone && <div style={{ fontWeight: '900' }}>Tel: {settings.phone}</div>}
                <div style={{ marginTop: '1px', fontWeight: '900' }}>TVA: {settings.vat_number}</div>
              </div>
            </div>

            <div style={{ borderTop: '2px dashed #000', margin: '6px 0' }}></div>

            {/* Type de rapport */}
            <div className="text-center" style={{ fontSize: '14px', marginBottom: '6px', fontWeight: '900', backgroundColor: '#DBEAFE', padding: '8px', margin: '0 -8px 6px -8px' }}>
              <div style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '0.7px', marginBottom: '2px', color: '#3B82F6' }}>
                RAPPORT X
              </div>
              <div style={{ fontSize: '12px', color: '#2563EB', fontWeight: '900' }}>
                (CONSULTATION INTERMEDIAIRE)
              </div>
              <div style={{ fontSize: '11px', color: '#666', fontWeight: '900', marginTop: '2px' }}>
                Ne remet pas les compteurs à zéro
              </div>
              <div style={{ marginTop: '4px', fontSize: '14px', fontWeight: '900' }}>
                Date: {new Date().toLocaleDateString('fr-BE')}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '900' }}>
                Heure: {new Date().toLocaleTimeString('fr-BE')}
              </div>
            </div>

            <div style={{ borderTop: '2px dashed #000', margin: '6px 0' }}></div>

            {/* Ventes */}
            <div style={{ marginBottom: '6px', paddingRight: '24px' }}>
              <div style={{ fontSize: '15px', fontWeight: '900', marginBottom: '4px' }}>
                RECAPITULATIF DES VENTES
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontWeight: '900' }}>
                <span style={{ fontWeight: '900' }}>Nombre de transactions:</span>
                <span style={{ fontWeight: '900' }}>{reportData.salesCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: '900', color: '#3B82F6', gap: '8px' }}>
                <span style={{ fontWeight: '900' }}>TOTAL VENTES:</span>
                <span style={{ whiteSpace: 'nowrap', fontWeight: '900' }}>{reportData.totalSales.toFixed(2)}€</span>
              </div>
            </div>

            <div style={{ borderTop: '2px solid #000', margin: '6px 0' }}></div>

            {/* Moyens de paiement */}
            <div style={{ marginBottom: '6px', paddingRight: '24px' }}>
              <div style={{ fontSize: '15px', fontWeight: '900', marginBottom: '4px' }}>
                MOYENS DE PAIEMENT
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '14px', fontWeight: '900' }}>
                <span style={{ fontWeight: '900' }}>Espèces</span>
                <span style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>{reportData.totalCash.toFixed(2)}€</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '14px', fontWeight: '900' }}>
                <span style={{ fontWeight: '900' }}>Carte bancaire</span>
                <span style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>{reportData.totalCard.toFixed(2)}€</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '900' }}>
                <span style={{ fontWeight: '900' }}>Paiement mobile</span>
                <span style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>{reportData.totalMobile.toFixed(2)}€</span>
              </div>
            </div>

            <div style={{ borderTop: '2px dashed #000', margin: '6px 0' }}></div>

            {/* TVA */}
            <div style={{ marginBottom: '6px', paddingRight: '24px', backgroundColor: '#FEF3C7', padding: '6px', margin: '0 -8px 6px -8px', border: '2px solid #F59E0B' }}>
              <div style={{ fontSize: '15px', fontWeight: '900', marginBottom: '4px' }}>
                DETAIL TVA
              </div>
              {Object.entries(reportData.vatByRate)
                .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
                .map(([rate, amounts]) => (
                <div key={rate} style={{ marginBottom: '4px', fontSize: '13px', fontWeight: '900' }}>
                  <div style={{ fontWeight: '900', fontSize: '14px' }}>TVA {parseFloat(rate).toFixed(2)}%</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px', fontWeight: '900' }}>
                    <span style={{ fontWeight: '900' }}>Base HT:</span>
                    <span style={{ whiteSpace: 'nowrap', fontWeight: '900' }}>{amounts.totalHT.toFixed(2)}€</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px', fontWeight: '900' }}>
                    <span style={{ fontWeight: '900' }}>Montant TVA:</span>
                    <span style={{ whiteSpace: 'nowrap', fontWeight: '900' }}>{amounts.totalVAT.toFixed(2)}€</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px', fontWeight: '900', borderTop: '1px solid #F59E0B', paddingTop: '2px', marginTop: '2px' }}>
                    <span style={{ fontWeight: '900' }}>Total TTC:</span>
                    <span style={{ whiteSpace: 'nowrap', fontWeight: '900' }}>{(amounts.totalHT + amounts.totalVAT).toFixed(2)}€</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '2px solid #000', margin: '6px 0' }}></div>

            {/* Totaux récapitulatifs */}
            <div style={{ marginBottom: '6px', paddingRight: '24px', backgroundColor: '#E0F2FE', padding: '8px', margin: '0 -8px 6px -8px', border: '2px solid #0EA5E9' }}>
              <div style={{ fontSize: '15px', fontWeight: '900', marginBottom: '6px', textAlign: 'center', color: '#0369A1' }}>
                TOTAUX RECAPITULATIFS
              </div>
              
              {/* Total Hors TVA */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '15px', fontWeight: '900', paddingBottom: '3px' }}>
                <span style={{ fontWeight: '900' }}>Total Hors TVA:</span>
                <span style={{ whiteSpace: 'nowrap', fontWeight: '900' }}>
                  {Object.values(reportData.vatByRate).reduce((sum, amounts) => sum + amounts.totalHT, 0).toFixed(2)}€
                </span>
              </div>
              
              {/* Total TVA */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '15px', fontWeight: '900', paddingBottom: '3px' }}>
                <span style={{ fontWeight: '900' }}>Total TVA:</span>
                <span style={{ whiteSpace: 'nowrap', fontWeight: '900' }}>
                  {Object.values(reportData.vatByRate).reduce((sum, amounts) => sum + amounts.totalVAT, 0).toFixed(2)}€
                </span>
              </div>
              
              {/* Total TVAC */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '900', borderTop: '2px solid #0EA5E9', paddingTop: '6px', marginTop: '3px', color: '#0369A1' }}>
                <span style={{ fontWeight: '900' }}>TOTAL TVAC:</span>
                <span style={{ whiteSpace: 'nowrap', fontWeight: '900' }}>{reportData.totalSales.toFixed(2)}€</span>
              </div>
            </div>

            <div style={{ borderTop: '2px solid #000', margin: '6px 0' }}></div>

            {/* État caisse */}
            {todayReport && (
              <div style={{ marginBottom: '6px', paddingRight: '24px' }}>
                <div style={{ fontSize: '15px', fontWeight: '900', marginBottom: '4px' }}>
                  ETAT DE CAISSE ACTUEL
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '14px', fontWeight: '900' }}>
                  <span style={{ fontWeight: '900' }}>Fond de caisse ouverture:</span>
                  <span style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>{todayReport.opening_amount.toFixed(2)}€</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '14px', fontWeight: '900' }}>
                  <span style={{ fontWeight: '900' }}>Espèces journée:</span>
                  <span style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>{reportData.totalCash.toFixed(2)}€</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '900', borderTop: '1px dashed #000', paddingTop: '2px', marginTop: '2px', color: '#3B82F6' }}>
                  <span style={{ fontWeight: '900' }}>Espèces attendues:</span>
                  <span style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>{expectedCash.toFixed(2)}€</span>
                </div>
              </div>
            )}

            <div style={{ borderTop: '3px double #000', margin: '8px 0' }}></div>

            {/* AVERTISSEMENT NON-FISCAL */}
            <div style={{ fontSize: '11px', fontWeight: '900', backgroundColor: '#DBEAFE', padding: '8px', border: '2px solid #3B82F6', marginBottom: '6px' }}>
              <div style={{ fontWeight: '900', marginBottom: '4px', textAlign: 'center', fontSize: '13px', color: '#2563EB' }}>
                RAPPORT NON-FISCAL
              </div>
              <div style={{ fontWeight: '900', fontSize: '12px', textAlign: 'center', marginBottom: '4px' }}>
                USAGE INTERNE
              </div>
            </div>

            {/* Footer */}
            <div style={{ borderTop: '2px dashed #000', marginTop: '8px', paddingTop: '8px' }}>
              <div className="text-center" style={{ fontSize: '12px', color: '#666', fontWeight: '900' }}>
                www.JLprod.be
              </div>
              <div className="text-center" style={{ fontSize: '10px', color: '#999', fontWeight: '900', marginTop: '4px' }}>
                Document non-fiscal - Conservation interne recommandée
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
            className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white font-bold"
          >
            <Printer className="h-5 w-5 mr-2" />
            IMPRIMER
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
