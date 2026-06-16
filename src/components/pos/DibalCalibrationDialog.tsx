import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Scale, Target, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useDibalScale } from '@/hooks/useDibalScale';
import { getDibalConfig, saveDibalConfig } from '@/lib/dibalScale';

interface DibalCalibrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DibalCalibrationDialog({ open, onOpenChange }: DibalCalibrationDialogProps) {
  const { connected, connect, readRawOnce } = useDibalScale();
  const [cfg, setCfg] = useState(getDibalConfig());
  const [rawNow, setRawNow] = useState<number | null>(null);
  const [knownWeight, setKnownWeight] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setCfg(getDibalConfig());
  }, [open]);

  // Lecture en continu du poids brut quand le dialog est ouvert
  useEffect(() => {
    if (!open || !connected) return;
    let stop = false;
    const tick = async () => {
      const w = await readRawOnce();
      if (!stop && w !== null) setRawNow(w);
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => { stop = true; window.clearInterval(id); };
  }, [open, connected, readRawOnce]);

  const corrected = rawNow !== null
    ? Math.max(0, Math.round(((rawNow - cfg.offsetKg) * cfg.factor) * 1000) / 1000)
    : null;

  const handleTare = async () => {
    setBusy(true);
    const w = await readRawOnce();
    setBusy(false);
    if (w === null) {
      toast.error('Impossible de lire la balance');
      return;
    }
    const next = { ...cfg, offsetKg: w };
    setCfg(next);
    saveDibalConfig(next);
    toast.success(`Tare réglée à ${w.toFixed(3)} kg`);
  };

  const handleCalibrate = async () => {
    const known = parseFloat(knownWeight);
    if (!known || known <= 0) {
      toast.error('Entrez un poids de référence valide');
      return;
    }
    setBusy(true);
    const raw = await readRawOnce();
    setBusy(false);
    if (raw === null) {
      toast.error('Impossible de lire la balance');
      return;
    }
    const adjusted = raw - cfg.offsetKg;
    if (adjusted <= 0.001) {
      toast.error('Poids brut trop faible. Posez bien la charge.');
      return;
    }
    const factor = known / adjusted;
    const next = { ...cfg, factor };
    setCfg(next);
    saveDibalConfig(next);
    toast.success(`Calibrée: facteur ${factor.toFixed(4)}`);
  };

  const handleReset = () => {
    const next = { ...cfg, offsetKg: 0, factor: 1 };
    setCfg(next);
    saveDibalConfig(next);
    toast.success('Calibration réinitialisée');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Calibration balance Dibal
          </DialogTitle>
          <DialogDescription>
            Corrigez les écarts entre le poids affiché sur la balance et celui de la caisse.
          </DialogDescription>
        </DialogHeader>

        {!connected ? (
          <div className="py-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">Balance non connectée.</p>
            <Button onClick={() => connect()}>Connecter la balance</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-xs text-muted-foreground">Poids brut balance</div>
                <div className="text-xl font-bold">
                  {rawNow !== null ? `${rawNow.toFixed(3)} kg` : '—'}
                </div>
              </div>
              <div className="bg-primary/10 p-3 rounded-lg">
                <div className="text-xs text-muted-foreground">Poids corrigé (caisse)</div>
                <div className="text-xl font-bold text-primary">
                  {corrected !== null ? `${corrected.toFixed(3)} kg` : '—'}
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2">
              <div>Tare actuelle: <span className="font-mono">{cfg.offsetKg.toFixed(3)} kg</span></div>
              <div>Facteur: <span className="font-mono">{cfg.factor.toFixed(4)}</span></div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-sm font-semibold">1. Mise à zéro (tare)</Label>
              <p className="text-xs text-muted-foreground">
                Plateau vide, cliquez pour enregistrer le zéro.
              </p>
              <Button variant="outline" className="w-full" onClick={handleTare} disabled={busy}>
                <Scale className="h-4 w-4 mr-2" />
                Faire la tare maintenant
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-sm font-semibold">2. Calibrer avec un poids étalon</Label>
              <p className="text-xs text-muted-foreground">
                Posez un objet de poids connu (ex: 1.000 kg), entrez sa valeur, puis calibrez.
              </p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={knownWeight}
                  onChange={(e) => setKnownWeight(e.target.value)}
                  placeholder="Poids réel en kg (ex: 1.000)"
                />
                <Button onClick={handleCalibrate} disabled={busy || !knownWeight}>
                  Calibrer
                </Button>
              </div>
            </div>

            <Separator />

            <Button variant="ghost" size="sm" className="w-full" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Réinitialiser la calibration
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
