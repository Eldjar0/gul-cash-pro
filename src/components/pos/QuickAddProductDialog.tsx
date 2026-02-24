import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Zap, Plus, Minus, Check, Scale, Package } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { VirtualKeyboard } from './VirtualKeyboard';

interface QuickAddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (product: { id: string; name: string; price: number; vat_rate: number; barcode: string | null; type: string; stock: number | null; category_id: string | null; quantity?: number }) => boolean;
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

type ActiveField = 'name' | 'price' | 'quantity';

export function QuickAddProductDialog({ open, onOpenChange, onAdd }: QuickAddProductDialogProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [vat, setVat] = useState(21);
  const [isDeduction, setIsDeduction] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [activeField, setActiveField] = useState<ActiveField>('name');
  const [productType, setProductType] = useState<'unit' | 'weight'>('unit');

  useEffect(() => {
    if (open) {
      setName('');
      setPrice('');
      setQuantity('1');
      setVat(21);
      setIsDeduction(false);
      setSelectedPreset(null);
      setActiveField('name');
      setProductType('unit');
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
    const parsedQuantity = parseFloat(quantity.replace(',', '.'));

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
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      toast.error('Entrez une quantité valide');
      setActiveField('quantity');
      return;
    }

    const finalPrice = isDeduction ? -parsedPrice : parsedPrice;
    const displayName = isDeduction ? `${trimmedName} (déduction)` : productType === 'weight' ? `${trimmedName} /kg` : trimmedName;

    const added = onAdd({
      id: `quick-${Date.now()}`,
      name: displayName,
      price: finalPrice,
      vat_rate: vat,
      barcode: null,
      type: productType,
      stock: null,
      category_id: null,
      quantity: parsedQuantity,
    });

    if (!added) return;
    toast.success(isDeduction ? `−${parsedPrice.toFixed(2)}€ déduit` : `${trimmedName} x${parsedQuantity} ajouté`);
    onOpenChange(false);
  };

  const handleKeyboardInput = (char: string) => {
    if (activeField === 'name') {
      setName(prev => prev + char);
      setSelectedPreset(null);
    } else if (activeField === 'price') {
      if (char === ',' && price.includes(',')) return;
      const commaIndex = price.indexOf(',');
      if (commaIndex !== -1 && price.substring(commaIndex + 1).length >= 2 && char !== ',') return;
      setPrice(prev => prev + char);
    } else if (activeField === 'quantity') {
      if (char === ',' && quantity.includes(',')) return;
      const commaIndex = quantity.indexOf(',');
      if (commaIndex !== -1 && quantity.substring(commaIndex + 1).length >= 3 && char !== ',') return;
      setQuantity(prev => {
        // If default "1", replace it on first input
        if (prev === '1' && char !== ',') return char;
        return prev + char;
      });
    }
  };

  const handleKeyboardBackspace = () => {
    if (activeField === 'name') {
      setName(prev => prev.slice(0, -1));
    } else if (activeField === 'price') {
      setPrice(prev => prev.slice(0, -1));
    } else if (activeField === 'quantity') {
      setQuantity(prev => {
        const newVal = prev.slice(0, -1);
        return newVal || '0';
      });
    }
  };

  const parsedQuantity = parseFloat(quantity.replace(',', '.'));
  const parsedPrice = parseFloat(price.replace(',', '.'));
  const canSubmit = name.trim().length > 0 && price.length > 0 && !isNaN(parsedPrice) && parsedPrice > 0 && !isNaN(parsedQuantity) && parsedQuantity > 0;

  const priceLabel = productType === 'weight' ? 'Prix/kg TTC' : 'Prix TTC';
  const quantityLabel = productType === 'weight' ? 'Poids (kg)' : 'Quantité';
  const totalLine = canSubmit ? (parsedPrice * parsedQuantity).toFixed(2) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] w-[98vw] lg:max-w-[1100px] p-0 gap-0 overflow-hidden max-h-[98vh] h-[98vh] lg:h-auto" style={{ maxWidth: '1100px' }}>
        
        {/* DESKTOP/TABLET: horizontal layout */}
        <div className="hidden md:flex h-full max-h-[98vh]">
          {/* Left: presets + form */}
          <div className="flex-1 flex flex-col p-4 gap-3 overflow-y-auto border-r border-border">
            {/* Header */}
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Zap className="h-5 w-5 text-primary" />
              Ajout rapide
            </div>

            {/* Presets */}
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((preset, i) => (
                <button
                  key={`${preset.name}-${preset.deduction}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectPreset(i)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 py-2 px-2 rounded-xl border-2 text-xs font-semibold transition-all active:scale-95 min-h-[56px]",
                    selectedPreset === i
                      ? preset.deduction
                        ? "border-destructive bg-destructive/10 text-destructive shadow-md"
                        : "border-primary bg-primary/10 text-primary shadow-md"
                      : preset.deduction
                        ? "border-destructive/30 bg-card hover:bg-destructive/5 text-foreground"
                        : "border-border bg-card hover:bg-muted/60 text-foreground"
                  )}
                >
                  <span className="text-xl leading-none">{preset.icon}</span>
                  <span className="truncate w-full text-center text-[11px]">{preset.name}</span>
                </button>
              ))}
            </div>

            {/* Name field */}
            <div
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setActiveField('name')}
              className={cn(
                "h-11 px-3 rounded-xl border-2 flex items-center text-base cursor-pointer transition-colors",
                activeField === 'name'
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border bg-card",
                !name && "text-muted-foreground"
              )}
            >
              {name || "Nom de l'article"}
              {activeField === 'name' && <span className="ml-0.5 animate-pulse text-primary">|</span>}
            </div>

            {/* Price + mode + type */}
            <div className="flex gap-2">
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setIsDeduction(!isDeduction)}
                className={cn(
                  "shrink-0 w-12 h-11 rounded-xl border-2 flex items-center justify-center transition-colors active:scale-95",
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
                  "flex-1 h-11 px-3 rounded-xl border-2 flex items-center justify-between text-base cursor-pointer transition-colors",
                  activeField === 'price'
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border bg-card",
                  isDeduction && activeField !== 'price' && "border-destructive/30",
                  !price && "text-muted-foreground"
                )}
              >
                <span>
                  {price || priceLabel}
                  {activeField === 'price' && <span className="ml-0.5 animate-pulse text-primary">|</span>}
                </span>
                <span className="text-muted-foreground font-medium text-sm">€{productType === 'weight' ? '/kg' : ''}</span>
              </div>
            </div>

            {/* Quantity / Weight field */}
            <div
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setActiveField('quantity')}
              className={cn(
                "h-11 px-3 rounded-xl border-2 flex items-center justify-between text-base cursor-pointer transition-colors",
                activeField === 'quantity'
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border bg-card",
                quantity === '0' && "text-muted-foreground"
              )}
            >
              <span>
                {quantity || '0'}
                {activeField === 'quantity' && <span className="ml-0.5 animate-pulse text-primary">|</span>}
              </span>
              <span className="text-muted-foreground font-medium text-sm">{quantityLabel}</span>
            </div>

            {/* Total preview */}
            {totalLine && (
              <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-muted/50 text-sm">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-bold">{isDeduction ? '−' : ''}{totalLine}€</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setProductType('unit')}
                className={cn(
                  "flex-1 h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-95 border",
                  productType === 'unit'
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border"
                )}
              >
                <Package className="h-4 w-4" />
                À l'unité
              </button>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setProductType('weight')}
                className={cn(
                  "flex-1 h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-95 border",
                  productType === 'weight'
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border"
                )}
              >
                <Scale className="h-4 w-4" />
                Au kilo
              </button>
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
                    "flex-1 h-9 rounded-xl text-sm font-semibold transition-colors active:scale-95",
                    vat === rate
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {rate}%
                </button>
              ))}
            </div>

            {/* Submit button */}
            <Button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full h-12 text-base font-semibold mt-auto"
              variant={isDeduction ? 'destructive' : 'default'}
            >
              <Check className="h-5 w-5 mr-2" />
              {isDeduction
                ? `Déduire${price ? ` −${parseFloat(price.replace(',', '.') || '0').toFixed(2)}€` : ''}`
                : `Ajouter${price ? ` ${parseFloat(price.replace(',', '.') || '0').toFixed(2)}€` : ''}`
              }
            </Button>
          </div>

          {/* Right: virtual keyboard */}
          <div className="w-[380px] flex flex-col justify-center p-4 bg-muted/30">
            <div className="text-xs font-medium text-muted-foreground mb-2 text-center">
              {activeField === 'name' ? '🔤 Clavier — Nom' : '🔢 Clavier — Prix'}
            </div>
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
        </div>

        {/* MOBILE: vertical layout */}
        <div className="flex flex-col md:hidden overflow-y-auto max-h-[98vh]">
          <div className="px-3 pt-3 pb-2 flex items-center gap-2 text-base font-semibold">
            <Zap className="h-5 w-5 text-primary" />
            Ajout rapide
          </div>

          {/* Presets compact */}
          <div className="px-3 grid grid-cols-3 gap-1.5">
            {PRESETS.map((preset, i) => (
              <button
                key={`m-${preset.name}-${preset.deduction}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectPreset(i)}
                className={cn(
                  "flex items-center gap-1.5 py-2 px-2 rounded-lg border text-xs font-medium transition-all active:scale-95",
                  selectedPreset === i
                    ? preset.deduction
                      ? "border-destructive bg-destructive/10 text-destructive"
                      : "border-primary bg-primary/10 text-primary"
                    : preset.deduction
                      ? "border-destructive/30 bg-card text-foreground"
                      : "border-border bg-card text-foreground"
                )}
              >
                <span className="text-base">{preset.icon}</span>
                <span className="truncate">{preset.name}</span>
              </button>
            ))}
          </div>

          <div className="px-3 pt-2 space-y-2">
            {/* Name */}
            <div
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setActiveField('name')}
              className={cn(
                "h-10 px-3 rounded-lg border-2 flex items-center text-sm cursor-pointer transition-colors",
                activeField === 'name'
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card",
                !name && "text-muted-foreground"
              )}
            >
              {name || "Nom de l'article"}
              {activeField === 'name' && <span className="ml-0.5 animate-pulse text-primary">|</span>}
            </div>

            {/* Price + mode */}
            <div className="flex gap-1.5">
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setIsDeduction(!isDeduction)}
                className={cn(
                  "shrink-0 w-10 h-10 rounded-lg border-2 flex items-center justify-center active:scale-95",
                  isDeduction
                    ? "bg-destructive text-destructive-foreground border-destructive"
                    : "bg-primary text-primary-foreground border-primary"
                )}
              >
                {isDeduction ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </button>
              <div
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setActiveField('price')}
                className={cn(
                  "flex-1 h-10 px-3 rounded-lg border-2 flex items-center justify-between text-sm cursor-pointer transition-colors",
                  activeField === 'price'
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card",
                  !price && "text-muted-foreground"
                )}
              >
                <span>
                  {price || priceLabel}
                  {activeField === 'price' && <span className="ml-0.5 animate-pulse text-primary">|</span>}
                </span>
                <span className="text-muted-foreground text-xs">€{productType === 'weight' ? '/kg' : ''}</span>
              </div>
            </div>

            {/* Type + TVA row */}
            <div className="flex gap-1.5">
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setProductType(productType === 'unit' ? 'weight' : 'unit')}
                className={cn(
                  "h-9 px-3 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors active:scale-95 border shrink-0",
                  productType === 'weight'
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border"
                )}
              >
                {productType === 'weight' ? <Scale className="h-3.5 w-3.5" /> : <Package className="h-3.5 w-3.5" />}
                {productType === 'weight' ? 'kg' : 'unité'}
              </button>
              {VAT_OPTIONS.map((rate) => (
                <button
                  key={rate}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setVat(rate)}
                  className={cn(
                    "flex-1 h-9 rounded-lg text-xs font-semibold transition-colors active:scale-95",
                    vat === rate
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {rate}%
                </button>
              ))}
            </div>
          </div>

          {/* Virtual Keyboard mobile */}
          <div className="px-3 pt-2 pb-1">
            {activeField === 'price' ? (
              <VirtualKeyboard
                type="numeric"
                onInput={handleKeyboardInput}
                onBackspace={handleKeyboardBackspace}
                compact
              />
            ) : (
              <VirtualKeyboard
                type="azerty"
                onInput={handleKeyboardInput}
                onBackspace={handleKeyboardBackspace}
                compact
              />
            )}
          </div>

          {/* Submit mobile */}
          <div className="px-3 pb-3 pt-1">
            <Button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full h-12 text-base font-semibold"
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
