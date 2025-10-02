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
import { ReportZContent } from './ReportZContent';

interface CloseDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (closingAmount: number) => void;
  reportData: ReportData;
  todayReport: DailyReport | null;
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
