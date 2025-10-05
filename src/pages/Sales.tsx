import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search, Eye, Euro, Receipt, Trash2, TrendingUp, TrendingDown,
  CreditCard, Calendar, ShoppingBag, BarChart3, Clock
} from 'lucide-react';
import { useSales, useDeleteSalePermanently } from '@/hooks/useSales';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format, startOfHour, endOfHour, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ThermalReceipt, printThermalReceipt } from '@/components/pos/ThermalReceipt';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Sales() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const { data: sales = [], isLoading } = useSales();
  const deleteSale = useDeleteSalePermanently();

  // Stats calculations
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySales = sales.filter(s => {
      const saleDate = new Date(s.date);
      saleDate.setHours(0, 0, 0, 0);
      return saleDate.getTime() === today.getTime() && !s.is_cancelled;
    });
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdaySales = sales.filter(s => {
      const saleDate = new Date(s.date);
      saleDate.setHours(0, 0, 0, 0);
      return saleDate.getTime() === yesterday.getTime() && !s.is_cancelled;
    });
    
    const totalToday = todaySales.reduce((sum, s) => sum + s.total, 0);
    const countToday = todaySales.length;
    const avgBasket = countToday > 0 ? totalToday / countToday : 0;
    
    const totalYesterday = yesterdaySales.reduce((sum, s) => sum + s.total, 0);
    const countYesterday = yesterdaySales.length;
    
    const totalChange = totalYesterday > 0 ? ((totalToday - totalYesterday) / totalYesterday) * 100 : 0;
    const countChange = countYesterday > 0 ? ((countToday - countYesterday) / countYesterday) * 100 : 0;
    
    // Hourly sales
    const hourlySales = Array.from({ length: 24 }, (_, hour) => {
      const hourSales = todaySales.filter(s => {
        const saleDate = new Date(s.date);
        return saleDate.getHours() === hour;
      });
      return {
        hour: `${hour}h`,
        total: hourSales.reduce((sum, s) => sum + s.total, 0),
        count: hourSales.length
      };
    }).filter(h => h.count > 0);
    
    // Payment methods
    const paymentMethods = [
      { name: 'Espèces', value: todaySales.filter(s => s.payment_method === 'cash').length, color: '#10b981' },
      { name: 'Carte', value: todaySales.filter(s => s.payment_method === 'card').length, color: '#3b82f6' },
      { name: 'Mobile', value: todaySales.filter(s => s.payment_method === 'mobile').length, color: '#8b5cf6' },
    ].filter(p => p.value > 0);
    
    return {
      totalToday, countToday, avgBasket, totalChange, countChange,
      hourlySales, paymentMethods
    };
  }, [sales]);

  const filteredSales = sales.filter((sale) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      sale.sale_number?.toLowerCase().includes(searchLower) ||
      format(new Date(sale.date), 'dd/MM/yyyy').includes(searchLower)
    );
  });

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground font-medium">Chargement des ventes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <ShoppingBag className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-foreground">Historique Ventes</h1>
            <p className="text-muted-foreground text-lg">Activité du jour et statistiques</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 bg-gradient-to-br from-primary to-primary-glow text-white border-0 shadow-lg">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-white/80 text-sm font-medium">CA Aujourd'hui</p>
                <p className="text-3xl font-black">{stats.totalToday.toFixed(2)}€</p>
                <div className="flex items-center gap-1 text-white/80 text-sm">
                  {stats.totalChange >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>{Math.abs(stats.totalChange).toFixed(1)}% vs hier</span>
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <Euro className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-accent to-accent/80 text-white border-0 shadow-lg">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-white/80 text-sm font-medium">Ventes Aujourd'hui</p>
                <p className="text-3xl font-black">{stats.countToday}</p>
                <div className="flex items-center gap-1 text-white/80 text-sm">
                  {stats.countChange >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>{Math.abs(stats.countChange).toFixed(1)}% vs hier</span>
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <Receipt className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-category-orange to-category-orange/80 text-white border-0 shadow-lg">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-white/80 text-sm font-medium">Panier Moyen</p>
                <p className="text-3xl font-black">{stats.avgBasket.toFixed(2)}€</p>
                <p className="text-white/60 text-xs">Par transaction</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <BarChart3 className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-category-green to-category-green/80 text-white border-0 shadow-lg">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-white/80 text-sm font-medium">En Cours</p>
                <p className="text-3xl font-black">{stats.hourlySales.length > 0 ? stats.hourlySales[stats.hourlySales.length - 1].count : 0}</p>
                <p className="text-white/60 text-xs">Ventes cette heure</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hourly Sales Chart */}
          <Card className="lg:col-span-2 p-6 bg-white border-0 shadow-lg">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Ventes par Heure
            </h3>
            {stats.hourlySales.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={stats.hourlySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: 'hsl(var(--primary))' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Aucune vente aujourd'hui
              </div>
            )}
          </Card>

          {/* Payment Methods */}
          <Card className="p-6 bg-white border-0 shadow-lg">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Modes de Paiement
            </h3>
            {stats.paymentMethods.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={stats.paymentMethods}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.paymentMethods.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {stats.paymentMethods.map((method, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: method.color }} />
                        <span className="text-sm text-muted-foreground">{method.name}</span>
                      </div>
                      <span className="font-bold">{method.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Aucune donnée
              </div>
            )}
          </Card>
        </div>

        {/* Search */}
        <Card className="p-4 bg-white border-0 shadow-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher par numéro ou date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 text-base"
            />
          </div>
        </Card>

        {/* Sales Table */}
        <Card className="bg-white border-0 shadow-lg overflow-hidden">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Articles</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                        {sale.is_invoice ? 'Facture' : 'Ticket'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {sale.sale_items?.length || 0} article{(sale.sale_items?.length || 0) > 1 ? 's' : ''}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm capitalize">
                        {sale.payment_method === 'cash' ? 'Espèces' : 
                         sale.payment_method === 'card' ? 'Carte' : 'Mobile'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {sale.is_cancelled ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="line-through text-muted-foreground text-sm">
                            {sale.total.toFixed(2)}€
                          </span>
                          <span className="text-destructive font-black">0.00€</span>
                        </div>
                      ) : (
                        <span>{sale.total.toFixed(2)}€</span>
                      )}
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
                          onClick={() => {
                            setSaleToDelete(sale.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="h-8 text-destructive hover:bg-destructive/10"
                          disabled={sale.is_cancelled}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-sm bg-white p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-primary font-bold text-center">TICKET DE CAISSE</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            {selectedSale && <ThermalReceipt sale={selectedSale} />}
          </div>
          <div className="p-4 border-t flex gap-2">
            <Button
              variant="outline"
              onClick={() => setReceiptDialogOpen(false)}
              className="flex-1"
            >
              Fermer
            </Button>
            <Button
              onClick={() => {
                printThermalReceipt();
                setTimeout(() => setReceiptDialogOpen(false), 500);
              }}
              className="flex-1 bg-accent hover:bg-accent/90"
            >
              IMPRIMER
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette vente ?</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4">
                <p>Cette action est irréversible. La vente sera définitivement supprimée.</p>
                <Input
                  placeholder="Raison de la suppression (obligatoire)"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (saleToDelete) {
                  deleteSale.mutate({ 
                    saleId: saleToDelete, 
                    reason: cancelReason || 'Aucune raison fournie' 
                  });
                  setDeleteDialogOpen(false);
                  setSaleToDelete(null);
                  setCancelReason('');
                }
              }}
              disabled={!cancelReason.trim()}
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
