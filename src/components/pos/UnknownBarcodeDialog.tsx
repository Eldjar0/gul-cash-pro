import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProducts, useCreateProduct } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { Search } from 'lucide-react';

interface UnknownBarcodeDialogProps {
  open: boolean;
  onClose: () => void;
  barcode: string;
  onProductLinked: (productId: string) => void;
}

export const UnknownBarcodeDialog = ({ open, onClose, barcode, onProductLinked }: UnknownBarcodeDialogProps) => {
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [searchTerm, setSearchTerm] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    vat_rate: '21',
    type: 'unit' as 'unit' | 'weight',
  });

  const { data: products = [] } = useProducts();
  const createProduct = useCreateProduct();
  const { toast } = useToast();

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLinkExisting = (productId: string) => {
    onProductLinked(productId);
    onClose();
  };

  const handleCreateNew = async () => {
    if (!newProduct.name || !newProduct.price) {
      toast({
        title: 'Champs requis',
        description: 'Veuillez remplir le nom et le prix.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await createProduct.mutateAsync({
        name: newProduct.name,
        barcode: barcode,
        price: parseFloat(newProduct.price),
        vat_rate: parseFloat(newProduct.vat_rate),
        type: newProduct.type,
        is_active: true,
        stock: 0,
        min_stock: 0,
      });

      toast({
        title: 'Produit créé',
        description: `${result.name} créé avec le code-barres ${barcode}`,
      });

      onProductLinked(result.id);
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer le produit.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-primary text-xl font-bold">
            Code-barres inconnu: {barcode}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={mode === 'select' ? 'default' : 'outline'}
              onClick={() => setMode('select')}
              className="flex-1 h-12 text-base font-semibold"
            >
              Lier à un produit existant
            </Button>
            <Button
              variant={mode === 'create' ? 'default' : 'outline'}
              onClick={() => setMode('create')}
              className="flex-1 h-12 text-base font-semibold bg-accent hover:bg-accent/90 text-white border-accent"
            >
              Créer un nouveau produit
            </Button>
          </div>

          {mode === 'select' ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {filteredProducts.map((product) => (
                  <Button
                    key={product.id}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3"
                    onClick={() => handleLinkExisting(product.id)}
                  >
                    <div className="flex-1">
                      <div className="font-semibold">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.price.toFixed(2)} € · TVA {product.vat_rate}%
                      </div>
                    </div>
                  </Button>
                ))}
                {filteredProducts.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">Aucun produit trouvé</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4 bg-muted/30 p-4 rounded-lg border-2 border-accent/30">
              <div className="bg-accent/10 p-3 rounded-lg border border-accent/30 mb-4">
                <p className="text-sm font-semibold text-accent">
                  📦 Création d'un nouveau produit avec le code-barres: <span className="font-mono font-bold">{barcode}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ce code-barres sera automatiquement lié au produit créé.
                </p>
              </div>
              <div>
                <Label htmlFor="name" className="text-base font-semibold">Nom du produit *</Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Ex: Coca-Cola 33cl"
                  className="h-12 text-base mt-2"
                />
              </div>
              <div>
                <Label htmlFor="price" className="text-base font-semibold">Prix (€) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  placeholder="0.00"
                  className="h-12 text-base mt-2"
                />
              </div>
              <div>
                <Label htmlFor="vat" className="text-base font-semibold">TVA (%)</Label>
                <Input
                  id="vat"
                  type="number"
                  step="0.01"
                  value={newProduct.vat_rate}
                  onChange={(e) => setNewProduct({ ...newProduct, vat_rate: e.target.value })}
                  className="h-12 text-base mt-2"
                />
              </div>
              <div>
                <Label htmlFor="type" className="text-base font-semibold">Type de produit</Label>
                <Select
                  value={newProduct.type}
                  onValueChange={(value: 'unit' | 'weight') =>
                    setNewProduct({ ...newProduct, type: value })
                  }
                >
                  <SelectTrigger id="type" className="h-12 text-base mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unit">Unité (pièce)</SelectItem>
                    <SelectItem value="weight">Poids (kg)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="h-12 px-6 text-base font-semibold"
          >
            Annuler
          </Button>
          {mode === 'create' && (
            <Button 
              onClick={handleCreateNew} 
              disabled={createProduct.isPending}
              className="h-12 px-6 bg-accent hover:bg-accent/90 text-white text-base font-bold"
            >
              {createProduct.isPending ? 'Création...' : '✓ Créer et ajouter au panier'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
