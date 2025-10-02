import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Search,
  FileText,
  Calendar,
  Euro,
  User,
  Eye,
  Download,
} from 'lucide-react';
import { useSales } from '@/hooks/useSales';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ThermalReceipt, printThermalReceipt } from '@/components/pos/ThermalReceipt';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function Invoices() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);

  const { data: sales = [], isLoading } = useSales();

  // Filtrer uniquement les factures
  const invoices = sales.filter(sale => sale.is_invoice);

  const filteredInvoices = invoices.filter((invoice) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      invoice.sale_number?.toLowerCase().includes(searchLower) ||
      format(new Date(invoice.date), 'dd/MM/yyyy').includes(searchLower)
    );
  });

  const handleViewInvoice = (sale: any) => {
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
      customer: sale.customers ? {
        name: sale.customers.name,
        email: sale.customers.email,
        phone: sale.customers.phone,
        vat_number: sale.customers.vat_number,
      } : undefined,
    };

    setSelectedSale(saleForReceipt);
    setReceiptDialogOpen(true);
  };

  const getTotals = () => {
    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalCount = filteredInvoices.length;
    return { totalAmount, totalCount };
  };

  const { totalAmount, totalCount } = getTotals();

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
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold text-white truncate">Factures</h1>
            <p className="text-xs md:text-sm text-white/80">Gestion des factures clients</p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
          <Card className="p-3 md:p-4 bg-white">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 md:p-3 bg-primary/10 rounded-lg shrink-0">
                <FileText className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-xs text-muted-foreground truncate">Total Factures</p>
                <p className="text-sm md:text-xl font-bold text-primary truncate">{totalCount}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 md:p-4 bg-white">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 md:p-3 bg-accent/10 rounded-lg shrink-0">
                <Euro className="h-4 w-4 md:h-5 md:w-5 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-xs text-muted-foreground truncate">Montant Total</p>
                <p className="text-sm md:text-xl font-bold truncate">{totalAmount.toFixed(2)}€</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card className="p-4 bg-white mb-4">
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

        {/* Invoices Table */}
        <Card className="bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <ScrollArea className="h-[calc(100vh-400px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[140px]">N° Facture</TableHead>
                    <TableHead className="min-w-[140px]">Date</TableHead>
                    <TableHead className="min-w-[180px]">Client</TableHead>
                    <TableHead className="min-w-[80px]">Articles</TableHead>
                    <TableHead className="text-right min-w-[100px]">Total HT</TableHead>
                    <TableHead className="text-right min-w-[80px]">TVA</TableHead>
                    <TableHead className="text-right min-w-[100px]">Total TTC</TableHead>
                    <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono font-semibold">
                        {invoice.sale_number}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {format(new Date(invoice.date), 'dd/MM/yyyy', { locale: fr })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {invoice.customers && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{invoice.customers.name}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {invoice.sale_items?.length || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {invoice.subtotal.toFixed(2)}€
                      </TableCell>
                      <TableCell className="text-right">
                        {invoice.total_vat.toFixed(2)}€
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {invoice.total.toFixed(2)}€
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewInvoice(invoice)}
                            className="h-8"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredInvoices.length === 0 && (
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
      </div>

      {/* Invoice Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-sm bg-white border-2 border-primary p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-primary font-bold text-center">FACTURE</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            {selectedSale && <ThermalReceipt sale={selectedSale} />}
          </div>
          <div className="p-4 border-t bg-muted/30 flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setReceiptDialogOpen(false);
                setSelectedSale(null);
              }}
              className="flex-1 h-12 font-semibold"
            >
              Fermer
            </Button>
            <Button
              onClick={() => {
                printThermalReceipt();
                setTimeout(() => {
                  setReceiptDialogOpen(false);
                  setSelectedSale(null);
                }, 500);
              }}
              className="flex-1 h-12 bg-accent hover:bg-accent/90 text-white font-bold"
            >
              IMPRIMER
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
