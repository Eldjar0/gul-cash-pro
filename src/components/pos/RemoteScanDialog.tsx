import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Smartphone, X, Lock, Eye, EyeOff } from 'lucide-react';
import QRCode from 'qrcode';

interface RemoteScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ADMIN_PASSWORD = 'jlprod2024'; // Mot de passe pour accéder au QR code

export function RemoteScanDialog({ open, onOpenChange }: RemoteScanDialogProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && isAuthenticated && !qrCodeUrl) {
      const generateQR = async () => {
        const url = `${window.location.origin}/mobile`;
        const qrDataUrl = await QRCode.toDataURL(url, {
          width: 300,
          margin: 2,
        });
        setQrCodeUrl(qrDataUrl);
      };
      generateQR();
    }
  }, [open, isAuthenticated, qrCodeUrl]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setPassword('');
      setIsAuthenticated(false);
      setError('');
      setQrCodeUrl('');
    }
  }, [open]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Mot de passe incorrect');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Accès mobile rapide
          </DialogTitle>
        </DialogHeader>

        {!isAuthenticated ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Entrez le mot de passe pour accéder au QR code de scan mobile
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Entrez le mot de passe..."
                  className="pr-10"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={!password}>
                Valider
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4">
            {qrCodeUrl ? (
              <>
                <div className="bg-white p-4 rounded-lg">
                  <img src={qrCodeUrl} alt="QR Code" className="w-full h-auto" />
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  Scannez ce QR code avec votre téléphone pour accéder à l'interface mobile
                </p>
              </>
            ) : (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4 mr-2" />
                Fermer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
