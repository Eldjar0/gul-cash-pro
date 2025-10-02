import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Euro, CreditCard, Smartphone, Receipt, Printer } from 'lucide-react';
import { ReportData } from '@/hooks/useDailyReports';
import { DailyReport } from '@/hooks/useDailyReports';
import { COMPANY_INFO } from '@/data/company';

interface ReportXDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportData: ReportData;
  todayReport: DailyReport | null;
}

export function printReportX() {
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
            
            #report-x-content {
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

export function ReportXDialog({ open, onOpenChange, reportData, todayReport }: ReportXDialogProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-white border-2 border-primary p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-primary font-bold text-center">RAPPORT INTERMEDIAIRE</DialogTitle>
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
                <div style={{ fontWeight: '900' }}>{COMPANY_INFO.name}</div>
                <div style={{ fontWeight: '900' }}>{COMPANY_INFO.address}</div>
                <div style={{ fontWeight: '900' }}>{COMPANY_INFO.postalCode} {COMPANY_INFO.city}</div>
                {COMPANY_INFO.phone && <div style={{ fontWeight: '900' }}>Tel: {COMPANY_INFO.phone}</div>}
                <div style={{ marginTop: '1px', fontWeight: '900' }}>TVA: {COMPANY_INFO.vat}</div>
              </div>
            </div>

            <div style={{ borderTop: '2px dashed #000', margin: '6px 0' }}></div>

            {/* Type de rapport */}
            <div className="text-center" style={{ fontSize: '14px', marginBottom: '6px', fontWeight: '900' }}>
              <div style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '0.7px', marginBottom: '2px' }}>
                RAPPORT X
              </div>
              <div style={{ fontSize: '12px', color: '#666', fontWeight: '900' }}>
                (Rapport intermédiaire non fiscal)
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
            <div style={{ marginBottom: '6px', paddingRight: '24px' }}>
              <div style={{ fontSize: '15px', fontWeight: '900', marginBottom: '4px' }}>
                DETAIL TVA
              </div>
              {Object.entries(reportData.vatByRate).map(([rate, amounts]) => (
                <div key={rate} style={{ marginBottom: '4px', fontSize: '13px', fontWeight: '900' }}>
                  <div style={{ fontWeight: '900' }}>TVA {parseFloat(rate).toFixed(0)}%</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px', fontWeight: '900' }}>
                    <span style={{ fontWeight: '900' }}>Base HT:</span>
                    <span style={{ whiteSpace: 'nowrap', fontWeight: '900' }}>{amounts.totalHT.toFixed(2)}€</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px', fontWeight: '900' }}>
                    <span style={{ fontWeight: '900' }}>Montant TVA:</span>
                    <span style={{ whiteSpace: 'nowrap', fontWeight: '900' }}>{amounts.totalVAT.toFixed(2)}€</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '2px dashed #000', margin: '6px 0' }}></div>

            {/* Caisse */}
            {todayReport && (
              <div style={{ marginBottom: '6px', paddingRight: '24px' }}>
                <div style={{ fontSize: '15px', fontWeight: '900', marginBottom: '4px' }}>
                  ETAT DE LA CAISSE
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '14px', fontWeight: '900' }}>
                  <span style={{ fontWeight: '900' }}>Ouverture:</span>
                  <span style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>{todayReport.opening_amount.toFixed(2)}€</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '14px', fontWeight: '900' }}>
                  <span style={{ fontWeight: '900' }}>Espèces du jour:</span>
                  <span style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>{reportData.totalCash.toFixed(2)}€</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '900', color: '#3B82F6', gap: '8px', borderTop: '2px solid #000', paddingTop: '4px', marginTop: '4px' }}>
                  <span style={{ fontWeight: '900' }}>Espèces attendues:</span>
                  <span style={{ whiteSpace: 'nowrap', fontWeight: '900' }}>{(todayReport.opening_amount + reportData.totalCash).toFixed(2)}€</span>
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{ borderTop: '2px dashed #000', marginTop: '8px', paddingTop: '8px' }}>
              <div className="text-center" style={{ fontSize: '12px', color: '#666', fontWeight: '900' }}>
                www.JLprod.be
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
            onClick={() => {
              printReportX();
              setTimeout(() => {
                onOpenChange(false);
              }, 500);
            }}
            className="flex-1 h-12 bg-accent hover:bg-accent/90 text-white font-bold"
          >
            <Printer className="h-5 w-5 mr-2" />
            IMPRIMER
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
