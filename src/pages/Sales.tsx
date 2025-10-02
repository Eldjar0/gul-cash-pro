import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Search,
  Eye,
  FileText,
  Calendar,
  Euro,
  User,
  CreditCard,
  Receipt,
  Trash2,
  Edit,
} from 'lucide-react';
import { useSales, useDeleteSale } from '@/hooks/useSales';
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

export default function Sales() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);

  const { data: sales = [], isLoading } = useSales();
  const deleteSale = useDeleteSale();

  const handleDeleteClick = (saleId: string) => {
    setSaleToDelete(saleId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (saleToDelete) {
      deleteSale.mutate(saleToDelete);
      setDeleteDialogOpen(false);
      setSaleToDelete(null);
    }
  };

  const filteredSales = sales.filter((sale) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      sale.sale_number?.toLowerCase().includes(searchLower) ||
      format(new Date(sale.date), 'dd/MM/yyyy').includes(searchLower)
    );
  });

  const handleViewReceipt = (sale: any) => {
    // Transform sale data to match Receipt component format
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

  const getTotalsByDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySales = sales.filter((sale) => {
      const saleDate = new Date(sale.date);
      saleDate.setHours(0, 0, 0, 0);
      return saleDate.getTime() === today.getTime();
    });

    const totalToday = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const countToday = todaySales.length;

    const totalAll = sales.reduce((sum, sale) => sum + sale.total, 0);
    const countAll = sales.length;

    return { totalToday, countToday, totalAll, countAll };
  };

  const { totalToday, countToday, totalAll, countAll } = getTotalsByDate();

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
            <h1 className="text-lg md:text-2xl font-bold text-white truncate">Historique des Ventes</h1>
            <p className="text-xs md:text-sm text-white/80">Tickets et factures</p>
          </div>
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
              <div className="p-2 md:p-3 bg-primary/10 rounded-lg shrink-0">
                <Euro className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-xs text-muted-foreground truncate">Total Global</p>
                <p className="text-sm md:text-xl font-bold text-primary truncate">{totalAll.toFixed(2)}€</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 md:p-4 bg-white">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 md:p-3 bg-accent/10 rounded-lg shrink-0">
                <Receipt className="h-4 w-4 md:h-5 md:w-5 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-xs text-muted-foreground truncate">Total Ventes</p>
                <p className="text-sm md:text-xl font-bold truncate">{countAll}</p>
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

        {/* Sales List */}
        <Card className="bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <ScrollArea className="h-[calc(100vh-400px)]">
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
                  <TableRow key={sale.id}>
                    <TableCell className="font-mono font-semibold">
                      {sale.sale_number}
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
                        {sale.is_invoice ? (
                          <><FileText className="h-3 w-3 mr-1" /> Facture</>
                        ) : (
                          <><Receipt className="h-3 w-3 mr-1" /> Ticket</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {sale.sale_items?.length || 0} article{(sale.sale_items?.length || 0) > 1 ? 's' : ''}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm capitalize">
                          {sale.payment_method === 'cash' ? 'Espèces' : 
                           sale.payment_method === 'card' ? 'Carte' : 'Mobile'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {sale.total.toFixed(2)}€
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewReceipt(sale)}
                          className="h-8"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(sale.id)}
                          className="h-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucune vente trouvée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
          </div>
        </Card>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-sm bg-white border-2 border-primary p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-primary font-bold text-center">TICKET DE CAISSE</DialogTitle>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Cette vente sera définitivement supprimée de la base de données.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
