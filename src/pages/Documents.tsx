import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LegalFooter } from '@/components/pos/LegalFooter';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
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
  RotateCcw,
  XCircle,
  Download,
  Plus,
  Building2,
  AlertCircle,
  CheckCircle,
  Clock,
  Smartphone,
  Package,
  Filter,
  FileDown,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useSales, useCancelSale, useRestoreSale } from '@/hooks/useSales';
import { useRefunds, useDeleteRefund } from '@/hooks/useRefunds';
import { useSavedCarts } from '@/hooks/useSavedCarts';
import { RefundDialog } from '@/components/pos/RefundDialog';
import { SavedCartsContent } from '@/components/orders/SavedCartsContent';
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
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InvoiceEditor } from '@/components/invoices/InvoiceEditor';
import { exportDocumentsToPDF } from '@/utils/exportDocumentsPDF';
import { exportToXML, exportToUBL, exportToCSV } from '@/utils/exportDocumentsXML';
import { ProductSalesReport } from '@/components/dashboard/ProductSalesReport';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, subDays } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQueryClient } from '@tanstack/react-query';

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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saleToEdit, setSaleToEdit] = useState<any>(null);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [deleteRefundDialogOpen, setDeleteRefundDialogOpen] = useState(false);
  const [refundToDelete, setRefundToDelete] = useState<string | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [invoiceToUpdate, setInvoiceToUpdate] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [invoiceEditorOpen, setInvoiceEditorOpen] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | undefined>(undefined);
  const [cancelReasonDialogOpen, setCancelReasonDialogOpen] = useState(false);
  const [cancelReasonToShow, setCancelReasonToShow] = useState<string>('');
  
  // Mode sélection pour créer une facture
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  
  // Pagination et filtres
  const [salesPage, setSalesPage] = useState(1);
  const [invoicesPage, setInvoicesPage] = useState(1);
  const [refundsPage, setRefundsPage] = useState(1);
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const itemsPerPage = 10;

  const { data: sales = [], isLoading } = useSales();
  const { data: refunds = [], isLoading: refundsLoading } = useRefunds();
  const cancelSale = useCancelSale();
  const restoreSale = useRestoreSale();
  const deleteRefund = useDeleteRefund();
  const { settings: companySettings } = useCompanySettings();
  const queryClient = useQueryClient();

  // Helper pour trouver les remboursements liés à une vente
  const getRefundsForSale = (saleId: string) => {
    return refunds?.filter(refund => refund.original_sale_id === saleId) || [];
  };

  // Helper pour trouver la vente originale d'un remboursement
  const getSaleForRefund = (refundOriginalSaleId: string | null) => {
    if (!refundOriginalSaleId) return null;
    return sales?.find(sale => sale.id === refundOriginalSaleId) || null;
  };

  const handleCancelClick = (saleId: string) => {
    setSaleToDelete(saleId);

    setDeleteDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!saleToDelete) return;

    try {
      // Vérifier si c'est une facture en brouillon
      const saleData = sales?.find(s => s.id === saleToDelete);
      const isDraftInvoice = saleData?.is_invoice && saleData?.invoice_status === 'brouillon';

      if (isDraftInvoice) {
        // Supprimer complètement les factures en brouillon
        const { error } = await supabase
          .from('sales')
          .delete()
          .eq('id', saleToDelete);
        
        if (error) throw error;
        
        queryClient.invalidateQueries({ queryKey: ['sales'] });
        toast.success('Facture brouillon supprimée');
      } else {
        // Annuler les autres ventes (tickets et factures validées)
        cancelSale.mutate({ 
          saleId: saleToDelete, 
          reason: 'Annulation confirmée' 
        });
      }

      setDeleteDialogOpen(false);
      setSaleToDelete(null);
      setCancelReason('');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression de la facture');
    }
  };

  const handleRestoreClick = (saleId: string) => {
    restoreSale.mutate({ saleId });
  };

  const handleEditClick = (sale: any) => {
    // Vérifier si la vente peut être modifiée (uniquement jour J avant clôture)
    const saleDate = new Date(sale.date);
    const today = new Date();
    
    // Réinitialiser les heures pour comparer seulement les dates
    saleDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    if (saleDate.getTime() !== today.getTime()) {
      toast.error('Modification interdite', {
        description: '⚖️ Conformité Art. 315bis CIR92 : Les documents ne peuvent être modifiés qu\'avant la clôture du jour J',
      });
      return;
    }
    
    setSaleToEdit(sale);
    setEditDialogOpen(true);
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

  const handleStatusChange = (invoice: any, status: string) => {
    setInvoiceToUpdate(invoice);
    setNewStatus(status);
    setStatusDialogOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!invoiceToUpdate || !newStatus) return;

    try {
      const { error } = await supabase
        .from('sales')
        .update({ invoice_status: newStatus })
        .eq('id', invoiceToUpdate.id);

      if (error) throw error;

      toast.success('Statut de la facture mis à jour');
      setStatusDialogOpen(false);
      setInvoiceToUpdate(null);
      setNewStatus('');
      
      // Rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'brouillon':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Edit className="h-3 w-3 mr-1" />Brouillon</Badge>;
      case 'en_attente':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'paye':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Payé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canModifyInvoice = (status: string) => status === 'brouillon';
  const canDeleteInvoice = (status: string) => status === 'brouillon';

  // Fonction de filtrage par date
  const getDateRange = (filter: string): { start: Date; end: Date } | null => {
    const now = new Date();
    switch (filter) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'yesterday':
        return { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) };
      case 'week':
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'quarter':
        return { start: startOfQuarter(now), end: endOfQuarter(now) };
      case 'custom':
        if (customStartDate && customEndDate) {
          return { start: startOfDay(customStartDate), end: endOfDay(customEndDate) };
        }
        return null;
      default:
        return null;
    }
  };

  const filterByDate = (items: any[]) => {
    if (dateFilter === 'all') return items;
    const range = getDateRange(dateFilter);
    if (!range) return items;
    
    return items.filter(item => {
      const itemDate = new Date(item.date || item.created_at);
      return itemDate >= range.start && itemDate <= range.end;
    });
  };

  const filteredSales = useMemo(() => {
    let filtered = sales.filter((sale) => {
      // Exclure les factures des ventes (pour éviter les doublons)
      if (sale.is_invoice) return false;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        sale.sale_number?.toLowerCase().includes(searchLower) ||
        format(new Date(sale.date), 'dd/MM/yyyy').includes(searchLower)
      );
    });
    
    return filterByDate(filtered);
  }, [sales, searchTerm, dateFilter, customStartDate, customEndDate]);

  const filteredRefunds = useMemo(() => {
    const filtered = refunds.filter((refund) =>
      refund.refund_number.toLowerCase().includes(refundSearchTerm.toLowerCase()) ||
      refund.reason.toLowerCase().includes(refundSearchTerm.toLowerCase()) ||
      refund.customers?.name?.toLowerCase().includes(refundSearchTerm.toLowerCase())
    );
    return filterByDate(filtered);
  }, [refunds, refundSearchTerm, dateFilter, customStartDate, customEndDate]);

  const invoices = useMemo(() => sales.filter(sale => sale.is_invoice), [sales]);
  
  const filteredInvoices = useMemo(() => {
    let filtered = invoices.filter((invoice) => {
      const searchLower = invoiceSearchTerm.toLowerCase();
      return (
        invoice.sale_number?.toLowerCase().includes(searchLower) ||
        invoice.customers?.name?.toLowerCase().includes(searchLower) ||
        format(new Date(invoice.date), 'dd/MM/yyyy').includes(searchLower)
      );
    });
    return filterByDate(filtered);
  }, [invoices, invoiceSearchTerm, dateFilter, customStartDate, customEndDate]);

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

  // Calcul des totaux en déduisant les remboursements
  const todayTotalWithRefunds = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySalesFiltered = sales.filter(sale => {
      if (sale.is_invoice || sale.is_cancelled) return false;
      const saleDate = new Date(sale.date);
      saleDate.setHours(0, 0, 0, 0);
      return saleDate.getTime() === today.getTime();
    });
    
    const salesTotal = todaySalesFiltered.reduce((sum, s) => sum + s.total, 0);
    return salesTotal - todayRefundsTotal;
  }, [sales, todayRefundsTotal]);

  // Pagination
  const paginatedSales = useMemo(() => {
    const start = (salesPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredSales.slice(start, end);
  }, [filteredSales, salesPage]);

  const paginatedInvoices = useMemo(() => {
    const start = (invoicesPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredInvoices.slice(start, end);
  }, [filteredInvoices, invoicesPage]);

  const paginatedRefunds = useMemo(() => {
    const start = (refundsPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredRefunds.slice(start, end);
  }, [filteredRefunds, refundsPage]);

  const totalSalesPages = Math.ceil(filteredSales.length / itemsPerPage);
  const totalInvoicesPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const totalRefundsPages = Math.ceil(filteredRefunds.length / itemsPerPage);

  // Export PDF
  const handleExportSalesPDF = async () => {
    const range = getDateRange(dateFilter);
    await exportDocumentsToPDF({
      type: 'sales',
      documents: filteredSales,
      dateRange: range || undefined,
      companyInfo: {
        name: companySettings.name,
        address: companySettings.address,
        city: companySettings.city,
        postalCode: companySettings.postal_code,
        vatNumber: companySettings.vat_number,
      },
    });
    toast.success('Export PDF généré');
  };

  const handleExportInvoicesPDF = async () => {
    const range = getDateRange(dateFilter);
    await exportDocumentsToPDF({
      type: 'invoices',
      documents: filteredInvoices,
      dateRange: range || undefined,
      companyInfo: {
        name: companySettings.name,
        address: companySettings.address,
        city: companySettings.city,
        postalCode: companySettings.postal_code,
        vatNumber: companySettings.vat_number,
      },
    });
    toast.success('Export PDF généré');
  };

  const handleExportRefundsPDF = async () => {
    const range = getDateRange(dateFilter);
    await exportDocumentsToPDF({
      type: 'refunds',
      documents: filteredRefunds,
      dateRange: range || undefined,
      companyInfo: {
        name: companySettings.name,
        address: companySettings.address,
        city: companySettings.city,
        postalCode: companySettings.postal_code,
        vatNumber: companySettings.vat_number,
      },
    });
    toast.success('Export PDF généré');
  };

  // Exports XML, UBL, CSV
  const handleExportSalesXML = () => {
    const range = getDateRange(dateFilter);
    exportToXML({
      documents: filteredSales,
      type: 'sales',
      dateRange: range || undefined,
      companyInfo: {
        name: companySettings.name,
        address: companySettings.address,
        city: companySettings.city,
        postalCode: companySettings.postal_code,
        vatNumber: companySettings.vat_number,
      },
    });
    toast.success('Export XML généré');
  };

  const handleExportSalesCSV = () => {
    exportToCSV({
      documents: filteredSales,
      type: 'sales',
    });
    toast.success('Export CSV généré');
  };

  const handleExportInvoicesXML = () => {
    const range = getDateRange(dateFilter);
    exportToXML({
      documents: filteredInvoices,
      type: 'invoices',
      dateRange: range || undefined,
      companyInfo: {
        name: companySettings.name,
        address: companySettings.address,
        city: companySettings.city,
        postalCode: companySettings.postal_code,
        vatNumber: companySettings.vat_number,
      },
    });
    toast.success('Export XML généré');
  };

  const handleExportInvoicesUBL = () => {
    exportToUBL({
      documents: filteredInvoices,
      type: 'invoices',
      companyInfo: {
        name: companySettings.name,
        address: companySettings.address,
        city: companySettings.city,
        postalCode: companySettings.postal_code,
        vatNumber: companySettings.vat_number,
      },
    });
    toast.success('Export UBL généré');
  };

  const handleExportInvoicesCSV = () => {
    exportToCSV({
      documents: filteredInvoices,
      type: 'invoices',
    });
    toast.success('Export CSV généré');
  };

  const handleViewReceipt = (sale: any) => {
    const saleForReceipt = {
      ...sale,
      saleNumber: sale.sale_number,
      items: sale.sale_items?.map((item: any) => ({
        product: {
          name: item.product_name,
          price: item.unit_price, // Prix de base du produit
          vat_rate: item.vat_rate,
          type: 'unit' as const,
        },
        quantity: item.quantity,
        // Pas de custom_price car unit_price est déjà le prix correct
        discount: item.discount_type ? {
          type: item.discount_type as 'percentage' | 'amount',
          value: item.discount_value || 0,
        } : undefined,
        subtotal: item.subtotal,
        vatAmount: item.vat_amount,
        total: item.total,
        is_gift: item.total === 0, // Article offert si total = 0
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

  const handleViewInvoice = async (sale: any) => {
    const saleData = sale as any;
    
    // Charger les comptes bancaires depuis les settings
    const { data: settingsData } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'invoice_settings')
      .maybeSingle();
    
    const invoiceSettings = settingsData?.value as any;
    const bankAccounts = invoiceSettings?.bank_accounts || [];
    const isPaid = saleData.invoice_status === 'payée';
    
    const invoiceData = {
      saleNumber: sale.sale_number,
      date: new Date(sale.date),
      dueDate: saleData.due_date ? new Date(saleData.due_date) : undefined,
      structuredCommunication: saleData.structured_communication,
      isPaid,
      bankAccounts,
      company: {
        name: companySettings.name,
        address: companySettings.address,
        city: companySettings.city,
        postalCode: companySettings.postal_code,
        vatNumber: companySettings.vat_number,
        phone: companySettings.phone,
        email: companySettings.email,
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
    await previewInvoicePDF(invoiceData);
  };

  const handleDownloadInvoice = async (sale: any) => {
    const saleData = sale as any;
    
    // Charger les comptes bancaires depuis les settings
    const { data: settingsData } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'invoice_settings')
      .maybeSingle();
    
    const invoiceSettings = settingsData?.value as any;
    const bankAccounts = invoiceSettings?.bank_accounts || [];
    const isPaid = saleData.invoice_status === 'payée';
    
    const invoiceData = {
      saleNumber: sale.sale_number,
      date: new Date(sale.date),
      dueDate: saleData.due_date ? new Date(saleData.due_date) : undefined,
      structuredCommunication: saleData.structured_communication,
      isPaid,
      bankAccounts,
      company: {
        name: companySettings.name,
        address: companySettings.address,
        city: companySettings.city,
        postalCode: companySettings.postal_code,
        vatNumber: companySettings.vat_number,
        phone: companySettings.phone,
        email: companySettings.email,
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
    await downloadInvoicePDF(invoiceData);
  };

  // Gestion de la sélection de tickets pour créer une facture
  const handleToggleSelection = (saleId: string) => {
    setSelectedTickets(prev => 
      prev.includes(saleId) 
        ? prev.filter(id => id !== saleId)
        : [...prev, saleId]
    );
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedTickets([]);
  };

  const handleCreateInvoiceFromTickets = async () => {
    if (selectedTickets.length === 0) {
      toast.error('Veuillez sélectionner au moins un ticket');
      return;
    }

    // Récupérer toutes les ventes sélectionnées avec leurs items
    const { data: selectedSales, error } = await supabase
      .from('sales')
      .select('*, sale_items(*), customers(*)')
      .in('id', selectedTickets)
      .eq('is_invoice', false)
      .eq('is_cancelled', false);

    if (error || !selectedSales || selectedSales.length === 0) {
      toast.error('Erreur lors de la récupération des tickets');
      return;
    }

    // Vérifier que tous les tickets ont le même client ou pas de client
    const customerIds = selectedSales.map(s => s.customer_id).filter(Boolean);
    const uniqueCustomerIds = [...new Set(customerIds)];
    
    if (uniqueCustomerIds.length > 1) {
      toast.error('Les tickets sélectionnés doivent avoir le même client');
      return;
    }

    const customerId = uniqueCustomerIds[0] || null;

    try {
      // Générer un numéro de facture
      const { data: invoiceNumber, error: numberError } = await supabase.rpc('generate_sale_number', { 
        is_invoice_param: true 
      });

      if (numberError) throw numberError;

      // Calculer les totaux
      let subtotal = 0;
      let totalVat = 0;
      let total = 0;
      const allItems: any[] = [];

      selectedSales.forEach(sale => {
        subtotal += sale.subtotal;
        totalVat += sale.total_vat;
        total += sale.total;
        
        if (sale.sale_items) {
          allItems.push(...sale.sale_items);
        }
      });

      // Créer la facture
      const { data: invoice, error: invoiceError } = await supabase
        .from('sales')
        .insert({
          sale_number: invoiceNumber as string,
          customer_id: customerId as string | undefined,
          cashier_id: selectedSales[0].cashier_id as string | undefined,
          subtotal,
          total_vat: totalVat,
          total_discount: 0,
          total,
          payment_method: 'card' as const,
          is_invoice: true,
          invoice_status: 'brouillon',
          is_cancelled: false,
        } as any)
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Ajouter les items à la facture
      const invoiceItems = allItems.map(item => ({
        sale_id: invoice.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_barcode: item.product_barcode,
        quantity: item.quantity,
        unit_price: item.unit_price,
        vat_rate: item.vat_rate,
        discount_type: item.discount_type,
        discount_value: item.discount_value,
        subtotal: item.subtotal,
        vat_amount: item.vat_amount,
        total: item.total,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      toast.success(`Facture ${invoiceNumber} créée à partir de ${selectedTickets.length} ticket(s)`);
      
      // Réinitialiser la sélection
      setSelectionMode(false);
      setSelectedTickets([]);
      
      // Rafraîchir les données
      window.location.reload();
    } catch (error: any) {
      console.error('Erreur création facture:', error);
      toast.error('Erreur lors de la création de la facture');
    }
  };

  const getTotalsByDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filtrer uniquement les tickets (pas les factures) pour les statistiques de caisse
    const ticketsOnly = sales.filter(sale => !sale.is_invoice);

    const todaySales = ticketsOnly.filter((sale) => {
      const saleDate = new Date(sale.date);
      saleDate.setHours(0, 0, 0, 0);
      return saleDate.getTime() === today.getTime() && !sale.is_cancelled;
    });

    const totalToday = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const countToday = todaySales.length;

    const activeSales = ticketsOnly.filter((sale) => !sale.is_cancelled);
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-teal-900/20 dark:to-gray-900">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                  Documents
                </h1>
                <p className="text-sm text-muted-foreground">Ventes, Factures & Remboursements</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Total Aujourd'hui (Net)</p>
                <p className="text-3xl font-bold mt-1">{todayTotalWithRefunds.toFixed(2)}€</p>
                <p className="text-emerald-100 text-xs mt-1">Remb: -{todayRefundsTotal.toFixed(2)}€</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <Euro className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-teal-500 to-teal-600 text-white border-0 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm font-medium">Ventes Aujourd'hui</p>
                <p className="text-3xl font-bold mt-1">{countToday}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <Receipt className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white border-0 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-100 text-sm font-medium">Total Factures</p>
                <p className="text-3xl font-bold mt-1">{totalAmount.toFixed(2)}€</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Remboursements</p>
                <p className="text-3xl font-bold mt-1">{todayRefunds.length}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <Undo2 className="h-6 w-6" />
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
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Produits</span>
            </TabsTrigger>
            <TabsTrigger value="saved-carts" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Paniers</span>
            </TabsTrigger>
            <TabsTrigger value="refunds" className="gap-2">
              <Undo2 className="h-4 w-4" />
              <span className="hidden sm:inline">Remb.</span>
            </TabsTrigger>
          </TabsList>

          {/* Onglet Ventes */}
          <TabsContent value="sales" className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Note importante :</strong> Cet onglet affiche uniquement les tickets de caisse. Les factures sont dans l'onglet "Factures" pour éviter les doublons dans les déclarations.
              </AlertDescription>
            </Alert>

            {/* Filtres et Export */}
            <Card className="p-4 bg-white">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 flex gap-2">
                  {!selectionMode && (
                    <>
                      <Select value={dateFilter} onValueChange={(value) => { setDateFilter(value); setSalesPage(1); }}>
                        <SelectTrigger className="w-[200px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Période" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes les dates</SelectItem>
                          <SelectItem value="today">Aujourd'hui</SelectItem>
                          <SelectItem value="yesterday">Hier</SelectItem>
                          <SelectItem value="week">Cette semaine</SelectItem>
                          <SelectItem value="month">Ce mois</SelectItem>
                          <SelectItem value="quarter">Ce trimestre</SelectItem>
                          <SelectItem value="custom">Personnalisé</SelectItem>
                        </SelectContent>
                      </Select>
                    </>
                  )}
                  
                  {selectionMode && (
                    <div className="flex items-center gap-3 flex-1 bg-blue-50 p-3 rounded-lg border-2 border-blue-200">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-blue-900">
                        {selectedTickets.length} ticket(s) sélectionné(s)
                      </span>
                    </div>
                  )}
                  
                  {dateFilter === 'custom' && (
                    <>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customStartDate ? format(customStartDate, 'dd/MM/yyyy') : 'Date début'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent mode="single" selected={customStartDate} onSelect={setCustomStartDate} />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customEndDate ? format(customEndDate, 'dd/MM/yyyy') : 'Date fin'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent mode="single" selected={customEndDate} onSelect={setCustomEndDate} />
                        </PopoverContent>
                      </Popover>
                    </>
                  )}
                </div>
                
                {!selectionMode ? (
                  <>
                    <Button 
                      variant="default" 
                      onClick={() => setSelectionMode(true)}
                      className="gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                      <FileText className="h-4 w-4" />
                      Créer facture
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <FileDown className="h-4 w-4" />
                          Exporter
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 bg-background z-50">
                        <DropdownMenuLabel>Formats disponibles</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleExportSalesPDF}>
                          <FileDown className="h-4 w-4 mr-2" />
                          PDF (Art. 315bis CIR92)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportSalesXML}>
                          <FileDown className="h-4 w-4 mr-2" />
                          XML Standard
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportSalesCSV}>
                          <FileDown className="h-4 w-4 mr-2" />
                          CSV (Excel)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="default" 
                      onClick={handleCreateInvoiceFromTickets}
                      disabled={selectedTickets.length === 0}
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4" />
                      Générer facture ({selectedTickets.length})
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleCancelSelection}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Annuler
                    </Button>
                  </>
                )}
              </div>
            </Card>

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
                <ScrollArea className="h-[calc(100vh-600px)]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {selectionMode && <TableHead className="w-[50px]">Select</TableHead>}
                        <TableHead className="min-w-[120px]">Numéro</TableHead>
                        <TableHead className="min-w-[140px]">Date</TableHead>
                        <TableHead className="min-w-[100px]">Type</TableHead>
                        <TableHead className="min-w-[80px]">Articles</TableHead>
                        <TableHead className="min-w-[100px]">Paiement</TableHead>
                        <TableHead className="text-right min-w-[80px]">Total</TableHead>
                        {!selectionMode && <TableHead className="text-right min-w-[80px]">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedSales.map((sale) => (
                        <TableRow key={sale.id} className={sale.is_cancelled ? 'bg-red-50 opacity-60' : ''}>
                          {selectionMode && (
                            <TableCell>
                              <Checkbox
                                checked={selectedTickets.includes(sale.id)}
                                onCheckedChange={() => handleToggleSelection(sale.id)}
                                disabled={sale.is_cancelled}
                              />
                            </TableCell>
                          )}
                          <TableCell className="font-mono font-semibold">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span>{sale.sale_number}</span>
                                {(sale as any).source === 'mobile' && (
                                  <Badge variant="outline" className="gap-1 text-xs">
                                    <Smartphone className="h-3 w-3" />
                                    Mobile
                                  </Badge>
                                )}
                                {getRefundsForSale(sale.id).length > 0 && (
                                  <Badge variant="destructive" className="gap-1 text-xs">
                                    <Undo2 className="h-3 w-3" />
                                    Remboursée
                                  </Badge>
                                )}
                              </div>
                              {sale.is_cancelled && (
                                <div className="flex items-center gap-2">
                                  <Badge variant="destructive" className="text-xs font-black animate-pulse">
                                    ❌ ANNULÉE
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => {
                                      const reason = sale.notes?.replace('ANNULÉE: ', '') || 'Aucune raison spécifiée';
                                      setCancelReasonToShow(reason);
                                      setCancelReasonDialogOpen(true);
                                    }}
                                    title="Voir la raison d'annulation"
                                  >
                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
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
                          {!selectionMode && (
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Button variant="ghost" size="sm" onClick={() => handleViewReceipt(sale)} className="h-8" title="Voir le ticket">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {sale.is_cancelled ? (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleRestoreClick(sale.id)} 
                                    className="h-8 text-green-600 hover:text-green-700"
                                    title="Restaurer ce ticket"
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => handleEditClick(sale)} 
                                      className="h-8 text-blue-600 hover:text-blue-700"
                                      title="Modifier ce ticket"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => handleCancelClick(sale.id)} 
                                      className="h-8 text-orange-600 hover:text-orange-700"
                                      title="Annuler ce ticket"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                      {paginatedSales.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={selectionMode ? 8 : 7} className="text-center py-8 text-muted-foreground">Aucune vente trouvée</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </Card>

            {/* Pagination */}
            {totalSalesPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setSalesPage(Math.max(1, salesPage - 1))}
                        className={salesPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalSalesPages }, (_, i) => i + 1)
                      .filter(page => {
                        if (totalSalesPages <= 7) return true;
                        if (page === 1 || page === totalSalesPages) return true;
                        if (Math.abs(page - salesPage) <= 1) return true;
                        return false;
                      })
                      .map((page, idx, arr) => {
                        const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                        return (
                          <PaginationItem key={page}>
                            {showEllipsis && <span className="px-2">...</span>}
                            <PaginationLink
                              onClick={() => setSalesPage(page)}
                              isActive={page === salesPage}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setSalesPage(Math.min(totalSalesPages, salesPage + 1))}
                        className={salesPage === totalSalesPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                <div className="text-sm text-muted-foreground">
                  Page {salesPage} sur {totalSalesPages} ({filteredSales.length} tickets)
                </div>
              </div>
            )}
          </TabsContent>

          {/* Onglet Factures */}
          <TabsContent value="invoices" className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Note importante :</strong> Les factures sont gérées séparément des ventes de caisse pour éviter les doublons dans les déclarations fiscales.
              </AlertDescription>
            </Alert>

            {/* Filtres et Export */}
            <Card className="p-4 bg-white">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 flex gap-2">
                  <Select value={dateFilter} onValueChange={(value) => { setDateFilter(value); setInvoicesPage(1); }}>
                    <SelectTrigger className="w-[200px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Période" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les dates</SelectItem>
                      <SelectItem value="today">Aujourd'hui</SelectItem>
                      <SelectItem value="yesterday">Hier</SelectItem>
                      <SelectItem value="week">Cette semaine</SelectItem>
                      <SelectItem value="month">Ce mois</SelectItem>
                      <SelectItem value="quarter">Ce trimestre</SelectItem>
                      <SelectItem value="custom">Personnalisé</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {dateFilter === 'custom' && (
                    <>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customStartDate ? format(customStartDate, 'dd/MM/yyyy') : 'Date début'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent mode="single" selected={customStartDate} onSelect={setCustomStartDate} />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customEndDate ? format(customEndDate, 'dd/MM/yyyy') : 'Date fin'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent mode="single" selected={customEndDate} onSelect={setCustomEndDate} />
                        </PopoverContent>
                      </Popover>
                    </>
                  )}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <FileDown className="h-4 w-4" />
                      Exporter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-background z-50">
                    <DropdownMenuLabel>Formats disponibles</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleExportInvoicesPDF}>
                      <FileDown className="h-4 w-4 mr-2" />
                      PDF (Art. 315bis CIR92)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportInvoicesXML}>
                      <FileDown className="h-4 w-4 mr-2" />
                      XML Standard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportInvoicesUBL}>
                      <FileDown className="h-4 w-4 mr-2" />
                      UBL (Format belge)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportInvoicesCSV}>
                      <FileDown className="h-4 w-4 mr-2" />
                      CSV (Excel)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>

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
                  <Button onClick={() => { setEditingInvoiceId(undefined); setInvoiceEditorOpen(true); }} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle Facture
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <ScrollArea className="h-[calc(100vh-600px)]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Numéro</TableHead>
                        <TableHead className="min-w-[100px]">Statut</TableHead>
                        <TableHead className="min-w-[140px]">Date</TableHead>
                        <TableHead className="min-w-[150px]">Client</TableHead>
                        <TableHead className="min-w-[80px]">Articles</TableHead>
                        <TableHead className="text-right min-w-[100px]">Total HT</TableHead>
                        <TableHead className="text-right min-w-[100px]">Total TTC</TableHead>
                        <TableHead className="text-right min-w-[150px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono font-semibold">
                            {invoice.sale_number}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-2">
                              {getStatusBadge(invoice.invoice_status || 'paye')}
                              <Select
                                value={invoice.invoice_status || 'paye'}
                                onValueChange={(value) => handleStatusChange(invoice, value)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="brouillon">Brouillon</SelectItem>
                                  <SelectItem value="en_attente">En attente</SelectItem>
                                  <SelectItem value="paye">Payé</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {format(new Date(invoice.date), 'dd/MM/yyyy HH:mm', { locale: fr })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {invoice.customers ? (
                              <div>
                                <p className="font-medium">{invoice.customers.name}</p>
                                {invoice.customers.vat_number && (
                                  <p className="text-xs text-muted-foreground">TVA: {invoice.customers.vat_number}</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {invoice.sale_items?.length || 0} article{(invoice.sale_items?.length || 0) > 1 ? 's' : ''}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {invoice.subtotal.toFixed(2)}€
                          </TableCell>
                          <TableCell className="text-right font-bold text-primary">
                            {invoice.total.toFixed(2)}€
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleViewInvoice(invoice)} 
                                className="h-8"
                                title="Voir la facture"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDownloadInvoice(invoice)} 
                                className="h-8"
                                title="Télécharger la facture"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              {invoice.is_cancelled ? (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleRestoreClick(invoice.id)} 
                                  className="h-8 text-green-600 hover:text-green-700"
                                  title="Restaurer cette facture"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              ) : (
                                <>
                                  {canModifyInvoice(invoice.invoice_status) && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => handleEditClick(invoice)} 
                                      className="h-8 text-blue-600 hover:text-blue-700"
                                      title="Modifier cette facture"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {canDeleteInvoice(invoice.invoice_status) && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => handleCancelClick(invoice.id)} 
                                      className="h-8 text-orange-600 hover:text-orange-700"
                                      title="Annuler cette facture"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {paginatedInvoices.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            Aucune facture trouvée
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </Card>

            {/* Pagination */}
            {totalInvoicesPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setInvoicesPage(Math.max(1, invoicesPage - 1))}
                        className={invoicesPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalInvoicesPages }, (_, i) => i + 1)
                      .filter(page => {
                        if (totalInvoicesPages <= 7) return true;
                        if (page === 1 || page === totalInvoicesPages) return true;
                        if (Math.abs(page - invoicesPage) <= 1) return true;
                        return false;
                      })
                      .map((page, idx, arr) => {
                        const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                        return (
                          <PaginationItem key={page}>
                            {showEllipsis && <span className="px-2">...</span>}
                            <PaginationLink
                              onClick={() => setInvoicesPage(page)}
                              isActive={page === invoicesPage}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setInvoicesPage(Math.min(totalInvoicesPages, invoicesPage + 1))}
                        className={invoicesPage === totalInvoicesPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                <div className="text-sm text-muted-foreground">
                  Page {invoicesPage} sur {totalInvoicesPages} ({filteredInvoices.length} factures)
                </div>
              </div>
            )}

            {/* Avertissement facturation numérique 2026 */}
            <Alert variant="destructive" className="mt-6 border-orange-500 bg-orange-50 dark:bg-orange-950/20">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <AlertTitle className="text-orange-900 dark:text-orange-100 font-bold">
                ⚠️ Passage obligatoire à la facturation numérique - 1er janvier 2026
              </AlertTitle>
              <AlertDescription className="text-orange-800 dark:text-orange-200 space-y-2">
                <p className="font-semibold">
                  À partir du 1er janvier 2026, la Belgique impose la facturation électronique pour toutes les entreprises.
                </p>
                <p>
                  Les factures créées ici ne seront plus conformes et serviront uniquement d'<strong>archives et de consultation</strong>.
                </p>
                <p>
                  Vous devrez utiliser un logiciel de facturation certifié recommandé par votre comptable pour être en conformité légale.
                </p>
                <p className="text-sm">
                  <strong>Contact recommandé :</strong> Rapprochez-vous de votre comptable dès maintenant pour anticiper cette transition obligatoire.
                </p>
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Onglet Produits vendus */}
          <TabsContent value="products" className="space-y-4">
            {/* Filtres */}
            <Card className="p-4 bg-white">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 flex gap-2">
                  <Select value={dateFilter} onValueChange={(value) => { setDateFilter(value); }}>
                    <SelectTrigger className="w-[200px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Période" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les dates</SelectItem>
                      <SelectItem value="today">Aujourd'hui</SelectItem>
                      <SelectItem value="yesterday">Hier</SelectItem>
                      <SelectItem value="week">Cette semaine</SelectItem>
                      <SelectItem value="month">Ce mois</SelectItem>
                      <SelectItem value="quarter">Ce trimestre</SelectItem>
                      <SelectItem value="custom">Personnalisé</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {dateFilter === 'custom' && (
                    <>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customStartDate ? format(customStartDate, 'dd/MM/yyyy') : 'Date début'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent mode="single" selected={customStartDate} onSelect={setCustomStartDate} />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customEndDate ? format(customEndDate, 'dd/MM/yyyy') : 'Date fin'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent mode="single" selected={customEndDate} onSelect={setCustomEndDate} />
                        </PopoverContent>
                      </Popover>
                    </>
                  )}
                </div>
              </div>
            </Card>

            {/* Rapport produits vendus (tous documents) */}
            <ProductSalesReport 
              documents={[...filteredSales, ...filteredInvoices]}
              dateRange={getDateRange(dateFilter) || undefined}
              title="Produits vendus (Tous documents)"
            />
          </TabsContent>


          {/* Onglet Paniers Sauvegardés */}
          <TabsContent value="saved-carts" className="space-y-4">
            <Card>
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Paniers Sauvegardés</h2>
                <SavedCartsContent />
              </div>
            </Card>
          </TabsContent>

          {/* Onglet Remboursements */}
          <TabsContent value="refunds" className="space-y-4">
            {/* Filtres et Export */}
            <Card className="p-4 bg-white">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 flex gap-2">
                  <Select value={dateFilter} onValueChange={(value) => { setDateFilter(value); setRefundsPage(1); }}>
                    <SelectTrigger className="w-[200px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Période" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les dates</SelectItem>
                      <SelectItem value="today">Aujourd'hui</SelectItem>
                      <SelectItem value="yesterday">Hier</SelectItem>
                      <SelectItem value="week">Cette semaine</SelectItem>
                      <SelectItem value="month">Ce mois</SelectItem>
                      <SelectItem value="quarter">Ce trimestre</SelectItem>
                      <SelectItem value="custom">Personnalisé</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {dateFilter === 'custom' && (
                    <>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customStartDate ? format(customStartDate, 'dd/MM/yyyy') : 'Date début'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent mode="single" selected={customStartDate} onSelect={setCustomStartDate} />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customEndDate ? format(customEndDate, 'dd/MM/yyyy') : 'Date fin'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent mode="single" selected={customEndDate} onSelect={setCustomEndDate} />
                        </PopoverContent>
                      </Popover>
                    </>
                  )}
                </div>
                
                <Button onClick={handleExportRefundsPDF} variant="outline" className="gap-2">
                  <FileDown className="h-4 w-4" />
                  Exporter PDF (Art. 315bis CIR92)
                </Button>
              </div>
            </Card>

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

            <ScrollArea className="h-[calc(100vh-500px)]">
              <div className="space-y-3">
                {paginatedRefunds.map((refund) => (
                  <Card key={refund.id} className="p-4 bg-white hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge variant="outline" className="font-mono">
                            {refund.refund_number}
                          </Badge>
                          <Badge variant="destructive">Remboursement</Badge>
                          {refund.original_sale_id && getSaleForRefund(refund.original_sale_id) && (
                            <Badge variant="outline" className="gap-1">
                              <Receipt className="h-3 w-3" />
                              Vente: {getSaleForRefund(refund.original_sale_id)?.sale_number}
                            </Badge>
                          )}
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

                {paginatedRefunds.length === 0 && (
                  <Card className="p-12 bg-white text-center">
                    <Undo2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun remboursement trouvé</p>
                  </Card>
                )}
              </div>
            </ScrollArea>

            {/* Pagination */}
            {totalRefundsPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setRefundsPage(Math.max(1, refundsPage - 1))}
                        className={refundsPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalRefundsPages }, (_, i) => i + 1)
                      .filter(page => {
                        if (totalRefundsPages <= 7) return true;
                        if (page === 1 || page === totalRefundsPages) return true;
                        if (Math.abs(page - refundsPage) <= 1) return true;
                        return false;
                      })
                      .map((page, idx, arr) => {
                        const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                        return (
                          <PaginationItem key={page}>
                            {showEllipsis && <span className="px-2">...</span>}
                            <PaginationLink
                              onClick={() => setRefundsPage(page)}
                              isActive={page === refundsPage}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setRefundsPage(Math.min(totalRefundsPages, refundsPage + 1))}
                        className={refundsPage === totalRefundsPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                <div className="text-sm text-muted-foreground">
                  Page {refundsPage} sur {totalRefundsPages} ({filteredRefunds.length} remboursements)
                </div>
              </div>
            )}
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
            <AlertDialogTitle>
              {sales?.find(s => s.id === saleToDelete)?.is_invoice && 
               sales?.find(s => s.id === saleToDelete)?.invoice_status === 'brouillon' 
                ? 'Supprimer ?' 
                : 'Annuler ?'}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Oui
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le changement de statut</AlertDialogTitle>
            <AlertDialogDescription>
              {newStatus === 'brouillon' && 'La facture redeviendra modifiable et supprimable.'}
              {newStatus === 'en_attente' && 'La facture ne sera plus modifiable, seulement passable en "Payé".'}
              {newStatus === 'paye' && 'La facture sera marquée comme payée. Vous pourrez la repasser en "En attente" si nécessaire.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmStatusChange}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog raison d'annulation */}
      <Dialog open={cancelReasonDialogOpen} onOpenChange={setCancelReasonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Raison de l'annulation
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ticket annulé</AlertTitle>
              <AlertDescription className="mt-2 text-base">
                {cancelReasonToShow}
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button onClick={() => setCancelReasonDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InvoiceEditor
        open={invoiceEditorOpen} 
        onOpenChange={setInvoiceEditorOpen}
        invoiceId={editingInvoiceId}
      />
      
      {/* Footer légal */}
      <div className="container mx-auto px-6 pb-8">
        <LegalFooter />
      </div>
    </div>
  );
}
