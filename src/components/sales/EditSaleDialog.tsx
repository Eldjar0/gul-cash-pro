import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Trash2, Save, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { ProductSearch } from '@/components/pos/ProductSearch';
import { Product } from '@/hooks/useProducts';

interface EditSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: any;
}

export function EditSaleDialog({ open, onOpenChange, sale }: EditSaleDialogProps) {
  const [items, setItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (sale?.sale_items) {
      setItems(sale.sale_items.map((item: any) => ({ ...item })));
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
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle className="text-destructive">MODE DEV - Édition de vente</DialogTitle>
          </div>
          <DialogDescription className="space-y-2">
            <div className="text-destructive font-bold text-base">
              ⚠️ MENU INTERDIT EN PRODUCTION
            </div>
            <div className="text-sm text-destructive">
              Ce menu est UNIQUEMENT utilisable en fin de test niveau développement.
            </div>
            <div className="text-sm text-destructive font-semibold">
              La modification des données de vente est ILLÉGALE en environnement de production.
            </div>
            <div className="text-xs text-muted-foreground mt-3 p-2 bg-destructive/10 rounded border border-destructive/20">
              <strong>Décharge de responsabilité :</strong> JLprod retire toute sa responsabilité 
              en cas d'utilisation de ce menu. L'utilisateur est seul responsable des conséquences 
              légales et fiscales de toute modification effectuée via ce mode développement.
            </div>
          </DialogDescription>
        </DialogHeader>

        {sale && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
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
            ) : (
              <Button
                onClick={() => setShowProductSearch(true)}
                variant="outline"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un produit
              </Button>
            )}

            <ScrollArea className="h-[350px] border rounded-lg p-4">
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-semibold">{item.product_name}</div>
                      <div className="text-sm text-muted-foreground">
                        Prix unitaire: {item.unit_price.toFixed(2)}€ | TVA: {item.vat_rate}%
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
            </ScrollArea>

            <div className="border-t pt-4 space-y-2">
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || items.length === 0}
            variant="destructive"
          >
            <Save className="h-4 w-4 mr-2" />
            Enregistrer les modifications
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
