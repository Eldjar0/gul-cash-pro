import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Ticket } from 'lucide-react';
import { useUpdateProduct, type Product } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { PRODUCT_UNITS } from '@/data/units';
import { ProductBarcodesManager } from '@/components/products/ProductBarcodesManager';
import { toast } from 'sonner';

interface QuickProductEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export function QuickProductEditDialog({ open, onOpenChange, product }: QuickProductEditDialogProps) {
  const updateProduct = useUpdateProduct();
  const { data: categories = [] } = useCategories();

  const [form, setForm] = useState({
    name: '',
    barcode: '',
    price: '',
    cost_price: '',
    vat_rate: '6',
    stock: '',
    min_stock: '',
    type: 'unit' as 'unit' | 'weight',
    unit: 'pièce',
    category_id: '',
    meal_voucher_eligible: true,
  });

  useEffect(() => {
    if (!open || !product) return;
    setForm({
      name: product.name ?? '',
      barcode: product.barcode ?? '',
      price: product.price?.toString() ?? '',
      cost_price: product.cost_price?.toString() ?? '',
      vat_rate: product.vat_rate?.toString() ?? '6',
      stock: product.stock?.toString() ?? '',
      min_stock: product.min_stock?.toString() ?? '',
      type: (product.type as 'unit' | 'weight') ?? 'unit',
      unit: product.unit ?? 'pièce',
      category_id: product.category_id ?? '',
      meal_voucher_eligible: product.meal_voucher_eligible ?? Number(product.vat_rate) < 21,
    });
  }, [open, product]);

  const handleSave = async () => {
    if (!product) return;
    if (!form.name.trim()) {
      toast.error('Le nom est obligatoire');
      return;
    }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) {
      toast.error('Prix invalide');
      return;
    }

    await updateProduct.mutateAsync({
      id: product.id,
      name: form.name.trim(),
      barcode: form.barcode.trim() || null as any,
      price,
      cost_price: form.cost_price ? parseFloat(form.cost_price) : null as any,
      vat_rate: parseFloat(form.vat_rate),
      stock: form.stock ? parseFloat(form.stock) : 0,
      min_stock: form.min_stock ? parseFloat(form.min_stock) : 0,
      type: form.type,
      unit: form.unit,
      category_id: form.category_id || null as any,
      meal_voucher_eligible: form.meal_voucher_eligible,
    } as any);

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modification rapide</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nom</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prix de vente (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Prix d'achat (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.cost_price}
                onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Stock</Label>
              <Input
                type="number"
                step="0.001"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Stock min.</Label>
              <Input
                type="number"
                step="0.001"
                value={form.min_stock}
                onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>TVA</Label>
              <Select value={form.vat_rate} onValueChange={(v) => setForm({ ...form, vat_rate: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="6">6%</SelectItem>
                  <SelectItem value="12">12%</SelectItem>
                  <SelectItem value="21">21%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v: 'unit' | 'weight') => setForm({ ...form, type: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unit">À l'unité</SelectItem>
                  <SelectItem value="weight">Au poids</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Unité</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCT_UNITS.map((u: any) => (
                    <SelectItem key={u.value ?? u} value={u.value ?? u}>
                      {u.label ?? u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Catégorie</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  {categories.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Code-barres principal</Label>
            <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
          </div>

          {product && (
            <div className="rounded-lg border p-3 bg-muted/20">
              <ProductBarcodesManager productId={product.id} />
            </div>
          )}

          <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30">
            <Checkbox
              id="quick-meal-voucher"
              checked={form.meal_voucher_eligible}
              onCheckedChange={(c) => setForm({ ...form, meal_voucher_eligible: c === true })}
            />
            <Label htmlFor="quick-meal-voucher" className="cursor-pointer flex items-center gap-2">
              <Ticket className="h-4 w-4 text-menu-500" />
              Accepté en chèques-repas
            </Label>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={updateProduct.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
