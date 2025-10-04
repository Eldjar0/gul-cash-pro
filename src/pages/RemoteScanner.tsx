import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Scan, CheckCircle2, AlertCircle, Smartphone } from 'lucide-react';
import { useScanSession, useAddScannedItem } from '@/hooks/useRemoteScan';
import { toast } from 'sonner';

export default function RemoteScanner() {
  const { sessionCode } = useParams();
  const navigate = useNavigate();
  const [barcode, setBarcode] = useState('');
  const [scannedItems, setScannedItems] = useState<Array<{ barcode: string; time: string }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { data: session, isLoading, error } = useScanSession(sessionCode);
  const addScannedItem = useAddScannedItem();

  useEffect(() => {
    // Auto-focus input for barcode scanner
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (error) {
      toast.error('Session invalide ou expirée');
      setTimeout(() => navigate('/'), 3000);
    }
  }, [error, navigate]);

  const handleScan = async (scannedBarcode: string) => {
    if (!session || !scannedBarcode.trim()) return;

    try {
      await addScannedItem.mutateAsync({
        sessionId: session.id,
        barcode: scannedBarcode.trim(),
        quantity: 1,
      });

      setScannedItems(prev => [
        { barcode: scannedBarcode, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 9) // Keep last 10 items
      ]);
      
      setBarcode('');
      
      // Play success sound
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTQIGWi77eeeTRAMUKfj8LZjHAY4ktfx');
      audio.play().catch(() => {});
    } catch (error) {
      console.error('Error scanning item:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScan(barcode);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Connexion à la session...</p>
        </div>
      </div>
    );
  }

  if (error || !session || !session.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/20 to-destructive/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <CardTitle>Session Invalide</CardTitle>
            </div>
            <CardDescription>
              Cette session de scan n'existe pas ou a expiré.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Retour à la caisse
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/5 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary rounded-lg">
                  <Smartphone className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Scanner à Distance</CardTitle>
                  <CardDescription className="text-base">
                    Session: <span className="font-mono font-bold">{session.session_code}</span>
                  </CardDescription>
                </div>
              </div>
              <Badge variant="default" className="animate-pulse">
                <div className="h-2 w-2 rounded-full bg-white mr-2"></div>
                Connecté
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Scanner Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              Scanner un produit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Code-barres du produit..."
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="text-lg h-14 text-center font-mono"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground text-center">
                  Scannez un code-barres ou saisissez-le manuellement
                </p>
              </div>
              <Button type="submit" className="w-full h-12 text-lg" disabled={!barcode.trim()}>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Ajouter au panier
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Scanned Items History */}
        {scannedItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Articles scannés récemment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {scannedItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-accent rounded-lg animate-in slide-in-from-top"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="font-mono font-semibold">{item.barcode}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-accent/50">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <p className="text-sm font-medium">💡 Conseils d'utilisation:</p>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>Gardez cette page ouverte pendant le scan</li>
                <li>Pointez la caméra directement sur le code-barres</li>
                <li>Assurez-vous d'avoir un bon éclairage</li>
                <li>Les produits sont ajoutés automatiquement au panier</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
