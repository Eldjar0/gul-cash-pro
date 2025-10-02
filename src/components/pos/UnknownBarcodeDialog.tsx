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
      });

      toast({
        title: 'Produit créé',
        description: `${result.name} a été créé avec succès.`,
      });

      onProductLinked(result.id);
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Connexion requise pour créer un produit.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Code-barres inconnu: {barcode}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={mode === 'select' ? 'default' : 'outline'}
              onClick={() => setMode('select')}
              className="flex-1"
            >
              Lier à un produit
            </Button>
            <Button
              variant={mode === 'create' ? 'default' : 'outline'}
              onClick={() => setMode('create')}
              className="flex-1"
            >
              Créer un produit
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
            <div className="space-y-3">
              <div>
                <Label htmlFor="name">Nom du produit *</Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Ex: Coca-Cola 33cl"
                />
              </div>
              <div>
                <Label htmlFor="price">Prix (€) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="vat">TVA (%)</Label>
                <Input
                  id="vat"
                  type="number"
                  step="0.01"
                  value={newProduct.vat_rate}
                  onChange={(e) => setNewProduct({ ...newProduct, vat_rate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={newProduct.type}
                  onValueChange={(value: 'unit' | 'weight') =>
                    setNewProduct({ ...newProduct, type: value })
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unit">Unité</SelectItem>
                    <SelectItem value="weight">Poids</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Le code-barres {barcode} sera automatiquement associé.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          {mode === 'create' && (
            <Button onClick={handleCreateNew} disabled={createProduct.isPending}>
              {createProduct.isPending ? 'Création...' : 'Créer'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
