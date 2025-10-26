import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Minus, Package, Save } from 'lucide-react';
import { useProducts, useUpdateProduct } from '@/hooks/useProducts';
import { toast } from 'sonner';

export default function MobileStockAdjust() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: products = [] } = useProducts();
  const updateProduct = useUpdateProduct();
  
  const product = products.find(p => p.id === id);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
  const [quantity, setQuantity] = useState<string>('1');
  const [reason, setReason] = useState('');

  if (!product) {
    return (
      <MobileLayout title="Produit introuvable">
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Ce produit n'existe pas</p>
          <Button onClick={() => navigate('/mobile/products')} className="mt-4">
            Retour aux produits
          </Button>
        </div>
      </MobileLayout>
    );
  }

  const currentStock = product.stock || 0;
  const quantityNum = parseInt(quantity) || 0;
  const newStock = adjustmentType === 'add' 
    ? currentStock + quantityNum 
    : Math.max(0, currentStock - quantityNum);

  const handleSave = async () => {
    if (quantityNum <= 0) {
      toast.error('La quantité doit être supérieure à 0');
      return;
    }

    if (!reason.trim()) {
      toast.error('Veuillez indiquer une raison');
      return;
    }

    try {
      await updateProduct.mutateAsync({
        id: product.id,
        stock: newStock,
      });
      
      toast.success(`Stock ${adjustmentType === 'add' ? 'ajouté' : 'retiré'} avec succès`);
      navigate(`/mobile/product/${product.id}`);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du stock');
    }
  };

  const quickActions = [
    { label: '+1', value: 1 },
    { label: '+5', value: 5 },
    { label: '+10', value: 10 },
    { label: '+50', value: 50 },
  ];

  return (
    <MobileLayout 
      title="Ajuster le stock"
      actions={
        <Button 
          size="icon"
          onClick={handleSave}
          disabled={updateProduct.isPending}
        >
          <Save className="h-5 w-5" />
        </Button>
      }
    >
      <div className="p-3 sm:p-4 space-y-4 pb-20">
        
        {/* Produit */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold truncate">{product.name}</h3>
              <p className="text-sm text-muted-foreground">
                Stock actuel: <span className="font-semibold text-foreground">{currentStock}</span> {product.unit || 'unités'}
              </p>
            </div>
          </div>
        </Card>

        {/* Type d'ajustement */}
        <Card className="p-4">
          <Label className="text-base font-semibold mb-3 block">Type d'ajustement</Label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={adjustmentType === 'add' ? 'default' : 'outline'}
              size="lg"
              className="gap-2 h-16"
              onClick={() => setAdjustmentType('add')}
            >
              <Plus className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Ajouter</div>
                <div className="text-xs opacity-90">Entrée stock</div>
              </div>
            </Button>
            <Button
              variant={adjustmentType === 'remove' ? 'default' : 'outline'}
              size="lg"
              className="gap-2 h-16"
              onClick={() => setAdjustmentType('remove')}
            >
              <Minus className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Retirer</div>
                <div className="text-xs opacity-90">Sortie stock</div>
              </div>
            </Button>
          </div>
        </Card>

        {/* Quantité */}
        <Card className="p-4">
          <Label htmlFor="quantity" className="text-base font-semibold mb-3 block">
            Quantité à {adjustmentType === 'add' ? 'ajouter' : 'retirer'}
          </Label>
          
          <div className="space-y-3">
            <Input
              id="quantity"
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="text-2xl font-bold text-center h-16"
              placeholder="0"
            />

            {/* Actions rapides */}
            <div className="grid grid-cols-4 gap-2">
              {quickActions.map((action) => (
                <Button
                  key={action.value}
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(action.value.toString())}
                  className="h-10"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Aperçu */}
        <Card className="p-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Stock actuel</p>
              <p className="text-xl font-bold">{currentStock}</p>
            </div>
            <div className="text-2xl font-bold text-muted-foreground">→</div>
            <div>
              <p className="text-sm text-muted-foreground">Nouveau stock</p>
              <p className={`text-xl font-bold ${
                newStock === 0 ? 'text-destructive' : 
                newStock < (product.min_stock || 10) ? 'text-orange-500' : 
                'text-primary'
              }`}>
                {newStock}
              </p>
            </div>
          </div>
          {newStock === 0 && (
            <Badge variant="destructive" className="w-full mt-3 justify-center">
              ATTENTION: Rupture de stock
            </Badge>
          )}
          {newStock > 0 && newStock < (product.min_stock || 10) && (
            <Badge variant="outline" className="w-full mt-3 justify-center border-orange-500 text-orange-500">
              Stock faible
            </Badge>
          )}
        </Card>

        {/* Raison */}
        <Card className="p-4">
          <Label htmlFor="reason" className="text-base font-semibold mb-3 block">
            Raison de l'ajustement *
          </Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={adjustmentType === 'add' 
              ? "Ex: Réception commande fournisseur, Inventaire, Retour client..."
              : "Ex: Vente, Casse, Vol, Péremption, Inventaire..."
            }
            className="min-h-24"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Cette raison sera enregistrée dans l'historique
          </p>
        </Card>

        {/* Boutons d'action */}
        <div className="space-y-2">
          <Button
            size="lg"
            className="w-full h-14 gap-2"
            onClick={handleSave}
            disabled={updateProduct.isPending || quantityNum <= 0 || !reason.trim()}
          >
            <Save className="h-5 w-5" />
            <span className="font-semibold">
              {adjustmentType === 'add' ? 'Ajouter' : 'Retirer'} {quantityNum} unité{quantityNum > 1 ? 's' : ''}
            </span>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => navigate(`/mobile/product/${product.id}`)}
          >
            Annuler
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
}
