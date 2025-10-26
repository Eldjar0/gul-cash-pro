import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Smartphone, X } from 'lucide-react';
import { useCreateScanSession, useCloseScanSession } from '@/hooks/useRemoteScan';
import QRCode from 'qrcode';
import { toast } from 'sonner';

interface RemoteScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RemoteScanDialog({ open, onOpenChange }: RemoteScanDialogProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [sessionCode, setSessionCode] = useState<string>('');
  const createSession = useCreateScanSession();
  const closeSession = useCloseScanSession();
  const [currentSessionId, setCurrentSessionId] = useState<string>('');

  useEffect(() => {
    if (open && !sessionCode) {
      createSession.mutate(undefined, {
        onSuccess: async (session) => {
          setSessionCode(session.session_code);
          setCurrentSessionId(session.id);
          
          const url = `${window.location.origin}/mobile/scan?session=${session.session_code}`;
          const qrDataUrl = await QRCode.toDataURL(url, {
            width: 300,
            margin: 2,
          });
          setQrCodeUrl(qrDataUrl);
        },
      });
    }
  }, [open, sessionCode]);

  const handleClose = () => {
    if (currentSessionId) {
      closeSession.mutate(currentSessionId);
    }
    setSessionCode('');
    setQrCodeUrl('');
    setCurrentSessionId('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Scanner avec votre téléphone
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {qrCodeUrl ? (
            <>
              <div className="bg-white p-4 rounded-lg">
                <img src={qrCodeUrl} alt="QR Code" className="w-full h-auto" />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Code de session
                </p>
                <p className="text-2xl font-bold tracking-wider">{sessionCode}</p>
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Scannez ce QR code avec votre téléphone pour connecter votre appareil à cette caisse
              </p>
            </>
          ) : (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
