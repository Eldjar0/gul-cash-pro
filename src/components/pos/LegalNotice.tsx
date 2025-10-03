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
        <p className="text-[10px]">Conservation obligatoire 7 ans • JLprod v1.0</p>
      </div>
    );
  }

  return (
    <Alert variant={variant}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="font-bold">Information</AlertTitle>
      <AlertDescription className="text-sm">
        <p className="text-xs">Conservation des données : 7 ans minimum</p>
      </AlertDescription>
    </Alert>
  );
}
