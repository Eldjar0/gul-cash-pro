import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface LegalNoticeProps {
  variant?: "default" | "destructive";
  compact?: boolean;
}

export function LegalNotice({ variant = "destructive", compact = false }: LegalNoticeProps) {
  if (compact) {
    return (
      <div className="text-center text-xs text-muted-foreground space-y-1 border-t pt-2">
        <p className="font-bold uppercase">Document non-fiscal</p>
        <p>Outil de gestion interne - Ne remplace pas le carnet de caisse officiel</p>
        <p className="text-[10px]">Conservation obligatoire 7 ans • JLprod v1.0</p>
      </div>
    );
  }

  return (
    <Alert variant={variant}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="font-bold">⚠️ Document non-fiscal</AlertTitle>
      <AlertDescription className="text-sm space-y-1">
        <p>
          Ce document est généré par un <strong>outil de gestion interne non certifié</strong> par le SPF Finances de Belgique.
        </p>
        <p>
          Il ne remplace <strong>PAS</strong> le carnet de caisse officiel ou un système de caisse enregistreuse certifié.
        </p>
        <p className="text-xs mt-2">
          Les données doivent être reportées manuellement dans votre comptabilité officielle.
        </p>
      </AlertDescription>
    </Alert>
  );
}
