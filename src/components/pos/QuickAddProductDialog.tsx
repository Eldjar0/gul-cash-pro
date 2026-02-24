import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, Plus, Minus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface QuickAddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (product: { id: string; name: string; price: number; vat_rate: number; barcode: string | null; type: string; stock: number | null; category_id: string | null }) => void;
}

const PRESETS = [
  { name: 'Légume', vat: 6, icon: '🥬' },
  { name: 'Fruit', vat: 6, icon: '🍎' },
  { name: 'Viande', vat: 6, icon: '🥩' },
  { name: 'Boisson', vat: 21, icon: '🥤' },
  { name: 'Cigarette', vat: 0, icon: '🚬' },
  { name: 'Divers', vat: 21, icon: '📦' },
];

const VAT_OPTIONS = [0, 6, 12, 21];

export function QuickAddProductDialog({ open, onOpenChange, onAdd }: QuickAddProductDialogProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [vat, setVat] = useState(21);
  const [isDeduction, setIsDeduction] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const priceRef = useRef<HTMLInputElement>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setName('');
      setPrice('');
      setVat(21);
      setIsDeduction(false);
      setSelectedPreset(null);
    }
  }, [open]);

  const selectPreset = (index: number) => {
    const preset = PRESETS[index];
    setSelectedPreset(index);
    setName(preset.name);
    setVat(preset.vat);
    setIsDeduction(false);
    // Focus prix après sélection preset
    setTimeout(() => priceRef.current?.focus(), 50);
  };

  const handleSubmit = () => {
    const trimmedName = name.trim();
    const parsedPrice = parseFloat(price);

    if (!trimmedName) {
      toast.error('Entrez un nom');
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error('Entrez un prix valide');
      return;
    }

    const finalPrice = isDeduction ? -parsedPrice : parsedPrice;

    onAdd({
      id: `quick-${Date.now()}`,
      name: isDeduction ? `${trimmedName} (déduction)` : trimmedName,
      price: finalPrice,
      vat_rate: vat,
      barcode: null,
      type: 'unit',
      stock: null,
      category_id: null,
    });

    toast.success(isDeduction ? `−${parsedPrice.toFixed(2)}€ déduit` : `${trimmedName} ajouté`);
    onOpenChange(false);
  };

  const canSubmit = name.trim() && price && !isNaN(parseFloat(price)) && parseFloat(price) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-primary" />
            Ajout rapide
          </DialogTitle>
        </DialogHeader>

        {/* Presets grid */}
        <div className="px-4 grid grid-cols-3 gap-1.5">
          {PRESETS.map((preset, i) => (
            <button
              key={preset.name}
              onClick={() => selectPreset(i)}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2.5 px-1 rounded-lg border text-xs font-medium transition-all",
                selectedPreset === i
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-border bg-card hover:bg-muted/60 text-foreground"
              )}
            >
              <span className="text-lg leading-none">{preset.icon}</span>
              <span className="truncate w-full text-center">{preset.name}</span>
              <span className="text-[10px] text-muted-foreground">{preset.vat}%</span>
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="px-4 pt-3 space-y-2.5">
          {/* Nom */}
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSelectedPreset(null);
            }}
            placeholder="Nom de l'article"
            className="h-9 text-sm"
          />

          {/* Prix + mode */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsDeduction(!isDeduction)}
              className={cn(
                "shrink-0 w-10 h-9 rounded-md border flex items-center justify-center transition-colors",
                isDeduction
                  ? "bg-destructive text-destructive-foreground border-destructive"
                  : "bg-primary text-primary-foreground border-primary"
              )}
              title={isDeduction ? 'Mode déduction' : 'Mode ajout'}
            >
              {isDeduction ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </button>
            <div className="relative flex-1">
              <Input
                ref={priceRef}
                type="number"
                step="0.01"
                min="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Prix TTC"
                className={cn(
                  "h-9 text-sm pr-8",
                  isDeduction && "border-destructive/50"
                )}
                onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleSubmit()}
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
            </div>
          </div>

          {/* TVA chips */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground shrink-0">TVA</span>
            {VAT_OPTIONS.map((rate) => (
              <button
                key={rate}
                onClick={() => setVat(rate)}
                className={cn(
                  "flex-1 h-7 rounded-md text-xs font-medium transition-colors",
                  vat === rate
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {rate}%
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="p-4 pt-3">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full"
            variant={isDeduction ? 'destructive' : 'default'}
          >
            <Check className="h-4 w-4 mr-1.5" />
            {isDeduction
              ? `Déduire${price ? ` −${parseFloat(price || '0').toFixed(2)}€` : ''}`
              : `Ajouter${price ? ` ${parseFloat(price || '0').toFixed(2)}€` : ''}`
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
