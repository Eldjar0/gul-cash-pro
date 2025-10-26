import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProducts, useCreateProduct } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/use-toast';
import { Search } from 'lucide-react';
import { useAddProductBarcode } from '@/hooks/useProductBarcodes';

interface UnknownBarcodeDialogProps {
  open: boolean;
  onClose: () => void;
  barcode: string;
  onProductLinked?: (productId: string) => void;
}

export const UnknownBarcodeDialog = ({ open, onClose, barcode, onProductLinked }: UnknownBarcodeDialogProps) => {
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [searchTerm, setSearchTerm] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    vat_rate: '21',
    type: 'unit' as 'unit' | 'weight',
    category_id: '',
    unit: 'pièce',
  });

  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const createProduct = useCreateProduct();
  const addBarcode = useAddProductBarcode();
  const { toast } = useToast();

  const filteredProducts = products.filter(p => {
    const trimmedSearch = searchTerm.trim();
    if (!trimmedSearch) return true;
    
    const searchLower = trimmedSearch.toLowerCase();
    const isNumber = !isNaN(Number(trimmedSearch)) && trimmedSearch !== '';
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedSearch);
    
    // Recherche dans le nom
    if (p.name.toLowerCase().includes(searchLower)) return true;
    
    // Recherche dans le code-barres (normalisé)
    if (p.barcode) {
      const normalizedBarcode = p.barcode.replace(/[^0-9]/g, '');
      const normalizedSearch = trimmedSearch.replace(/[^0-9]/g, '');
      if (normalizedSearch.length > 0 && normalizedBarcode.includes(normalizedSearch)) return true;
    }
    
    // Recherche par ID
    if (isUUID && p.id === trimmedSearch) return true;
    if (p.id.toLowerCase().includes(searchLower)) return true;
    
    // Recherche par prix
    if (isNumber) {
      const numValue = Number(trimmedSearch);
      if (Math.abs(p.price - numValue) < 0.01) return true;
    }
    
    return false;
  });

  const handleLinkExisting = async (productId: string) => {
    try {
      await addBarcode.mutateAsync({ productId, barcode, isPrimary: false });
      toast({
        title: 'Code-barres lié',
        description: 'Le code-barres a été ajouté au produit.',
      });
      onProductLinked?.(productId);
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de lier le code-barres.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateNew = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.category_id) {
      toast({
        title: 'Champs requis',
        description: 'Veuillez remplir le nom, le prix et la catégorie.',
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
        category_id: newProduct.category_id,
        unit: newProduct.unit,
        is_active: true,
        stock: 0,
        min_stock: 0,
      });

      toast({
        title: 'Produit créé',
        description: `${result.name} créé avec le code-barres ${barcode}`,
      });

      try {
        await addBarcode.mutateAsync({ productId: result.id, barcode, isPrimary: true });
      } catch (_) {
        // Si déjà présent, on ignore
      }

      onProductLinked?.(result.id);
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
                  placeholder="Rechercher par nom, code-barres, ID ou prix..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
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
                  autoFocus
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  onKeyDown={(e) => {
                    // Empêcher le système de scan global de capturer les événements
                    e.stopPropagation();
                  }}
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
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="0.00"
                  className="h-12 text-base mt-2"
                />
              </div>
              <div>
                <Label htmlFor="category" className="text-base font-semibold">Catégorie *</Label>
                <Select
                  value={newProduct.category_id}
                  onValueChange={(value) =>
                    setNewProduct({ ...newProduct, category_id: value })
                  }
                >
                  <SelectTrigger id="category" className="h-12 text-base mt-2">
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="vat" className="text-base font-semibold">TVA (%)</Label>
                <Input
                  id="vat"
                  type="number"
                  step="0.01"
                  value={newProduct.vat_rate}
                  onChange={(e) => setNewProduct({ ...newProduct, vat_rate: e.target.value })}
                  onKeyDown={(e) => e.stopPropagation()}
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
                    <SelectItem value="unit">Unité</SelectItem>
                    <SelectItem value="weight">Poids</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="unit" className="text-base font-semibold">Unité de mesure</Label>
                <Select
                  value={newProduct.unit}
                  onValueChange={(value) =>
                    setNewProduct({ ...newProduct, unit: value })
                  }
                >
                  <SelectTrigger id="unit" className="h-12 text-base mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pièce">pièce</SelectItem>
                    <SelectItem value="kg">kg (kilogramme)</SelectItem>
                    <SelectItem value="g">g (gramme)</SelectItem>
                    <SelectItem value="L">L (litre)</SelectItem>
                    <SelectItem value="mL">mL (millilitre)</SelectItem>
                    <SelectItem value="m">m (mètre)</SelectItem>
                    <SelectItem value="m²">m² (mètre carré)</SelectItem>
                    <SelectItem value="paquet">paquet</SelectItem>
                    <SelectItem value="boîte">boîte</SelectItem>
                    <SelectItem value="carton">carton</SelectItem>
                    <SelectItem value="lot">lot</SelectItem>
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
