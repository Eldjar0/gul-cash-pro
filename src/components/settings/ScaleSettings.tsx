import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Scale, Wifi, WifiOff, RefreshCw, Info } from 'lucide-react';
import { toast } from 'sonner';
import { getDibalConfig, saveDibalConfig, isWebSerialSupported, DibalConfig, DibalMode } from '@/lib/dibalScale';
import { useDibalScale } from '@/hooks/useDibalScale';

export function ScaleSettings() {
  const { connected, weight, connect, disconnect, readOnce, supported } = useDibalScale({ autoPoll: true, intervalMs: 400 });
  const [config, setConfig] = useState<DibalConfig>(getDibalConfig());
  const [testWeight, setTestWeight] = useState<number | null>(null);

  useEffect(() => {
    setConfig(getDibalConfig());
  }, []);

  const updateConfig = (patch: Partial<DibalConfig>) => {
    const next = { ...config, ...patch };
    setConfig(next);
    saveDibalConfig(next);
  };

  const handleConnect = async () => {
    if (connected) {
      await disconnect();
    } else {
      await connect();
    }
  };

  const handleTestRead = async () => {
    const w = await readOnce();
    if (w !== null) {
      setTestWeight(w);
      toast.success(`Poids lu: ${w.toFixed(3)} kg`);
    } else {
      toast.error('Impossible de lire la balance');
    }
  };

  if (!supported) {
    return (
      <Card className="p-6 bg-amber-50/80 dark:bg-amber-900/20 border-amber-200 shadow-lg border">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500 rounded-xl text-white">
            <Info className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-amber-800 dark:text-amber-200">Web Serial non supporté</h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              La connexion à une balance via USB/Série nécessite <strong>Google Chrome</strong> ou <strong>Microsoft Edge</strong> sur ordinateur.
              Veuillez ouvrir cette application dans l'un de ces navigateurs.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900 border-0 shadow-lg">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl text-white">
            <Scale className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold">Balance Dibal</h3>
            <p className="text-sm text-muted-foreground">Connexion et test de la balance</p>
          </div>
          <div className="flex items-center gap-2">
            {connected ? (
              <span className="flex items-center gap-1.5 text-sm font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
                <Wifi className="h-4 w-4" /> Connectée
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                <WifiOff className="h-4 w-4" /> Non connectée
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleConnect}
            className={connected
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white'
            }
          >
            {connected ? 'Déconnecter' : 'Connecter la balance'}
          </Button>
          {connected && (
            <Button variant="outline" onClick={handleTestRead} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Tester lecture
            </Button>
          )}
        </div>

        {(weight !== null || testWeight !== null) && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg">
            <div className="text-sm text-muted-foreground">
              {weight !== null ? 'Poids en direct' : 'Dernier poids lu'}
            </div>
            <div className="text-2xl font-bold text-primary">
              {(weight ?? testWeight)?.toFixed(3)} kg
            </div>
          </div>
        )}
      </Card>

      {/* Parameters Card */}
      <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-0">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl text-white">
            <RefreshCw className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold">Paramètres de communication</h3>
            <p className="text-sm text-muted-foreground">Réglez le protocole selon votre modèle de balance</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="baudRate" className="text-base font-medium">Vitesse (baud rate)</Label>
              <Input
                id="baudRate"
                type="number"
                value={config.baudRate}
                onChange={(e) => updateConfig({ baudRate: parseInt(e.target.value) || 9600 })}
                placeholder="9600"
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">Standard Dibal: 9600</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="decimals" className="text-base font-medium">Décimales</Label>
              <Input
                id="decimals"
                type="number"
                min={0}
                max={4}
                value={config.decimals}
                onChange={(e) => updateConfig({ decimals: parseInt(e.target.value) || 3 })}
                placeholder="3"
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">Nombre de décimales affichées (ex: 3 = 1.234 kg)</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Poids reçu en grammes</Label>
                <p className="text-xs text-muted-foreground">
                  La balance envoie-t-elle le poids en grammes entiers (ex: 1250 = 1,250 kg) ?
                </p>
              </div>
              <Switch
                checked={config.weightInGrams ?? true}
                onCheckedChange={(checked) => updateConfig({ weightInGrams: checked })}
              />
            </div>
            <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
              <Info className="h-3 w-3 inline mr-1" />
              Désactivez cette option si votre modèle envoie déjà des kilogrammes avec décimales.
            </p>
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="offsetKg" className="text-base font-medium">Tare (offset kg)</Label>
              <Input
                id="offsetKg"
                type="number"
                step="0.001"
                value={config.offsetKg}
                onChange={(e) => updateConfig({ offsetKg: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">Valeur soustraite du poids brut (réglez via Calibration)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="factor" className="text-base font-medium">Facteur de correction</Label>
              <Input
                id="factor"
                type="number"
                step="0.0001"
                value={config.factor}
                onChange={(e) => updateConfig({ factor: parseFloat(e.target.value) || 1 })}
                placeholder="1"
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">Multiplicateur correctif (réglez via Calibration)</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Instructions Card */}
      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 border-0 shadow-lg">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl text-white">
            <Info className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Instructions de configuration</h3>
            <p className="text-sm text-muted-foreground">Étapes pour faire fonctionner votre balance Dibal</p>
          </div>
        </div>

        <ol className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
            <span><strong>Branchez la balance</strong> à l'ordinateur via le câble RS-232 → USB (adaptateur FTDI/Prolific).</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
            <span><strong>Sur la balance</strong>, réglez le mode de communication sur "PC / Request" ou "Continuous" à <strong>9600 bauds, 8 bits, pas de parité, 1 stop bit</strong>.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
            <span><strong>Utilisez Chrome ou Edge</strong> (Web Serial n'est pas supporté sur Safari/Firefox).</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">4</span>
            <span>Cliquez sur <strong>"Connecter la balance"</strong> ci-dessus et sélectionnez le port USB-SERIAL dans la fenêtre du navigateur.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">5</span>
            <span>Dans la caisse, cliquez sur un produit <strong>"au poids"</strong> — le poids se remplit automatiquement depuis la balance.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">6</span>
            <span>Si le poids affiché est incorrect, utilisez le bouton <strong>⚙️ Calibration</strong> dans la boîte de dialogue de poids pour faire la tare et calibrer avec un poids étalon.</span>
          </li>
        </ol>
      </Card>
    </div>
  );
}
