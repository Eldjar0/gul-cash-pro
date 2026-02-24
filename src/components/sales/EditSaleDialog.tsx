import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Trash2, Save, Plus, User, X, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { ProductSearch } from '@/components/pos/ProductSearch';
import { Product } from '@/hooks/useProducts';
import { CustomerDialog } from '@/components/pos/CustomerDialog';
import { Customer } from '@/hooks/useCustomers';

interface EditSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: any;
}

export function EditSaleDialog({ open, onOpenChange, sale }: EditSaleDialogProps) {
  const [items, setItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPrice, setQuickPrice] = useState('');
  const [quickVat, setQuickVat] = useState('21');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (sale?.sale_items) {
      setItems(sale.sale_items.map((item: any) => ({ ...item })));
    }
    if (sale?.customers) {
      setSelectedCustomer(sale.customers);
    } else {
      setSelectedCustomer(null);
    }
  }, [sale]);

  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) return;
    
    const newItems = [...items];
    const item = newItems[index];
    
    // Recalculer les montants
    item.quantity = newQuantity;
    item.subtotal = item.unit_price * newQuantity;
    item.vat_amount = item.subtotal * (item.vat_rate / 100);
    item.total = item.subtotal + item.vat_amount;
    
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleAddProduct = (product: Product) => {
    const newItem = {
      product_id: product.id,
      product_name: product.name,
      product_barcode: product.barcode,
      quantity: 1,
      unit_price: product.price,
      vat_rate: product.vat_rate,
      discount_type: null,
      discount_value: 0,
      subtotal: product.price,
      vat_amount: product.price * (product.vat_rate / 100),
      total: product.price * (1 + product.vat_rate / 100),
      created_at: new Date().toISOString(),
    };
    
    setItems([...items, newItem]);
    setShowProductSearch(false);
    toast.success('Produit ajouté');
  };

  const QUICK_PRESETS = [
    { label: 'Légume', name: 'Légume', vat: '6' },
    { label: 'Viande', name: 'Viande', vat: '6' },
    { label: 'Cigarette', name: 'Cigarette', vat: '0' },
    { label: 'Consommable', name: 'Consommable', vat: '21' },
    { label: 'Positif', name: 'Positif', vat: '21' },
    { label: 'Positif +', name: 'Positif +', vat: '21' },
  ];

  const handleQuickAdd = () => {
    const name = quickName.trim();
    const price = parseFloat(quickPrice);
    const vat = parseFloat(quickVat) || 0;
    if (!name || isNaN(price) || price <= 0) {
      toast.error('Nom et prix valide requis');
      return;
    }
    const newItem = {
      product_id: null,
      product_name: name,
      product_barcode: null,
      quantity: 1,
      unit_price: price,
      vat_rate: vat,
      discount_type: null,
      discount_value: 0,
      subtotal: price,
      vat_amount: price * (vat / 100),
      total: price * (1 + vat / 100),
      created_at: new Date().toISOString(),
    };
    setItems([...items, newItem]);
    setQuickName('');
    setQuickPrice('');
    setQuickVat('21');
    setShowQuickAdd(false);
    toast.success(`${name} ajouté`);
  };

  const applyPreset = (preset: typeof QUICK_PRESETS[0]) => {
    setQuickName(preset.name);
    setQuickVat(preset.vat);
  };

  const calculateNewTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalVat = items.reduce((sum, item) => sum + item.vat_amount, 0);
    const total = items.reduce((sum, item) => sum + item.total, 0);
    
    return { subtotal, totalVat, total };
  };

  const handleSave = async () => {
    if (items.length === 0) {
      toast.error('Au moins un article requis');
      return;
    }

    setSaving(true);
    try {
      const { subtotal, totalVat, total } = calculateNewTotals();

      // Supprimer les anciens items
      const { error: deleteError } = await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', sale.id);

      if (deleteError) throw deleteError;

      // Insérer les nouveaux items avec la date de création originale
      const { error: insertError } = await supabase
        .from('sale_items')
        .insert(
          items.map(item => ({
            sale_id: sale.id,
            product_id: item.product_id,
            product_name: item.product_name,
            product_barcode: item.product_barcode,
            quantity: item.quantity,
            unit_price: item.unit_price,
            vat_rate: item.vat_rate,
            discount_type: item.discount_type,
            discount_value: item.discount_value || 0,
            subtotal: item.subtotal,
            vat_amount: item.vat_amount,
            total: item.total,
            created_at: item.created_at,
          }))
        );

      if (insertError) throw insertError;

      // Mettre à jour la vente en préservant updated_at (pas de trace)
      const { error: updateError } = await supabase
        .from('sales')
        .update({
          subtotal,
          total_vat: totalVat,
          total,
          customer_id: selectedCustomer?.id || null,
          updated_at: sale.updated_at, // Conserver la date originale
        })
        .eq('id', sale.id);

      if (updateError) throw updateError;

      // Supprimer toute trace dans les audit logs pour cette vente
      await supabase
        .from('audit_logs')
        .delete()
        .eq('entity_type', 'sale')
        .eq('entity_id', sale.id)
        .gte('created_at', new Date(Date.now() - 60000).toISOString()); // Dernière minute

      // Invalider toutes les queries liées et forcer le refetch immédiat
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sales'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['products'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['cash_movements'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['daily_reports'], refetchType: 'active' }),
      ]);
      
      toast.success('Vente modifiée (sans trace)');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating sale:', error);
      toast.error('Erreur lors de la modification');
    } finally {
      setSaving(false);
    }
  };

  const newTotals = calculateNewTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[95vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <DialogTitle className="text-red-900">⚖️ MODIFICATION DE DOCUMENT COMPTABLE</DialogTitle>
          </div>
          <DialogDescription className="space-y-2">
            <div className="bg-red-50 border-2 border-red-300 p-4 rounded-lg space-y-3">
              <div className="text-sm font-bold text-red-900">
                ⚖️ OBLIGATIONS LÉGALES BELGES
              </div>
              <div className="text-xs text-red-800 space-y-2">
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Conservation obligatoire :</strong> 10 ans (Art. 315bis CIR92)</li>
                  <li><strong>Modification de documents :</strong> AUTORISÉE uniquement le jour J avant clôture</li>
                </ul>
                <div className="mt-3 p-3 bg-red-100 border-2 border-red-500 rounded space-y-2">
                  <p className="font-black text-red-900 text-center">
                    🚨 MODIFICATION POUR TRICHER = FRAUDE FISCALE
                  </p>
                  <p className="font-bold text-red-800">
                    ⚠️ Sanctions : Amendes jusqu'à 25 000 € + poursuites pénales
                  </p>
                  <p className="text-xs text-red-700">
                    Toute modification frauduleuse constitue une infraction grave au Code pénal belge et peut entraîner des sanctions civiles et pénales.
                  </p>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-1">
          {sale && (
            <div className="space-y-4 pr-4">
              <div className="flex flex-wrap items-center gap-4 p-3 bg-muted rounded-lg">
                <div>
                  <span className="text-sm text-muted-foreground">N° Vente:</span>
                  <span className="ml-2 font-bold">{sale.sale_number}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Date:</span>
                  <span className="ml-2 font-semibold">
                    {new Date(sale.date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Client:</span>
                  {selectedCustomer ? (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{selectedCustomer.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setShowCustomerDialog(true)}
                        title="Modifier le client"
                      >
                        <User className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        onClick={() => setSelectedCustomer(null)}
                        title="Retirer le client"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCustomerDialog(true)}
                      className="h-7"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Ajouter
                    </Button>
                  )}
                </div>
              </div>

              {showProductSearch ? (
                <div className="p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Ajouter un produit</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowProductSearch(false)}
                    >
                      Annuler
                    </Button>
                  </div>
                  <ProductSearch onProductSelect={handleAddProduct} />
                </div>
              ) : showQuickAdd ? (
                <div className="p-4 border-2 border-primary/30 rounded-lg bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      Ajout rapide
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowQuickAdd(false)}>
                      Annuler
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_PRESETS.map((p) => (
                      <Button
                        key={p.label}
                        variant={quickName === p.name ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => applyPreset(p)}
                      >
                        {p.label}
                      </Button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <Label className="text-xs">Nom</Label>
                      <Input
                        value={quickName}
                        onChange={(e) => setQuickName(e.target.value)}
                        placeholder="Article..."
                        className="h-9"
                        autoFocus
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Prix €</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={quickPrice}
                        onChange={(e) => setQuickPrice(e.target.value)}
                        placeholder="0.00"
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">TVA %</Label>
                      <div className="flex gap-1">
                        {['0', '6', '21'].map((rate) => (
                          <Button
                            key={rate}
                            variant={quickVat === rate ? 'default' : 'outline'}
                            size="sm"
                            className="h-9 flex-1 text-xs"
                            onClick={() => setQuickVat(rate)}
                          >
                            {rate}%
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleQuickAdd} className="w-full" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowProductSearch(true)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Chercher produit
                  </Button>
                  <Button
                    onClick={() => setShowQuickAdd(true)}
                    variant="outline"
                    className="flex-1 border-primary/30 text-primary"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Ajout rapide
                  </Button>
                </div>
              )}

              <div className="border rounded-lg p-4 bg-background">
                <div className="space-y-3 max-h-[250px] overflow-y-auto">
                  {items.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{item.product_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Prix unitaire: {item.unit_price.toFixed(2)}€ | TVA: {item.vat_rate}%
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Label className="text-xs">Qté:</Label>
                        <Input
                          type="number"
                          step="0.001"
                          min="0.001"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, parseFloat(e.target.value) || 0)}
                          className="w-20"
                        />
                      </div>
                      <div className="w-24 text-right font-bold">
                        {item.total.toFixed(2)}€
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        className="text-destructive hover:text-destructive"
                        title="Supprimer cet article"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {items.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Tous les articles ont été supprimés
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2 bg-background p-4 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Sous-total HT:</span>
                  <span className="font-semibold">{newTotals.subtotal.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>TVA:</span>
                  <span className="font-semibold">{newTotals.totalVat.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total TTC:</span>
                  <span>{newTotals.total.toFixed(2)}€</span>
                </div>
                
                {newTotals.total !== sale.total && (
                  <Badge variant="destructive" className="w-full justify-center">
                    Différence: {(newTotals.total - sale.total).toFixed(2)}€
                  </Badge>
                )}
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex-shrink-0 pt-4 border-t mt-4 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-initial">
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || items.length === 0}
            variant="destructive"
            className="flex-1 sm:flex-initial"
          >
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>

      <CustomerDialog
        open={showCustomerDialog}
        onOpenChange={setShowCustomerDialog}
        onSelectCustomer={(customer) => {
          setSelectedCustomer(customer);
          setShowCustomerDialog(false);
        }}
      />
    </Dialog>
  );
}
