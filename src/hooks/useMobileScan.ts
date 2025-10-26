import { create } from 'zustand';

interface ScanState {
  isScanning: boolean;
  lastScanned: { barcode: string; timestamp: number } | null;
  scanResult: 'success' | 'error' | null;
  scannedProduct: any | null;
}

interface ScanActions {
  startScan: () => void;
  stopScan: () => void;
  setScanResult: (result: 'success' | 'error', product?: any) => void;
  clearScan: () => void;
  setLastScanned: (barcode: string) => void;
}

export const useMobileScan = create<ScanState & ScanActions>((set) => ({
  isScanning: false,
  lastScanned: null,
  scanResult: null,
  scannedProduct: null,

  startScan: () => set({ isScanning: true, scanResult: null }),
  stopScan: () => set({ isScanning: false }),
  
  setScanResult: (result, product) => set({ 
    scanResult: result, 
    scannedProduct: product,
    isScanning: false 
  }),
  
  clearScan: () => set({ 
    scanResult: null, 
    scannedProduct: null,
    lastScanned: null 
  }),
  
  setLastScanned: (barcode) => set({ 
    lastScanned: { barcode, timestamp: Date.now() } 
  }),
}));
