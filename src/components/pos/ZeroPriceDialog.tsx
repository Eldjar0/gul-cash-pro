import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Product, useUpdateProduct } from '@/hooks/useProducts';
import { toast } from 'sonner';
import { Euro, Save } from 'lucide-react';

interface ZeroPriceDialogProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  quantity: number;
  onConfirm: (price: number) => void;
}

export function ZeroPriceDialog({ open, onClose, product, quantity, onConfirm }: ZeroPriceDialogProps) {
  const [price, setPrice] = useState('');
  const [savePrice, setSavePrice] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const updateProduct = useUpdateProduct();

  const handleConfirm = async () => {
    const numericPrice = parseFloat(price.replace(',', '.'));
    
    if (isNaN(numericPrice) || numericPrice <= 0) {
      toast.error('Veuillez entrer un prix valide');
      return;
    }

    setIsLoading(true);
    
    try {
      // Sauvegarder le prix dans la base de données si demandé
      if (savePrice && product) {
        await updateProduct.mutateAsync({
          id: product.id,
          price: numericPrice
        });
        toast.success(`Prix de ${product.name} enregistré: ${numericPrice.toFixed(2)}€`);
      }
      
      // Appeler le callback avec le prix saisi
      onConfirm(numericPrice);
      
      // Réinitialiser et fermer
      setPrice('');
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du prix:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5 text-primary" />
            Prix non défini
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {product && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-lg">{product.name}</p>
              {product.barcode && (
                <p className="text-sm text-muted-foreground">Code: {product.barcode}</p>
              )}
              <p className="text-sm text-muted-foreground">Quantité: {quantity}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="price">Prix de vente (€)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="text-xl font-semibold h-14 text-center"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="savePrice"
              checked={savePrice}
              onCheckedChange={(checked) => setSavePrice(checked === true)}
            />
            <Label htmlFor="savePrice" className="text-sm cursor-pointer">
              Enregistrer ce prix pour le futur
            </Label>
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || !price}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Enregistrement...' : 'Ajouter au panier'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
