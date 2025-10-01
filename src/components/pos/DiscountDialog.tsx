import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Percent, DollarSign } from 'lucide-react';

interface DiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (type: 'percentage' | 'amount', value: number) => void;
  title?: string;
}

export const DiscountDialog = ({ open, onOpenChange, onApply, title = "Appliquer une remise" }: DiscountDialogProps) => {
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [discountValue, setDiscountValue] = useState('');

  const handleApply = () => {
    const value = parseFloat(discountValue);
    if (isNaN(value) || value <= 0) {
      return;
    }
    onApply(discountType, value);
    setDiscountValue('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Choisissez le type de remise et entrez la valeur
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={discountType === 'percentage' ? 'default' : 'outline'}
              onClick={() => setDiscountType('percentage')}
              className="h-20 flex flex-col gap-2"
            >
              <Percent className="h-6 w-6" />
              <span>Pourcentage</span>
            </Button>
            <Button
              variant={discountType === 'amount' ? 'default' : 'outline'}
              onClick={() => setDiscountType('amount')}
              className="h-20 flex flex-col gap-2"
            >
              <DollarSign className="h-6 w-6" />
              <span>Montant fixe</span>
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Valeur {discountType === 'percentage' ? '(%)' : '(€)'}
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountType === 'percentage' ? 'Ex: 10' : 'Ex: 5.00'}
              className="h-12 text-lg"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setDiscountValue('');
                onOpenChange(false);
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleApply}
              disabled={!discountValue || parseFloat(discountValue) <= 0}
            >
              Appliquer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
