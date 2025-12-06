import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, AlertTriangle, CheckCircle2, FileDown, X } from 'lucide-react';
import { UBLValidationResult } from '@/utils/validateUBL';

interface UBLValidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  validationResults: Map<string, UBLValidationResult>;
  totalErrors: number;
  totalWarnings: number;
  onConfirmExport: () => void;
  isExporting?: boolean;
}

export function UBLValidationDialog({
  open,
  onOpenChange,
  validationResults,
  totalErrors,
  totalWarnings,
  onConfirmExport,
  isExporting
}: UBLValidationDialogProps) {
  const hasErrors = totalErrors > 0;
  const documentsArray = Array.from(validationResults.entries());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasErrors ? (
              <AlertCircle className="h-5 w-5 text-destructive" />
            ) : totalWarnings > 0 ? (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
            Validation UBL.BE
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 mb-4">
          <Badge variant={hasErrors ? "destructive" : "outline"} className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {totalErrors} erreur{totalErrors !== 1 ? 's' : ''}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 text-yellow-600">
            <AlertTriangle className="h-3 w-3" />
            {totalWarnings} avertissement{totalWarnings !== 1 ? 's' : ''}
          </Badge>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          {documentsArray.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucun document à valider
            </p>
          ) : (
            <div className="space-y-4">
              {documentsArray.map(([docId, result]) => (
                <div key={docId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{docId}</span>
                    {result.isValid ? (
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Valide
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <X className="h-3 w-3 mr-1" />
                        Erreurs
                      </Badge>
                    )}
                  </div>

                  {result.errors.length > 0 && (
                    <div className="space-y-1 mb-2">
                      {result.errors.map((error, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm text-destructive">
                          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                          <span>
                            <strong>[{error.code}]</strong> {error.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {result.warnings.length > 0 && (
                    <div className="space-y-1">
                      {result.warnings.map((warning, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm text-yellow-600">
                          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                          <span>
                            <strong>[{warning.code}]</strong> {warning.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {result.errors.length === 0 && result.warnings.length === 0 && (
                    <p className="text-sm text-green-600">
                      Aucun problème détecté
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button 
            onClick={onConfirmExport}
            disabled={hasErrors || isExporting}
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            {hasErrors 
              ? 'Corrigez les erreurs pour exporter' 
              : isExporting 
                ? 'Export en cours...' 
                : 'Exporter quand même'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
