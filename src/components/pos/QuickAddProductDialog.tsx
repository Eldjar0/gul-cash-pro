import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Zap, Plus, Minus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { VirtualKeyboard } from './VirtualKeyboard';

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
  { name: 'Viande', vat: 6, icon: '🥩', deduction: true },
  { name: 'Vidange', vat: 0, icon: '♻️', deduction: true },
  { name: 'Déduction', vat: 0, icon: '➖', deduction: true },
];

const VAT_OPTIONS = [0, 6, 12, 21];

type ActiveField = 'name' | 'price' | null;

export function QuickAddProductDialog({ open, onOpenChange, onAdd }: QuickAddProductDialogProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [vat, setVat] = useState(21);
  const [isDeduction, setIsDeduction] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [activeField, setActiveField] = useState<ActiveField>('name');

  // Reset on open
  useEffect(() => {
    if (open) {
      setName('');
      setPrice('');
      setVat(21);
      setIsDeduction(false);
      setSelectedPreset(null);
      setActiveField('name');
    }
  }, [open]);

  const selectPreset = (index: number) => {
    const preset = PRESETS[index];
    setSelectedPreset(index);
    setName(preset.name);
    setVat(preset.vat);
    setIsDeduction(preset.deduction);
    setActiveField('price');
  };

  const handleSubmit = () => {
    const trimmedName = name.trim();
    const parsedPrice = parseFloat(price.replace(',', '.'));

    if (!trimmedName) {
      toast.error('Entrez un nom');
      setActiveField('name');
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error('Entrez un prix valide');
      setActiveField('price');
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

  const handleKeyboardInput = (char: string) => {
    if (activeField === 'name') {
      setName(prev => prev + char);
      setSelectedPreset(null);
    } else if (activeField === 'price') {
      // Prevent multiple commas
      if (char === ',' && price.includes(',')) return;
      // Limit decimals to 2
      const commaIndex = price.indexOf(',');
      if (commaIndex !== -1 && price.substring(commaIndex + 1).length >= 2 && char !== ',') return;
      setPrice(prev => prev + char);
    }
  };

  const handleKeyboardBackspace = () => {
    if (activeField === 'name') {
      setName(prev => prev.slice(0, -1));
    } else if (activeField === 'price') {
      setPrice(prev => prev.slice(0, -1));
    }
  };

  const canSubmit = name.trim().length > 0 && price.length > 0 && !isNaN(parseFloat(price.replace(',', '.'))) && parseFloat(price.replace(',', '.')) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] w-[98vw] p-0 gap-0 overflow-hidden max-h-[98vh]" style={{ maxWidth: '900px' }}>
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-primary" />
            Ajout rapide
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(98vh-80px)]">
          {/* Presets grid */}
          <div className="px-4 grid grid-cols-3 gap-2">
            {PRESETS.map((preset, i) => (
              <button
                key={preset.name}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectPreset(i)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl border-2 text-xs font-semibold transition-all active:scale-95 min-h-[70px]",
                  selectedPreset === i
                    ? preset.deduction
                      ? "border-destructive bg-destructive/10 text-destructive shadow-md"
                      : "border-primary bg-primary/10 text-primary shadow-md"
                    : preset.deduction
                      ? "border-destructive/30 bg-card hover:bg-destructive/5 text-foreground"
                      : "border-border bg-card hover:bg-muted/60 text-foreground"
                )}
              >
                <span className="text-2xl leading-none">{preset.icon}</span>
                <span className="truncate w-full text-center">{preset.name}</span>
              </button>
            ))}
          </div>

          {/* Form fields as display-only + virtual keyboard */}
          <div className="px-4 pt-3 space-y-3">
            {/* Name field (read-only, tap to activate) */}
            <div
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setActiveField('name')}
              className={cn(
                "h-12 px-4 rounded-xl border-2 flex items-center text-lg cursor-pointer transition-colors",
                activeField === 'name'
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border bg-card",
                !name && "text-muted-foreground"
              )}
            >
              {name || "Nom de l'article"}
              {activeField === 'name' && <span className="ml-0.5 animate-pulse text-primary">|</span>}
            </div>

            {/* Price + mode */}
            <div className="flex gap-2">
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setIsDeduction(!isDeduction)}
                className={cn(
                  "shrink-0 w-14 h-12 rounded-xl border-2 flex items-center justify-center transition-colors active:scale-95",
                  isDeduction
                    ? "bg-destructive text-destructive-foreground border-destructive"
                    : "bg-primary text-primary-foreground border-primary"
                )}
              >
                {isDeduction ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </button>
              <div
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setActiveField('price')}
                className={cn(
                  "flex-1 h-12 px-4 rounded-xl border-2 flex items-center justify-between text-lg cursor-pointer transition-colors",
                  activeField === 'price'
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border bg-card",
                  isDeduction && activeField !== 'price' && "border-destructive/30",
                  !price && "text-muted-foreground"
                )}
              >
                <span>
                  {price || "Prix TTC"}
                  {activeField === 'price' && <span className="ml-0.5 animate-pulse text-primary">|</span>}
                </span>
                <span className="text-muted-foreground font-medium">€</span>
              </div>
            </div>

            {/* TVA chips */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground shrink-0 font-medium">TVA</span>
              {VAT_OPTIONS.map((rate) => (
                <button
                  key={rate}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setVat(rate)}
                  className={cn(
                    "flex-1 h-10 rounded-xl text-sm font-semibold transition-colors active:scale-95",
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

          {/* Virtual Keyboard */}
          <div className="px-4 pt-3 pb-2">
            {activeField === 'price' ? (
              <VirtualKeyboard
                type="numeric"
                onInput={handleKeyboardInput}
                onBackspace={handleKeyboardBackspace}
              />
            ) : (
              <VirtualKeyboard
                type="azerty"
                onInput={handleKeyboardInput}
                onBackspace={handleKeyboardBackspace}
              />
            )}
          </div>

          {/* Submit */}
          <div className="px-4 pb-4 pt-2">
            <Button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full h-14 text-lg font-semibold"
              variant={isDeduction ? 'destructive' : 'default'}
            >
              <Check className="h-5 w-5 mr-2" />
              {isDeduction
                ? `Déduire${price ? ` −${parseFloat(price.replace(',', '.') || '0').toFixed(2)}€` : ''}`
                : `Ajouter${price ? ` ${parseFloat(price.replace(',', '.') || '0').toFixed(2)}€` : ''}`
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
