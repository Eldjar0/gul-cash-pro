import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Smartphone, X } from 'lucide-react';
import QRCode from 'qrcode';

interface RemoteScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RemoteScanDialog({ open, onOpenChange }: RemoteScanDialogProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (open && !qrCodeUrl) {
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
  }, [open, qrCodeUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Accès mobile rapide
          </DialogTitle>
        </DialogHeader>

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
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
