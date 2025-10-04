import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  ShoppingCart,
  User,
  Phone,
  FileText,
  Check,
  X,
  Search,
  Barcode,
  Tag,
  Percent,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useMobileOrders, useCreateMobileOrder, useUpdateMobileOrder, useDeleteMobileOrder, MobileOrder, MobileOrderItem } from '@/hooks/useMobileOrders';
import { useProducts } from '@/hooks/useProducts';
import { usePromotions } from '@/hooks/usePromotions';
import { toast } from 'sonner';

export default function MobileOrders() {
  const navigate = useNavigate();
  const { data: orders = [] } = useMobileOrders('pending');
  const { data: products = [] } = useProducts();
  const { data: promotions = [] } = usePromotions();
  const createOrder = useCreateMobileOrder();
  const updateOrder = useUpdateMobileOrder();
  const deleteOrder = useDeleteMobileOrder();

  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingOrder, setEditingOrder] = useState<MobileOrder | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  
  // Product search dialog
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Item editing dialog
  const [editItemDialogOpen, setEditItemDialogOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editItemData, setEditItemData] = useState({
    quantity: '1',
    unit_price: '0',
    discount_percent: '0',
  });

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    notes: '',
    items: [] as MobileOrderItem[],
  });

  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');

  const handleOpenOrderForm = (order?: MobileOrder) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        customer_name: order.customer_name || '',
        customer_phone: order.customer_phone || '',
        notes: order.notes || '',
        items: order.items,
      });
    } else {
      setEditingOrder(null);
      setFormData({
        customer_name: '',
        customer_phone: '',
        notes: '',
        items: [],
      });
    }
    setView('form');
  };

  // Scan detection for barcode scanner
  useEffect(() => {
    if (view !== 'form') return;
    
    let buffer = "";
    let lastKeyTime = 0;
    let timeoutId: NodeJS.Timeout | null = null;

    const processScan = (barcode: string) => {
      const product = products.find(p => p.barcode === barcode);
      if (product) {
        handleAddProductByBarcode(product.id);
        toast.success(`${product.name} ajouté`);
      } else {
        toast.error('Produit non trouvé');
      }
    };

    const handler = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      const now = Date.now();
      const delta = now - lastKeyTime;
      lastKeyTime = now;

      if (e.key === 'Enter' && buffer.length >= 3) {
        e.preventDefault();
        if (timeoutId) clearTimeout(timeoutId);
        processScan(buffer);
        buffer = "";
        return;
      }

      if (e.key.length === 1 && /[0-9]/.test(e.key)) {
        if (delta > 400 && buffer.length > 0) {
          buffer = "";
        }
        buffer += e.key;
        
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (buffer.length >= 8) {
            processScan(buffer);
            buffer = "";
          }
        }, 300);
      }
    };

    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [view, products]);

  const handleAddProductByBarcode = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Check for applicable promotions
    const applicablePromo = promotions.find(promo => 
      promo.is_active &&
      promo.type === 'percentage' &&
      (!promo.applicable_products || promo.applicable_products.includes(product.id))
    );

    const qty = 1;
    const unitPrice = product.price;
    let discountPercent = 0;

    if (applicablePromo) {
      discountPercent = applicablePromo.value || 0;
    }

    const discountAmount = (unitPrice * qty * discountPercent) / 100;
    const totalPrice = (unitPrice * qty) - discountAmount;

    const newItem: MobileOrderItem = {
      product_id: product.id,
      product_name: product.name,
      quantity: qty,
      unit_price: unitPrice,
      total_price: totalPrice,
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const handleSearchProduct = (productId: string) => {
    handleAddProductByBarcode(productId);
    setSearchDialogOpen(false);
    setSearchTerm('');
  };

  const handleEditItem = (index: number) => {
    const item = formData.items[index];
    setEditingItemIndex(index);
    setEditItemData({
      quantity: item.quantity.toString(),
      unit_price: item.unit_price.toString(),
      discount_percent: '0',
    });
    setEditItemDialogOpen(true);
  };

  const handleSaveEditedItem = () => {
    if (editingItemIndex === null) return;

    const qty = parseFloat(editItemData.quantity);
    const unitPrice = parseFloat(editItemData.unit_price);
    const discountPercent = parseFloat(editItemData.discount_percent);

    const subtotal = qty * unitPrice;
    const discountAmount = (subtotal * discountPercent) / 100;
    const totalPrice = subtotal - discountAmount;

    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, index) => 
        index === editingItemIndex
          ? { ...item, quantity: qty, unit_price: unitPrice, total_price: totalPrice }
          : item
      ),
    }));

    setEditItemDialogOpen(false);
    setEditingItemIndex(null);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = () => {
    if (!selectedProductId || !quantity) {
      toast.error('Sélectionnez un produit et une quantité');
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const qty = parseFloat(quantity);
    const unitPrice = product.price;
    const totalPrice = qty * unitPrice;

    const newItem: MobileOrderItem = {
      product_id: product.id,
      product_name: product.name,
      quantity: qty,
      unit_price: unitPrice,
      total_price: totalPrice,
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    setSelectedProductId('');
    setQuantity('1');
  };

  const handleRemoveProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total_price, 0);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.items.length === 0) {
      toast.error('Ajoutez au moins un produit');
      return;
    }

    const orderData = {
      ...formData,
      total_amount: calculateTotal(),
      status: 'pending' as const,
    };

    try {
      if (editingOrder) {
        await updateOrder.mutateAsync({ id: editingOrder.id, ...orderData });
      } else {
        await createOrder.mutateAsync(orderData);
      }
      setView('list');
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;

    try {
      await deleteOrder.mutateAsync(orderToDelete);
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      await updateOrder.mutateAsync({ id: orderId, status: 'completed' });
    } catch (error) {
      console.error('Error completing order:', error);
    }
  };

  if (view === 'form') {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setView('list')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">
              {editingOrder ? 'Modifier la commande' : 'Nouvelle commande'}
            </h1>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <form onSubmit={handleSubmitOrder} className="p-4 space-y-4">
            {/* Customer Info */}
            <Card className="p-4 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="customer_name">
                  <User className="h-4 w-4 inline mr-1" />
                  Nom du client
                </Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                  placeholder="Nom du client (optionnel)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_phone">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Téléphone
                </Label>
                <Input
                  id="customer_phone"
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                  placeholder="Numéro de téléphone (optionnel)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notes supplémentaires..."
                  rows={3}
                />
              </div>
            </Card>

            {/* Add Products */}
            <Card className="p-4 space-y-3">
              <h3 className="font-bold">Ajouter des produits</h3>
              
              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  onClick={() => setSearchDialogOpen(true)}
                  variant="outline"
                  className="h-16"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Recherche rapide
                </Button>
                <div className="flex flex-col items-center justify-center p-2 border rounded-md bg-muted">
                  <Barcode className="h-6 w-6 mb-1 text-muted-foreground" />
                  <span className="text-xs text-center text-muted-foreground">
                    Scan automatique
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Produit</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  <option value="">Sélectionner un produit...</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.price.toFixed(2)}€
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Quantité</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Quantité"
                />
              </div>

              <Button
                type="button"
                onClick={handleAddProduct}
                className="w-full"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter le produit
              </Button>
            </Card>

            {/* Order Items */}
            {formData.items.length > 0 && (
              <Card className="p-4 space-y-3">
                <h3 className="font-bold">Produits de la commande</h3>
                
                {formData.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} × {item.unit_price.toFixed(2)}€
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{item.total_price.toFixed(2)}€</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditItem(index)}
                      >
                        <Edit className="h-4 w-4 text-primary" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveProduct(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <div className="pt-3 border-t flex justify-between items-center">
                  <span className="text-lg font-bold">Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    {calculateTotal().toFixed(2)}€
                  </span>
                </div>
              </Card>
            )}

            <Button type="submit" className="w-full h-14" disabled={formData.items.length === 0}>
              <Check className="h-5 w-5 mr-2" />
              {editingOrder ? 'Mettre à jour' : 'Créer la commande'}
            </Button>
          </form>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/mobile')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Commandes</h1>
          </div>
          <Button onClick={() => handleOpenOrderForm()}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="p-4 space-y-3">
          {orders.length === 0 ? (
            <Card className="p-8 text-center">
              <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Aucune commande en attente</p>
              <Button onClick={() => handleOpenOrderForm()} className="mt-4">
                Créer une commande
              </Button>
            </Card>
          ) : (
            orders.map(order => (
              <Card key={order.id} className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold">{order.order_number}</p>
                    {order.customer_name && (
                      <p className="text-sm text-muted-foreground">
                        <User className="h-3 w-3 inline mr-1" />
                        {order.customer_name}
                      </p>
                    )}
                    {order.customer_phone && (
                      <p className="text-sm text-muted-foreground">
                        <Phone className="h-3 w-3 inline mr-1" />
                        {order.customer_phone}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary">
                    {order.status === 'pending' ? 'En attente' : order.status === 'completed' ? 'Terminée' : 'Annulée'}
                  </Badge>
                </div>

                <div className="space-y-1 mb-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="text-sm flex justify-between">
                      <span>{item.quantity} × {item.product_name}</span>
                      <span className="font-semibold">{item.total_price.toFixed(2)}€</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="font-bold text-lg">{order.total_amount.toFixed(2)}€</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCompleteOrder(order.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenOrderForm(order)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOrderToDelete(order.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Product Search Dialog */}
      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Rechercher un produit
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Input
              placeholder="Nom ou code-barres..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredProducts.map(product => (
                  <Card
                    key={product.id}
                    className="p-3 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleSearchProduct(product.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        {product.barcode && (
                          <p className="text-xs text-muted-foreground">{product.barcode}</p>
                        )}
                      </div>
                      <Badge variant="secondary">{product.price.toFixed(2)}€</Badge>
                    </div>
                  </Card>
                ))}
                {filteredProducts.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun produit trouvé
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={editItemDialogOpen} onOpenChange={setEditItemDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Modifier l'article
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Quantité</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={editItemData.quantity}
                onChange={(e) => setEditItemData(prev => ({ ...prev, quantity: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Prix unitaire (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={editItemData.unit_price}
                onChange={(e) => setEditItemData(prev => ({ ...prev, unit_price: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Remise (%)
              </Label>
              <Input
                type="number"
                step="1"
                min="0"
                max="100"
                value={editItemData.discount_percent}
                onChange={(e) => setEditItemData(prev => ({ ...prev, discount_percent: e.target.value }))}
              />
            </div>

            {parseFloat(editItemData.discount_percent) > 0 && (
              <div className="p-3 bg-accent rounded-lg">
                <p className="text-sm">
                  <span className="font-semibold">Total: </span>
                  {(
                    parseFloat(editItemData.quantity) * parseFloat(editItemData.unit_price) *
                    (1 - parseFloat(editItemData.discount_percent) / 100)
                  ).toFixed(2)}€
                </p>
                <p className="text-xs text-muted-foreground">
                  Économie: {(
                    parseFloat(editItemData.quantity) * parseFloat(editItemData.unit_price) *
                    parseFloat(editItemData.discount_percent) / 100
                  ).toFixed(2)}€
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItemDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveEditedItem}>
              <Check className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la commande</DialogTitle>
          </DialogHeader>
          <p>Êtes-vous sûr de vouloir supprimer cette commande ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrder}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}