import { useState, useEffect } from 'react';
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
  CreditCard,
  Receipt,
  Trash2,
  Edit,
  AlertTriangle,
  Settings,
  X,
  ShoppingCart,
  Undo2,
} from 'lucide-react';
import { useSales, useDeleteSalePermanently } from '@/hooks/useSales';
import { useRefunds } from '@/hooks/useRefunds';
import { RefundDialog } from '@/components/pos/RefundDialog';
import { CustomerOrdersTab } from '@/components/orders/CustomerOrdersTab';
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

export default function Sales() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [refundSearchTerm, setRefundSearchTerm] = useState('');
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

  const { data: sales = [], isLoading } = useSales();
  const { data: refunds = [], isLoading: refundsLoading } = useRefunds();
  const deleteSale = useDeleteSalePermanently();

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

  const todayRefunds = refunds.filter((r) => {
    const refundDate = new Date(r.created_at);
    const today = new Date();
    return refundDate.toDateString() === today.toDateString();
  });

  const todayRefundsTotal = todayRefunds.reduce((sum, r) => sum + r.total, 0);

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

    // Exclure les ventes annulées (conformité légale belge)
    const todaySales = sales.filter((sale) => {
      const saleDate = new Date(sale.date);
      saleDate.setHours(0, 0, 0, 0);
      return saleDate.getTime() === today.getTime() && !sale.is_cancelled;
    });

    const totalToday = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const countToday = todaySales.length;

    // Exclure également les ventes annulées du total général
    const activeSales = sales.filter((sale) => !sale.is_cancelled);
    const totalAll = activeSales.reduce((sum, sale) => sum + sale.total, 0);
    const countAll = activeSales.length;

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
        {/* Header - Simplified since navigation is in TopNavigation */}
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
              <h1 className="text-lg md:text-2xl font-bold text-white truncate">Gestion des Ventes</h1>
              <p className="text-xs md:text-sm text-white/80">Ventes, Commandes & Remboursements</p>
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
              <div className="p-2 md:p-3 bg-orange-500/10 rounded-lg shrink-0">
                <Undo2 className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-xs text-muted-foreground truncate">Remboursements</p>
                <p className="text-sm md:text-xl font-bold truncate">{todayRefunds.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 md:p-4 bg-white">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 md:p-3 bg-red-500/10 rounded-lg shrink-0">
                <Euro className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-xs text-muted-foreground truncate">Remboursé</p>
                <p className="text-sm md:text-xl font-bold text-red-600 truncate">{todayRefundsTotal.toFixed(2)}€</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="sales" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sales" className="gap-2">
              <Receipt className="h-4 w-4" />
              Ventes
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Commandes
            </TabsTrigger>
            <TabsTrigger value="refunds" className="gap-2">
              <Undo2 className="h-4 w-4" />
              Remboursements
            </TabsTrigger>
          </TabsList>

          {/* Onglet Ventes */}
          <TabsContent value="sales" className="space-y-4">
            {/* Search */}
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

            {/* Sales List */}
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

          {/* Onglet Commandes */}
          <TabsContent value="orders">
            <CustomerOrdersTab />
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
              <Button onClick={() => setRefundDialogOpen(true)} size="lg">
                <Undo2 className="h-5 w-5 mr-2" />
                Nouveau Remboursement
              </Button>
            </div>

            <Card className="bg-white">
              <ScrollArea className="h-[calc(100vh-500px)]">
                {refundsLoading ? (
                  <div className="p-12 text-center text-muted-foreground">Chargement...</div>
                ) : filteredRefunds.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">
                    <Undo2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun remboursement trouvé</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredRefunds.map((refund) => (
                      <div key={refund.id} className="p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex flex-col md:flex-row items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="font-semibold">{refund.refund_number}</h3>
                              <Badge variant={refund.refund_type === 'full' ? 'destructive' : 'secondary'}>
                                {refund.refund_type === 'full' ? 'Complet' : 'Partiel'}
                              </Badge>
                              <Badge variant="outline">{refund.payment_method}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              {format(new Date(refund.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                            </p>
                            {refund.customers && (
                              <p className="text-sm text-muted-foreground">Client: {refund.customers.name}</p>
                            )}
                            <p className="text-sm mt-2">
                              <span className="font-medium">Raison:</span> {refund.reason}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl md:text-2xl font-bold text-destructive">-{refund.total.toFixed(2)}€</p>
                            <p className="text-xs text-muted-foreground mt-1">dont TVA: {refund.total_vat.toFixed(2)}€</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>
          </TabsContent>
        </Tabs>
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
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        setDeleteDialogOpen(open);
        if (!open) setCancelReason('');
      }}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive text-xl">
              <Trash2 className="h-6 w-6" />
              Supprimer définitivement cette vente
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 pt-4">
              <div className="bg-amber-50 border-2 border-amber-500 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-amber-900">
                      ⚠️ AVERTISSEMENT IMPORTANT - RESPONSABILITÉ LÉGALE
                    </p>
                    <p className="text-xs text-amber-800">
                      Cette vente sera <strong>définitivement supprimée</strong> de la base de données et ne pourra pas être récupérée.
                    </p>
                    <p className="text-xs text-amber-800 font-semibold">
                      Cette action ne doit être effectuée que dans les cas suivants :
                    </p>
                    <ul className="text-xs text-amber-800 list-disc list-inside space-y-1 ml-2">
                      <li>Annulation par le client avec remboursement</li>
                      <li>Erreur de saisie majeure nécessitant une suppression</li>
                      <li>Produit retourné et remboursé intégralement</li>
                      <li>Autre raison légalement justifiable</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-red-900">
                      ⚖️ CLAUSE DE RESPONSABILITÉ
                    </p>
                    <p className="text-xs text-red-800 font-semibold">
                      En supprimant cette vente, vous confirmez que cette action est justifiée et conforme à la législation en vigueur.
                    </p>
                    <p className="text-xs text-red-800">
                      <strong>JLprod décline toute responsabilité</strong> concernant l'utilisation abusive de cette fonction de suppression. L'utilisateur est seul responsable du respect des obligations fiscales et comptables, notamment la conservation des documents pendant 7 ans conformément à la loi belge.
                    </p>
                    <p className="text-xs text-red-800 italic">
                      Note : La suppression volontaire de ventes pour dissimuler des revenus constitue une fraude fiscale passible de sanctions pénales.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="text-sm font-medium text-foreground">
                  Raison de la suppression (obligatoire pour traçabilité) :
                </label>
                <Input
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ex: Remboursement client après retour produit, erreur de caisse..."
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Cette raison sera enregistrée dans les logs système pour audit.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={!cancelReason.trim()}
              className="bg-destructive hover:bg-destructive/90"
            >
              Je comprends et je supprime définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Sale Dialog (DEV MODE) */}
      <EditSaleDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        sale={saleToEdit}
      />

      {/* Refund Dialog */}
      <RefundDialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen} />

      {/* PIN Dialog pour mode dev */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Settings className="h-5 w-5" />
              Code d'accès Mode Développement
            </DialogTitle>
            <DialogDescription className="text-destructive text-sm">
              ⚠️ ACCÈS RESTREINT - Entrez le code d'accès
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20 text-xs">
              <strong>Avertissement :</strong> Ce mode permet de modifier les données de vente, 
              ce qui est ILLÉGAL en production. JLprod décline toute responsabilité.
            </div>
            <Input
              type="password"
              placeholder="Code PIN"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
              className="text-center text-2xl tracking-widest"
              maxLength={4}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPinDialog(false);
                setPinInput('');
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handlePinSubmit}
            >
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
