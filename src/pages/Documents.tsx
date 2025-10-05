import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Search,
  Eye,
  FileText,
  Calendar,
  Euro,
  User,
  Receipt,
  Trash2,
  Edit,
  Settings,
  ShoppingCart,
  Undo2,
  Download,
  Plus,
  Building2,
} from 'lucide-react';
import { useSales, useDeleteSalePermanently } from '@/hooks/useSales';
import { useRefunds, useDeleteRefund } from '@/hooks/useRefunds';
import { RefundDialog } from '@/components/pos/RefundDialog';
import { CustomerOrdersTab } from '@/components/orders/CustomerOrdersTab';
import { QuotesTab } from '@/components/orders/QuotesTab';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ThermalReceipt, printThermalReceipt } from '@/components/pos/ThermalReceipt';
import { EditSaleDialog } from '@/components/sales/EditSaleDialog';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { downloadInvoicePDF, previewInvoicePDF } from '@/utils/generateInvoicePDF';
import { useCompanySettings } from '@/hooks/useCompanySettings';

export default function Documents() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [refundSearchTerm, setRefundSearchTerm] = useState('');
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [devMode, setDevMode] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saleToEdit, setSaleToEdit] = useState<any>(null);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [deleteRefundDialogOpen, setDeleteRefundDialogOpen] = useState(false);
  const [refundToDelete, setRefundToDelete] = useState<string | null>(null);

  const { data: sales = [], isLoading } = useSales();
  const { data: refunds = [], isLoading: refundsLoading } = useRefunds();
  const deleteSale = useDeleteSalePermanently();
  const deleteRefund = useDeleteRefund();
  const { settings: companySettings } = useCompanySettings();

  // Activer le mode dev avec Ctrl+5 + code PIN
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '5') {
        e.preventDefault();
        if (devMode) {
          setDevMode(false);
          toast.success('Mode dev désactivé');
        } else {
          setShowPinDialog(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [devMode]);

  const handlePinSubmit = () => {
    if (pinInput === '3679') {
      setDevMode(true);
      setShowPinDialog(false);
      setPinInput('');
      console.log('⚠️ MODE DEV ACTIVÉ - ATTENTION: UTILISATION ILLÉGALE EN PRODUCTION');
      toast.error('MODE DEV ACTIVÉ - INTERDIT EN PRODUCTION');
    } else {
      toast.error('Code incorrect');
      setPinInput('');
    }
  };

  const handleDeleteClick = (saleId: string) => {
    setSaleToDelete(saleId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (saleToDelete) {
      deleteSale.mutate({ 
        saleId: saleToDelete, 
        reason: cancelReason || 'Aucune raison fournie' 
      });
      setDeleteDialogOpen(false);
      setSaleToDelete(null);
      setCancelReason('');
    }
  };

  const handleDeleteRefundClick = (refundId: string) => {
    setRefundToDelete(refundId);
    setDeleteRefundDialogOpen(true);
  };

  const handleDeleteRefundConfirm = () => {
    if (refundToDelete) {
      deleteRefund.mutate(refundToDelete);
      setDeleteRefundDialogOpen(false);
      setRefundToDelete(null);
    }
  };

  const filteredSales = sales.filter((sale) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      sale.sale_number?.toLowerCase().includes(searchLower) ||
      format(new Date(sale.date), 'dd/MM/yyyy').includes(searchLower)
    );
  });

  const filteredRefunds = refunds.filter((refund) =>
    refund.refund_number.toLowerCase().includes(refundSearchTerm.toLowerCase()) ||
    refund.reason.toLowerCase().includes(refundSearchTerm.toLowerCase()) ||
    refund.customers?.name?.toLowerCase().includes(refundSearchTerm.toLowerCase())
  );

  const invoices = useMemo(() => sales.filter(sale => sale.is_invoice), [sales]);
  
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const searchLower = invoiceSearchTerm.toLowerCase();
      return (
        invoice.sale_number?.toLowerCase().includes(searchLower) ||
        invoice.customers?.name?.toLowerCase().includes(searchLower) ||
        format(new Date(invoice.date), 'dd/MM/yyyy').includes(searchLower)
      );
    });
  }, [invoices, invoiceSearchTerm]);

  const todayRefunds = useMemo(() => {
    return refunds.filter((r) => {
      const refundDate = new Date(r.created_at);
      const today = new Date();
      return refundDate.toDateString() === today.toDateString();
    });
  }, [refunds]);

  const todayRefundsTotal = useMemo(() => {
    return todayRefunds.reduce((sum, r) => sum + r.total, 0);
  }, [todayRefunds]);

  const handleViewReceipt = (sale: any) => {
    const saleForReceipt = {
      ...sale,
      saleNumber: sale.sale_number,
      items: sale.sale_items?.map((item: any) => ({
        product: {
          name: item.product_name,
          price: item.unit_price,
          vat_rate: item.vat_rate,
          type: 'unit' as const,
        },
        quantity: item.quantity,
        discount: item.discount_type ? {
          type: item.discount_type as 'percentage' | 'amount',
          value: item.discount_value || 0,
        } : undefined,
        subtotal: item.subtotal,
        vatAmount: item.vat_amount,
        total: item.total,
      })) || [],
      subtotal: sale.subtotal,
      totalVat: sale.total_vat,
      totalDiscount: sale.total_discount,
      total: sale.total,
      paymentMethod: sale.payment_method,
      amountPaid: sale.amount_paid,
      change: sale.change_amount,
      is_invoice: sale.is_invoice,
    };

    setSelectedSale(saleForReceipt);
    setReceiptDialogOpen(true);
  };

  const handleViewInvoice = (sale: any) => {
    const invoiceData = {
      saleNumber: sale.sale_number,
      date: new Date(sale.date),
      company: {
        name: companySettings.name,
        address: companySettings.address,
        city: companySettings.city,
        postalCode: companySettings.postal_code,
        vatNumber: companySettings.vat_number,
        phone: companySettings.phone,
      },
      customer: sale.customers ? {
        name: sale.customers.name,
        vatNumber: sale.customers.vat_number,
        address: sale.customers.address,
        city: sale.customers.city,
        postalCode: sale.customers.postal_code,
      } : undefined,
      items: sale.sale_items?.map((item: any) => ({
        description: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        vatRate: item.vat_rate,
        subtotal: item.subtotal,
        vatAmount: item.vat_amount,
        total: item.total,
      })) || [],
      subtotal: sale.subtotal,
      totalVat: sale.total_vat,
      total: sale.total,
      notes: sale.notes,
    };
    previewInvoicePDF(invoiceData);
  };

  const handleDownloadInvoice = (sale: any) => {
    const invoiceData = {
      saleNumber: sale.sale_number,
      date: new Date(sale.date),
      company: {
        name: companySettings.name,
        address: companySettings.address,
        city: companySettings.city,
        postalCode: companySettings.postal_code,
        vatNumber: companySettings.vat_number,
        phone: companySettings.phone,
      },
      customer: sale.customers ? {
        name: sale.customers.name,
        vatNumber: sale.customers.vat_number,
        address: sale.customers.address,
        city: sale.customers.city,
        postalCode: sale.customers.postal_code,
      } : undefined,
      items: sale.sale_items?.map((item: any) => ({
        description: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        vatRate: item.vat_rate,
        subtotal: item.subtotal,
        vatAmount: item.vat_amount,
        total: item.total,
      })) || [],
      subtotal: sale.subtotal,
      totalVat: sale.total_vat,
      total: sale.total,
      notes: sale.notes,
    };
    downloadInvoicePDF(invoiceData);
  };

  const getTotalsByDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySales = sales.filter((sale) => {
      const saleDate = new Date(sale.date);
      saleDate.setHours(0, 0, 0, 0);
      return saleDate.getTime() === today.getTime() && !sale.is_cancelled;
    });

    const totalToday = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const countToday = todaySales.length;

    const activeSales = sales.filter((sale) => !sale.is_cancelled);
    const totalAll = activeSales.reduce((sum, sale) => sum + sale.total, 0);
    const countAll = activeSales.length;

    return { totalToday, countToday, totalAll, countAll };
  }, [sales]);

  const getInvoiceStats = useMemo(() => {
    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalHT = filteredInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
    const totalTVA = filteredInvoices.reduce((sum, inv) => sum + inv.total_vat, 0);
    const uniqueClients = new Set(filteredInvoices.filter(i => i.customer_id).map(i => i.customer_id)).size;
    return { totalAmount, totalHT, totalTVA, totalCount: filteredInvoices.length, uniqueClients };
  }, [filteredInvoices]);

  const { totalToday, countToday, totalAll, countAll } = getTotalsByDate;
  const { totalAmount, totalHT, totalTVA, totalCount, uniqueClients } = getInvoiceStats;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-glow border-b border-primary/20 px-4 md:px-6 py-3">
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/20 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg md:text-2xl font-bold text-white truncate">Documents</h1>
            <p className="text-xs md:text-sm text-white/80">Ventes, Factures, Commandes & Remboursements</p>
          </div>
          {devMode && (
            <div className="flex flex-col gap-1 shrink-0">
              <Badge variant="destructive" className="animate-pulse">
                <Settings className="h-3 w-3 mr-1" />
                MODE DEV - INTERDIT
              </Badge>
              <div className="text-[10px] text-destructive text-right">
                JLprod décline toute responsabilité
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
          <Card className="p-3 md:p-4 bg-white">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 md:p-3 bg-primary/10 rounded-lg shrink-0">
                <Euro className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-xs text-muted-foreground truncate">Total Aujourd'hui</p>
                <p className="text-sm md:text-xl font-bold text-primary truncate">{totalToday.toFixed(2)}€</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 md:p-4 bg-white">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 md:p-3 bg-accent/10 rounded-lg shrink-0">
                <Receipt className="h-4 w-4 md:h-5 md:w-5 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-xs text-muted-foreground truncate">Ventes Aujourd'hui</p>
                <p className="text-sm md:text-xl font-bold truncate">{countToday}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 md:p-4 bg-white">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 md:p-3 bg-category-blue/10 rounded-lg shrink-0">
                <FileText className="h-4 w-4 md:h-5 md:w-5 text-category-blue" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-xs text-muted-foreground truncate">Total Factures</p>
                <p className="text-sm md:text-xl font-bold truncate">{totalAmount.toFixed(2)}€</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 md:p-4 bg-white">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 md:p-3 bg-orange-500/10 rounded-lg shrink-0">
                <Undo2 className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-xs text-muted-foreground truncate">Remboursements</p>
                <p className="text-sm md:text-xl font-bold truncate">{todayRefunds.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="sales" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="sales" className="gap-2">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Ventes</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Factures</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Commandes</span>
            </TabsTrigger>
            <TabsTrigger value="quotes" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Devis</span>
            </TabsTrigger>
            <TabsTrigger value="refunds" className="gap-2">
              <Undo2 className="h-4 w-4" />
              <span className="hidden sm:inline">Remboursements</span>
            </TabsTrigger>
          </TabsList>

          {/* Onglet Ventes */}
          <TabsContent value="sales" className="space-y-4">
            <Card className="p-4 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par numéro ou date..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </Card>

            <Card className="bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <ScrollArea className="h-[calc(100vh-500px)]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Numéro</TableHead>
                        <TableHead className="min-w-[140px]">Date</TableHead>
                        <TableHead className="min-w-[100px]">Type</TableHead>
                        <TableHead className="min-w-[80px]">Articles</TableHead>
                        <TableHead className="min-w-[100px]">Paiement</TableHead>
                        <TableHead className="text-right min-w-[80px]">Total</TableHead>
                        <TableHead className="text-right min-w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSales.map((sale) => (
                        <TableRow key={sale.id} className={sale.is_cancelled ? 'bg-red-50 opacity-60' : ''}>
                          <TableCell className="font-mono font-semibold">
                            <div className="flex flex-col gap-1">
                              <span>{sale.sale_number}</span>
                              {sale.is_cancelled && (
                                <Badge variant="destructive" className="text-xs w-fit">ANNULÉE</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {format(new Date(sale.date), 'dd/MM/yyyy HH:mm', { locale: fr })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={sale.is_invoice ? 'default' : 'secondary'}>
                              {sale.is_invoice ? <><FileText className="h-3 w-3 mr-1" /> Facture</> : <><Receipt className="h-3 w-3 mr-1" /> Ticket</>}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {sale.sale_items?.length || 0} article{(sale.sale_items?.length || 0) > 1 ? 's' : ''}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm capitalize">
                              {sale.payment_method === 'cash' ? 'Espèces' : sale.payment_method === 'card' ? 'Carte' : 'Mobile'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-bold text-primary">
                            {sale.is_cancelled ? (
                              <span className="line-through text-muted-foreground">{sale.total.toFixed(2)}€</span>
                            ) : (
                              <span>{sale.total.toFixed(2)}€</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              {devMode && !sale.is_cancelled && (
                                <Button variant="ghost" size="sm" onClick={() => { setSaleToEdit(sale); setEditDialogOpen(true); }} className="h-8 text-orange-600">
                                  <Settings className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => handleViewReceipt(sale)} className="h-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(sale.id)} className="h-8 text-destructive" disabled={sale.is_cancelled}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredSales.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucune vente trouvée</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </Card>
          </TabsContent>

          {/* Onglet Factures */}
          <TabsContent value="invoices" className="space-y-4">
            <Card className="p-4 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par numéro de facture, client ou date..."
                  value={invoiceSearchTerm}
                  onChange={(e) => setInvoiceSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </Card>

            <Card className="bg-white overflow-hidden">
              <div className="p-6 border-b bg-gradient-to-r from-muted/30 to-muted/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-primary" />
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Liste des Factures</h2>
                      <p className="text-sm text-muted-foreground">{filteredInvoices.length} facture{filteredInvoices.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <Button onClick={() => navigate('/invoices/create')} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle Facture
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[calc(100vh-500px)]">
                <div className="p-6 space-y-3">
                  {filteredInvoices.map((invoice) => (
                    <Card key={invoice.id} className="p-5 border-2 hover:border-primary/30 hover:shadow-lg transition-all">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="font-mono text-base px-3 py-1">
                                {invoice.sale_number}
                              </Badge>
                              <Badge className="bg-primary/10 text-primary border-0">Facture</Badge>
                            </div>
                            
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                {format(new Date(invoice.date), 'dd MMMM yyyy', { locale: fr })}
                              </span>
                            </div>

                            {invoice.customers && (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-semibold text-foreground">{invoice.customers.name}</p>
                                  {invoice.customers.vat_number && (
                                    <p className="text-xs text-muted-foreground">TVA: {invoice.customers.vat_number}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="text-right space-y-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Total HT</p>
                              <p className="text-lg font-bold">{invoice.subtotal.toFixed(2)}€</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Total TTC</p>
                              <p className="text-2xl font-black text-primary">{invoice.total.toFixed(2)}€</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{invoice.sale_items?.length || 0} article{(invoice.sale_items?.length || 0) > 1 ? 's' : ''}</span>
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewInvoice(invoice)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir
                            </Button>
                            <Button size="sm" onClick={() => handleDownloadInvoice(invoice)}>
                              <Download className="h-4 w-4 mr-2" />
                              PDF
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {filteredInvoices.length === 0 && (
                    <div className="text-center py-16">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-xl font-semibold text-muted-foreground">Aucune facture trouvée</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* Onglet Commandes */}
          <TabsContent value="orders">
            <CustomerOrdersTab />
          </TabsContent>

          {/* Onglet Devis */}
          <TabsContent value="quotes">
            <QuotesTab />
          </TabsContent>

          {/* Onglet Remboursements */}
          <TabsContent value="refunds" className="space-y-4">
            <div className="flex justify-between items-center">
              <Card className="p-4 bg-white flex-1 mr-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un remboursement..."
                    value={refundSearchTerm}
                    onChange={(e) => setRefundSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </Card>
              <Button onClick={() => setRefundDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Remboursement
              </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-400px)]">
              <div className="space-y-3">
                {filteredRefunds.map((refund) => (
                  <Card key={refund.id} className="p-4 bg-white hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono">
                            {refund.refund_number}
                          </Badge>
                          <Badge variant="destructive">Remboursement</Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">
                            {format(new Date(refund.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                          </span>
                        </div>

                        {refund.customers && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{refund.customers.name}</span>
                          </div>
                        )}

                        <p className="text-sm text-muted-foreground">
                          Raison: {refund.reason}
                        </p>
                      </div>

                      <div className="text-right space-y-2">
                        <p className="text-2xl font-bold text-red-600">-{refund.total.toFixed(2)}€</p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteRefundClick(refund.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}

                {filteredRefunds.length === 0 && (
                  <Card className="p-12 bg-white text-center">
                    <Undo2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun remboursement trouvé</p>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ticket de vente</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <>
              <ThermalReceipt sale={selectedSale} />
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setReceiptDialogOpen(false)}>
                  Fermer
                </Button>
                <Button onClick={() => printThermalReceipt()}>
                  Imprimer
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler cette vente ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va marquer la vente comme annulée. Le montant sera déduit des totaux et un historique sera conservé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <label className="text-sm font-medium mb-2 block">Raison de l'annulation (obligatoire pour conformité légale)</label>
            <Input
              placeholder="Ex: Erreur de saisie, demande client..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={!cancelReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmer l'annulation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Code PIN Développeur</DialogTitle>
            <DialogDescription>
              Entrez le code PIN pour activer le mode développeur
            </DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            placeholder="Code PIN"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlePinSubmit();
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPinDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handlePinSubmit}>
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editDialogOpen && saleToEdit && (
        <EditSaleDialog
          sale={saleToEdit}
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setSaleToEdit(null);
          }}
        />
      )}

      <RefundDialog
        open={refundDialogOpen}
        onOpenChange={setRefundDialogOpen}
      />

      <AlertDialog open={deleteRefundDialogOpen} onOpenChange={setDeleteRefundDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce remboursement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le remboursement sera supprimé et le stock sera ajusté.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteRefundConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
