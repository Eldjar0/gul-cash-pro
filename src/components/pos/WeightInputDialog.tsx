import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Scale, Wifi, WifiOff, RefreshCw, Settings2, Zap } from 'lucide-react';
import { Product } from '@/hooks/useProducts';
import { useDibalScale } from '@/hooks/useDibalScale';
import { DibalCalibrationDialog } from './DibalCalibrationDialog';

interface WeightInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onConfirm: (weight: number) => void;
}

const AUTO_KEY = 'pos.scale.autoConfirm';
const STABLE_READINGS = 3;
const AUTO_CONFIRM_DELAY_MS = 1200;

export function WeightInputDialog({ open, onOpenChange, product, onConfirm }: WeightInputDialogProps) {
  const [weight, setWeight] = useState('');
  const [calibOpen, setCalibOpen] = useState(false);
  const [autoConfirm, setAutoConfirm] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const v = window.localStorage.getItem(AUTO_KEY);
    return v === null ? true : v === '1';
  });
  const [countdown, setCountdown] = useState<number | null>(null);
  const stableRef = useRef<{ value: number | null; count: number }>({ value: null, count: 0 });
  const userEditedRef = useRef(false);
  const autoFiredRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { connected, weight: liveWeight, connect, readOnce, supported } = useDibalScale({
    autoPoll: open && !calibOpen,
    intervalMs: 500,
  });

  // Persiste la préférence
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AUTO_KEY, autoConfirm ? '1' : '0');
    }
  }, [autoConfirm]);

  // Reset quand on ouvre/ferme
  useEffect(() => {
    if (open) {
      userEditedRef.current = false;
      autoFiredRef.current = false;
      stableRef.current = { value: null, count: 0 };
      setCountdown(null);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      setWeight('');
      setCountdown(null);
    }
  }, [open]);

  // Synchronise le poids live de la balance dans l'input + détection de stabilité
  useEffect(() => {
    if (!open || !connected || liveWeight === null) return;
    if (!userEditedRef.current && liveWeight > 0) {
      setWeight(liveWeight.toFixed(3));
    }

    // Détection de stabilité (3 lectures identiques à 1g près)
    const rounded = Math.round(liveWeight * 1000);
    const s = stableRef.current;
    if (s.value !== null && Math.abs((s.value ?? 0) - rounded) <= 1) {
      s.count += 1;
    } else {
      s.value = rounded;
      s.count = 1;
    }

    if (
      autoConfirm &&
      !autoFiredRef.current &&
      !userEditedRef.current &&
      liveWeight > 0 &&
      s.count >= STABLE_READINGS
    ) {
      autoFiredRef.current = true;
      // Compte à rebours visible
      let remaining = Math.ceil(AUTO_CONFIRM_DELAY_MS / 400);
      setCountdown(remaining);
      const tick = () => {
        remaining -= 1;
        if (remaining <= 0) {
          confirmWeight(liveWeight);
        } else {
          setCountdown(remaining);
          timerRef.current = setTimeout(tick, 400);
        }
      };
      timerRef.current = setTimeout(tick, 400);
    }
  }, [liveWeight, connected, open, autoConfirm]);

  const confirmWeight = (value: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCountdown(null);
    if (value && value > 0) {
      onConfirm(value);
      setWeight('');
      onOpenChange(false);
    }
  };

  const handleConfirm = () => {
    confirmWeight(parseFloat(weight));
  };

  const cancelAuto = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCountdown(null);
    autoFiredRef.current = false;
    userEditedRef.current = true;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Saisir le poids
          </DialogTitle>
        </DialogHeader>

        {product && (
          <div className="space-y-4">
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="font-bold text-lg">{product.name}</div>
              <div className="text-sm text-muted-foreground">
                {product.price.toFixed(2)}€ / kg
              </div>
            </div>

            {/* Balance Dibal */}
            {supported && (
              <div className="flex items-center justify-between gap-2 border rounded-lg p-2">
                <div className="flex items-center gap-2 text-sm">
                  {connected ? (
                    <Wifi className="h-4 w-4 text-green-600" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium">Balance Dibal</span>
                  <span className="text-muted-foreground">
                    {connected ? 'connectée' : 'non connectée'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {connected && (
                    <Button size="sm" variant="ghost" onClick={() => readOnce()} title="Relire">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setCalibOpen(true)} title="Calibration">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                  {!connected && (
                    <Button size="sm" variant="outline" onClick={() => connect()}>
                      Connecter
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Poids (kg)
              </label>
              <Input
                type="number"
                step="0.001"
                min="0.001"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="0.000"
                autoFocus
                className="text-lg font-bold text-center"
              />
            </div>

            {weight && parseFloat(weight) > 0 && (
              <div className="bg-primary/10 p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-2xl font-bold text-primary">
                  {(parseFloat(weight) * product.price).toFixed(2)}€
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!weight || parseFloat(weight) <= 0}
          >
            Valider
          </Button>
        </DialogFooter>
      </DialogContent>
      <DibalCalibrationDialog open={calibOpen} onOpenChange={setCalibOpen} />
    </Dialog>
  );
}
