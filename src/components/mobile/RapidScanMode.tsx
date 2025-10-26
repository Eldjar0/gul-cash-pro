import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Check, User, Trash2, Camera, CameraOff, Flashlight, FlashlightOff } from 'lucide-react';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { Product } from '@/hooks/useProducts';
import { useUnifiedScanner } from '@/hooks/useUnifiedScanner';

interface RapidScanModeProps {
  open: boolean;
  onClose: () => void;
  onValidate?: (items: ScannedItem[]) => void;
  onAssociateCustomer?: () => void;
}

interface ScannedItem {
  barcode: string;
  product: Product;
  quantity: number;
  timestamp: number;
}

export function RapidScanMode({ open, onClose, onValidate, onAssociateCustomer }: RapidScanModeProps) {
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isTorchAvailable, setIsTorchAvailable] = useState(false);

  // Verrou global
  useEffect(() => {
    (window as any).__SCAN_LOCK = open;
    return () => { (window as any).__SCAN_LOCK = false; };
  }, [open]);

  const { processScan } = useUnifiedScanner({
    onScan: (barcode, product) => {
      if (product) {
        addItem(barcode, product);
      }
    },
    enabled: open,
    cooldown: 500,
    minLength: 3,
  });

  // Total
  const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // Ajouter un produit
  const addItem = useCallback((barcode: string, product: Product) => {
    setItems(prev => {
      const existing = prev.find(i => i.barcode === barcode);
      if (existing) {
        return prev.map(i => 
          i.barcode === barcode 
            ? { ...i, quantity: i.quantity + 1, timestamp: Date.now() }
            : i
        );
      }
      return [...prev, { barcode, product, quantity: 1, timestamp: Date.now() }];
    });
  }, []);

  // Retirer un produit
  const removeItem = useCallback((barcode: string) => {
    setItems(prev => {
      const existing = prev.find(i => i.barcode === barcode);
      if (existing && existing.quantity > 1) {
        return prev.map(i => 
          i.barcode === barcode 
            ? { ...i, quantity: i.quantity - 1 }
            : i
        );
      }
      return prev.filter(i => i.barcode !== barcode);
    });
  }, []);

  // Scanner caméra
  const startCameraScanning = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      console.warn('Camera scanning only available on native platforms');
      return;
    }

    try {
      // Check permissions
      const { camera } = await BarcodeScanner.checkPermissions();
      if (camera !== 'granted') {
        const { camera: newPermission } = await BarcodeScanner.requestPermissions();
        if (newPermission !== 'granted') return;
      }

      // Check torch availability
      const torchAvailable = await BarcodeScanner.isTorchAvailable();
      setIsTorchAvailable(torchAvailable.available);

      // Start scanning
      document.body.style.background = 'transparent';
      setIsCameraActive(true);
      
      // Loop tant que la vue est ouverte
      while ((window as any).__SCAN_LOCK === true) {
        const result = await BarcodeScanner.scan();
        if (result.barcodes && result.barcodes.length > 0) {
          await processScan(result.barcodes[0].displayValue);
        }
        // Petite pause de 100ms pour éviter boucle serrée
        await new Promise(r => setTimeout(r, 100));
      }
    } catch (error) {
      console.error('Error starting camera scan:', error);
    }
  }, [processScan]);

  const stopCameraScanning = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await BarcodeScanner.stopScan();
      await BarcodeScanner.removeAllListeners();
      document.body.style.background = '';
      setIsCameraActive(false);
      setIsTorchOn(false);
    } catch (error) {
      console.error('Error stopping camera scan:', error);
    }
  }, []);

  const toggleTorch = useCallback(async () => {
    if (!isTorchAvailable) return;
    
    try {
      await BarcodeScanner.toggleTorch();
      setIsTorchOn(prev => !prev);
    } catch (error) {
      console.error('Error toggling torch:', error);
    }
  }, [isTorchAvailable]);

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      stopCameraScanning();
      setItems([]);
    }
  }, [open, stopCameraScanning]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-lg font-bold">Scan Rapide</h2>
              <p className="text-xs text-muted-foreground">
                {totalItems} article{totalItems > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isCameraActive && isTorchAvailable && (
              <Button
                variant={isTorchOn ? "default" : "outline"}
                size="icon"
                onClick={toggleTorch}
                className={isTorchOn ? "bg-yellow-500 hover:bg-yellow-600" : ""}
              >
                {isTorchOn ? <Flashlight className="h-4 w-4" /> : <FlashlightOff className="h-4 w-4" />}
              </Button>
            )}
            {Capacitor.isNativePlatform() && (
              <Button
                variant={isCameraActive ? "destructive" : "default"}
                size="icon"
                onClick={isCameraActive ? stopCameraScanning : startCameraScanning}
              >
                {isCameraActive ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Total bar */}
      <div className="sticky top-[73px] z-10 bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Total</p>
            <p className="text-3xl font-bold">{total.toFixed(2)} €</p>
          </div>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {totalItems}
          </Badge>
        </div>
      </div>

      {/* Items list */}
      <ScrollArea className="flex-1 h-[calc(100vh-280px)]">
        <div className="p-4 space-y-2">
          {items.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Scannez des produits pour commencer</p>
              <p className="text-xs text-muted-foreground mt-2">
                {Capacitor.isNativePlatform() 
                  ? "Utilisez le scanner physique ou activez la caméra"
                  : "Utilisez un scanner physique"}
              </p>
            </Card>
          ) : (
            items.map((item) => (
              <Card key={item.barcode} className="p-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-semibold">{item.product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        x{item.quantity}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {item.product.price.toFixed(2)} €
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {(item.product.price * item.quantity).toFixed(2)} €
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.barcode)}
                      className="mt-1 h-7"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Action buttons */}
      <div className="sticky bottom-0 bg-background border-t p-4 space-y-2">
        {onAssociateCustomer && (
          <Button
            variant="outline"
            className="w-full"
            onClick={onAssociateCustomer}
          >
            <User className="h-4 w-4 mr-2" />
            Associer un client
          </Button>
        )}
        <Button
          className="w-full"
          size="lg"
          disabled={items.length === 0}
          onClick={() => onValidate?.(items)}
        >
          <Check className="h-5 w-5 mr-2" />
          Valider ({total.toFixed(2)} €)
        </Button>
      </div>
    </div>
  );
}
