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

export function ReportXDialog({ open, onOpenChange, reportData, todayReport }: ReportXDialogProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border-2 border-primary p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-primary font-bold text-2xl flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Rapport X - Intermédiaire
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] p-4">
          <div className="space-y-4 font-mono text-sm">
            {/* En-tête */}
            <div className="text-center border-b pb-3">
              <h3 className="font-bold text-lg">{COMPANY_INFO.name}</h3>
              <p className="text-xs">{COMPANY_INFO.address}</p>
              <p className="text-xs">{COMPANY_INFO.postalCode} {COMPANY_INFO.city}</p>
              <p className="text-xs">TVA: {COMPANY_INFO.vat}</p>
            </div>

            {/* Type de rapport */}
            <div className="text-center border-b pb-3">
              <h2 className="font-bold text-xl">RAPPORT X</h2>
              <p className="text-xs text-muted-foreground">(Rapport intermédiaire non fiscal)</p>
              <p className="text-sm mt-2">
                Date: {new Date().toLocaleDateString('fr-BE')}
              </p>
              <p className="text-sm">
                Heure: {new Date().toLocaleTimeString('fr-BE')}
              </p>
            </div>

            {/* Ventes */}
            <div className="space-y-2 border-b pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Récapitulatif des ventes
              </h3>
              <div className="flex justify-between">
                <span>Nombre de transactions:</span>
                <span className="font-bold">{reportData.salesCount}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-primary">
                <span>TOTAL VENTES:</span>
                <span>{reportData.totalSales.toFixed(2)}€</span>
              </div>
            </div>

            {/* Moyens de paiement */}
            <div className="space-y-2 border-b pb-3">
              <h3 className="font-bold text-base">Moyens de paiement</h3>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  Espèces
                </span>
                <span className="font-bold">{reportData.totalCash.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Carte bancaire
                </span>
                <span className="font-bold">{reportData.totalCard.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Paiement mobile
                </span>
                <span className="font-bold">{reportData.totalMobile.toFixed(2)}€</span>
              </div>
            </div>

            {/* TVA */}
            <div className="space-y-2 border-b pb-3">
              <h3 className="font-bold text-base">Détail TVA</h3>
              {Object.entries(reportData.vatByRate).map(([rate, amounts]) => (
                <div key={rate} className="space-y-1 text-xs">
                  <div className="font-semibold">TVA {parseFloat(rate).toFixed(0)}%</div>
                  <div className="flex justify-between pl-4">
                    <span>Base HT:</span>
                    <span>{amounts.totalHT.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between pl-4">
                    <span>Montant TVA:</span>
                    <span>{amounts.totalVAT.toFixed(2)}€</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Caisse */}
            {todayReport && (
              <div className="space-y-2">
                <h3 className="font-bold text-base">État de la caisse</h3>
                <div className="flex justify-between">
                  <span>Ouverture:</span>
                  <span className="font-bold">{todayReport.opening_amount.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between">
                  <span>Espèces du jour:</span>
                  <span className="font-bold">{reportData.totalCash.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-primary">
                  <span>Espèces attendues:</span>
                  <span>{(todayReport.opening_amount + reportData.totalCash).toFixed(2)}€</span>
                </div>
              </div>
            )}
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
            className="flex-1 h-12 bg-accent hover:bg-accent/90 text-white font-bold"
          >
            <Printer className="h-5 w-5 mr-2" />
            Imprimer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
