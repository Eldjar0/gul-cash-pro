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
  onAdd: (product: { id: string; name: string; price: number; vat_rate: number; barcode: string | null; type: string; stock: number | null; category_id: string | null }) => boolean;
}

const PRESETS = [
  { name: 'Fruit & Légume', vat: 6, icon: '🥬', deduction: false },
  { name: 'Viande', vat: 6, icon: '🥩', deduction: false },
  { name: 'Boisson', vat: 21, icon: '🥤', deduction: false },
  { name: 'Consommable', vat: 21, icon: '🧴', deduction: false },
  { name: 'Cigarette', vat: 0, icon: '🚬', deduction: false },
  { name: 'Divers', vat: 21, icon: '📦', deduction: false },
  { name: 'Vidange', vat: 0, icon: '♻️', deduction: true },
  { name: 'Déduction', vat: 0, icon: '➖', deduction: true },
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
    setIsDeduction(preset.deduction);
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

    const added = onAdd({
      id: `quick-${Date.now()}`,
      name: isDeduction ? `${trimmedName} (déduction)` : trimmedName,
      price: finalPrice,
      vat_rate: vat,
      barcode: null,
      type: 'unit',
      stock: null,
      category_id: null,
    });

    if (!added) return;

    toast.success(isDeduction ? `−${parsedPrice.toFixed(2)}€ déduit` : `${trimmedName} ajouté`);
    onOpenChange(false);
  };

  const canSubmit = name.trim().length > 0 && price.length > 0 && !isNaN(parseFloat(price)) && parseFloat(price) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] w-[95vw] p-0 gap-0 overflow-hidden" style={{ maxWidth: '900px' }}>
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Zap className="h-6 w-6 text-primary" />
            Ajout rapide
          </DialogTitle>
        </DialogHeader>

        {/* Presets grid — large touch targets */}
        <div className="px-6 grid grid-cols-4 gap-3">
          {PRESETS.map((preset, i) => (
            <button
              key={preset.name}
              onClick={() => selectPreset(i)}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 py-6 px-3 rounded-xl border-2 text-sm font-semibold transition-all active:scale-95 min-h-[90px]",
                selectedPreset === i
                  ? preset.deduction
                    ? "border-destructive bg-destructive/10 text-destructive shadow-md"
                    : "border-primary bg-primary/10 text-primary shadow-md"
                  : preset.deduction
                    ? "border-destructive/30 bg-card hover:bg-destructive/5 text-foreground"
                    : "border-border bg-card hover:bg-muted/60 text-foreground"
              )}
            >
              <span className="text-3xl leading-none">{preset.icon}</span>
              <span className="truncate w-full text-center text-sm">{preset.name}</span>
              <span className="text-xs text-muted-foreground font-normal">{preset.vat}%</span>
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="px-6 pt-5 space-y-4">
          {/* Nom */}
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSelectedPreset(null);
            }}
            placeholder="Nom de l'article"
            className="h-14 text-lg"
            inputMode="text"
          />

          {/* Prix + mode */}
          <div className="flex gap-3">
            <button
              onClick={() => setIsDeduction(!isDeduction)}
              className={cn(
                "shrink-0 w-16 h-14 rounded-xl border-2 flex items-center justify-center transition-colors active:scale-95",
                isDeduction
                  ? "bg-destructive text-destructive-foreground border-destructive"
                  : "bg-primary text-primary-foreground border-primary"
              )}
              title={isDeduction ? 'Mode déduction' : 'Mode ajout'}
            >
              {isDeduction ? <Minus className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
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
                inputMode="decimal"
                className={cn(
                  "h-14 text-lg pr-10",
                  isDeduction && "border-destructive/50"
                )}
                onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleSubmit()}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base text-muted-foreground font-medium">€</span>
            </div>
          </div>

          {/* TVA chips */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground shrink-0 font-medium">TVA</span>
            {VAT_OPTIONS.map((rate) => (
              <button
                key={rate}
                onClick={() => setVat(rate)}
                className={cn(
                  "flex-1 h-12 rounded-xl text-base font-semibold transition-colors active:scale-95",
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
        <div className="p-6 pt-5">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full h-16 text-lg font-semibold"
            variant={isDeduction ? 'destructive' : 'default'}
          >
            <Check className="h-6 w-6 mr-2" />
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
