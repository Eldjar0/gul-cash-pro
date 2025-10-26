import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, X, CheckCircle2, XCircle } from 'lucide-react';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { useProducts } from '@/hooks/useProducts';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { DecodeHintType } from '@zxing/library';
import { supabase } from '@/integrations/supabase/client';

interface MobileBarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onProductFound?: (product: any) => void;
  onProductNotFound?: (barcode: string) => void;
}

export const MobileBarcodeScanner = ({ open, onClose, onProductFound, onProductNotFound }: MobileBarcodeScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<{ type: 'success' | 'error'; product?: any; barcode?: string } | null>(null);
  const { data: products = [] } = useProducts();
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const scanAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastScannedRef = useRef<{ code: string; at: number } | null>(null);
  const isNative = Capacitor.isNativePlatform();

  // Son continu pendant le scan
  useEffect(() => {
    if (isScanning && !scanAudioRef.current) {
      scanAudioRef.current = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
      scanAudioRef.current.loop = true;
      scanAudioRef.current.volume = 0.2;
      scanAudioRef.current.play().catch(() => {});
    } else if (!isScanning && scanAudioRef.current) {
      scanAudioRef.current.pause();
      scanAudioRef.current = null;
    }
    
    return () => {
      if (scanAudioRef.current) {
        scanAudioRef.current.pause();
        scanAudioRef.current = null;
      }
    };
  }, [isScanning]);

  const playSuccessBeep = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjuY3/LNfzYFII/P8d2RRwoXZLnq66lWFQxGnODyvmwhBzuZ3/LNgDYFIJDP8d2QRwoXY7jq66lWFQxFnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRw==');
    audio.volume = 0.8;
    audio.play().catch(() => {});
  };

  const playErrorBeep = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
    audio.volume = 0.5;
    audio.play().catch(() => {});
  };

  const handleScan = async (barcode: string) => {
    const now = Date.now();
    if (lastScannedRef.current && lastScannedRef.current.code === barcode && now - lastScannedRef.current.at < 2000) {
      return;
    }
    lastScannedRef.current = { code: barcode, at: now };

    let product = products.find(p => p.barcode === barcode);
    
    if (!product) {
      const { data: barcodeData } = await supabase
        .from('product_barcodes')
        .select('product_id')
        .eq('barcode', barcode)
        .maybeSingle();
      
      if (barcodeData) {
        product = products.find(p => p.id === barcodeData.product_id);
      }
    }
    
    if (product) {
      playSuccessBeep();
      setLastResult({ type: 'success', product });
      toast.success(`Produit trouvé: ${product.name}`);
      setTimeout(() => {
        onProductFound?.(product);
      }, 800);
    } else {
      playErrorBeep();
      setLastResult({ type: 'error', barcode });
      toast.error('Produit non trouvé');
      setTimeout(() => {
        onProductNotFound?.(barcode);
      }, 800);
    }
  };

  const startScanning = async () => {
    if (isNative) {
      try {
        const { camera } = await BarcodeScanner.requestPermissions();
        if (camera !== 'granted') {
          toast.error('Permission caméra refusée');
          return;
        }

        setIsScanning(true);
        document.body.classList.add('barcode-scanning-active');
        
        const result = await BarcodeScanner.scan({ formats: [] });

        if (result.barcodes.length > 0) {
          await handleScan(result.barcodes[0].rawValue);
        }
      } catch (error) {
        console.error('Erreur scan natif:', error);
        toast.error('Erreur lors du scan');
      } finally {
        setIsScanning(false);
        document.body.classList.remove('barcode-scanning-active');
      }
    } else {
      try {
        setIsScanning(true);
        
        if (!codeReaderRef.current) {
          const hints = new Map();
          hints.set(DecodeHintType.TRY_HARDER, true);
          codeReaderRef.current = new BrowserMultiFormatReader(hints);
        }

        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (videoInputDevices.length === 0) {
          toast.error('Aucune caméra détectée');
          setIsScanning(false);
          return;
        }

        const selectedDevice = videoInputDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear')
        ) || videoInputDevices[0];

        if (videoRef.current) {
          await codeReaderRef.current.decodeFromVideoDevice(
            selectedDevice.deviceId,
            videoRef.current,
            (result) => {
              if (result) {
                handleScan(result.getText());
                stopWebScanning();
              }
            }
          );
        }
      } catch (error) {
        console.error('Erreur scan web:', error);
        toast.error('Erreur accès caméra');
        setIsScanning(false);
      }
    }
  };

  const stopWebScanning = () => {
    if (codeReaderRef.current && videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      if (!isNative && videoRef.current) {
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    };
  }, [isNative]);

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen && isScanning && !isNative) {
        stopWebScanning();
      }
      if (!newOpen) {
        setLastResult(null);
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scanner Mobile
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Visualisation caméra */}
          <div className="relative aspect-square w-full bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg overflow-hidden border-2 border-dashed border-primary/20">
            {!isNative && isScanning && (
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
            )}
            
            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="h-24 w-24 text-primary/30" />
              </div>
            )}
            
            {/* Cadre de guidage */}
            <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
              <div className="relative w-full h-32 border-2 border-primary rounded-lg">
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                
                {isScanning && (
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary/50 shadow-[0_0_10px_rgba(var(--primary),0.5)] animate-pulse" />
                )}
              </div>
            </div>
            
            {/* Résultat du scan */}
            {lastResult && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-background/95 flex items-center gap-2 shadow-lg">
                {lastResult.type === 'success' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">{lastResult.product?.name}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Non trouvé</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Instructions:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Appuyez sur "Démarrer"</li>
              <li>Autorisez l'accès caméra</li>
              <li>Positionnez le code-barres</li>
              <li>Attendez le bip de confirmation</li>
            </ol>
          </div>

          {/* Boutons */}
          <div className="flex gap-2">
            {isScanning && !isNative && (
              <Button
                variant="outline"
                size="lg"
                onClick={stopWebScanning}
                className="flex-1 h-14"
              >
                <X className="h-5 w-5 mr-2" />
                Arrêter
              </Button>
            )}
            <Button
              size="lg"
              onClick={startScanning}
              disabled={isScanning}
              className="flex-1 h-14"
            >
              <Camera className="h-5 w-5 mr-2" />
              {isScanning ? 'Scan...' : 'Démarrer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
