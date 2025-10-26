import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { MobileLayout } from './MobileLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, Scan } from 'lucide-react';
import { useProducts, useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { MobileBarcodeScanner } from './MobileBarcodeScanner';
import { PRODUCT_UNITS } from '@/data/units';
import { toast } from 'sonner';

export const MobileProductForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const [scannerOpen, setScannerOpen] = useState(false);

  const isEditing = id !== 'new';
  const product = isEditing ? products.find(p => p.id === id) : null;
  const barcodeParam = searchParams.get('barcode');

  const [formData, setFormData] = useState({
    barcode: barcodeParam || '',
    name: '',
    description: '',
    price: '',
    cost_price: '',
    type: 'unit' as 'unit' | 'weight',
    unit: 'pièce',
    category_id: '',
    vat_rate: '6',
    stock: '',
    min_stock: '',
    supplier: '',
  });

  useEffect(() => {
    if (product) {
      setFormData({
        barcode: product.barcode || '',
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        cost_price: product.cost_price?.toString() || '',
        type: product.type,
        unit: product.unit || 'pièce',
        category_id: product.category_id || '',
        vat_rate: product.vat_rate.toString(),
        stock: product.stock?.toString() || '',
        min_stock: product.min_stock?.toString() || '',
        supplier: product.supplier || '',
      });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price) {
      toast.error('Nom et prix obligatoires');
      return;
    }

    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
      vat_rate: parseFloat(formData.vat_rate),
      stock: formData.stock ? parseFloat(formData.stock) : 0,
      min_stock: formData.min_stock ? parseFloat(formData.min_stock) : 0,
      category_id: formData.category_id || null,
      is_active: true,
    };

    try {
      if (isEditing && product) {
        await updateProduct.mutateAsync({ id: product.id, ...productData });
        toast.success('Produit modifié');
      } else {
        await createProduct.mutateAsync(productData);
        toast.success('Produit créé');
      }
      navigate('/mobile/products');
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <MobileLayout
      title={isEditing ? 'Modifier Produit' : 'Nouveau Produit'}
      actions={
        <Button
          size="icon"
          variant="outline"
          onClick={() => setScannerOpen(true)}
        >
          <Scan className="h-5 w-5" />
        </Button>
      }
    >
      <ScrollArea className="h-[calc(100vh-80px)]">
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Code-barres */}
          <Card className="p-4">
            <div className="space-y-2">
              <Label>Code-barres</Label>
              <Input
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="Scannez ou saisissez"
              />
            </div>
          </Card>

          {/* Informations de base */}
          <Card className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nom du produit"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description optionnelle"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
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
          </Card>

          {/* Prix */}
          <Card className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prix de vente * (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Prix d'achat (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>TVA (%)</Label>
              <Select
                value={formData.vat_rate}
                onValueChange={(value) => setFormData({ ...formData, vat_rate: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="6">6%</SelectItem>
                  <SelectItem value="12">12%</SelectItem>
                  <SelectItem value="21">21%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Type et unité */}
          <Card className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Type de produit</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'unit' | 'weight') => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unit">À l'unité</SelectItem>
                  <SelectItem value="weight">Au poids</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Unité</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_UNITS.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Stock */}
          <Card className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Stock minimum</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fournisseur</Label>
              <Input
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="Nom du fournisseur"
              />
            </div>
          </Card>

          {/* Actions */}
          <Button
            type="submit"
            className="w-full h-14 text-lg"
            disabled={createProduct.isPending || updateProduct.isPending}
          >
            <Save className="h-5 w-5 mr-2" />
            {isEditing ? 'Enregistrer' : 'Créer le produit'}
          </Button>
        </form>
      </ScrollArea>

      {/* Scanner pour code-barres */}
      <MobileBarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onProductFound={(foundProduct) => {
          setFormData({ ...formData, barcode: foundProduct.barcode || '' });
          setScannerOpen(false);
          toast.info('Code-barres déjà utilisé par ' + foundProduct.name);
        }}
        onProductNotFound={(barcode) => {
          setFormData({ ...formData, barcode });
          setScannerOpen(false);
        }}
      />
    </MobileLayout>
  );
};

export default MobileProductForm;
