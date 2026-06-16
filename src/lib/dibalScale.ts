// Driver balance Dibal (D-900, 500, K-235, etc.) via Web Serial API
//
// Deux modes supportés :
//  - "continuous" : la balance envoie en permanence des trames poids
//     -> on lit en boucle, on parse à la volée, on notifie via callback
//  - "request"    : on envoie une commande ENQ et la balance répond
//
// Format de trame Dibal couramment rencontré :
//   STX P|S sign DDDD.DDD UU ETX           (binaire)
//   "ST,GS,+00.123kg\r\n"                  (ASCII, CAS-like)
//   "00123\r\n"                            (poids brut en grammes)
//
// Paramètres série Dibal par défaut : 9600 bauds, 8N1, pas de flow control.

export type DibalMode = 'continuous' | 'request';

export interface DibalConfig {
  baudRate?: number;
  mode?: DibalMode;
  requestProtocol?: 'dibal9800' | 'enq';
  weightInGrams?: boolean;
  decimals?: number;
  offsetKg?: number;
  factor?: number;
}

const STORAGE_KEY = 'dibal_scale_config';

// ENQ classique pour demander un poids en mode requête
const ENQ_REQUEST = new Uint8Array([0x05]);
// Protocole Dibal POS courant : demander le poids avec 98000001 + CRLF
const DIBAL_POS_WEIGHT_REQUEST = new TextEncoder().encode('98000001\r\n');

export function getDibalConfig(): Required<DibalConfig> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const c = raw ? JSON.parse(raw) : {};
    return {
      baudRate: c.baudRate ?? 9600,
      mode: (c.mode as DibalMode) ?? 'continuous',
        requestProtocol: c.requestProtocol ?? 'dibal9800',
      weightInGrams: c.weightInGrams ?? false,
      decimals: c.decimals ?? 3,
      offsetKg: c.offsetKg ?? 0,
      factor: c.factor ?? 1,
    };
  } catch {
    return { baudRate: 9600, mode: 'continuous', requestProtocol: 'dibal9800', weightInGrams: false, decimals: 3, offsetKg: 0, factor: 1 };
  }
}

export function saveDibalConfig(c: DibalConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...getDibalConfig(), ...c }));
}

export function applyCalibration(rawKg: number): number {
  const c = getDibalConfig();
  const v = (rawKg - c.offsetKg) * c.factor;
  return Math.max(0, Math.round(v * 1000) / 1000);
}

export function isWebSerialSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serial' in (navigator as any);
}

// Parse une trame texte et renvoie un poids en kg, ou null.
function parseFrame(frame: string, weightInGrams: boolean, decimals: number): number | null {
  if (!frame) return null;

  // Nettoyage : retire STX/ETX et caractères non imprimables
  const clean = frame.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
  if (!clean) return null;

  // 0) Réponse Dibal POS : "9900031600000004" => 316 g => 0.316 kg
  const dibalPos = clean.match(/99[0-9]([0-9]{5})[0-9]{7,}/);
  if (dibalPos) {
    const grams = parseInt(dibalPos[1], 10);
    if (!Number.isNaN(grams)) return grams / 1000;
  }

  // 1) Format Dibal/CAS : "ST,GS,+00.123kg" ou "US,GS,+00.000kg"
  //    On accepte aussi sans préfixe ST/US
  const named = clean.match(/([+-]?\d+\.\d+)\s*(kg|g)/i);
  if (named) {
    const v = parseFloat(named[1]);
    if (!Number.isNaN(v)) return named[2].toLowerCase() === 'g' ? v / 1000 : v;
  }

  // 2) Décimal sans unité : on suppose kg
  const dec = clean.match(/([+-]?\d+\.\d+)/);
  if (dec) {
    const v = parseFloat(dec[1]);
    if (!Number.isNaN(v)) return v;
  }

  // 3) Entier seul : grammes ou unité brute selon config
  const ints = clean.match(/([+-]?\d{2,7})/);
  if (ints) {
    const raw = parseInt(ints[1], 10);
    if (!Number.isNaN(raw)) {
      return weightInGrams ? raw / 1000 : raw / Math.pow(10, decimals);
    }
  }

  return null;
}

export type WeightListener = (kg: number) => void;
export type RawListener = (hex: string, ascii: string) => void;

export class DibalScale {
  private port: any = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private buffer = '';
  private config: Required<DibalConfig>;
  private closed = false;
  private listeners = new Set<WeightListener>();
  private rawListeners = new Set<RawListener>();
  private lastWeight: number | null = null;
  private rawLog: { hex: string; ascii: string; t: number }[] = [];

  constructor(config?: DibalConfig) {
    this.config = { ...getDibalConfig(), ...config };
  }

  onWeight(cb: WeightListener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  onRaw(cb: RawListener): () => void {
    this.rawListeners.add(cb);
    return () => this.rawListeners.delete(cb);
  }

  getRawLog() { return this.rawLog.slice(-20); }

  getLastWeight(): number | null {
    return this.lastWeight;
  }


  async connect(): Promise<void> {
    if (!isWebSerialSupported()) {
      throw new Error("Web Serial non supporté. Utilisez Chrome ou Edge (HTTPS ou app desktop).");
    }
    const nav: any = navigator;

    // Réutilise un port déjà autorisé s'il y en a un, sinon prompt utilisateur
    const granted: any[] = await nav.serial.getPorts();
    this.port = granted[0] ?? (await nav.serial.requestPort());

    // IMPORTANT : si le port a déjà été ouvert (rechargement de page, HMR),
    // Chrome le considère "verrouillé" tant qu'on ne l'a pas explicitement
    // refermé. On force la fermeture avant de réouvrir.
    try {
      if (this.port.readable || this.port.writable) {
        await this.port.close();
        await new Promise((r) => setTimeout(r, 150));
      }
    } catch {
      // ignore : le port n'était pas ouvert
    }

    const openOpts = {
      baudRate: this.config.baudRate,
      dataBits: 8 as const,
      stopBits: 1 as const,
      parity: 'none' as const,
      flowControl: 'none' as const,
      bufferSize: 1024,
    };

    // Tentative avec un retry après 300ms (le pilote PL2303 met parfois du temps à libérer)
    try {
      await this.port.open(openOpts);
    } catch (e: any) {
      const msg = String(e?.message ?? '').toLowerCase();
      if (msg.includes('already open')) {
        // déjà ouvert, on continue
      } else {
        await new Promise((r) => setTimeout(r, 300));
        try {
          await this.port.open(openOpts);
        } catch (e2: any) {
          throw new Error(
            "Impossible d'ouvrir le port COM. Causes probables : un autre programme l'utilise (logiciel Dibal, autre onglet Chrome, PuTTY), ou le pilote est bloqué. Fermez les autres apps, débranchez/rebranchez le câble USB, puis réessayez."
          );
        }
      }
    }

    this.reader = this.port.readable.getReader();
    this.writer = this.port.writable.getWriter();
    this.closed = false;
    this.buffer = '';
    this.readLoop();
  }

  /** Oublie le port (révoque l'autorisation Chrome). Utile pour réinitialiser. */
  async forget(): Promise<void> {
    try { await this.disconnect(); } catch {}
    try {
      const nav: any = navigator;
      const ports: any[] = await nav.serial.getPorts();
      for (const p of ports) {
        try { await p.forget?.(); } catch {}
      }
    } catch {}
  }


  private notify(kg: number) {
    this.lastWeight = kg;
    this.listeners.forEach((l) => {
      try { l(kg); } catch {}
    });
  }

  private flushFrames() {
    // Découpe le buffer sur \r, \n ou ETX (0x03)
    const parts = this.buffer.split(/[\r\n\x03]+/);
    // On garde le dernier morceau potentiellement incomplet
    this.buffer = parts.pop() ?? '';
    for (const p of parts) {
      const kg = parseFrame(p, this.config.weightInGrams, this.config.decimals);
      if (kg !== null) this.notify(kg);
    }
    // Sécurité : si jamais le buffer enfle sans séparateur, on tente quand même
    if (this.buffer.length > 64) {
      const kg = parseFrame(this.buffer, this.config.weightInGrams, this.config.decimals);
      if (kg !== null) this.notify(kg);
      this.buffer = '';
    }
  }

  private async readLoop() {
    const decoder = new TextDecoder('latin1');
    try {
      while (this.reader && !this.closed) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value && value.length) {
          // Log brut pour debug
          const hex = Array.from(value).map((b) => b.toString(16).padStart(2, '0')).join(' ');
          const ascii = decoder.decode(value).replace(/[\x00-\x1F\x7F]/g, '·');
          const entry = { hex, ascii, t: Date.now() };
          this.rawLog.push(entry);
          if (this.rawLog.length > 50) this.rawLog.shift();
          this.rawListeners.forEach((l) => { try { l(hex, ascii); } catch {} });

          this.buffer += decoder.decode(value);
          this.flushFrames();
        }
      }
    } catch {
      // port fermé / déconnecté
    }
  }


  /** Force une lecture immédiate (mode request). En mode continu, renvoie le dernier poids reçu. */
  async readWeightRaw(timeoutMs = 1500): Promise<number> {
    if (!this.port) throw new Error('Balance non connectée');

    // Mode continu : on attend qu'une trame arrive (lastWeight est mis à jour par readLoop)
    if (this.config.mode === 'continuous') {
      const start = Date.now();
      const prev = this.lastWeight;
      while (Date.now() - start < timeoutMs) {
        if (this.lastWeight !== null && this.lastWeight !== prev) return this.lastWeight;
        await new Promise((r) => setTimeout(r, 50));
      }
      if (this.lastWeight !== null) return this.lastWeight;
      throw new Error("Aucune trame reçue. Vérifiez que la balance est en mode 'Continu' et bien branchée.");
    }

    // Mode requête : on envoie la commande configurée et on attend la prochaine notification
    if (!this.writer) throw new Error('Balance non connectée (writer)');
    const prev = this.lastWeight;
    await this.writer.write(
      this.config.requestProtocol === 'enq' ? ENQ_REQUEST : DIBAL_POS_WEIGHT_REQUEST,
    );
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, 40));
      if (this.lastWeight !== null && this.lastWeight !== prev) return this.lastWeight;
    }
    throw new Error('Pas de réponse de la balance (mode requête).');
  }

  async readWeight(timeoutMs = 1500): Promise<number> {
    const raw = await this.readWeightRaw(timeoutMs);
    return applyCalibration(raw);
  }

  async disconnect(): Promise<void> {
    this.closed = true;
    try { await this.reader?.cancel(); } catch {}
    try { this.reader?.releaseLock(); } catch {}
    try { this.writer?.releaseLock(); } catch {}
    try { await this.port?.close(); } catch {}
    this.reader = null;
    this.writer = null;
    this.port = null;
    this.lastWeight = null;
    this.buffer = '';
  }
}
