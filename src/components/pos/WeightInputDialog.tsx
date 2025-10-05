import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Scale } from 'lucide-react';
import { Product } from '@/hooks/useProducts';

interface WeightInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onConfirm: (weight: number) => void;
}

export function WeightInputDialog({ open, onOpenChange, product, onConfirm }: WeightInputDialogProps) {
  const [weight, setWeight] = useState('');

  const handleConfirm = () => {
    const weightValue = parseFloat(weight);
    if (weightValue && weightValue > 0) {
      onConfirm(weightValue);
      setWeight('');
      onOpenChange(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Saisir le poids
          </DialogTitle>
        </DialogHeader>
        
        {product && (
          <div className="space-y-4">
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="font-bold text-lg">{product.name}</div>
              <div className="text-sm text-muted-foreground">
                {product.price.toFixed(2)}€ / kg
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Poids (kg)
              </label>
              <Input
                type="number"
                step="0.001"
                min="0.001"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="0.000"
                autoFocus
                className="text-lg font-bold text-center"
              />
            </div>

            {weight && parseFloat(weight) > 0 && (
              <div className="bg-primary/10 p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-2xl font-bold text-primary">
                  {(parseFloat(weight) * product.price).toFixed(2)}€
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!weight || parseFloat(weight) <= 0}
          >
            Valider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
