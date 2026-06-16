import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Scale, Wifi, WifiOff, RefreshCw, Info, Play, Square } from 'lucide-react';
import { toast } from 'sonner';
import { getDibalConfig, saveDibalConfig, isWebSerialSupported, DibalConfig, DibalMode } from '@/lib/dibalScale';
import { useDibalScale, subscribeDibalRaw, getDibalRawLog } from '@/hooks/useDibalScale';

export function ScaleSettings() {
  const { connected, weight, connect, disconnect, forgetPort, readOnce, supported } = useDibalScale({ autoPoll: true, intervalMs: 400 });
  const [config, setConfig] = useState<DibalConfig>(getDibalConfig());
  const [testWeight, setTestWeight] = useState<number | null>(null);
  const [rawLog, setRawLog] = useState<{ hex: string; ascii: string; t: number }[]>(getDibalRawLog());

  // Test de lecture en direct
  const [liveTestActive, setLiveTestActive] = useState(false);
  const [liveReadings, setLiveReadings] = useState<{ t: string; weight: number | null; hex: string; ascii: string }[]>([]);
  const liveIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    setConfig(getDibalConfig());
  }, []);

  useEffect(() => {
    const unsub = subscribeDibalRaw(() => setRawLog(getDibalRawLog()));
    return unsub;
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

  const startLiveTest = useCallback(() => {
    if (!connected) {
      toast.error('Connectez d\'abord la balance');
      return;
    }
    setLiveReadings([]);
    setLiveTestActive(true);
    const tick = async () => {
      const w = await readOnce();
      const lastRaw = getDibalRawLog().slice(-1)[0];
      setLiveReadings((prev) => {
        const next = [
          {
            t: new Date().toLocaleTimeString('fr-BE', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + String(new Date().getMilliseconds()).padStart(3, '0'),
            weight: w,
            hex: lastRaw?.hex ?? '-',
            ascii: lastRaw?.ascii ?? '-',
          },
          ...prev,
        ];
        return next.slice(0, 30);
      });
    };
    tick();
    liveIntervalRef.current = window.setInterval(tick, 500);
  }, [connected, readOnce]);

  const stopLiveTest = useCallback(() => {
    setLiveTestActive(false);
    if (liveIntervalRef.current) {
      window.clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (liveIntervalRef.current) window.clearInterval(liveIntervalRef.current);
    };
  }, []);

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
            <>
              <Button variant="outline" onClick={handleTestRead} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Tester lecture
              </Button>
              {!liveTestActive ? (
                <Button variant="outline" onClick={startLiveTest} className="gap-2 text-green-600 border-green-300 hover:bg-green-50">
                  <Play className="h-4 w-4" />
                  Test en direct
                </Button>
              ) : (
                <Button variant="outline" onClick={stopLiveTest} className="gap-2 text-red-600 border-red-300 hover:bg-red-50">
                  <Square className="h-4 w-4" />
                  Arrêter le test
                </Button>
              )}
            </>
          )}
          <Button
            variant="outline"
            onClick={forgetPort}
            className="gap-2 text-orange-600 border-orange-300 hover:bg-orange-50"
            title="À utiliser si vous avez l'erreur 'Failed to open serial port'"
          >
            <RefreshCw className="h-4 w-4" />
            Réinitialiser le port
          </Button>
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
          <div className="space-y-2">
            <Label className="text-base font-medium">Mode de communication</Label>
            <Select
              value={config.mode ?? 'continuous'}
              onValueChange={(v) => updateConfig({ mode: v as DibalMode })}
            >
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="continuous">Continu (la balance envoie en permanence)</SelectItem>
                <SelectItem value="request">Requête (l'app demande, la balance répond)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Si rien ne s'écrit en continu, passez en <strong>Requête</strong> : l'app demandera le poids à la balance.
            </p>
          </div>

          {config.mode === 'request' && (
            <div className="space-y-2">
              <Label className="text-base font-medium">Commande de requête</Label>
              <Select
                value={config.requestProtocol ?? 'dibal9800'}
                onValueChange={(v) => updateConfig({ requestProtocol: v as DibalConfig['requestProtocol'] })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dibal9800">Dibal POS 98000001</SelectItem>
                  <SelectItem value="enq">ENQ standard</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Pour beaucoup de balances Dibal, choisissez <strong>Dibal POS 98000001</strong>.
              </p>
            </div>
          )}

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
              <p className="text-xs text-muted-foreground">Nombre de décimales (ex: 3 = 1.234 kg)</p>
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

      {/* Debug Console */}
      {connected && (
        <Card className="p-6 bg-gray-900 text-green-400 border-0 shadow-lg font-mono">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-bold text-white">🔬 Console de debug — trames brutes</h3>
              <p className="text-xs text-gray-400">Affiche tout ce que la balance envoie. Posez/retirez un poids pour tester.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setRawLog([])} className="text-black">
              Vider
            </Button>
          </div>
          <div className="bg-black/60 rounded p-3 max-h-64 overflow-auto text-xs space-y-1">
            {rawLog.length === 0 ? (
              <div className="text-gray-500">En attente de données... Si rien n'apparaît après 5s, la balance n'envoie pas (vérifiez câble, mode de la balance, baud rate).</div>
            ) : (
              rawLog.map((r, i) => (
                <div key={i} className="border-b border-gray-800 pb-1">
                  <div className="text-yellow-400">ASCII: {r.ascii || '(vide)'}</div>
                  <div className="text-cyan-400">HEX:   {r.hex}</div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}



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
