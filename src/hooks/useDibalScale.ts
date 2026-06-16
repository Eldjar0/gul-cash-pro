import { useCallback, useEffect, useRef, useState } from 'react';
import { DibalScale, isWebSerialSupported, applyCalibration } from '@/lib/dibalScale';
import { toast } from 'sonner';

// Singleton : une seule connexion balance pour toute l'app
let sharedScale: DibalScale | null = null;
let sharedConnected = false;
let sharedLastRaw: number | null = null;

const connectionListeners = new Set<(connected: boolean) => void>();
const weightListeners = new Set<(rawKg: number) => void>();
const rawListeners = new Set<(hex: string, ascii: string) => void>();

function setConnected(v: boolean) {
  sharedConnected = v;
  connectionListeners.forEach((l) => l(v));
}

function ensureScale(): DibalScale {
  if (!sharedScale) {
    sharedScale = new DibalScale();
    sharedScale.onWeight((kg) => {
      sharedLastRaw = kg;
      weightListeners.forEach((l) => l(kg));
    });
    sharedScale.onRaw((hex, ascii) => {
      rawListeners.forEach((l) => l(hex, ascii));
    });
  }
  return sharedScale;
}

export function getDibalRawLog() {
  return sharedScale?.getRawLog() ?? [];
}

export function subscribeDibalRaw(cb: (hex: string, ascii: string) => void) {
  rawListeners.add(cb);
  return () => { rawListeners.delete(cb); };
}

// Tente de réutiliser un port déjà autorisé, sans interaction utilisateur
let autoConnectAttempted = false;
export async function tryAutoConnectDibal(): Promise<boolean> {
  if (autoConnectAttempted || sharedConnected) return sharedConnected;
  autoConnectAttempted = true;
  if (!isWebSerialSupported()) return false;
  try {
    const nav: any = navigator;
    const ports: any[] = await nav.serial.getPorts();
    if (!ports.length) {
      console.info('[Dibal] Aucun port pré-autorisé, connexion auto ignorée');
      return false;
    }
    const sc = ensureScale();
    await sc.connect();
    setConnected(true);
    console.info('[Dibal] Connexion automatique réussie');
    return true;
  } catch (e) {
    console.warn('[Dibal] Connexion auto échouée:', e);
    return false;
  }
}

// Écoute les évènements de branchement/débranchement USB
if (typeof navigator !== 'undefined' && 'serial' in (navigator as any)) {
  const nav: any = navigator;
  nav.serial.addEventListener?.('connect', () => {
    if (!sharedConnected) {
      autoConnectAttempted = false;
      tryAutoConnectDibal();
    }
  });
  nav.serial.addEventListener?.('disconnect', () => {
    if (sharedConnected) {
      setConnected(false);
      sharedLastRaw = null;
    }
  });
}




export function useDibalScale(options?: { autoPoll?: boolean; intervalMs?: number }) {
  const { autoPoll = false, intervalMs = 300 } = options ?? {};
  const [connected, setConnectedState] = useState(sharedConnected);
  const [weight, setWeight] = useState<number | null>(
    sharedLastRaw !== null ? applyCalibration(sharedLastRaw) : null,
  );
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    const cl = (v: boolean) => setConnectedState(v);
    connectionListeners.add(cl);
    return () => { connectionListeners.delete(cl); };
  }, []);

  // Souscription live aux trames poids (mode continu)
  useEffect(() => {
    if (!autoPoll) return;
    const wl = (raw: number) => setWeight(applyCalibration(raw));
    weightListeners.add(wl);
    if (sharedLastRaw !== null) setWeight(applyCalibration(sharedLastRaw));
    return () => { weightListeners.delete(wl); };
  }, [autoPoll]);

  const connect = useCallback(async () => {
    if (!isWebSerialSupported()) {
      toast.error('Web Serial non supporté', {
        description: 'Ouvrez l\'app dans Chrome ou Edge (ou la version desktop).',
      });
      return false;
    }
    try {
      const sc = ensureScale();
      await sc.connect();
      setConnected(true);
      toast.success('Balance connectée');
      return true;
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      setError(msg);
      // Annulation par l'utilisateur : pas une vraie erreur
      if (msg.toLowerCase().includes('no port selected') || msg.toLowerCase().includes('cancelled')) {
        toast.info('Connexion annulée');
      } else {
        toast.error('Connexion balance échouée', { description: msg });
      }
      return false;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try { await sharedScale?.disconnect(); } catch {}
    setConnected(false);
    setWeight(null);
    sharedLastRaw = null;
    toast.info('Balance déconnectée');
  }, []);

  const forgetPort = useCallback(async () => {
    try { await sharedScale?.forget(); } catch {}
    sharedScale = null;
    autoConnectAttempted = false;
    setConnected(false);
    setWeight(null);
    sharedLastRaw = null;
    toast.success('Port réinitialisé. Cliquez à nouveau sur Connecter.');
  }, []);


  const readOnce = useCallback(async () => {
    if (!sharedScale || !sharedConnected) return null;
    try {
      const w = await sharedScale.readWeight();
      setWeight(w);
      setError(null);
      return w;
    } catch (e: any) {
      setError(e?.message ?? String(e));
      return null;
    }
  }, []);

  const readRawOnce = useCallback(async () => {
    if (!sharedScale || !sharedConnected) return null;
    try {
      const w = await sharedScale.readWeightRaw();
      setError(null);
      return w;
    } catch (e: any) {
      setError(e?.message ?? String(e));
      return null;
    }
  }, []);

  // Polling actif (mode requête principalement)
  useEffect(() => {
    if (!autoPoll || !connected) return;
    const tick = async () => { await readOnce(); };
    tick();
    pollRef.current = window.setInterval(tick, intervalMs);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [autoPoll, connected, intervalMs, readOnce]);

  return {
    connected,
    weight,
    error,
    connect,
    disconnect,
    readOnce,
    readRawOnce,
    supported: isWebSerialSupported(),
  };
}
