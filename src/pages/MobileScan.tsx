import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useScanSession, useAddScannedItem } from '@/hooks/useRemoteScan';
import { Button } from '@/components/ui/button';
import { Camera, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';

export default function MobileScan() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionCode = searchParams.get('session');
  const [isScanning, setIsScanning] = useState(false);
  
  const { data: session, isLoading } = useScanSession(sessionCode || undefined);
  const addScannedItem = useAddScannedItem();

  const handleScan = (barcode: string) => {
    if (session && barcode) {
      addScannedItem.mutate({
        sessionId: session.id,
        barcode,
        quantity: 1,
      });
    }
  };

  useBarcodeScanner({
    onScan: handleScan,
    enabled: isScanning && !!session,
    minLength: 3,
  });

  useEffect(() => {
    if (!sessionCode) {
      toast.error('Code de session manquant');
      navigate('/');
    }
  }, [sessionCode, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background p-4">
        <XCircle className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Session invalide</h1>
        <p className="text-muted-foreground text-center">
          Cette session n'existe pas ou a expiré
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-primary text-primary-foreground p-4 shadow-lg">
        <h1 className="text-xl font-bold text-center">Scanner Mobile</h1>
        <p className="text-sm text-center opacity-90">Session: {sessionCode}</p>
      </div>

      <div className="p-4 space-y-6">
        <div className="flex flex-col items-center gap-4 py-8">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Connecté à la caisse</h2>
            <p className="text-muted-foreground">
              Votre téléphone est maintenant connecté. Scannez des produits pour les ajouter à la caisse.
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={() => setIsScanning(!isScanning)}
            className={`w-full max-w-md h-20 text-lg ${
              isScanning 
                ? 'bg-destructive hover:bg-destructive/90' 
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            <Camera className="h-6 w-6 mr-2" />
            {isScanning ? 'Arrêter le scan' : 'Commencer à scanner'}
          </Button>
        </div>

        {isScanning && (
          <div className="bg-green-500/10 border-2 border-green-500 rounded-lg p-6 text-center animate-pulse">
            <p className="text-lg font-semibold text-green-700 dark:text-green-400">
              Scan actif - Prêt à scanner
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Utilisez un scanner physique ou la caméra pour scanner des codes-barres
            </p>
          </div>
        )}

        <div className="bg-card rounded-lg p-6 space-y-2">
          <h3 className="font-semibold text-lg">Instructions</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Activez le scan avec le bouton ci-dessus</li>
            <li>• Scannez vos produits avec un scanner physique</li>
            <li>• Les articles apparaîtront automatiquement à la caisse</li>
            <li>• Cette session reste active tant que vous ne fermez pas la page</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
