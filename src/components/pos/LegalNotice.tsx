import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface LegalNoticeProps {
  variant?: "default" | "destructive";
  compact?: boolean;
}

export function LegalNotice({ variant = "default", compact = false }: LegalNoticeProps) {
  if (compact) {
    return (
      <div className="text-center text-xs text-muted-foreground space-y-1 border-t pt-2">
        <p className="text-[10px] font-semibold">Conservation obligatoire 10 ans • Art. 315bis CIR92</p>
      </div>
    );
  }

  return (
    <Alert variant={variant}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="font-bold">Obligation légale</AlertTitle>
      <AlertDescription className="text-sm">
        <p className="text-xs font-semibold">Conservation des données : 10 ans minimum (Art. 315bis CIR92)</p>
      </AlertDescription>
    </Alert>
  );
}
