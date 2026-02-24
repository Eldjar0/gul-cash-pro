import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

type SignMode = 'positive' | 'negative';

const QUICK_PRESETS = [
  { label: 'Légume', name: 'Légume', vat: '6', sign: 'positive' as SignMode },
  { label: 'Viande', name: 'Viande', vat: '6', sign: 'positive' as SignMode },
  { label: 'Cigarette', name: 'Cigarette', vat: '0', sign: 'positive' as SignMode },
  { label: 'Consommable', name: 'Consommable', vat: '21', sign: 'positive' as SignMode },
  { label: '➕ Positif', name: 'Positif', vat: '21', sign: 'positive' as SignMode },
  { label: '➖ Négatif', name: 'Négatif', vat: '21', sign: 'negative' as SignMode },
];

interface QuickAddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (product: { id: string; name: string; price: number; vat_rate: number; barcode: string | null; type: string; stock: number | null; category_id: string | null }) => void;
}

export function QuickAddProductDialog({ open, onOpenChange, onAdd }: QuickAddProductDialogProps) {
  const [quickName, setQuickName] = useState('');
  const [quickPrice, setQuickPrice] = useState('');
  const [quickVat, setQuickVat] = useState('21');
  const [signMode, setSignMode] = useState<SignMode>('positive');

  const handleAdd = () => {
    const name = quickName.trim();
    const price = parseFloat(quickPrice);
    const vat = parseFloat(quickVat) || 0;

    if (!name) {
      toast.error('Nom requis');
      return;
    }
    if (isNaN(price) || price <= 0) {
      toast.error('Prix valide requis');
      return;
    }

    const finalPrice = signMode === 'negative' ? -Math.abs(price) : Math.abs(price);

    onAdd({
      id: `quick-${Date.now()}`,
      name: signMode === 'negative' ? `${name} (déduction)` : name,
      price: finalPrice,
      vat_rate: vat,
      barcode: null,
      type: 'unit',
      stock: null,
      category_id: null,
    });

    toast.success(signMode === 'negative' ? `${name} déduit` : `${name} ajouté`);
    setQuickName('');
    setQuickPrice('');
    setQuickVat('21');
    setSignMode('positive');
    onOpenChange(false);
  };

  const applyPreset = (preset: typeof QUICK_PRESETS[0]) => {
    setQuickName(preset.name);
    setQuickVat(preset.vat);
    setSignMode(preset.sign);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Ajout rapide
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Presets */}
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PRESETS.map((p) => (
              <Button
                key={p.label}
                variant={quickName === p.name && signMode === p.sign ? 'default' : 'outline'}
                size="sm"
                className={`h-8 text-xs ${p.sign === 'negative' ? 'border-destructive/40 text-destructive hover:bg-destructive/10' : ''}`}
                onClick={() => applyPreset(p)}
              >
                {p.label}
              </Button>
            ))}
          </div>

          {/* Positif / Négatif toggle */}
          <div>
            <Label className="text-xs mb-1.5 block">Type de ligne</Label>
            <div className="flex gap-2">
              <Button
                variant={signMode === 'positive' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setSignMode('positive')}
              >
                <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                Positif (+)
              </Button>
              <Button
                variant={signMode === 'negative' ? 'destructive' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setSignMode('negative')}
              >
                <TrendingDown className="h-3.5 w-3.5 mr-1.5" />
                Négatif (−)
              </Button>
            </div>
          </div>

          {/* Nom */}
          <div>
            <Label className="text-xs">Nom de l'article</Label>
            <Input
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
              placeholder="Ex: Tomate, Pack eau..."
              autoFocus
            />
          </div>

          {/* Prix */}
          <div>
            <Label className="text-xs">
              {signMode === 'negative' ? 'Montant à déduire (€)' : 'Prix TTC (€)'}
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={quickPrice}
              onChange={(e) => setQuickPrice(e.target.value)}
              placeholder="0.00"
              className={signMode === 'negative' ? 'border-destructive/40' : ''}
            />
          </div>

          {/* TVA */}
          <div>
            <Label className="text-xs mb-1.5 block">TVA</Label>
            <div className="flex gap-2">
              {['0', '6', '21'].map((rate) => (
                <Button
                  key={rate}
                  variant={quickVat === rate ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setQuickVat(rate)}
                >
                  {rate}%
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleAdd}
            className="w-full"
            variant={signMode === 'negative' ? 'destructive' : 'default'}
          >
            <Plus className="h-4 w-4 mr-2" />
            {signMode === 'negative' ? 'Déduire du panier' : 'Ajouter au panier'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
