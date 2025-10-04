import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileCheck } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  onConfirm: (checkNumber: string, checkDate: Date) => void;
}

export const CheckPaymentDialog = ({ open, onOpenChange, amount, onConfirm }: CheckPaymentDialogProps) => {
  const [checkNumber, setCheckNumber] = useState('');
  const [checkDate, setCheckDate] = useState<Date>(new Date());

  const handleConfirm = () => {
    if (!checkNumber) {
      return;
    }

    onConfirm(checkNumber, checkDate);
    setCheckNumber('');
    setCheckDate(new Date());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Paiement par Chèque
          </DialogTitle>
          <DialogDescription>
            Entrez les informations du chèque
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Montant:</span>
              <span className="font-bold text-lg">{amount.toFixed(2)} €</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Numéro du Chèque</Label>
            <Input
              placeholder="Ex: 1234567"
              value={checkNumber}
              onChange={(e) => setCheckNumber(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Date du Chèque</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !checkDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {checkDate ? format(checkDate, 'PPP', { locale: fr }) : <span>Sélectionnez une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkDate}
                  onSelect={(date) => date && setCheckDate(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={!checkNumber}>
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
