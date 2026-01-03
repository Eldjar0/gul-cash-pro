import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Euro, Calculator } from 'lucide-react';

interface PriceEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPrice: number;
  vatRate: number;
  productName: string;
  onConfirm: (newPrice: number) => void;
}

export function PriceEditDialog({
  open,
  onOpenChange,
  currentPrice,
  vatRate,
  productName,
  onConfirm,
}: PriceEditDialogProps) {
  const [priceTVAC, setPriceTVAC] = useState('');
  const [priceHTVA, setPriceHTVA] = useState('');

  useEffect(() => {
    if (open) {
      setPriceTVAC(currentPrice.toString());
      const htva = currentPrice / (1 + vatRate / 100);
      setPriceHTVA(htva.toFixed(2));
    }
  }, [open, currentPrice, vatRate]);

  const handleTVACChange = (value: string) => {
    setPriceTVAC(value);
    const tvac = parseFloat(value) || 0;
    const htva = tvac / (1 + vatRate / 100);
    setPriceHTVA(htva.toFixed(2));
  };

  const handleHTVAChange = (value: string) => {
    setPriceHTVA(value);
    const htva = parseFloat(value) || 0;
    const tvac = htva * (1 + vatRate / 100);
    setPriceTVAC(tvac.toFixed(2));
  };

  const handleConfirm = () => {
    const newPrice = parseFloat(priceTVAC) || 0;
    if (newPrice >= 0) {
      onConfirm(newPrice);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5" />
            Modifier le prix
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Article: <span className="font-semibold text-foreground">{productName}</span>
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priceHTVA">Prix HTVA</Label>
              <div className="relative">
                <Input
                  id="priceHTVA"
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceHTVA}
                  onChange={(e) => handleHTVAChange(e.target.value)}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priceTVAC">Prix TVAC</Label>
              <div className="relative">
                <Input
                  id="priceTVAC"
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceTVAC}
                  onChange={(e) => handleTVACChange(e.target.value)}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <Calculator className="h-4 w-4" />
            <span>TVA appliquée: {vatRate}%</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleConfirm}>
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
