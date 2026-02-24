import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Plus } from 'lucide-react';
import { toast } from 'sonner';

const QUICK_PRESETS = [
  { label: 'Légume', name: 'Légume', vat: '6' },
  { label: 'Viande', name: 'Viande', vat: '6' },
  { label: 'Cigarette', name: 'Cigarette', vat: '0' },
  { label: 'Consommable', name: 'Consommable', vat: '21' },
  { label: 'Positif', name: 'Positif', vat: '21' },
  { label: 'Positif +', name: 'Positif +', vat: '21' },
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

    onAdd({
      id: `quick-${Date.now()}`,
      name,
      price,
      vat_rate: vat,
      barcode: null,
      type: 'unit',
      stock: null,
      category_id: null,
    });

    toast.success(`${name} ajouté`);
    setQuickName('');
    setQuickPrice('');
    setQuickVat('21');
    onOpenChange(false);
  };

  const applyPreset = (preset: typeof QUICK_PRESETS[0]) => {
    setQuickName(preset.name);
    setQuickVat(preset.vat);
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
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PRESETS.map((p) => (
              <Button
                key={p.label}
                variant={quickName === p.name ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs"
                onClick={() => applyPreset(p)}
              >
                {p.label}
              </Button>
            ))}
          </div>

          <div>
            <Label className="text-xs">Nom de l'article</Label>
            <Input
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
              placeholder="Ex: Tomate, Pack eau..."
              autoFocus
            />
          </div>

          <div>
            <Label className="text-xs">Prix TTC (€)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={quickPrice}
              onChange={(e) => setQuickPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>

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

          <Button onClick={handleAdd} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter au panier
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
