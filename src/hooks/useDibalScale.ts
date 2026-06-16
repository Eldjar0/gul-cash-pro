import { useCallback, useEffect, useRef, useState } from 'react';
import { DibalScale, isWebSerialSupported } from '@/lib/dibalScale';
import { toast } from 'sonner';

// Singleton: une seule connexion balance pour toute l'app
let sharedScale: DibalScale | null = null;
let sharedConnected = false;
const listeners = new Set<(connected: boolean) => void>();

function setConnected(v: boolean) {
  sharedConnected = v;
  listeners.forEach((l) => l(v));
}

export function useDibalScale(options?: { autoPoll?: boolean; intervalMs?: number }) {
  const { autoPoll = false, intervalMs = 400 } = options ?? {};
  const [connected, setConnectedState] = useState(sharedConnected);
  const [weight, setWeight] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    const l = (v: boolean) => setConnectedState(v);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const connect = useCallback(async () => {
    if (!isWebSerialSupported()) {
      toast.error("Web Serial non supporté", { description: "Utilisez Chrome ou Edge." });
      return false;
    }
    try {
      if (!sharedScale) sharedScale = new DibalScale();
      await sharedScale.connect();
      setConnected(true);
      toast.success("Balance Dibal connectée");
      return true;
    } catch (e: any) {
      setError(e?.message ?? String(e));
      toast.error("Connexion balance échouée", { description: e?.message });
      return false;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try { await sharedScale?.disconnect(); } catch {}
    setConnected(false);
    setWeight(null);
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

  return { connected, weight, error, connect, disconnect, readOnce, readRawOnce, supported: isWebSerialSupported() };
}
