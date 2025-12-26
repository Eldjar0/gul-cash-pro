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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { 
  ArrowLeft, Plus, Trash2, Search, Package, AlertTriangle, 
  CheckCircle, TrendingUp, TrendingDown, Save, FileCheck, 
  Calculator, Barcode, Euro, Eye, Pencil, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useProducts, Product, useUpdateProduct } from '@/hooks/useProducts';
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
  useUpdateReceiptStatus,
  SupplierReceiptWithItems,
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
  needs_cost_input?: boolean;
  selling_price: number; // Current selling price (editable)
  original_selling_price: number; // Original price to detect changes
}

interface ProductToAdapt {
  product_id: string;
  product_name: string;
  current_price: number;
  cost_price: number;
  suggested_price: number;
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
  const updateStatus = useUpdateReceiptStatus();
  const updateProduct = useUpdateProduct();

  // State
  const [currentReceiptId, setCurrentReceiptId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false); // New: editing mode
  const [supplierName, setSupplierName] = useState('');
  const [supplierId, setSupplierId] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceTotal, setInvoiceTotal] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [discrepancyDialogOpen, setDiscrepancyDialogOpen] = useState(false);
  
  // Price adaptation dialog state
  const [priceAdaptDialogOpen, setPriceAdaptDialogOpen] = useState(false);
  const [productsToAdapt, setProductsToAdapt] = useState<ProductToAdapt[]>([]);
  
  // View receipt dialog
  const [viewReceiptId, setViewReceiptId] = useState<string | null>(null);
  const { data: viewReceiptDetails } = useSupplierReceiptDetails(viewReceiptId || undefined);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

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

  // Check for items missing cost price
  const itemsMissingCost = useMemo(() => 
    items.filter(item => item.actual_unit_cost <= 0),
    [items]
  );

  // Calculate margins for each item (using the item's selling_price field now)
  const itemsWithMargins = useMemo(() => {
    return items.map(item => {
      const margin = item.selling_price - item.actual_unit_cost;
      const marginPercent = item.actual_unit_cost > 0 
        ? (margin / item.actual_unit_cost) * 100 
        : 0;
      const isLoss = margin < 0 && item.actual_unit_cost > 0;
      const sellingPriceChanged = item.selling_price !== item.original_selling_price;
      return { ...item, margin, marginPercent, isLoss, sellingPriceChanged };
    });
  }, [items]);

  // Check for products that would be sold at a loss
  const productsAtLoss = useMemo(() => {
    return itemsWithMargins.filter(item => item.isLoss && item.product_id);
  }, [itemsWithMargins]);

  // Check for items with selling price changes
  const itemsWithPriceChanges = useMemo(() => 
    itemsWithMargins.filter(item => item.sellingPriceChanged),
    [itemsWithMargins]
  );

  // Pagination calculations
  const totalPages = Math.ceil((receipts?.length || 0) / ITEMS_PER_PAGE);
  const paginatedReceipts = useMemo(() => {
    if (!receipts) return [];
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return receipts.slice(start, start + ITEMS_PER_PAGE);
  }, [receipts, currentPage]);

  // Reset form
  const resetForm = () => {
    setCurrentReceiptId(null);
    setIsEditing(false);
    setSupplierName('');
    setSupplierId('');
    setInvoiceNumber('');
    setInvoiceTotal('');
    setNotes('');
    setItems([]);
  };

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

  // Load receipt for editing
  const handleLoadReceiptForEdit = (receipt: SupplierReceiptWithItems) => {
    setCurrentReceiptId(receipt.id);
    setIsEditing(true);
    setSupplierName(receipt.supplier_name);
    setSupplierId(receipt.supplier_id || '');
    setInvoiceNumber(receipt.supplier_invoice_number || '');
    setInvoiceTotal(receipt.supplier_invoice_total?.toString() || '');
    setNotes(receipt.notes || '');
    
    // Load items
    const loadedItems: ReceiptItem[] = receipt.items.map(item => {
      const product = products?.find(p => p.id === item.product_id);
      const needsCostInput = !item.expected_unit_cost && item.actual_unit_cost <= 0;
      const sellingPrice = product?.price || 0;
      
      return {
        id: item.id,
        product_id: item.product_id || undefined,
        product_name: item.product_name,
        product_barcode: item.product_barcode || undefined,
        quantity: item.quantity,
        expected_unit_cost: item.expected_unit_cost,
        actual_unit_cost: item.actual_unit_cost,
        line_total: item.quantity * item.actual_unit_cost,
        has_price_change: item.has_price_change || false,
        needs_cost_input: needsCostInput,
        selling_price: sellingPrice,
        original_selling_price: sellingPrice,
      };
    });
    
    setItems(loadedItems);
    setViewReceiptId(null); // Close view dialog
    toast.info('Réception chargée pour modification');
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

    const hasCostPrice = product.cost_price && product.cost_price > 0;
    const needsCostInput = !hasCostPrice;

    const newItem: ReceiptItem = {
      product_id: product.id,
      product_name: product.name,
      product_barcode: product.barcode || undefined,
      quantity: 1,
      expected_unit_cost: product.cost_price || null,
      actual_unit_cost: product.cost_price || 0,
      line_total: product.cost_price || 0,
      has_price_change: false,
      needs_cost_input: needsCostInput,
      selling_price: product.price,
      original_selling_price: product.price,
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
      
      if (needsCostInput) {
        toast.warning(`⚠️ Prix d'achat inconnu pour "${product.name}" - Saisissez le prix d'achat`);
      }
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
    const needsCostInput = cost <= 0;

    const updatedItems = [...items];
    updatedItems[index] = {
      ...item,
      actual_unit_cost: cost,
      line_total: newLineTotal,
      has_price_change: hasPriceChange,
      needs_cost_input: needsCostInput,
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

  // Update selling price (local state)
  const handleUpdateSellingPrice = (index: number, price: number) => {
    const item = items[index];
    if (!item || price < 0) return;

    const updatedItems = [...items];
    updatedItems[index] = {
      ...item,
      selling_price: price,
    };
    setItems(updatedItems);
  };

  // Check margins before validation
  const checkProductMargins = (): boolean => {
    const toAdapt = itemsWithMargins
      .filter(item => item.isLoss && item.product_id)
      .map(item => {
        // Suggest price with 20% margin
        const suggestedPrice = item.actual_unit_cost * 1.20;
        return {
          product_id: item.product_id!,
          product_name: item.product_name,
          current_price: item.selling_price,
          cost_price: item.actual_unit_cost,
          suggested_price: Math.ceil(suggestedPrice * 100) / 100, // Round up to cents
        };
      });

    if (toAdapt.length > 0) {
      setProductsToAdapt(toAdapt);
      setPriceAdaptDialogOpen(true);
      return false;
    }
    return true;
  };

  // Validate receipt
  const handleValidate = async () => {
    if (!currentReceiptId) return;

    if (items.length === 0) {
      toast.error('Ajoutez au moins un article');
      return;
    }

    // Check for missing cost prices
    if (itemsMissingCost.length > 0) {
      toast.error(`${itemsMissingCost.length} article(s) n'ont pas de prix d'achat. Veuillez les saisir.`);
      return;
    }

    // Check for discrepancy
    if (hasDiscrepancy) {
      setDiscrepancyDialogOpen(true);
      return;
    }

    // Check for products at loss
    if (!checkProductMargins()) {
      return;
    }

    // Save any selling price changes before validating
    await saveSellingPriceChanges();

    try {
      await validateReceipt.mutateAsync(currentReceiptId);
      resetForm();
    } catch (error) {
      console.error(error);
    }
  };

  // Save selling price changes to DB
  const saveSellingPriceChanges = async () => {
    const changedItems = items.filter(item => item.selling_price !== item.original_selling_price && item.product_id);
    for (const item of changedItems) {
      await updateProduct.mutateAsync({
        id: item.product_id!,
        price: item.selling_price,
      });
    }
    if (changedItems.length > 0) {
      toast.success(`${changedItems.length} prix de vente mis à jour en BDD`);
    }
  };

  // Force validate despite discrepancy
  const handleForceValidate = async () => {
    if (!currentReceiptId) return;

    setDiscrepancyDialogOpen(false);

    // Check for products at loss after discrepancy check
    if (!checkProductMargins()) {
      return;
    }

    // Save any selling price changes before validating
    await saveSellingPriceChanges();

    try {
      await validateReceipt.mutateAsync(currentReceiptId);
      resetForm();
    } catch (error) {
      console.error(error);
    }
  };

  // Validate with price update
  const handleValidateWithPriceUpdate = async () => {
    if (!currentReceiptId) return;

    try {
      // Update selling prices
      for (const prod of productsToAdapt) {
        await updateProduct.mutateAsync({
          id: prod.product_id,
          price: prod.suggested_price,
        });
      }

      toast.success(`${productsToAdapt.length} prix de vente mis à jour`);
      setPriceAdaptDialogOpen(false);
      
      await validateReceipt.mutateAsync(currentReceiptId);
      resetForm();
    } catch (error) {
      console.error(error);
    }
  };

  // Validate without price update
  const handleValidateWithoutPriceUpdate = async () => {
    if (!currentReceiptId) return;

    setPriceAdaptDialogOpen(false);
    
    try {
      await validateReceipt.mutateAsync(currentReceiptId);
      resetForm();
    } catch (error) {
      console.error(error);
    }
  };

  // Update suggested price in dialog
  const handleUpdateSuggestedPrice = (index: number, newPrice: number) => {
    const updated = [...productsToAdapt];
    updated[index].suggested_price = newPrice;
    setProductsToAdapt(updated);
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
          <p className="text-muted-foreground">
            {isEditing ? 'Modification d\'une réception' : 'Enregistrer une réception de marchandises'}
          </p>
        </div>
        {isEditing && (
          <Badge variant="outline" className="ml-2">
            <Pencil className="h-3 w-3 mr-1" />
            Mode édition
          </Badge>
        )}
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
                disabled={!!currentReceiptId && !isEditing}
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

                {/* Warnings summary */}
                {itemsMissingCost.length > 0 && (
                  <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {itemsMissingCost.length} article(s) sans prix d'achat
                    </p>
                  </div>
                )}
                
                {productsAtLoss.length > 0 && (
                  <div className="mt-2 p-2 bg-orange-50 rounded border border-orange-200">
                    <p className="text-xs text-orange-600 flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      {productsAtLoss.length} produit(s) vendus à perte
                    </p>
                  </div>
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
                    <TableRow className="bg-muted/50">
                      <TableHead>Produit</TableHead>
                      <TableHead className="w-16 text-center">Qté</TableHead>
                      <TableHead className="w-20 text-center text-green-700">Stock +</TableHead>
                      <TableHead className="w-24 text-right">P.A. Attendu</TableHead>
                      <TableHead className="w-24 text-right">Nouv. P.A.</TableHead>
                      <TableHead className="w-24 text-right">Total Achat</TableHead>
                      <TableHead className="w-24 text-right">Prix Vente</TableHead>
                      <TableHead className="w-24 text-right">Marge</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemsWithMargins.map((item, index) => (
                      <TableRow 
                        key={item.id || index} 
                        className={`${item.has_price_change ? 'bg-yellow-50' : ''} ${item.needs_cost_input ? 'bg-red-50' : ''} ${item.sellingPriceChanged ? 'bg-blue-50' : ''}`}
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{item.product_name}</div>
                            {item.product_barcode && (
                              <div className="text-xs text-muted-foreground">{item.product_barcode}</div>
                            )}
                            {/* Price change indicator */}
                            {item.has_price_change && (
                              <Badge 
                                className={`mt-1 text-xs ${
                                  item.actual_unit_cost > (item.expected_unit_cost || 0) 
                                    ? 'bg-red-100 text-red-700 border-red-300' 
                                    : 'bg-green-100 text-green-700 border-green-300'
                                }`}
                              >
                                {item.actual_unit_cost > (item.expected_unit_cost || 0) ? (
                                  <>
                                    <TrendingUp className="h-3 w-3 mr-1" /> 
                                    +{(item.actual_unit_cost - (item.expected_unit_cost || 0)).toFixed(2)}€
                                  </>
                                ) : (
                                  <>
                                    <TrendingDown className="h-3 w-3 mr-1" /> 
                                    {(item.actual_unit_cost - (item.expected_unit_cost || 0)).toFixed(2)}€
                                  </>
                                )}
                              </Badge>
                            )}
                            {/* Missing cost warning */}
                            {item.needs_cost_input && (
                              <Badge variant="destructive" className="mt-1 text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                P.A. requis
                              </Badge>
                            )}
                            {/* Selling price changed indicator */}
                            {item.sellingPriceChanged && (
                              <Badge className="mt-1 text-xs bg-blue-100 text-blue-700 border-blue-300">
                                <Pencil className="h-3 w-3 mr-1" />
                                P.V. modifié
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
                            className="w-14 text-center text-sm"
                          />
                        </TableCell>
                        {/* Stock addition indicator */}
                        <TableCell className="text-center">
                          <Badge className="bg-green-100 text-green-700 border-green-300 font-mono">
                            +{item.quantity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">
                          {item.expected_unit_cost?.toFixed(2) ?? (
                            <span className="text-orange-500 italic text-xs">?</span>
                          )} €
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.actual_unit_cost || ''}
                            onChange={(e) => handleUpdateCost(index, parseFloat(e.target.value) || 0)}
                            placeholder="P.A."
                            className={`w-20 text-right text-sm ${
                              item.needs_cost_input 
                                ? 'border-red-400 bg-red-50' 
                                : item.has_price_change 
                                  ? 'border-yellow-400' 
                                  : ''
                            }`}
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium text-sm">
                          {item.line_total.toFixed(2)} €
                        </TableCell>
                        {/* Selling price column - editable */}
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.selling_price || ''}
                            onChange={(e) => handleUpdateSellingPrice(index, parseFloat(e.target.value) || 0)}
                            placeholder="P.V."
                            className={`w-20 text-right text-sm ${
                              item.sellingPriceChanged 
                                ? 'border-blue-400 bg-blue-50' 
                                : item.isLoss 
                                  ? 'border-red-400 bg-red-50'
                                  : ''
                            }`}
                          />
                        </TableCell>
                        {/* Margin column */}
                        <TableCell className={`text-right text-xs ${
                          item.isLoss 
                            ? 'text-red-600 font-bold' 
                            : item.marginPercent < 10 
                              ? 'text-orange-500' 
                              : 'text-green-600'
                        }`}>
                          {item.actual_unit_cost > 0 ? (
                            <>
                              <div>{item.margin.toFixed(2)} €</div>
                              <div>
                                ({item.marginPercent.toFixed(0)}%)
                                {item.isLoss && ' ⚠️'}
                              </div>
                            </>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(index)}
                            className="text-destructive hover:text-destructive h-8 w-8"
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

            {/* Products at loss warning */}
            {productsAtLoss.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  {productsAtLoss.length} produit(s) vendus à perte !
                </h4>
                <p className="text-sm text-red-700">
                  Vous pourrez adapter les prix de vente lors de la validation.
                </p>
              </div>
            )}

            {/* Stock update summary */}
            {currentReceiptId && items.length > 0 && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Stock à ajouter lors de la validation
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded border text-sm">
                      <Badge className="bg-green-600 text-white">+{item.quantity}</Badge>
                      <span className="truncate">{item.product_name}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-green-700 mt-2">
                  Total : {items.reduce((sum, i) => sum + i.quantity, 0)} unités à ajouter au stock
                </p>
              </div>
            )}

            {/* Actions */}
            {currentReceiptId && items.length > 0 && (
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <Button variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleValidate}
                  disabled={validateReceipt.isPending || itemsMissingCost.length > 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <FileCheck className="h-4 w-4 mr-2" />
                  {isEditing ? 'Valider les modifications' : 'Valider la réception'}
                  <span className="ml-2 text-xs opacity-80">
                    (+{items.reduce((sum, i) => sum + i.quantity, 0)} stock)
                  </span>
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
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedReceipts.map((receipt) => (
                <TableRow 
                  key={receipt.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setViewReceiptId(receipt.id)}
                >
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
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {receipt.status === 'draft' && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Need to fetch details first
                            setViewReceiptId(receipt.id);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!receipts || receipts.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Aucune réception enregistrée
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={page === currentPage}
                        onClick={() => setCurrentPage(page)}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
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
                    <div className={`text-sm ${product.cost_price ? 'text-muted-foreground' : 'text-orange-500'}`}>
                      P.A.: {product.cost_price?.toFixed(2) || '⚠️ inconnu'} €
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

      {/* Price Adaptation Dialog */}
      <Dialog open={priceAdaptDialogOpen} onOpenChange={setPriceAdaptDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Produits vendus à perte détectés
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Les produits suivants seraient vendus à perte ou sans marge avec ce prix d'achat.
              Vous pouvez adapter leurs prix de vente pour garantir une marge.
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-right">P.A.</TableHead>
                  <TableHead className="text-right">Prix actuel</TableHead>
                  <TableHead className="text-right">Nouveau prix</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsToAdapt.map((prod, idx) => (
                  <TableRow key={prod.product_id}>
                    <TableCell className="font-medium">{prod.product_name}</TableCell>
                    <TableCell className="text-right">{prod.cost_price.toFixed(2)} €</TableCell>
                    <TableCell className="text-right text-red-600 line-through">
                      {prod.current_price.toFixed(2)} €
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        step="0.01"
                        min={prod.cost_price}
                        value={prod.suggested_price}
                        onChange={(e) => handleUpdateSuggestedPrice(idx, parseFloat(e.target.value) || 0)}
                        className="w-24 text-right"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="text-xs text-muted-foreground">
              💡 Les nouveaux prix suggérés incluent une marge de 20% sur le prix d'achat.
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={handleValidateWithoutPriceUpdate}
              disabled={validateReceipt.isPending}
            >
              Valider sans modifier les prix
            </Button>
            <Button 
              onClick={handleValidateWithPriceUpdate}
              disabled={validateReceipt.isPending || updateProduct.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Adapter les prix et valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Receipt Details Dialog */}
      <Dialog open={!!viewReceiptId} onOpenChange={(open) => !open && setViewReceiptId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Détails de la réception {viewReceiptDetails?.receipt_number}
            </DialogTitle>
          </DialogHeader>
          
          {viewReceiptDetails && (
            <div className="space-y-6">
              {/* Receipt info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Fournisseur</Label>
                  <p className="font-medium">{viewReceiptDetails.supplier_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date de réception</Label>
                  <p className="font-medium">
                    {new Date(viewReceiptDetails.received_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">N° Facture fournisseur</Label>
                  <p className="font-medium">{viewReceiptDetails.supplier_invoice_number || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Statut</Label>
                  <Select
                    value={viewReceiptDetails.status}
                    onValueChange={(value: 'draft' | 'validated' | 'cancelled') => {
                      updateStatus.mutate({ id: viewReceiptDetails.id, status: value });
                    }}
                    disabled={updateStatus.isPending}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="validated">Validé</SelectItem>
                      <SelectItem value="cancelled">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes */}
              {viewReceiptDetails.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="text-sm">{viewReceiptDetails.notes}</p>
                </div>
              )}

              {/* Items table */}
              <div>
                <Label className="text-muted-foreground mb-2 block">Articles ({viewReceiptDetails.items.length})</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead className="text-center">Qté</TableHead>
                      <TableHead className="text-right">P.A.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewReceiptDetails.items.map((item) => (
                      <TableRow key={item.id} className={item.has_price_change ? 'bg-yellow-50' : ''}>
                        <TableCell>
                          <div className="font-medium">{item.product_name}</div>
                          {item.product_barcode && (
                            <div className="text-xs text-muted-foreground">{item.product_barcode}</div>
                          )}
                          {item.has_price_change && (
                            <Badge variant="outline" className="mt-1 text-xs text-yellow-600">
                              Prix modifié
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">{item.actual_unit_cost.toFixed(2)} €</TableCell>
                        <TableCell className="text-right font-medium">
                          {(item.quantity * item.actual_unit_cost).toFixed(2)} €
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Total calculé:</span>
                  <span className="font-bold">{viewReceiptDetails.calculated_total.toFixed(2)} €</span>
                </div>
                {viewReceiptDetails.supplier_invoice_total && (
                  <>
                    <div className="flex justify-between">
                      <span>Total facture:</span>
                      <span>{viewReceiptDetails.supplier_invoice_total.toFixed(2)} €</span>
                    </div>
                    <div className={`flex justify-between font-bold ${
                      viewReceiptDetails.has_discrepancy ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      <span>Écart:</span>
                      <span className="flex items-center gap-1">
                        {viewReceiptDetails.has_discrepancy ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        {(viewReceiptDetails.calculated_total - viewReceiptDetails.supplier_invoice_total).toFixed(2)} €
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {viewReceiptDetails?.status === 'draft' && (
              <Button 
                variant="outline" 
                onClick={() => handleLoadReceiptForEdit(viewReceiptDetails)}
                className="w-full sm:w-auto"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Modifier cette réception
              </Button>
            )}
            <Button variant="outline" onClick={() => setViewReceiptId(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
