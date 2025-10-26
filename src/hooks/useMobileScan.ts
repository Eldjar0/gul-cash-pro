import { create } from 'zustand';

interface ScanState {
  isScanning: boolean;
  lastScanned: { barcode: string; timestamp: number } | null;
  scanResult: 'success' | 'error' | null;
  scannedProduct: any | null;
  scannedBarcode: string | null;
  resultMessage: string | null;
}

interface ScanActions {
  startScan: () => void;
  stopScan: () => void;
  handleScanResult: (params: {
    barcode: string;
    product: any | null;
    result: 'success' | 'error';
    message?: string;
  }) => void;
  clearScan: () => void;
  canScan: (barcode: string) => boolean;
}

const COOLDOWN_MS = 2000;

export const useMobileScan = create<ScanState & ScanActions>((set, get) => ({
  isScanning: false,
  lastScanned: null,
  scanResult: null,
  scannedProduct: null,
  scannedBarcode: null,
  resultMessage: null,

  startScan: () => set({ 
    isScanning: true, 
    scanResult: null,
    resultMessage: null 
  }),
  
  stopScan: () => set({ isScanning: false }),
  
  handleScanResult: ({ barcode, product, result, message }) => {
    const state = get();
    
    // Anti-duplication: vérifier le cooldown
    if (state.lastScanned?.barcode === barcode) {
      const timeSinceLastScan = Date.now() - state.lastScanned.timestamp;
      if (timeSinceLastScan < COOLDOWN_MS) {
        console.log(`[MobileScan] Cooldown actif pour ${barcode}, ignoré`);
        return;
      }
    }

    set({
      isScanning: false,
      scanResult: result,
      scannedProduct: product,
      scannedBarcode: barcode,
      resultMessage: message || (result === 'success' ? product?.name : `Code ${barcode} non trouvé`),
      lastScanned: { barcode, timestamp: Date.now() }
    });
  },
  
  clearScan: () => set({ 
    scanResult: null, 
    scannedProduct: null,
    scannedBarcode: null,
    resultMessage: null
  }),
  
  canScan: (barcode: string) => {
    const state = get();
    if (state.lastScanned?.barcode === barcode) {
      const timeSinceLastScan = Date.now() - state.lastScanned.timestamp;
      return timeSinceLastScan >= COOLDOWN_MS;
    }
    return true;
  }
}));
