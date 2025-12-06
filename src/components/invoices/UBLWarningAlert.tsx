import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UBLValidationResult } from '@/utils/validateUBL';

interface UBLWarningAlertProps {
  validation: UBLValidationResult | null;
}

export function UBLWarningAlert({ validation }: UBLWarningAlertProps) {
  if (!validation || (validation.errors.length === 0 && validation.warnings.length === 0)) {
    return null;
  }

  const hasErrors = validation.errors.length > 0;
  const hasWarnings = validation.warnings.length > 0;

  return (
    <Alert 
      variant={hasErrors ? "destructive" : "default"} 
      className={hasErrors ? "" : "border-amber-500 bg-amber-50 text-amber-900 dark:border-amber-500/50 dark:bg-amber-950/20 dark:text-amber-200"}
    >
      {hasErrors ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-amber-600" />
      )}
      <AlertTitle className="font-semibold">
        {hasErrors 
          ? `${validation.errors.length} champ(s) requis pour l'export UBL.BE` 
          : `${validation.warnings.length} recommandation(s) UBL.BE`
        }
      </AlertTitle>
      <AlertDescription className="mt-2">
        {hasErrors && (
          <div className="space-y-1 mb-2">
            {validation.errors.map((error, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-destructive font-medium">•</span>
                <span>{error.message}</span>
              </div>
            ))}
          </div>
        )}
        {hasWarnings && (
          <div className="space-y-1">
            {validation.warnings.map((warning, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm opacity-80">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                <span>{warning.message}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs mt-3 opacity-70">
          Ces informations sont nécessaires pour générer un fichier UBL.BE conforme depuis la page Documents.
        </p>
      </AlertDescription>
    </Alert>
  );
}
