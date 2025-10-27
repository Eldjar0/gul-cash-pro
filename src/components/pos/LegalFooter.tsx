import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function LegalFooter() {
  return (
    <Alert className="mt-6 border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
      <AlertTriangle className="h-5 w-5 text-amber-600" />
      <AlertTitle className="text-lg font-bold text-amber-900 dark:text-amber-100">
        ⚖️ OBLIGATIONS LÉGALES BELGES
      </AlertTitle>
      <AlertDescription className="text-sm space-y-2 mt-2 text-amber-800 dark:text-amber-200">
        <p><strong>Conservation obligatoire :</strong> 10 ans (Art. 315bis CIR92)</p>
        <p><strong>Suppression de documents :</strong> INTERDITE après clôture journalière</p>
        <p><strong>Modification de documents :</strong> INTERDITE après émission</p>
        <p className="text-xs text-amber-900 dark:text-amber-100 mt-3 font-semibold pt-2 border-t border-amber-300">
          ⚠️ Sanctions : Amendes jusqu'à 25 000 € + poursuites pénales possibles
        </p>
      </AlertDescription>
    </Alert>
  );
}
