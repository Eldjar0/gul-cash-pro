import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, X, Scan } from 'lucide-react';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { useProducts } from '@/hooks/useProducts';
import { UnknownBarcodeDialog } from '@/components/pos/UnknownBarcodeDialog';
import { MobilePhysicalScanDialog } from '@/components/pos/MobilePhysicalScanDialog';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { DecodeHintType } from '@zxing/library';
import { supabase } from '@/integrations/supabase/client';

interface MobileBarcodeScannerProps {
  open: boolean;
  onClose: () => void;
}

export const MobileBarcodeScanner = ({ open, onClose }: MobileBarcodeScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [foundProduct, setFoundProduct] = useState<any>(null);
  const [showUnknownDialog, setShowUnknownDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const { data: products = [] } = useProducts();
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const isNative = Capacitor.isNativePlatform();
  const lastScannedRef = useRef<{ code: string; at: number } | null>(null);

  // Sons
  const playSuccessSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjuY3/LNfzYFII/P8d2RRwoXZLnq66lWFQxGnODyvmwhBzuZ3/LNgDYFIJDP8d2QRwoXY7jq66lWFQxFnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRw==');
    audio.play().catch(() => {});
  };

  const playErrorSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
    audio.volume = 0.5;
    audio.play().catch(() => {});
  };

  const startScanning = async () => {
    if (isNative) {
      // Scanner natif Capacitor
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
          const barcode = result.barcodes[0].rawValue;
          await handleScan(barcode);
        }
      } catch (error) {
        console.error('Erreur scan natif:', error);
        toast.error('Erreur lors du scan');
      } finally {
        setIsScanning(false);
        document.body.classList.remove('barcode-scanning-active');
      }
    } else {
      // Scanner web pour navigateur
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

        // Préférer la caméra arrière
        const selectedDevice = videoInputDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear')
        ) || videoInputDevices[0];

        if (videoRef.current) {
          await codeReaderRef.current.decodeFromVideoDevice(
            selectedDevice.deviceId,
            videoRef.current,
            (result, error) => {
              if (result) {
                const barcode = result.getText();
                handleScan(barcode);
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

  // Cleanup au démontage
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

  const handleScan = async (barcode: string) => {
    const now = Date.now();
    if (lastScannedRef.current && lastScannedRef.current.code === barcode && now - lastScannedRef.current.at < 2000) {
      return; // ignore duplicate within 2s
    }
    lastScannedRef.current = { code: barcode, at: now };

    // Éviter les scans répétés quand un dialog est ouvert
    if (scannedBarcode === barcode && (showUnknownDialog || showProductDialog)) {
      return;
    }
    
    setScannedBarcode(barcode);
    
    // Rechercher le produit dans les codes-barres principaux et secondaires
    let product = products.find(p => p.barcode === barcode);
    
    // Si pas trouvé, chercher dans les codes-barres additionnels via product_barcodes
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
      // Produit trouvé
      playSuccessSound();
      setFoundProduct(product);
      setShowProductDialog(true);
    } else {
      // Produit non trouvé
      playErrorSound();
      setShowUnknownDialog(true);
    }
  };
  const handleCloseDialogs = () => {
    setShowUnknownDialog(false);
    setShowProductDialog(false);
    // Garder les valeurs scannées pour éviter les rescans
    setTimeout(() => {
      setScannedBarcode(null);
      setFoundProduct(null);
    }, 1000);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(newOpen) => {
        if (!newOpen && isScanning && !isNative) {
          stopWebScanning();
        }
        if (!newOpen) {
          onClose();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              Scanner Code-Barres
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Visualisation du scanner */}
            <div className="relative aspect-square w-full bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg overflow-hidden border-2 border-dashed border-primary/20">
              {/* Vidéo pour le scan web */}
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
              
              {/* Lignes de guidage */}
              <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
                <div className="relative w-full h-32 border-2 border-primary rounded-lg">
                  {/* Coins du cadre */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                  
                  {/* Ligne de scan animée */}
                  {isScanning && (
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary/50 shadow-[0_0_10px_rgba(var(--primary),0.5)] animate-pulse" />
                  )}
                </div>
              </div>
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                <p className="text-sm font-medium text-primary px-4 py-2 bg-background/90 rounded-full">
                  {isScanning ? 'Scannez le code-barres' : 'Alignez le code-barres'}
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Instructions:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Appuyez sur "Démarrer le scan"</li>
                <li>Autorisez l'accès à la caméra</li>
                <li>Positionnez le code-barres dans le cadre</li>
                <li>La détection est automatique</li>
              </ol>
            </div>

            {/* Boutons */}
            <div className="flex gap-2">
              {isScanning && !isNative && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={stopWebScanning}
                  className="flex-1 h-14 text-base"
                >
                  <X className="h-5 w-5 mr-2" />
                  Arrêter
                </Button>
              )}
              <Button
                size="lg"
                onClick={startScanning}
                disabled={isScanning}
                className="flex-1 h-14 text-base"
              >
                <Camera className="h-5 w-5 mr-2" />
                {isScanning ? 'Scan en cours...' : 'Démarrer le scan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog produit non trouvé */}
      <UnknownBarcodeDialog
        open={showUnknownDialog}
        onClose={handleCloseDialogs}
        barcode={scannedBarcode || ''}
        onProductLinked={() => {
          handleCloseDialogs();
        }}
      />

      {/* Dialog produit trouvé */}
      {foundProduct && (
        <MobilePhysicalScanDialog
          open={showProductDialog}
          onOpenChange={setShowProductDialog}
          barcode={scannedBarcode || ''}
          product={foundProduct}
          onEditProduct={() => {
            handleCloseDialogs();
            onClose();
          }}
          onAdjustStock={() => {
            handleCloseDialogs();
            onClose();
          }}
          onCreateProduct={() => {
            handleCloseDialogs();
            onClose();
          }}
          onChangeCategory={() => {
            handleCloseDialogs();
            onClose();
          }}
          onCreatePromotion={() => {
            handleCloseDialogs();
            onClose();
          }}
          onChangeBarcode={() => {
            handleCloseDialogs();
            onClose();
          }}
        />
      )}
    </>
  );
};
