import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Printer, RefreshCw, CheckCircle, XCircle, Info } from "lucide-react";
import { useElectronPrint } from "@/hooks/useElectronPrint";
import { toast } from "sonner";
export function PrinterSettings() {
  const {
    isElectron,
    printers,
    selectedPrinter,
    isLoading,
    loadPrinters,
    saveSelectedPrinter,
    testPrinter
  } = useElectronPrint();
  const [silentPrintEnabled, setSilentPrintEnabled] = useState(() => {
    return localStorage.getItem('silent_print_enabled') === 'true';
  });
  const handleSilentPrintToggle = (enabled: boolean) => {
    setSilentPrintEnabled(enabled);
    localStorage.setItem('silent_print_enabled', String(enabled));
    toast.success(enabled ? 'Impression silencieuse activée' : 'Impression silencieuse désactivée');
  };
  const handleTestPrint = async () => {
    const result = await testPrinter();
    if (result.success) {
      toast.success('Test d\'impression réussi !');
    } else {
      toast.error('Échec du test d\'impression');
    }
  };
  const handlePrinterChange = (printerName: string) => {
    saveSelectedPrinter(printerName);
    toast.success(`Imprimante sélectionnée: ${printerName}`);
  };
  if (!isElectron) {
    return <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Impression
          </CardTitle>
          <CardDescription>
            Configuration de l'imprimante thermique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Impression silencieuse non disponible</strong>
              <p className="mt-1 text-sm text-muted-foreground">
                L'impression silencieuse nécessite l'application de bureau Electron.
                Actuellement, vous utilisez la version web qui affiche la boîte de dialogue d'impression du navigateur.
              </p>
              <p className="mt-2 text-sm">
                <strong>Alternative :</strong> Utilisez Chrome en mode kiosk pour une impression semi-automatique :
              </p>
              
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>;
  }
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="h-5 w-5" />
          Impression
          <Badge variant="secondary" className="ml-2">
            <CheckCircle className="h-3 w-3 mr-1" />
            Electron
          </Badge>
        </CardTitle>
        <CardDescription>
          Configuration de l'imprimante thermique pour impression silencieuse
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Activation impression silencieuse */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="silent-print">Impression silencieuse</Label>
            <p className="text-sm text-muted-foreground">
              Imprimer automatiquement sans popup de confirmation
            </p>
          </div>
          <Switch id="silent-print" checked={silentPrintEnabled} onCheckedChange={handleSilentPrintToggle} />
        </div>

        {/* Sélection de l'imprimante */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="printer-select">Imprimante par défaut</Label>
            <Button variant="ghost" size="sm" onClick={loadPrinters} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
          <Select value={selectedPrinter} onValueChange={handlePrinterChange}>
            <SelectTrigger id="printer-select">
              <SelectValue placeholder="Sélectionner une imprimante" />
            </SelectTrigger>
            <SelectContent>
              {printers.map(printer => <SelectItem key={printer.name} value={printer.name}>
                  <div className="flex items-center gap-2">
                    <Printer className="h-4 w-4" />
                    <span>{printer.displayName || printer.name}</span>
                    {printer.isDefault && <Badge variant="outline" className="text-xs">
                        Par défaut
                      </Badge>}
                  </div>
                </SelectItem>)}
              {printers.length === 0 && <SelectItem value="" disabled>
                  Aucune imprimante trouvée
                </SelectItem>}
            </SelectContent>
          </Select>
        </div>

        {/* Test d'impression */}
        <div className="pt-4 border-t">
          <Button onClick={handleTestPrint} disabled={isLoading || !selectedPrinter} className="w-full">
            {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
            Imprimer une page de test
          </Button>
        </div>

        {/* Informations */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Astuce :</strong> Pour les imprimantes thermiques 80mm, 
            assurez-vous que le pilote est correctement installé et que 
            la largeur de papier est configurée à 80mm dans les propriétés de l'imprimante.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>;
}