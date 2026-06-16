// Dibal D-900 Web Serial driver
// Protocole: requête ASCII "98000001\r\n" (hex 39 38 30 30 30 30 30 31 0D 0A)
// Réponse: trame ASCII contenant le poids. On extrait le premier nombre
// et on l'interprète selon la config (grammes par défaut, converti en kg).
// Paramètres série Dibal: 9600 bauds, 8 bits, pas de parité, 1 stop bit.

export interface DibalConfig {
  baudRate?: number;
  weightInGrams?: boolean;
  decimals?: number;
  // Calibration: poids_corrigé = (poids_brut - offsetKg) * factor
  offsetKg?: number;
  factor?: number;
}

const REQUEST = new Uint8Array([0x39, 0x38, 0x30, 0x30, 0x30, 0x30, 0x30, 0x31, 0x0d, 0x0a]);
const STORAGE_KEY = 'dibal_scale_config';

export function getDibalConfig(): Required<DibalConfig> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const c = raw ? JSON.parse(raw) : {};
    return {
      baudRate: c.baudRate ?? 9600,
      weightInGrams: c.weightInGrams ?? true,
      decimals: c.decimals ?? 3,
      offsetKg: c.offsetKg ?? 0,
      factor: c.factor ?? 1,
    };
  } catch {
    return { baudRate: 9600, weightInGrams: true, decimals: 3, offsetKg: 0, factor: 1 };
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
  return typeof navigator !== 'undefined' && 'serial' in navigator;
}

export class DibalScale {
  private port: any = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private buffer = '';
  private config: Required<DibalConfig>;
  private closed = false;

  constructor(config?: DibalConfig) {
    this.config = { ...getDibalConfig(), ...config };
  }

  async connect(): Promise<void> {
    if (!isWebSerialSupported()) {
      throw new Error("Web Serial non supporté. Utilisez Chrome ou Edge en HTTPS.");
    }
    const nav: any = navigator;
    // Réutilise un port déjà autorisé si disponible
    const granted: any[] = await nav.serial.getPorts();
    this.port = granted[0] ?? (await nav.serial.requestPort());
    await this.port.open({
      baudRate: this.config.baudRate,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
      flowControl: 'none',
    });
    this.reader = this.port.readable.getReader();
    this.writer = this.port.writable.getWriter();
    this.closed = false;
    this.readLoop();
  }

  private async readLoop() {
    const decoder = new TextDecoder();
    try {
      while (this.reader && !this.closed) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) this.buffer += decoder.decode(value);
        // garde un buffer raisonnable
        if (this.buffer.length > 4096) this.buffer = this.buffer.slice(-1024);
      }
    } catch {
      // port fermé
    }
  }

  private parseWeight(frame: string): number | null {
    // Cherche un nombre décimal, sinon premier groupe d'entiers
    const dec = frame.match(/(\d+\.\d+)/);
    if (dec) return parseFloat(dec[1]);
    const ints = frame.match(/(\d{3,7})/);
    if (!ints) return null;
    const raw = parseInt(ints[1], 10);
    if (this.config.weightInGrams) return raw / 1000;
    return raw / Math.pow(10, this.config.decimals);
  }

  async readWeightRaw(timeoutMs = 800): Promise<number> {
    if (!this.writer) throw new Error('Balance non connectée');
    this.buffer = '';
    await this.writer.write(REQUEST);
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, 40));
      if (this.buffer.includes('\n') || this.buffer.includes('\r') || this.buffer.length > 8) {
        const w = this.parseWeight(this.buffer);
        if (w !== null && !Number.isNaN(w)) return w;
      }
    }
    const w = this.parseWeight(this.buffer);
    if (w !== null) return w;
    throw new Error('Pas de réponse de la balance');
  }

  async readWeight(timeoutMs = 800): Promise<number> {
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
  }
}
