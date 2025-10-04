import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Smartphone, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import { useCreateScanSession, useCloseScanSession } from '@/hooks/useRemoteScan';
interface RemoteScanDialogProps {
  onSessionCreated: (sessionId: string, sessionCode: string) => void;
}
export function RemoteScanDialog({
  onSessionCreated
}: RemoteScanDialogProps) {
  const [open, setOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [currentSession, setCurrentSession] = useState<{
    id: string;
    code: string;
  } | null>(null);
  const createSession = useCreateScanSession();
  const closeSession = useCloseScanSession();
  const handleOpenChange = (isOpen: boolean) => {
    // Ne pas fermer automatiquement la session
    setOpen(isOpen);
  };
  const handleCloseSession = () => {
    if (currentSession) {
      closeSession.mutate(currentSession.id);
      setCurrentSession(null);
      setQrCodeUrl('');
    }
    setOpen(false);
  };
  const handleCreateSession = async () => {
    try {
      const session = await createSession.mutateAsync();
      setCurrentSession({
        id: session.id,
        code: session.session_code
      });
      onSessionCreated(session.id, session.session_code);

      // Generate QR code with scanner URL
      const scannerUrl = `${window.location.origin}/remote-scanner/${session.session_code}`;
      const qrUrl = await QRCode.toDataURL(scannerUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };
  useEffect(() => {
    if (open && !currentSession) {
      handleCreateSession();
    }
  }, [open]);
  return <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scanner à Distance
          </DialogTitle>
          <DialogDescription>
            Scannez ce QR code avec votre téléphone pour scanner des produits à distance
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4 py-4">
          {qrCodeUrl ? <>
              <div className="p-4 bg-white rounded-lg border-4 border-primary">
                <img src={qrCodeUrl} alt="QR Code" className="w-full h-auto" />
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Code de session:</p>
                <p className="text-2xl font-bold font-mono tracking-wider">
                  {currentSession?.code}
                </p>
              </div>

              <div className="w-full p-4 bg-accent rounded-lg space-y-2">
                <p className="text-sm font-medium">Instructions:</p>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Scannez le QR code avec votre téléphone</li>
                  <li>La connexion reste active jusqu'à fermeture manuelle</li>
                  <li>Scannez les codes-barres des produits</li>
                  <li>Les produits sont ajoutés automatiquement au panier</li>
                </ol>
              </div>
              
              <Button variant="destructive" className="w-full" onClick={handleCloseSession}>
                Fermer la session
              </Button>
            </> : <div className="flex items-center justify-center h-64">
              <div className="animate-pulse text-muted-foreground">
                Génération du QR code...
              </div>
            </div>}
        </div>
      </DialogContent>
    </Dialog>;
}