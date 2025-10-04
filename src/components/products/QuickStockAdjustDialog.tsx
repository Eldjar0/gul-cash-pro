import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Package, Plus, Minus, Edit } from 'lucide-react';

interface QuickStockAdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    stock: number;
    barcode?: string;
  };
}

export function QuickStockAdjustDialog({ open, onOpenChange, product }: QuickStockAdjustDialogProps) {
  const [operation, setOperation] = useState<'add' | 'remove' | 'set'>('add');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  const adjustMutation = useMutation({
    mutationFn: async () => {
      let newStock = product.stock;

      if (operation === 'add') {
        newStock = product.stock + Number(quantity);
      } else if (operation === 'remove') {
        newStock = Math.max(0, product.stock - Number(quantity));
      } else {
        newStock = Number(quantity);
      }

      const { error } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', product.id);

      if (error) throw error;

      return newStock;
    },
    onSuccess: (newStock) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`Stock mis à jour: ${newStock} unités`);
      setQuantity('');
      setReason('');
      onOpenChange(false);
    },
    onError: (error: Error) => {
      console.error('Error adjusting stock:', error);
      toast.error('Erreur lors de l\'ajustement du stock');
    },
  });

  const handleSubmit = () => {
    if (!quantity || Number(quantity) <= 0) {
      toast.error('Veuillez saisir une quantité valide');
      return;
    }
    adjustMutation.mutate();
  };

  const previewStock = () => {
    if (!quantity) return product.stock;
    
    if (operation === 'add') {
      return product.stock + Number(quantity);
    } else if (operation === 'remove') {
      return Math.max(0, product.stock - Number(quantity));
    } else {
      return Number(quantity);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Ajustement rapide du stock
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium">{product.name}</p>
            {product.barcode && <p className="text-xs text-muted-foreground">{product.barcode}</p>}
            <p className="text-2xl font-bold mt-2">Stock actuel: {product.stock}</p>
          </div>

          <div className="space-y-2">
            <Label>Type d'ajustement</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={operation === 'add' ? 'default' : 'outline'}
                onClick={() => setOperation('add')}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
              <Button
                variant={operation === 'remove' ? 'default' : 'outline'}
                onClick={() => setOperation('remove')}
                className="w-full"
              >
                <Minus className="h-4 w-4 mr-1" />
                Retirer
              </Button>
              <Button
                variant={operation === 'set' ? 'default' : 'outline'}
                onClick={() => setOperation('set')}
                className="w-full"
              >
                <Edit className="h-4 w-4 mr-1" />
                Définir
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">
              {operation === 'add' ? 'Quantité à ajouter' : operation === 'remove' ? 'Quantité à retirer' : 'Nouveau stock'}
            </Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motif (optionnel)</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un motif" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reception">Réception marchandise</SelectItem>
                <SelectItem value="inventory">Inventaire</SelectItem>
                <SelectItem value="damage">Casse/Perte</SelectItem>
                <SelectItem value="return">Retour fournisseur</SelectItem>
                <SelectItem value="correction">Correction d'erreur</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {quantity && (
            <div className="rounded-lg bg-primary/10 p-4 text-center">
              <p className="text-sm text-muted-foreground">Nouveau stock</p>
              <p className="text-3xl font-bold text-primary">{previewStock()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {operation === 'add' && `+${quantity}`}
                {operation === 'remove' && `-${quantity}`}
                {operation === 'set' && 'Définir manuellement'}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={adjustMutation.isPending} className="flex-1">
              Valider
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
