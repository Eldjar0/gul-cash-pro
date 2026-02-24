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
      setName(''); setPrice(''); setQuantity('1'); setVat(21);
      setIsDeduction(false); setSelectedPreset(null); setActiveField('name'); setProductType('unit');
    }
  }, [open]);

  const selectPreset = (index: number) => {
    const preset = PRESETS[index];
    setSelectedPreset(index); setName(preset.name); setVat(preset.vat);
    setIsDeduction(preset.deduction); setActiveField('price');
  };

  const handleSubmit = () => {
    const trimmedName = name.trim();
    const parsedPrice = parseFloat(price.replace(',', '.'));
    const parsedQty = parseFloat(quantity.replace(',', '.'));
    if (!trimmedName) { toast.error('Entrez un nom'); setActiveField('name'); return; }
    if (isNaN(parsedPrice) || parsedPrice <= 0) { toast.error('Prix invalide'); setActiveField('price'); return; }
    if (isNaN(parsedQty) || parsedQty <= 0) { toast.error('Quantité invalide'); setActiveField('quantity'); return; }

    const finalPrice = isDeduction ? -parsedPrice : parsedPrice;
    const displayName = isDeduction ? `${trimmedName} (déduction)` : productType === 'weight' ? `${trimmedName} /kg` : trimmedName;

    const added = onAdd({
      id: `quick-${Date.now()}`, name: displayName, price: finalPrice, vat_rate: vat,
      barcode: null, type: productType, stock: null, category_id: null, quantity: parsedQty,
    });
    if (!added) return;
    toast.success(isDeduction ? `−${parsedPrice.toFixed(2)}€ déduit` : `${trimmedName} x${parsedQty} ajouté`);
    onOpenChange(false);
  };

  const handleKeyboardInput = (char: string) => {
    if (activeField === 'name') { setName(prev => prev + char); setSelectedPreset(null); }
    else if (activeField === 'price') {
      if (char === ',' && price.includes(',')) return;
      if (price.indexOf(',') !== -1 && price.substring(price.indexOf(',') + 1).length >= 2 && char !== ',') return;
      setPrice(prev => prev + char);
    } else {
      if (char === ',' && quantity.includes(',')) return;
      if (quantity.indexOf(',') !== -1 && quantity.substring(quantity.indexOf(',') + 1).length >= 3 && char !== ',') return;
      setQuantity(prev => prev === '1' && char !== ',' ? char : prev + char);
    }
  };

  const handleKeyboardBackspace = () => {
    if (activeField === 'name') setName(prev => prev.slice(0, -1));
    else if (activeField === 'price') setPrice(prev => prev.slice(0, -1));
    else setQuantity(prev => { const v = prev.slice(0, -1); return v || '0'; });
  };

  const parsedQty = parseFloat(quantity.replace(',', '.'));
  const parsedPrice = parseFloat(price.replace(',', '.'));
  const canSubmit = name.trim().length > 0 && price.length > 0 && !isNaN(parsedPrice) && parsedPrice > 0 && !isNaN(parsedQty) && parsedQty > 0;
  const totalLine = canSubmit ? (parsedPrice * parsedQty).toFixed(2) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] w-[98vw] lg:max-w-[900px] p-0 gap-0 overflow-hidden max-h-[98vh]" style={{ maxWidth: '900px' }}>
        <div className="flex flex-col overflow-y-auto max-h-[98vh]">
          {/* Header + Presets */}
          <div className="px-3 pt-3 pb-1 flex items-center gap-2 text-base font-semibold">
            <Zap className="h-4 w-4 text-primary" />
            Ajout rapide
          </div>

          <div className="px-3 grid grid-cols-3 md:grid-cols-9 gap-1.5">
            {PRESETS.map((preset, i) => (
              <button
                key={`${preset.name}-${preset.deduction}-${i}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectPreset(i)}
                className={cn(
                  "flex items-center md:flex-col gap-1 md:gap-0.5 py-1.5 px-2 rounded-lg border text-xs font-medium transition-all active:scale-95",
                  selectedPreset === i
                    ? preset.deduction ? "border-destructive bg-destructive/10 text-destructive" : "border-primary bg-primary/10 text-primary"
                    : preset.deduction ? "border-destructive/30 bg-card text-foreground" : "border-border bg-card text-foreground"
                )}
              >
                <span className="text-base leading-none">{preset.icon}</span>
                <span className="truncate text-[10px] md:text-[11px]">{preset.name}</span>
              </button>
            ))}
          </div>

          {/* Form row: Name | +/- Price | Qty | Type | TVA */}
          <div className="px-3 pt-2 flex flex-col gap-1.5">
            {/* Row 1: Name */}
            <div
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setActiveField('name')}
              className={cn(
                "h-10 px-3 rounded-lg border-2 flex items-center text-sm cursor-pointer transition-colors",
                activeField === 'name' ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card",
                !name && "text-muted-foreground"
              )}
            >
              {name || "Nom de l'article"}
              {activeField === 'name' && <span className="ml-0.5 animate-pulse text-primary">|</span>}
            </div>

            {/* Row 2: +/- | Price | Qty | unit/kg */}
            <div className="flex gap-1.5">
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setIsDeduction(!isDeduction)}
                className={cn(
                  "shrink-0 w-10 h-10 rounded-lg border-2 flex items-center justify-center active:scale-95",
                  isDeduction ? "bg-destructive text-destructive-foreground border-destructive" : "bg-primary text-primary-foreground border-primary"
                )}
              >
                {isDeduction ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </button>
              <div
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setActiveField('price')}
                className={cn(
                  "flex-1 h-10 px-3 rounded-lg border-2 flex items-center justify-between text-sm cursor-pointer transition-colors",
                  activeField === 'price' ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card",
                  !price && "text-muted-foreground"
                )}
              >
                <span>
                  {price || (productType === 'weight' ? 'Prix/kg' : 'Prix TTC')}
                  {activeField === 'price' && <span className="ml-0.5 animate-pulse text-primary">|</span>}
                </span>
                <span className="text-muted-foreground text-xs">€</span>
              </div>
              <div
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setActiveField('quantity')}
                className={cn(
                  "w-20 h-10 px-2 rounded-lg border-2 flex items-center justify-between text-sm cursor-pointer transition-colors",
                  activeField === 'quantity' ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card",
                  quantity === '0' && "text-muted-foreground"
                )}
              >
                <span>
                  {quantity || '0'}
                  {activeField === 'quantity' && <span className="ml-0.5 animate-pulse text-primary">|</span>}
                </span>
                <span className="text-muted-foreground text-[10px]">{productType === 'weight' ? 'kg' : 'x'}</span>
              </div>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setProductType(productType === 'unit' ? 'weight' : 'unit')}
                className={cn(
                  "shrink-0 h-10 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors active:scale-95 border",
                  productType === 'weight' ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"
                )}
              >
                {productType === 'weight' ? <Scale className="h-3.5 w-3.5" /> : <Package className="h-3.5 w-3.5" />}
                {productType === 'weight' ? 'kg' : 'unité'}
              </button>
            </div>

            {/* Row 3: TVA + Total + Submit */}
            <div className="flex gap-1.5 items-center">
              <span className="text-[10px] text-muted-foreground shrink-0 font-medium">TVA</span>
              {VAT_OPTIONS.map((rate) => (
                <button
                  key={rate}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setVat(rate)}
                  className={cn(
                    "w-10 h-8 rounded-lg text-xs font-semibold transition-colors active:scale-95",
                    vat === rate ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  {rate}%
                </button>
              ))}
              {totalLine && (
                <span className="ml-auto text-sm font-bold text-foreground">
                  {isDeduction ? '−' : ''}{totalLine}€
                </span>
              )}
              <Button
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="ml-auto h-10 px-5 text-sm font-semibold"
                variant={isDeduction ? 'destructive' : 'default'}
              >
                <Check className="h-4 w-4 mr-1" />
                {isDeduction ? 'Déduire' : 'Ajouter'}
              </Button>
            </div>
          </div>

          {/* Keyboard below */}
          <div className="px-3 pt-2 pb-3">
            {activeField === 'name' ? (
              <VirtualKeyboard type="azerty" onInput={handleKeyboardInput} onBackspace={handleKeyboardBackspace} />
            ) : (
              <VirtualKeyboard type="numeric" onInput={handleKeyboardInput} onBackspace={handleKeyboardBackspace} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
