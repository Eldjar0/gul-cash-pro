import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Euro } from 'lucide-react';

interface OpenDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (amount: number) => void;
}

export function OpenDayDialog({ open, onOpenChange, onConfirm }: OpenDayDialogProps) {
  const [amount, setAmount] = useState('0');

  const handleConfirm = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return;
    }
    onConfirm(parsedAmount);
    setAmount('0');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-primary font-bold text-2xl flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Ouvrir la journée
          </DialogTitle>
          <DialogDescription>
            Saisissez le montant d'ouverture de la caisse
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="opening-amount" className="text-base font-semibold">
              Montant d'ouverture
            </Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="opening-amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 text-2xl h-16 font-bold text-center"
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>

          <div className="bg-muted/30 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Ce montant correspond au fond de caisse en début de journée. Il sera utilisé pour calculer les écarts de caisse en fin de journée.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-12 font-semibold"
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 h-12 bg-accent hover:bg-accent/90 text-white font-bold"
          >
            Ouvrir la journée
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
