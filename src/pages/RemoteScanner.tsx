import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Scan, CheckCircle2, AlertCircle, Smartphone, Edit, Plus, Barcode, DollarSign, Package } from 'lucide-react';
import { useScanSession, useAddScannedItem } from '@/hooks/useRemoteScan';
import { useProducts, useCreateProduct, useUpdateProduct, Product } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { toast } from 'sonner';
import logo from '@/assets/logo-gul-reyhan.png';

export default function RemoteScanner() {
  const { sessionCode } = useParams();
  const navigate = useNavigate();
  const [barcode, setBarcode] = useState('');
  const [scannedItems, setScannedItems] = useState<Array<{ barcode: string; time: string; success: boolean }>>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newProductDialogOpen, setNewProductDialogOpen] = useState(false);
  const [changeBarcodeDialogOpen, setChangeBarcodeDialogOpen] = useState(false);
  const [editPriceDialogOpen, setEditPriceDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editQuantity, setEditQuantity] = useState('1');
  const [editPrice, setEditPrice] = useState('');
  const [newBarcode, setNewBarcode] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { data: session, isLoading, error } = useScanSession(sessionCode);
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const addScannedItem = useAddScannedItem();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  
  // Sons optimisés
  const successSound = useRef<HTMLAudioElement | null>(null);
  const errorSound = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Sons de notification plus agréables
    successSound.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTQIGWi77eeeTRAMUKfj8LZjHAY4ktfx');
    errorSound.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAgICAgH9+fn5+fX19fHx8e3t7enp6eXl5eHh4d3d3dnZ2dXV1dHR0c3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nz');
  }, []);

  useEffect(() => {
    // Auto-focus input for barcode scanner and keep it focused
    const keepFocused = () => {
      if (inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus();
      }
    };

    // Focus immediately
    keepFocused();

    // Keep checking every 100ms to maintain focus
    const interval = setInterval(keepFocused, 100);

    // Also refocus on any click
    document.addEventListener('click', keepFocused);
    document.addEventListener('touchstart', keepFocused);

    return () => {
      clearInterval(interval);
      document.removeEventListener('click', keepFocused);
      document.removeEventListener('touchstart', keepFocused);
    };
  }, []);

  useEffect(() => {
    if (error) {
      toast.error('Session invalide ou expirée');
      setTimeout(() => navigate('/'), 3000);
    }
  }, [error, navigate]);

  const handleScan = async (scannedBarcode: string) => {
    if (!session || !scannedBarcode.trim()) return;

    // Vérifier si le produit existe
    const product = products?.find(p => p.barcode === scannedBarcode.trim());
    
    if (!product) {
      setScannedItems(prev => [
        { barcode: scannedBarcode, time: new Date().toLocaleTimeString(), success: false },
        ...prev.slice(0, 19)
      ]);
      errorSound.current?.play().catch(() => {});
      toast.error('Produit inconnu', {
        description: 'Code-barres non trouvé dans le système',
        action: {
          label: 'Créer',
          onClick: () => {
            setBarcode(scannedBarcode);
            setNewProductDialogOpen(true);
          }
        }
      });
      return;
    }

    try {
      await addScannedItem.mutateAsync({
        sessionId: session.id,
        barcode: scannedBarcode.trim(),
        quantity: 1,
      });

      setScannedItems(prev => [
        { barcode: scannedBarcode, time: new Date().toLocaleTimeString(), success: true },
        ...prev.slice(0, 19)
      ]);
      
      setBarcode('');
      successSound.current?.play().catch(() => {});
      toast.success('Produit scanné', { description: product.name });
    } catch (error) {
      console.error('Error scanning item:', error);
      errorSound.current?.play().catch(() => {});
      toast.error('Erreur de scan');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScan(barcode);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Connexion à la session...</p>
        </div>
      </div>
    );
  }

  if (error || !session || !session.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/20 to-destructive/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <CardTitle>Session Invalide</CardTitle>
            </div>
            <CardDescription>
              Cette session de scan n'existe pas ou a expiré.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Retour à la caisse
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lastScannedProduct = scannedItems.length > 0 && scannedItems[0].success
    ? products?.find(p => p.barcode === scannedItems[0].barcode)
    : null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary to-primary-foreground">
      {/* Header */}
      <div className="bg-background/95 backdrop-blur border-b p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Logo" className="h-16 w-auto" />
            <div>
              <h1 className="text-2xl font-bold">Scanner à Distance</h1>
              <Badge variant="secondary" className="bg-green-500/20 text-green-700 border-green-500/30">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                Connecté
              </Badge>
            </div>
          </div>
          <Button onClick={() => navigate('/')} variant="outline" size="lg">
            Retour Caisse
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100vh-80px)] overflow-auto">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          
          {/* Zone de Scan */}
          <Card className="border-4 border-primary/20 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-3xl flex items-center justify-center gap-3">
                <Scan className="h-10 w-10 text-primary" />
                Scanner un produit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Scannez ou saisissez le code-barres..."
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="text-3xl h-24 text-center font-mono font-bold border-4 focus-visible:ring-4"
                  autoFocus
                />
                <Button 
                  type="submit" 
                  size="lg"
                  className="w-full h-20 text-2xl"
                  disabled={!barcode.trim()}
                >
                  <CheckCircle2 className="h-8 w-8 mr-3" />
                  Valider le scan
                </Button>
              </form>

              {/* Dernier produit scanné */}
              {lastScannedProduct && (
                <div className="p-6 bg-green-50 border-4 border-green-500 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                        <span className="text-sm text-green-600 font-semibold">Dernier scan réussi</span>
                      </div>
                      <h3 className="text-2xl font-bold mb-2">{lastScannedProduct.name}</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Code: </span>
                          <span className="font-mono font-bold">{lastScannedProduct.barcode}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Prix: </span>
                          <span className="font-bold">{lastScannedProduct.price.toFixed(2)} €</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Stock: </span>
                          <span className="font-bold">{lastScannedProduct.stock}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Type: </span>
                          <span className="font-bold">{lastScannedProduct.type === 'weight' ? 'Poids' : 'Unité'}</span>
                        </div>
                      </div>
                    </div>
                    <Package className="h-16 w-16 text-green-600 opacity-20" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hub Actions - Très Gros Carrés */}
          <div className="grid grid-cols-2 gap-6">
            <Button
              onClick={() => {
                if (lastScannedProduct) {
                  setSelectedProduct(lastScannedProduct);
                  setEditQuantity('1');
                  setEditDialogOpen(true);
                }
              }}
              disabled={!lastScannedProduct}
              className="h-48 flex flex-col items-center justify-center gap-4 text-2xl font-bold"
              variant="outline"
            >
              <Edit className="h-16 w-16" />
              <span>Modifier Quantité</span>
            </Button>

            <Button
              onClick={() => {
                if (lastScannedProduct) {
                  setSelectedProduct(lastScannedProduct);
                  setEditPrice(lastScannedProduct.price.toString());
                  setEditPriceDialogOpen(true);
                }
              }}
              disabled={!lastScannedProduct}
              className="h-48 flex flex-col items-center justify-center gap-4 text-2xl font-bold"
              variant="outline"
            >
              <DollarSign className="h-16 w-16" />
              <span>Modifier Prix</span>
            </Button>

            <Button
              onClick={() => {
                if (lastScannedProduct) {
                  setSelectedProduct(lastScannedProduct);
                  setNewBarcode('');
                  setChangeBarcodeDialogOpen(true);
                }
              }}
              disabled={!lastScannedProduct}
              className="h-48 flex flex-col items-center justify-center gap-4 text-2xl font-bold"
              variant="outline"
            >
              <Barcode className="h-16 w-16" />
              <span>Changer Code</span>
            </Button>

            <Button
              onClick={() => {
                setBarcode('');
                setNewProductDialogOpen(true);
              }}
              className="h-48 flex flex-col items-center justify-center gap-4 text-2xl font-bold"
              variant="outline"
            >
              <Plus className="h-16 w-16" />
              <span>Nouveau Produit</span>
            </Button>
          </div>

          {/* Historique des scans */}
          {scannedItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Historique des scans</CardTitle>
                <CardDescription>Derniers produits scannés</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {scannedItems.slice(0, 5).map((item, index) => {
                    const product = products?.find(p => p.barcode === item.barcode);
                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-2 flex items-center justify-between ${
                          item.success 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {item.success ? (
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                          ) : (
                            <AlertCircle className="h-6 w-6 text-red-600" />
                          )}
                          <div>
                            <p className="font-mono font-bold">{item.barcode}</p>
                            {product && <p className="text-sm text-muted-foreground">{product.name}</p>}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{item.time}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Dialog Modifier Quantité */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la quantité</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedProduct && (
              <div className="p-3 bg-accent rounded-lg">
                <p className="font-semibold">{selectedProduct.name}</p>
                <p className="text-sm text-muted-foreground">{selectedProduct.barcode}</p>
              </div>
            )}
            <div>
              <Label>Quantité</Label>
              <Input
                type="number"
                step="0.01"
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
                className="text-xl h-14 text-center"
              />
            </div>
            <Button 
              className="w-full" 
              onClick={async () => {
                if (selectedProduct && session) {
                  await addScannedItem.mutateAsync({
                    sessionId: session.id,
                    barcode: selectedProduct.barcode || '',
                    quantity: parseFloat(editQuantity),
                  });
                  toast.success('Quantité ajoutée');
                  setEditDialogOpen(false);
                }
              }}
            >
              Confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Nouveau Produit */}
      <Dialog open={newProductDialogOpen} onOpenChange={setNewProductDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un nouveau produit</DialogTitle>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            await createProduct.mutateAsync({
              name: formData.get('name') as string,
              barcode: barcode || formData.get('barcode') as string,
              price: parseFloat(formData.get('price') as string),
              cost_price: parseFloat(formData.get('cost_price') as string) || undefined,
              vat_rate: parseFloat(formData.get('vat_rate') as string),
              type: formData.get('type') as 'unit' | 'weight',
              category_id: formData.get('category_id') as string || undefined,
              stock: parseFloat(formData.get('stock') as string) || 0,
              is_active: true,
            });
            setNewProductDialogOpen(false);
            setBarcode('');
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Code-barres</Label>
                <Input name="barcode" defaultValue={barcode} required />
              </div>
              <div>
                <Label>Nom du produit</Label>
                <Input name="name" required />
              </div>
              <div>
                <Label>Prix de vente (€)</Label>
                <Input name="price" type="number" step="0.01" required />
              </div>
              <div>
                <Label>Prix d'achat (€)</Label>
                <Input name="cost_price" type="number" step="0.01" />
              </div>
              <div>
                <Label>TVA (%)</Label>
                <Input name="vat_rate" type="number" step="0.01" defaultValue="21" required />
              </div>
              <div>
                <Label>Type</Label>
                <Select name="type" defaultValue="unit">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unit">Unité</SelectItem>
                    <SelectItem value="weight">Poids</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Catégorie</Label>
                <Select name="category_id">
                  <SelectTrigger>
                    <SelectValue placeholder="Aucune" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Stock initial</Label>
                <Input name="stock" type="number" step="0.01" defaultValue="0" />
              </div>
            </div>
            <Button type="submit" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Créer le produit
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Changer Code-barres */}
      <Dialog open={changeBarcodeDialogOpen} onOpenChange={setChangeBarcodeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le code-barres</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedProduct && (
              <div className="p-3 bg-accent rounded-lg">
                <p className="font-semibold">{selectedProduct.name}</p>
                <p className="text-sm text-muted-foreground">Actuel: {selectedProduct.barcode}</p>
              </div>
            )}
            <div>
              <Label>Nouveau code-barres</Label>
              <Input
                value={newBarcode}
                onChange={(e) => setNewBarcode(e.target.value)}
                placeholder="Scannez ou saisissez"
                className="text-xl h-14 text-center font-mono"
              />
            </div>
            <Button 
              className="w-full" 
              onClick={async () => {
                if (selectedProduct && newBarcode.trim()) {
                  await updateProduct.mutateAsync({
                    id: selectedProduct.id,
                    barcode: newBarcode.trim(),
                  });
                  setChangeBarcodeDialogOpen(false);
                  setNewBarcode('');
                }
              }}
            >
              Confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifier Prix */}
      <Dialog open={editPriceDialogOpen} onOpenChange={setEditPriceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le prix</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedProduct && (
              <div className="p-3 bg-accent rounded-lg">
                <p className="font-semibold">{selectedProduct.name}</p>
                <p className="text-sm text-muted-foreground">Prix actuel: {selectedProduct.price.toFixed(2)} €</p>
              </div>
            )}
            <div>
              <Label>Nouveau prix (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="text-xl h-14 text-center"
                placeholder={selectedProduct?.price.toFixed(2)}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={async () => {
                if (selectedProduct && editPrice) {
                  await updateProduct.mutateAsync({
                    id: selectedProduct.id,
                    price: parseFloat(editPrice),
                  });
                  setEditPriceDialogOpen(false);
                  setEditPrice('');
                }
              }}
            >
              Confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
