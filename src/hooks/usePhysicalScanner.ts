import { useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface PhysicalScannerOptions {
  onScan: (barcode: string) => void;
  enabled?: boolean;
  minLength?: number;
  timeout?: number;
}

const AZERTY_MAP: Record<string, string> = {
  '&': '1', '!': '1', 'é': '2', '@': '2', '"': '3', '#': '3',
  "'": '4', '$': '4', '(': '5', '%': '5', '-': '6', '^': '6',
  'è': '7', '&amp;': '7', '_': '8', '*': '8', 'ç': '9', 'à': '0', ')': '0',
  '§': '6', '²': '2', '³': '3', '°': '0', '+': '1', '=': '0',
  '~': '2', '{': '4', '}': '0', '[': '5', ']': '6', '|': '6',
  '`': '7', '\\': '8', '/': '9',
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
    return raw.split('').map(char => AZERTY_MAP[char] || char).join('').replace(/\D+/g, '').trim();
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

      // Mettre à jour le timestamp
      lastKeyTime = now;

      // Enter ou Tab = fin de scan
      if (e.key === 'Enter' || e.key === 'Tab') {
        if (buffer.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          if (timeoutId) clearTimeout(timeoutId);
          processScan();
        }
        return;
      }

      // Ignorer les touches spéciales non imprimables
      if (e.key.length > 1) return;

      // Déterminer le chiffre à ajouter
      let toAppend: string | null = null;
      if (e.code && e.code.startsWith('Digit')) {
        toAppend = e.code.replace('Digit', '');
      } else if (e.code && e.code.startsWith('Numpad')) {
        toAppend = e.code.replace('Numpad', '');
      } else {
        toAppend = AZERTY_MAP[e.key] || e.key;
      }

      // Démarrer le scan si nécessaire et ajouter le premier caractère
      if (!isScanning) {
        isScanning = true;
      }

      if (toAppend && toAppend.length === 1) {
        buffer += toAppend;
        e.preventDefault();
        e.stopPropagation();

        // Auto-traiter après timeout de silence
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(processScan, timeout);
      }
    };

    window.addEventListener('keydown', handler, true);

    return () => {
      window.removeEventListener('keydown', handler, true);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [enabled, minLength, timeout, onScan, normalizeBarcode]);

  return { normalizeBarcode };
};
