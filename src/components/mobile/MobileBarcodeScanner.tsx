import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Camera, CheckCircle, AlertCircle, Flashlight, FlashlightOff } from 'lucide-react';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { supabase } from '@/integrations/supabase/client';
import { useMobileScan } from '@/hooks/useMobileScan';
import { toast } from 'sonner';

interface MobileBarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onProductFound: (product: any) => void;
  onProductNotFound: (barcode: string) => void;
}

const AudioContext = window.AudioContext || (window as any).webkitAudioContext;

export const MobileBarcodeScanner = ({ open, onClose, onProductFound, onProductNotFound }: MobileBarcodeScannerProps) => {
  const mobileScan = useMobileScan();
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const isNative = Capacitor.isNativePlatform();
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isTorchAvailable, setIsTorchAvailable] = useState(false);
  
  // Initialiser le contexte audio
  useEffect(() => {
    if (AudioContext) {
      audioContextRef.current = new AudioContext();
    }
  }, []);

  // Bip d'activation (court, 0.2s)
  const playActivationBeep = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  };

  // Bip de succès (aigu, 0.3s)
  const playSuccessBeep = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.value = 1200;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
    
    // Vibration courte
    if (navigator.vibrate) navigator.vibrate(100);
  };

  // Bip d'erreur (grave, 0.5s)
  const playErrorBeep = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.value = 300;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
    
    // Vibration longue
    if (navigator.vibrate) navigator.vibrate(300);
  };

  // Gestion de la lampe torche
  const toggleTorch = async () => {
    if (isNative) {
      try {
        await BarcodeScanner.toggleTorch();
        setIsTorchOn(!isTorchOn);
      } catch (error) {
        console.error('Error toggling torch:', error);
        toast.error('Erreur lors de l\'activation de la lampe');
      }
    } else {
      // Pour le web, utiliser MediaStream API
      try {
        if (videoRef.current?.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          const track = stream.getVideoTracks()[0];
          const capabilities = track.getCapabilities() as any;
          
          if (capabilities.torch) {
            await track.applyConstraints({
              advanced: [{ torch: !isTorchOn } as any]
            });
            setIsTorchOn(!isTorchOn);
          } else {
            toast.info('Lampe torche non disponible sur ce navigateur');
          }
        }
      } catch (error) {
        console.error('Error toggling torch on web:', error);
        toast.error('Erreur lors de l\'activation de la lampe');
      }
    }
  };

  // Vérifier la disponibilité de la torche
  useEffect(() => {
    const checkTorch = async () => {
      if (isNative) {
        try {
          const available = await BarcodeScanner.isTorchAvailable();
          setIsTorchAvailable(available.available);
        } catch (error) {
          console.error('Error checking torch:', error);
        }
      } else {
        // Pour le web, vérifier lors de l'ouverture de la caméra
        setIsTorchAvailable(false);
      }
    };
    if (open) {
      checkTorch();
    }
  }, [open, isNative]);

  const handleScan = async (barcode: string) => {
    // Anti-duplication via le store
    if (!mobileScan.canScan(barcode)) {
      console.log('[Scanner] Cooldown actif, scan ignoré');
      return;
    }

    console.log('[Scanner] Code détecté:', barcode);

    try {
      // Recherche par code-barres principal
      let { data: productsMain, error: errorMain } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', barcode)
        .eq('is_active', true)
        .maybeSingle();

      if (errorMain) {
        console.error('[Scanner] Erreur recherche principale:', errorMain);
      }

      let product = productsMain;

      // Si pas trouvé, chercher dans product_barcodes
      if (!product) {
        const { data: barcodes, error: errorBarcodes } = await supabase
          .from('product_barcodes')
          .select('product_id')
          .eq('barcode', barcode)
          .maybeSingle();

        if (!errorBarcodes && barcodes) {
          const { data: foundProduct } = await supabase
            .from('products')
            .select('*')
            .eq('id', barcodes.product_id)
            .eq('is_active', true)
            .maybeSingle();

          product = foundProduct;
        }
      }

      if (product) {
        console.log('[Scanner] ✅ Produit trouvé:', product.name);
        playSuccessBeep();
        mobileScan.handleScanResult({
          barcode,
          product,
          result: 'success',
          message: product.name
        });
        
        // Appel IMMÉDIAT sans délai
        setTimeout(() => onProductFound(product), 100);
      } else {
        console.log('[Scanner] ❌ Produit non trouvé:', barcode);
        playErrorBeep();
        mobileScan.handleScanResult({
          barcode,
          product: null,
          result: 'error',
          message: `Code ${barcode} non trouvé`
        });
        
        // Appel IMMÉDIAT sans délai
        setTimeout(() => onProductNotFound(barcode), 300);
      }
    } catch (error) {
      console.error('[Scanner] Erreur:', error);
      playErrorBeep();
      mobileScan.handleScanResult({
        barcode,
        product: null,
        result: 'error',
        message: 'Erreur de recherche'
      });
    }
  };

  const startScanning = async () => {
    playActivationBeep();
    mobileScan.startScan();

    if (isNative) {
      try {
        const { barcodes } = await BarcodeScanner.scan();
        if (barcodes && barcodes.length > 0) {
          const scannedCode = barcodes[0].displayValue;
          handleScan(scannedCode);
        }
      } catch (error) {
        console.error('[Scanner] Erreur scan natif:', error);
        mobileScan.stopScan();
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();

          codeReaderRef.current = new BrowserMultiFormatReader();
          
          codeReaderRef.current.decodeFromVideoElement(videoRef.current, (result, error) => {
            if (result) {
              const scannedCode = result.getText();
              handleScan(scannedCode);
            }
          });
        }
      } catch (error) {
        console.error('[Scanner] Erreur caméra:', error);
        mobileScan.stopScan();
      }
    }
  };

  const stopWebScanning = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (codeReaderRef.current) {
      codeReaderRef.current = null;
    }
    mobileScan.stopScan();
  };

  useEffect(() => {
    return () => {
      if (!isNative) {
        stopWebScanning();
      }
      mobileScan.clearScan();
    };
  }, []);

  const { scanResult, resultMessage } = mobileScan;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Scanner un code-barres
            </span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Zone de scan */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            {!isNative && (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
              />
            )}
            
            {/* Bouton torche */}
            {mobileScan.isScanning && isTorchAvailable && (
              <Button
                variant={isTorchOn ? "default" : "outline"}
                size="icon"
                className={`absolute top-4 right-4 z-50 ${isTorchOn && 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg'}`}
                onClick={toggleTorch}
              >
                {isTorchOn ? (
                  <Flashlight className="h-5 w-5" />
                ) : (
                  <FlashlightOff className="h-5 w-5" />
                )}
              </Button>
            )}
            
            {/* Overlay avec feedback visuel */}
            <div className={`absolute inset-0 flex items-center justify-center transition-colors duration-300 ${
              scanResult === 'success' ? 'bg-green-500/20' : 
              scanResult === 'error' ? 'bg-red-500/20' : ''
            }`}>
              <div className="relative">
                {mobileScan.isScanning ? (
                  <div className="w-64 h-40 border-2 border-primary rounded-lg animate-pulse">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary"></div>
                  </div>
                ) : scanResult ? (
                  <div className="text-center text-white animate-fade-in">
                    {scanResult === 'success' ? (
                      <>
                        <CheckCircle className="h-16 w-16 mx-auto mb-2 text-green-400" />
                        <p className="font-semibold">{resultMessage}</p>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-16 w-16 mx-auto mb-2 text-red-400" />
                        <p className="font-semibold">{resultMessage}</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-white">
                    <Camera className="h-16 w-16 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Prêt à scanner</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-center space-y-2">
            {mobileScan.isScanning ? (
              <>
                <p className="font-semibold">Scan en cours...</p>
                <p className="text-sm text-muted-foreground">
                  Positionnez le code-barres dans le cadre
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Cliquez pour démarrer le scan
                </p>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {mobileScan.isScanning ? (
              <Button
                onClick={() => {
                  if (!isNative) stopWebScanning();
                }}
                variant="destructive"
                className="flex-1"
              >
                Arrêter
              </Button>
            ) : (
              <Button
                onClick={startScanning}
                className="flex-1 gap-2"
              >
                <Camera className="h-5 w-5" />
                Démarrer
              </Button>
            )}
            <Button onClick={onClose} variant="outline">
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
