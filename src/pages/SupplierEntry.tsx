import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowLeft, Plus, Trash2, Search, Package, AlertTriangle, 
  CheckCircle, TrendingUp, TrendingDown, Save, FileCheck, 
  Calculator, Barcode, Euro
} from 'lucide-react';
import { toast } from 'sonner';
import { useProducts, Product } from '@/hooks/useProducts';
import { useCustomers } from '@/hooks/useCustomers';
import { 
  useSupplierReceipts,
  useSupplierReceiptDetails,
  useCreateSupplierReceipt,
  useAddReceiptItem,
  useUpdateReceiptItem,
  useDeleteReceiptItem,
  useValidateReceipt,
  useUpdateSupplierReceipt,
} from '@/hooks/useSupplierReceipts';

interface ReceiptItem {
  id?: string;
  product_id?: string;
  product_name: string;
  product_barcode?: string;
  quantity: number;
  expected_unit_cost: number | null;
  actual_unit_cost: number;
  line_total: number;
  has_price_change: boolean;
}

export default function SupplierEntry() {
  const navigate = useNavigate();
  const { data: products } = useProducts();
  const { data: customers } = useCustomers();
  const { data: receipts } = useSupplierReceipts();
  const createReceipt = useCreateSupplierReceipt();
  const addItem = useAddReceiptItem();
  const updateItem = useUpdateReceiptItem();
  const deleteItem = useDeleteReceiptItem();
  const validateReceipt = useValidateReceipt();
  const updateReceipt = useUpdateSupplierReceipt();

  // State
  const [currentReceiptId, setCurrentReceiptId] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [supplierId, setSupplierId] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceTotal, setInvoiceTotal] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [discrepancyDialogOpen, setDiscrepancyDialogOpen] = useState(false);

  // Load receipt details if editing
  const { data: receiptDetails } = useSupplierReceiptDetails(currentReceiptId || undefined);

  // Suppliers (customers that act as suppliers)
  const suppliers = useMemo(() => 
    customers?.filter(c => c.name.toLowerCase().includes('fournisseur') || c.vat_number) || [],
    [customers]
  );

  // Filtered products for search
  const filteredProducts = useMemo(() => {
    if (!searchTerm || !products) return [];
    const term = searchTerm.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.barcode?.toLowerCase().includes(term)
    ).slice(0, 20);
  }, [products, searchTerm]);

  // Calculations
  const calculatedTotal = useMemo(() => 
    items.reduce((sum, item) => sum + item.line_total, 0),
    [items]
  );

  const invoiceTotalNum = parseFloat(invoiceTotal) || 0;
  const discrepancy = invoiceTotalNum > 0 ? calculatedTotal - invoiceTotalNum : 0;
  const hasDiscrepancy = Math.abs(discrepancy) > 0.01;

  // Price change summary
  const priceChanges = useMemo(() => 
    items.filter(item => item.has_price_change),
    [items]
  );

  // Start new receipt
  const handleStartReceipt = async () => {
    if (!supplierName.trim()) {
      toast.error('Veuillez entrer le nom du fournisseur');
      return;
    }

    try {
      const receipt = await createReceipt.mutateAsync({
        supplier_id: supplierId || undefined,
        supplier_name: supplierName,
        supplier_invoice_number: invoiceNumber || undefined,
        supplier_invoice_total: invoiceTotalNum || undefined,
        notes: notes || undefined,
      });

      setCurrentReceiptId(receipt.id);
      toast.success(`Réception ${receipt.receipt_number} créée`);
    } catch (error) {
      console.error(error);
    }
  };

  // Add product to items
  const handleAddProduct = async (product: Product) => {
    if (!currentReceiptId) {
      toast.error('Créez d\'abord la réception');
      return;
    }

    // Check if already in list
    const existing = items.find(i => i.product_id === product.id);
    if (existing) {
      toast.info('Produit déjà dans la liste, modifiez la quantité');
      setProductSearchOpen(false);
      return;
    }

    const newItem: ReceiptItem = {
      product_id: product.id,
      product_name: product.name,
      product_barcode: product.barcode || undefined,
      quantity: 1,
      expected_unit_cost: product.cost_price || null,
      actual_unit_cost: product.cost_price || 0,
      line_total: product.cost_price || 0,
      has_price_change: false,
    };

    // Add to database
    try {
      const savedItem = await addItem.mutateAsync({
        receipt_id: currentReceiptId,
        product_id: product.id,
        product_name: product.name,
        product_barcode: product.barcode || undefined,
        quantity: 1,
        expected_unit_cost: product.cost_price || undefined,
        actual_unit_cost: product.cost_price || 0,
      });

      setItems(prev => [...prev, { ...newItem, id: savedItem.id }]);
      setSearchTerm('');
      setProductSearchOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  // Update item quantity
  const handleUpdateQuantity = async (index: number, quantity: number) => {
    const item = items[index];
    if (!item || quantity < 0) return;

    const newLineTotal = quantity * item.actual_unit_cost;
    const updatedItems = [...items];
    updatedItems[index] = {
      ...item,
      quantity,
      line_total: newLineTotal,
    };
    setItems(updatedItems);

    if (item.id && currentReceiptId) {
      await updateItem.mutateAsync({
        id: item.id,
        receipt_id: currentReceiptId,
        quantity,
      });
    }
  };

  // Update item actual cost
  const handleUpdateCost = async (index: number, cost: number) => {
    const item = items[index];
    if (!item || cost < 0) return;

    const hasPriceChange = item.expected_unit_cost !== null && 
      Math.abs(cost - item.expected_unit_cost) > 0.001;
    const newLineTotal = item.quantity * cost;

    const updatedItems = [...items];
    updatedItems[index] = {
      ...item,
      actual_unit_cost: cost,
      line_total: newLineTotal,
      has_price_change: hasPriceChange,
    };
    setItems(updatedItems);

    if (item.id && currentReceiptId) {
      await updateItem.mutateAsync({
        id: item.id,
        receipt_id: currentReceiptId,
        actual_unit_cost: cost,
      });
    }
  };

  // Remove item
  const handleRemoveItem = async (index: number) => {
    const item = items[index];
    if (item.id && currentReceiptId) {
      await deleteItem.mutateAsync({
        id: item.id,
        receipt_id: currentReceiptId,
      });
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Update invoice total
  const handleUpdateInvoiceTotal = async () => {
    if (currentReceiptId) {
      await updateReceipt.mutateAsync({
        id: currentReceiptId,
        supplier_invoice_total: invoiceTotalNum,
      });
    }
  };

  // Validate receipt
  const handleValidate = async () => {
    if (!currentReceiptId) return;

    if (items.length === 0) {
      toast.error('Ajoutez au moins un article');
      return;
    }

    if (hasDiscrepancy) {
      setDiscrepancyDialogOpen(true);
      return;
    }

    try {
      await validateReceipt.mutateAsync(currentReceiptId);
      // Reset form
      setCurrentReceiptId(null);
      setSupplierName('');
      setSupplierId('');
      setInvoiceNumber('');
      setInvoiceTotal('');
      setNotes('');
      setItems([]);
    } catch (error) {
      console.error(error);
    }
  };

  // Force validate despite discrepancy
  const handleForceValidate = async () => {
    if (!currentReceiptId) return;

    try {
      await validateReceipt.mutateAsync(currentReceiptId);
      setDiscrepancyDialogOpen(false);
      // Reset form
      setCurrentReceiptId(null);
      setSupplierName('');
      setSupplierId('');
      setInvoiceNumber('');
      setInvoiceTotal('');
      setNotes('');
      setItems([]);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Entrée Fournisseur</h1>
          <p className="text-muted-foreground">Enregistrer une réception de marchandises</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Receipt Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Informations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Fournisseur *</Label>
              <Input
                placeholder="Nom du fournisseur"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                disabled={!!currentReceiptId}
              />
            </div>

            <div>
              <Label>N° Facture fournisseur</Label>
              <Input
                placeholder="FAC-2024-..."
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>

            <div>
              <Label>Total facture fournisseur (€)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={invoiceTotal}
                onChange={(e) => setInvoiceTotal(e.target.value)}
                onBlur={handleUpdateInvoiceTotal}
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                placeholder="Remarques..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {!currentReceiptId && (
              <Button 
                className="w-full" 
                onClick={handleStartReceipt}
                disabled={createReceipt.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer la réception
              </Button>
            )}

            {currentReceiptId && (
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total calculé:</span>
                  <span className="font-bold">{calculatedTotal.toFixed(2)} €</span>
                </div>
                {invoiceTotalNum > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Total facture:</span>
                      <span>{invoiceTotalNum.toFixed(2)} €</span>
                    </div>
                    <div className={`flex justify-between text-sm font-bold ${
                      hasDiscrepancy 
                        ? discrepancy > 0 ? 'text-red-500' : 'text-orange-500'
                        : 'text-green-500'
                    }`}>
                      <span>Écart:</span>
                      <span className="flex items-center gap-1">
                        {hasDiscrepancy ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        {discrepancy > 0 ? '+' : ''}{discrepancy.toFixed(2)} €
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Items */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Barcode className="h-5 w-5" />
                Articles ({items.length})
              </CardTitle>
              {currentReceiptId && (
                <Button onClick={() => setProductSearchOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter article
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {currentReceiptId 
                  ? 'Cliquez sur "Ajouter article" pour commencer'
                  : 'Créez d\'abord la réception'
                }
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead className="w-24 text-center">Qté</TableHead>
                      <TableHead className="w-32 text-right">P.A. Attendu</TableHead>
                      <TableHead className="w-32 text-right">P.A. Réel</TableHead>
                      <TableHead className="w-28 text-right">Total</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={item.id || index} className={item.has_price_change ? 'bg-yellow-50' : ''}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.product_name}</div>
                            {item.product_barcode && (
                              <div className="text-xs text-muted-foreground">{item.product_barcode}</div>
                            )}
                            {item.has_price_change && (
                              <Badge variant="outline" className="mt-1 text-xs text-yellow-600 border-yellow-300">
                                {item.actual_unit_cost > (item.expected_unit_cost || 0) ? (
                                  <><TrendingUp className="h-3 w-3 mr-1" /> +{((item.actual_unit_cost - (item.expected_unit_cost || 0)) / (item.expected_unit_cost || 1) * 100).toFixed(1)}%</>
                                ) : (
                                  <><TrendingDown className="h-3 w-3 mr-1" /> {((item.actual_unit_cost - (item.expected_unit_cost || 0)) / (item.expected_unit_cost || 1) * 100).toFixed(1)}%</>
                                )}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateQuantity(index, parseFloat(e.target.value) || 0)}
                            className="w-20 text-center"
                          />
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {item.expected_unit_cost?.toFixed(2) ?? '-'} €
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.actual_unit_cost}
                            onChange={(e) => handleUpdateCost(index, parseFloat(e.target.value) || 0)}
                            className={`w-24 text-right ${item.has_price_change ? 'border-yellow-400' : ''}`}
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.line_total.toFixed(2)} €
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}

            {/* Price changes summary */}
            {priceChanges.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {priceChanges.length} changement(s) de prix détecté(s)
                </h4>
                <p className="text-sm text-yellow-700">
                  Les prix d'achat seront mis à jour lors de la validation.
                </p>
              </div>
            )}

            {/* Actions */}
            {currentReceiptId && items.length > 0 && (
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <Button variant="outline" onClick={() => {
                  setCurrentReceiptId(null);
                  setSupplierName('');
                  setInvoiceNumber('');
                  setInvoiceTotal('');
                  setNotes('');
                  setItems([]);
                }}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleValidate}
                  disabled={validateReceipt.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <FileCheck className="h-4 w-4 mr-2" />
                  Valider la réception
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent receipts */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Réceptions récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Réception</TableHead>
                <TableHead>Fournisseur</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts?.slice(0, 10).map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell className="font-medium">{receipt.receipt_number}</TableCell>
                  <TableCell>{receipt.supplier_name}</TableCell>
                  <TableCell>{new Date(receipt.received_date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell className="text-right">{receipt.calculated_total.toFixed(2)} €</TableCell>
                  <TableCell>
                    <Badge variant={
                      receipt.status === 'validated' ? 'default' :
                      receipt.status === 'cancelled' ? 'destructive' : 'secondary'
                    }>
                      {receipt.status === 'validated' ? 'Validé' :
                       receipt.status === 'cancelled' ? 'Annulé' : 'Brouillon'}
                    </Badge>
                    {receipt.has_discrepancy && (
                      <Badge variant="outline" className="ml-2 text-yellow-600">
                        Écart
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(!receipts || receipts.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Aucune réception enregistrée
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Product Search Dialog */}
      <Dialog open={productSearchOpen} onOpenChange={setProductSearchOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Rechercher un produit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nom ou code-barres..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            <ScrollArea className="h-[300px]">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 hover:bg-muted rounded-lg cursor-pointer"
                  onClick={() => handleAddProduct(product)}
                >
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {product.barcode || 'Sans code-barres'} • Stock: {product.stock}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{product.price.toFixed(2)} €</div>
                    <div className="text-sm text-muted-foreground">
                      P.A.: {product.cost_price?.toFixed(2) || '-'} €
                    </div>
                  </div>
                </div>
              ))}
              {searchTerm && filteredProducts.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  Aucun produit trouvé
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discrepancy Dialog */}
      <Dialog open={discrepancyDialogOpen} onOpenChange={setDiscrepancyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              Écart détecté
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Il y a un écart de <strong>{Math.abs(discrepancy).toFixed(2)} €</strong> entre 
              le total calculé et le total de la facture fournisseur.
            </p>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Total calculé:</span>
                <span className="font-bold">{calculatedTotal.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between">
                <span>Total facture:</span>
                <span>{invoiceTotalNum.toFixed(2)} €</span>
              </div>
              <div className={`flex justify-between font-bold ${discrepancy > 0 ? 'text-red-500' : 'text-green-500'}`}>
                <span>Différence:</span>
                <span>{discrepancy > 0 ? '+' : ''}{discrepancy.toFixed(2)} €</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Vérifiez les quantités et les prix avant de continuer.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscrepancyDialogOpen(false)}>
              Vérifier
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleForceValidate}
              disabled={validateReceipt.isPending}
            >
              Valider quand même
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
