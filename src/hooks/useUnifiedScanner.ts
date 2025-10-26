import { useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from './useProducts';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

interface UnifiedScannerOptions {
  onScan: (barcode: string, product: Product | null) => void;
  enabled?: boolean;
  minLength?: number;
  timeout?: number;
  cooldown?: number;
  showFeedback?: boolean;
}

const AZERTY_MAP: Record<string, string> = {
  'à': '0', 'ampersand': '1', '&': '1', 'é': '2', '"': '3',
  "'": '4', '(': '5', '-': '6', 'è': '7', '_': '8', 'ç': '9',
  'À': '0', 'É': '2', 'È': '7', 'Ç': '9',
};

export const useUnifiedScanner = ({
  onScan,
  enabled = true,
  minLength = 3,
  timeout = 200,
  cooldown = 500,
  showFeedback = true,
}: UnifiedScannerOptions) => {
  const bufferRef = useRef<string>('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastScanRef = useRef<{ barcode: string; timestamp: number } | null>(null);
  const isScanningRef = useRef(false);

  // Normalisation des codes-barres (AZERTY → digits)
  const normalizeBarcode = useCallback((raw: string): string => {
    return raw
      .split('')
      .map(char => AZERTY_MAP[char] || char)
      .filter(char => /[0-9]/.test(char))
      .join('');
  }, []);

  // Recherche produit par barcode (product_barcodes puis products)
  const findProductByBarcode = useCallback(async (barcode: string): Promise<Product | null> => {
    try {
      // 1. Chercher dans product_barcodes
      const { data: barcodeMatch } = await supabase
        .from('product_barcodes')
        .select('product_id')
        .eq('barcode', barcode)
        .maybeSingle();

      if (barcodeMatch) {
        const { data: product } = await supabase
          .from('products')
          .select('*')
          .eq('id', barcodeMatch.product_id)
          .eq('is_active', true)
          .maybeSingle();
        
        if (product) return product as Product;
      }

      // 2. Chercher directement dans products
      const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', barcode)
        .eq('is_active', true)
        .maybeSingle();

      return product as Product | null;
    } catch (error) {
      console.error('Error finding product:', error);
      return null;
    }
  }, []);

  // Feedback haptique
  const vibrate = useCallback(async (success: boolean) => {
    if (!showFeedback) return;
    
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ 
          style: success ? ImpactStyle.Light : ImpactStyle.Heavy 
        });
      } catch (e) {
        console.warn('Haptics not available');
      }
    } else {
      // Fallback web vibration
      if (navigator.vibrate) {
        navigator.vibrate(success ? 100 : 300);
      }
    }
  }, [showFeedback]);

  // Sons de feedback
  const playSound = useCallback((success: boolean) => {
    if (!showFeedback) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = success ? 1200 : 300;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + (success ? 0.2 : 0.4));

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + (success ? 0.2 : 0.4));
  }, [showFeedback]);

  // Traiter le scan
  const processScan = useCallback(async (rawBarcode: string) => {
    if (isScanningRef.current) return;
    
    const normalized = normalizeBarcode(rawBarcode);
    if (normalized.length < minLength) return;

    // Anti-duplication (cooldown)
    const now = Date.now();
    if (lastScanRef.current?.barcode === normalized) {
      if (now - lastScanRef.current.timestamp < cooldown) {
        return;
      }
    }

    isScanningRef.current = true;
    lastScanRef.current = { barcode: normalized, timestamp: now };

    // Recherche produit
    const product = await findProductByBarcode(normalized);

    // Feedback immédiat
    vibrate(!!product);
    playSound(!!product);

    // Callback
    onScan(normalized, product);

    isScanningRef.current = false;
  }, [normalizeBarcode, minLength, cooldown, findProductByBarcode, vibrate, playSound, onScan]);

  // Scanner physique (détection clavier)
  useEffect(() => {
    if (!enabled) {
      // Nettoyer le buffer et les refs quand désactivé
      bufferRef.current = '';
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      isScanningRef.current = false;
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      
      // Ne pas capturer dans les champs de saisie (sauf si data-allow-scan)
      if (isInput && !target.hasAttribute('data-allow-scan')) {
        return;
      }

      // Enter ou Tab = fin de scan
      if (e.key === 'Enter' || e.key === 'Tab') {
        if (bufferRef.current.length >= minLength) {
          e.preventDefault();
          processScan(bufferRef.current);
          bufferRef.current = '';
        }
        if (timerRef.current) clearTimeout(timerRef.current);
        return;
      }

      // Accumuler les caractères
      if (e.key.length === 1) {
        e.preventDefault();
        bufferRef.current += e.key;

        // Reset timer
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          if (bufferRef.current.length >= minLength) {
            processScan(bufferRef.current);
          }
          bufferRef.current = '';
        }, timeout);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      bufferRef.current = '';
    };
  }, [enabled, minLength, timeout, processScan]);

  return {
    normalizeBarcode,
    findProductByBarcode,
    processScan,
  };
};
