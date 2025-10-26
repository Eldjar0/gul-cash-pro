import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, X, CheckCircle2, XCircle, Package, Flashlight, FlashlightOff } from 'lucide-react';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { useProducts } from '@/hooks/useProducts';
import { useAddScannedItem } from '@/hooks/useRemoteScan';
import { ProductInfoCard } from '@/components/products/ProductInfoCard';

export default function DirectCameraScanner() {
  const navigate = useNavigate();
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<{ barcode: string; success: boolean; productName?: string; product?: any } | null>(null);
  const { data: products = [] } = useProducts();
  const addScannedItem = useAddScannedItem();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isTorchAvailable, setIsTorchAvailable] = useState(false);

  // Sons
  const playSuccessSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjuY3/LNfzYFII/P8d2RRwoXZLnq66lWFQxGnODyvmwhBzuZ3/LNgDYFIJDP8d2QRwoXY7jq66lWFQxFnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRw==');
    audio.play().catch(err => console.error('Error playing success sound:', err));
  };

  const playErrorSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjuY3/LNfzYFII/P8d2RRwoXZLnq66lWFQxGnODyvmwhBzuZ3/LNgDYFIJDP8d2QRwoXY7jq66lWFQxFnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRwoXY7jq66lWFQxGnODyvmwhBzqY3/LNgDYFIJDP8d2RRw==');
    audio.play().catch(err => console.error('Error playing error sound:', err));
  };

  // Gestion de la lampe torche
  const toggleTorch = async () => {
    if (!Capacitor.isNativePlatform()) {
      toast.info('Lampe torche disponible uniquement sur mobile');
      return;
    }

    try {
      await BarcodeScanner.toggleTorch();
      setIsTorchOn(!isTorchOn);
    } catch (error) {
      console.error('Error toggling torch:', error);
      toast.error('Erreur lors de l\'activation de la lampe');
    }
  };

  // Vérifier la disponibilité de la torche
  useEffect(() => {
    const checkTorch = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const available = await BarcodeScanner.isTorchAvailable();
          setIsTorchAvailable(available.available);
        } catch (error) {
          console.error('Error checking torch:', error);
        }
      }
    };
    checkTorch();
  }, []);

  const startScanning = async () => {
    if (Capacitor.isNativePlatform()) {
      // Scanner natif pour mobile
      try {
        await BarcodeScanner.requestPermissions();
        setIsScanning(true);
        
        const result = await BarcodeScanner.scan();
        
        if (result.barcodes.length > 0) {
          const barcode = result.barcodes[0].rawValue;
          await handleScan(barcode);
        }
      } catch (error) {
        console.error('Error scanning:', error);
        toast.error('Erreur lors du scan');
      } finally {
        setIsScanning(false);
      }
    } else {
      // Scanner web pour navigateur
      toast.info('Scan par caméra disponible uniquement sur mobile. Utilisez le lecteur code-barres USB.');
    }
  };

  const handleScan = async (barcode: string) => {
    const product = products.find(p => p.barcode === barcode);
    
    if (product) {
      // Produit trouvé
      setLastScan({
        barcode,
        success: true,
        productName: product.name,
        product
      });
      playSuccessSound();
      
      // Vibration de succès
      if (navigator.vibrate) navigator.vibrate(100);
      
      // Envoyer à la caisse
      if (sessionId) {
        try {
          await addScannedItem.mutateAsync({
            sessionId,
            barcode,
            quantity: 1
          });
          toast.success(`${product.name} ajouté au ticket`, {
            description: `Prix: ${product.price.toFixed(2)}€`,
          });
        } catch (error) {
          console.error('Error adding item:', error);
        }
      }
    } else {
      // Produit non trouvé
      setLastScan({
        barcode,
        success: false
      });
      playErrorSound();
      
      // Vibration d'erreur (plus longue)
      if (navigator.vibrate) navigator.vibrate(300);
      
      toast.error('Produit non trouvé', {
        description: `Code-barres: ${barcode}`,
      });
    }
    
    // Réinitialiser après 3 secondes
    setTimeout(() => {
      setLastScan(null);
    }, 3000);
  };

  // Récupérer l'ID de session si un code est fourni
  useEffect(() => {
    const fetchSession = async () => {
      if (sessionCode) {
        // TODO: Récupérer l'ID de session depuis le code
        // Pour l'instant, on suppose qu'on a déjà l'ID
      }
    };
    fetchSession();
  }, [sessionCode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/5 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Camera className="h-6 w-6" />
            Scanner Direct
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Zone de scan */}
        <Card className="p-8 space-y-6 relative">
          {/* Bouton torche */}
          {isScanning && isTorchAvailable && (
            <Button
              variant={isTorchOn ? "default" : "outline"}
              size="icon"
              className={`absolute top-4 right-4 z-50 ${isTorchOn && 'bg-yellow-500 hover:bg-yellow-600 text-white'}`}
              onClick={toggleTorch}
            >
              {isTorchOn ? (
                <Flashlight className="h-5 w-5" />
              ) : (
                <FlashlightOff className="h-5 w-5" />
              )}
            </Button>
          )}

          {/* Retour visuel du dernier scan */}
          {lastScan && (
            <div className={`animate-fade-in ${
              lastScan.success 
                ? 'space-y-3' 
                : 'p-4 rounded-lg border-2 bg-red-500/10 border-red-500'
            }`}>
              {lastScan.success && lastScan.product ? (
                <>
                  <div className="flex items-center gap-3 p-3 bg-green-500/10 border-2 border-green-500 rounded-lg">
                    <CheckCircle2 className="h-8 w-8 text-green-500 animate-scale-in" />
                    <div>
                      <p className="font-bold text-green-700 dark:text-green-400">
                        Produit scanné avec succès !
                      </p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {lastScan.barcode}
                      </p>
                    </div>
                  </div>
                  <ProductInfoCard product={lastScan.product} variant="compact" />
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <XCircle className="h-8 w-8 text-red-500 animate-scale-in" />
                  <div>
                    <p className="font-bold text-red-700 dark:text-red-400">
                      Produit non trouvé
                    </p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {lastScan.barcode}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bouton de scan */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
              <Camera className="h-16 w-16 text-primary" />
            </div>
            
            <Button
              size="lg"
              onClick={startScanning}
              disabled={isScanning}
              className="w-full h-16 text-lg"
            >
              {isScanning ? (
                <>
                  <Package className="h-5 w-5 mr-2 animate-pulse" />
                  Scan en cours...
                </>
              ) : (
                <>
                  <Camera className="h-5 w-5 mr-2" />
                  Démarrer le scan
                </>
              )}
            </Button>
          </div>

          {/* Instructions */}
          <div className="p-4 bg-accent/50 rounded-lg space-y-2">
            <p className="text-sm font-medium">Instructions:</p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Appuyez sur "Démarrer le scan"</li>
              <li>Pointez la caméra vers le code-barres</li>
              <li>Le produit sera ajouté automatiquement au ticket</li>
              <li>Un son confirmera le scan réussi ou raté</li>
            </ol>
          </div>
        </Card>

        {/* Session info */}
        {sessionCode && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Session active</p>
                <p className="font-mono font-bold">{sessionCode}</p>
              </div>
              <Badge variant="default">Connecté</Badge>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
