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
import { Calendar, Euro, AlertTriangle, FileText, CreditCard, Smartphone, Receipt, Printer } from 'lucide-react';
import { ReportData, DailyReport } from '@/hooks/useDailyReports';
import { COMPANY_INFO } from '@/data/company';

interface CloseDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (closingAmount: number) => void;
  reportData: ReportData;
  todayReport: DailyReport | null;
}

export function CloseDayDialog({ open, onOpenChange, onConfirm, reportData, todayReport }: CloseDayDialogProps) {
  const [amount, setAmount] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const expectedCash = todayReport ? todayReport.opening_amount + reportData.totalCash : reportData.totalCash;
  const difference = amount ? parseFloat(amount) - expectedCash : 0;

  const handleContinue = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return;
    }
    setShowReport(true);
  };

  const handleConfirmClose = () => {
    const parsedAmount = parseFloat(amount);
    setShowConfirm(false);
    onConfirm(parsedAmount);
    setAmount('');
    setShowReport(false);
    onOpenChange(false);
  };

  const handlePrint = () => {
    window.print();
  };

  if (showReport) {
    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-md bg-white border-2 border-destructive p-0">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle className="text-destructive font-bold text-2xl flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Rapport Z - Clôture de journée
              </DialogTitle>
              <DialogDescription className="text-destructive/80">
                ⚠️ Ce rapport est irréversible et ferme définitivement la journée
              </DialogDescription>
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
                <div className="text-center border-b pb-3 bg-destructive/10 -mx-4 px-4 py-2">
                  <h2 className="font-bold text-xl text-destructive">RAPPORT Z</h2>
                  <p className="text-xs text-destructive/80">(Rapport de clôture fiscal)</p>
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
                  <h3 className="font-bold text-base">Détail TVA (Obligatoire BE)</h3>
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
                  <div className="space-y-2 border-b pb-3">
                    <h3 className="font-bold text-base">État de la caisse</h3>
                    <div className="flex justify-between">
                      <span>Ouverture:</span>
                      <span className="font-bold">{todayReport.opening_amount.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Espèces du jour:</span>
                      <span className="font-bold">{reportData.totalCash.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Espèces attendues:</span>
                      <span>{expectedCash.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Espèces comptées:</span>
                      <span>{parseFloat(amount).toFixed(2)}€</span>
                    </div>
                    <div className={`flex justify-between text-lg font-bold ${difference === 0 ? 'text-accent' : difference > 0 ? 'text-primary' : 'text-destructive'}`}>
                      <span>Écart:</span>
                      <span>{difference > 0 ? '+' : ''}{difference.toFixed(2)}€</span>
                    </div>
                  </div>
                )}

                {/* Conformité légale */}
                <div className="bg-muted p-3 rounded text-xs">
                  <p className="font-semibold mb-1">⚖️ Conformité légale Belgique</p>
                  <p className="text-muted-foreground">
                    Ce rapport Z constitue une clôture fiscale journalière conformément à la législation belge sur les systèmes de caisse enregistreuse.
                  </p>
                </div>
              </div>
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
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Confirmer la clôture
              </AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. La journée sera définitivement fermée et le rapport Z sera enregistré.
                {difference !== 0 && (
                  <div className={`mt-3 p-3 rounded ${difference > 0 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                    <p className="font-semibold">
                      Écart de caisse détecté: {difference > 0 ? '+' : ''}{difference.toFixed(2)}€
                    </p>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmClose}
                className="bg-destructive hover:bg-destructive/90"
              >
                Confirmer la clôture
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
