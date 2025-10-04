import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useLoyaltyConfig, useSaveLoyaltyConfig } from '@/hooks/useLoyalty';
import { useState, useEffect } from 'react';
import { Loader2, Gift } from 'lucide-react';

export function LoyaltySettings() {
  const { data: config, isLoading } = useLoyaltyConfig();
  const saveMutation = useSaveLoyaltyConfig();

  const [enabled, setEnabled] = useState(true);
  const [pointsPerEuro, setPointsPerEuro] = useState(10);
  const [euroPerPoint, setEuroPerPoint] = useState(0.01);
  const [minPointsToRedeem, setMinPointsToRedeem] = useState(100);
  const [maxRedemptionPercent, setMaxRedemptionPercent] = useState(50);

  useEffect(() => {
    if (config) {
      setEnabled(config.enabled);
      setPointsPerEuro(config.pointsPerEuro);
      setEuroPerPoint(config.euroPerPoint);
      setMinPointsToRedeem(config.minPointsToRedeem);
      setMaxRedemptionPercent(config.maxRedemptionPercent);
    }
  }, [config]);

  const handleSave = () => {
    saveMutation.mutate({
      enabled,
      pointsPerEuro,
      euroPerPoint,
      minPointsToRedeem,
      maxRedemptionPercent,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            <CardTitle>Programme de fidélité</CardTitle>
          </div>
          <CardDescription>
            Configurez le programme de points de fidélité pour vos clients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Activer le programme de fidélité</Label>
              <p className="text-sm text-muted-foreground">
                Les clients accumulent des points à chaque achat
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {enabled && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pointsPerEuro">Points par euro dépensé</Label>
                  <Input
                    id="pointsPerEuro"
                    type="number"
                    min="0"
                    step="1"
                    value={pointsPerEuro}
                    onChange={(e) => setPointsPerEuro(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Exemple: 10 points = 1€ dépensé
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="euroPerPoint">Valeur d'un point (€)</Label>
                  <Input
                    id="euroPerPoint"
                    type="number"
                    min="0"
                    step="0.001"
                    value={euroPerPoint}
                    onChange={(e) => setEuroPerPoint(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Exemple: 0.01€ = 1 point
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minPoints">Points minimum pour échanger</Label>
                  <Input
                    id="minPoints"
                    type="number"
                    min="0"
                    step="10"
                    value={minPointsToRedeem}
                    onChange={(e) => setMinPointsToRedeem(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Nombre minimum de points pour utiliser
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxPercent">% maximum d'échange par vente</Label>
                  <Input
                    id="maxPercent"
                    type="number"
                    min="0"
                    max="100"
                    step="5"
                    value={maxRedemptionPercent}
                    onChange={(e) => setMaxRedemptionPercent(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Limite le % du total payable avec points
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4 space-y-2">
                <p className="font-medium">Exemple avec vos paramètres:</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Client achète pour 50€ → Gagne {pointsPerEuro * 50} points</li>
                  <li>• {minPointsToRedeem} points = {(minPointsToRedeem * euroPerPoint).toFixed(2)}€ de réduction</li>
                  <li>• Sur une vente de 100€, max {maxRedemptionPercent}€ payable en points</li>
                </ul>
              </div>
            </>
          )}

          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
