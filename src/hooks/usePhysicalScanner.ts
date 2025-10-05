import { useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface PhysicalScannerOptions {
  onScan: (barcode: string) => void;
  enabled?: boolean;
  minLength?: number;
  timeout?: number;
}

const AZERTY_MAP: Record<string, string> = {
  '&': '1', 'é': '2', '"': '3', "'": '4', '(': '5',
  '-': '6', 'è': '7', '_': '8', 'ç': '9', 'à': '0',
  'Digit1': '1', 'Digit2': '2', 'Digit3': '3', 'Digit4': '4', 'Digit5': '5',
  'Digit6': '6', 'Digit7': '7', 'Digit8': '8', 'Digit9': '9', 'Digit0': '0',
};

export const usePhysicalScanner = ({
  onScan,
  enabled = true,
  minLength = 3,
  timeout = 100,
}: PhysicalScannerOptions) => {
  const normalizeBarcode = useCallback((raw: string): string => {
    return raw.split('').map(char => AZERTY_MAP[char] || char).join('').trim();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let buffer = '';
    let lastKeyTime = 0;
    let timeoutId: NodeJS.Timeout | null = null;
    let isScanning = false;

    const isEditableField = (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof HTMLElement)) return false;
      const tag = target.tagName.toLowerCase();
      return ['input', 'textarea', 'select'].includes(tag) || 
             target.isContentEditable;
    };

    const processScan = () => {
      if (buffer.length >= minLength) {
        const normalized = normalizeBarcode(buffer);
        if (normalized.length >= minLength) {
          onScan(normalized);
        }
      }
      buffer = '';
      isScanning = false;
    };

    const handler = (e: KeyboardEvent) => {
      if (isEditableField(e.target)) return;

      const now = Date.now();
      const timeDiff = now - lastKeyTime;

      // Réinitialiser si trop de temps écoulé
      if (timeDiff > timeout && buffer.length > 0) {
        buffer = '';
        isScanning = false;
      }

      // Détecter début de scan (frappe rapide)
      if (timeDiff < 50 && !isScanning) {
        isScanning = true;
      }

      lastKeyTime = now;

      // Enter ou Tab = fin de scan
      if (e.key === 'Enter' || e.key === 'Tab') {
        if (isScanning && buffer.length > 0) {
          e.preventDefault();
          if (timeoutId) clearTimeout(timeoutId);
          processScan();
          return;
        }
      }

      // Ignorer les touches spéciales
      if (e.key.length > 1 && e.key !== 'Enter' && e.key !== 'Tab') return;

      // Ajouter au buffer si scan en cours
      if (isScanning || timeDiff < 50) {
        isScanning = true;
        buffer += e.key;
        e.preventDefault();

        // Auto-traiter après timeout
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(processScan, timeout);
      }
    };

    window.addEventListener('keydown', handler);

    return () => {
      window.removeEventListener('keydown', handler);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [enabled, minLength, timeout, onScan, normalizeBarcode]);

  return { normalizeBarcode };
};
