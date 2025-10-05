import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Gift } from 'lucide-react';
import { useLoyaltyConfig } from '@/hooks/useLoyalty';

interface LoyaltyRedemptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerPoints: number;
  totalAmount: number;
  onRedeem: (points: number, discount: number) => void;
}

export function LoyaltyRedemptionDialog({
  open,
  onOpenChange,
  customerPoints,
  totalAmount,
  onRedeem,
}: LoyaltyRedemptionDialogProps) {
  const { data: config } = useLoyaltyConfig();
  const [pointsToUse, setPointsToUse] = useState(0);

  if (!config) return null;

  const maxPointsAllowed = Math.min(
    customerPoints,
    Math.floor((totalAmount * config.maxRedemptionPercent / 100) / config.euroPerPoint)
  );

  const maxPointsRedeemable = Math.min(maxPointsAllowed, customerPoints);
  const discountAmount = pointsToUse * config.euroPerPoint;

  const handleUseMax = () => {
    setPointsToUse(maxPointsRedeemable);
  };

  const handleConfirm = () => {
    if (pointsToUse >= config.minPointsToRedeem && pointsToUse <= maxPointsRedeemable) {
      onRedeem(pointsToUse, discountAmount);
      setPointsToUse(0);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Utiliser les points de fidélité
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Points disponibles:</span>
              <span className="font-semibold">{customerPoints}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total de la vente:</span>
              <span className="font-semibold">{totalAmount.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Maximum utilisable:</span>
              <span className="font-semibold">{maxPointsRedeemable} points</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="points">Points à utiliser</Label>
            <div className="flex gap-2">
              <Input
                id="points"
                type="number"
                min={config.minPointsToRedeem}
                max={maxPointsRedeemable}
                value={pointsToUse}
                onChange={(e) => setPointsToUse(Math.max(0, Math.min(maxPointsRedeemable, Number(e.target.value))))}
              />
              <Button variant="outline" onClick={handleUseMax}>
                Maximum
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum {config.minPointsToRedeem} points requis
            </p>
          </div>

          {pointsToUse > 0 && (
            <div className="rounded-lg bg-primary/10 p-4 text-center">
              <p className="text-sm text-muted-foreground">Réduction</p>
              <p className="text-2xl font-bold text-primary">-{discountAmount.toFixed(2)}€</p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Annuler
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={pointsToUse < config.minPointsToRedeem || pointsToUse > maxPointsRedeemable}
              className="flex-1"
            >
              Appliquer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
