import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface BarcodeScannerOptions {
  onScan: (barcode: string) => void;
  enabled?: boolean;
  minLength?: number;
  timeout?: number;
  showToast?: boolean;
  debugMode?: boolean;
}

/**
 * Hook unifié pour détecter les scans de lecteur code-barres physique (Athesi, etc.)
 * Optimisé pour les scanners HID qui envoient des touches rapides (< 50ms entre touches)
 * Gère la normalisation AZERTY → chiffres
 */
export const useBarcodeScanner = ({
  onScan,
  enabled = true,
  minLength = 3,
  timeout = 500,
  showToast = true,
  debugMode = false,
}: BarcodeScannerOptions) => {
  
  // Normalisation AZERTY → chiffres
  const normalizeBarcode = useCallback((raw: string): string => {
    const azertyMap: Record<string, string> = {
      '&': '1', '!': '1', 'é': '2', '@': '2', '"': '3', '#': '3', 
      "'": '4', '$': '4', '(': '5', '%': '5', '-': '6', '^': '6',
      'è': '7', '_': '8', '*': '8', 'ç': '9', 
      'à': '0', ')': '0', '§': '6'
    };
    const normalized = raw.split('').map(c => azertyMap[c] ?? c).join('');
    return normalized.replace(/\D+/g, '');
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let buffer = "";
    let lastKeyTime = 0;
    let isScanning = false;
    let timeoutId: NodeJS.Timeout | null = null;
    let scanStartTime = 0;

    // Vérifier si on est dans un champ éditable
    const isEditableField = (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof HTMLElement)) return false;
      
      // Ignorer si un dialog est ouvert
      const hasOpenDialog = document.querySelector('[role="dialog"]') !== null;
      if (hasOpenDialog) return true;
      
      // Chercher l'attribut data-scan-ignore dans la hiérarchie
      let element: HTMLElement | null = target;
      while (element) {
        if (element.hasAttribute('data-scan-ignore')) {
          return true;
        }
        element = element.parentElement;
      }
      
      // Vérifier si c'est un champ éditable
      const tagName = target.tagName.toLowerCase();
      const isContentEditable = target.isContentEditable;
      return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || isContentEditable;
    };

    // Mapper les touches du clavier numérique et principal
    const mapEventToDigit = (e: KeyboardEvent): string | null => {
      const code = e.code;
      
      // Touches numériques principales (Digit0-9)
      if (code && code.startsWith('Digit')) {
        return code.replace('Digit', '');
      }
      
      // Pavé numérique (Numpad0-9)
      if (code && code.startsWith('Numpad')) {
        return code.replace('Numpad', '');
      }
      
      // Fallback sur e.key
      if (!code && /^[0-9]$/.test(e.key)) {
        return e.key;
      }
      
      return null;
    };

    // Traiter le code-barres scanné
    const processScan = () => {
      if (buffer.length >= minLength) {
        const normalized = normalizeBarcode(buffer);
        
        if (debugMode) {
          console.log('[Scanner] Code détecté:', {
            raw: buffer,
            normalized,
            length: normalized.length,
            duration: Date.now() - scanStartTime,
          });
        }
        
        if (normalized.length >= minLength) {
          if (showToast) {
            toast.info(`Code scanné: ${normalized}`);
          }
          onScan(normalized);
        } else if (debugMode) {
          console.warn('[Scanner] Code trop court après normalisation:', normalized);
        }
      }
      
      buffer = "";
      isScanning = false;
      scanStartTime = 0;
    };

    // Gestionnaire principal
    const handler = (e: KeyboardEvent) => {
      // Ignorer si la page n'est pas visible
      if (document.hidden) return;

      const now = Date.now();
      const delta = now - lastKeyTime;
      lastKeyTime = now;

      // Touches de fin de scan (Enter, Tab)
      if (e.key === 'Enter' || e.key === 'Tab') {
        if (isScanning && buffer.length >= minLength) {
          e.preventDefault();
          e.stopPropagation();
          if (timeoutId) clearTimeout(timeoutId);
          processScan();
        }
        return;
      }

      // Touches numériques
      if (e.key.length === 1) {
        const digit = mapEventToDigit(e);

        // Premier caractère : vérifier si on peut commencer un scan
        if (buffer.length === 0) {
          // Ne pas scanner si on est dans un champ éditable
          if (isEditableField(e.target)) {
            return;
          }
          
          if (digit !== null) {
            scanStartTime = now;
            isScanning = true;
            e.preventDefault();
            e.stopPropagation();
            buffer += digit;
            
            if (debugMode) {
              console.log('[Scanner] Début du scan, premier digit:', digit);
            }
          }
        } 
        // Caractères suivants
        else {
          if (digit !== null) {
            buffer += digit;
            e.preventDefault();
            e.stopPropagation();
            
            if (debugMode && buffer.length % 3 === 0) {
              console.log(`[Scanner] Buffer (${buffer.length} chars):`, buffer);
            }
          }
        }

        // Reset du timeout pour chaque touche
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(processScan, timeout);
      }
    };

    // Ajouter l'écouteur avec capture pour intercepter avant les autres handlers
    document.addEventListener('keydown', handler, true);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handler, true);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [enabled, minLength, timeout, showToast, debugMode, onScan, normalizeBarcode]);

  return {
    normalizeBarcode,
  };
};
