import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, Camera, X, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useSuppliers } from '@/hooks/useSuppliers';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { PRODUCT_UNITS } from '@/data/units';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: any;
  onSave: (data: any) => void;
  onSupplierCreate: () => void;
}

export const ProductFormDialog = ({ 
  open, 
  onOpenChange, 
  product, 
  onSave,
  onSupplierCreate 
}: ProductFormDialogProps) => {
  const { data: categories = [] } = useCategories();
  const { data: suppliers = [] } = useSuppliers();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    barcode: '',
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
    supplier_id: '',
  });

  const margin = useMemo(() => {
    const price = parseFloat(formData.price);
    const cost = parseFloat(formData.cost_price);
    
    if (!price || !cost || price === 0) return null;
    
    const marginAmount = price - cost;
    const marginPercent = (marginAmount / price) * 100;
    
    return {
      amount: marginAmount,
      percent: marginPercent,
      isProfit: marginAmount > 0,
    };
  }, [formData.price, formData.cost_price]);

  useEffect(() => {
    if (product) {
      const matchingSupplier = suppliers.find(s => s.name === product.supplier);
      
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
        supplier_id: matchingSupplier?.id || '',
      });
      
      if (product.image) {
        setImageUrl(product.image);
      }
    } else {
      setFormData({
        barcode: '',
        name: '',
        description: '',
        price: '',
        cost_price: '',
        type: 'unit',
        unit: 'pièce',
        category_id: '',
        vat_rate: '6',
        stock: '',
        min_stock: '',
        supplier_id: '',
      });
      setImageUrl(null);
      setImageFile(null);
    }
  }, [product, suppliers, open]);

  const selectPhoto = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setImageUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return imageUrl;

    try {
      setIsUploadingImage(true);
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Erreur upload image:', error);
      toast.error('Erreur lors de l\'upload de l\'image');
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImageUrl(null);
    setImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price) {
      toast.error('Nom et prix obligatoires');
      return;
    }

    if (!formData.category_id) {
      toast.error('La catégorie est obligatoire');
      return;
    }

    const uploadedImageUrl = await uploadImage();
    const selectedSupplier = suppliers.find(s => s.id === formData.supplier_id);
    
    const productData = {
      barcode: formData.barcode || null,
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
      vat_rate: parseFloat(formData.vat_rate),
      stock: formData.stock ? parseFloat(formData.stock) : 0,
      min_stock: formData.min_stock ? parseFloat(formData.min_stock) : 0,
      category_id: formData.category_id || null,
      type: formData.type,
      unit: formData.unit,
      supplier: selectedSupplier?.name || null,
      is_active: true,
      image: uploadedImageUrl,
    };

    onSave(productData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{product ? 'Modifier Produit' : 'Nouveau Produit'}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Colonne gauche */}
              <div className="space-y-4">
                {/* Photo du produit */}
                <Card className="p-4">
                  <div className="space-y-3">
                    <Label>Photo du produit</Label>
                    
                    {imageUrl ? (
                      <div className="relative">
                        <img 
                          src={imageUrl} 
                          alt="Produit" 
                          className="w-full h-48 object-cover rounded-lg border-2 border-primary/20"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={removeImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-32 flex flex-col gap-2 border-dashed border-2"
                        onClick={selectPhoto}
                      >
                        <Camera className="h-8 w-8" />
                        <span>Sélectionner une photo</span>
                      </Button>
                    )}
                  </div>
                </Card>

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
                    <Label>Catégorie *</Label>
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
                            <div className="flex items-center gap-2">
                              {cat.icon && <DynamicIcon name={cat.icon} className="h-4 w-4" />}
                              <span>{cat.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </Card>
              </div>

              {/* Colonne droite */}
              <div className="space-y-4">
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

                  {margin && (
                    <Card className={`p-3 ${margin.isProfit ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {margin.isProfit ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm font-medium">
                            {margin.isProfit ? 'Gain' : 'Perte'}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${margin.isProfit ? 'text-green-600' : 'text-red-600'}`}>
                            {margin.percent > 0 ? '+' : ''}{margin.percent.toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {margin.amount > 0 ? '+' : ''}{margin.amount.toFixed(2)}€
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}

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
                    <div className="flex gap-2">
                      <Select
                        value={formData.supplier_id}
                        onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.filter(s => s.is_active).map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={onSupplierCreate}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isUploadingImage}>
                <Save className="h-4 w-4 mr-2" />
                {isUploadingImage ? 'Upload...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
