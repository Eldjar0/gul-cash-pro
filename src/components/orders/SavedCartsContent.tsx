import { useSavedCarts, useDeleteSavedCart, useLoadCart } from '@/hooks/useSavedCarts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, ShoppingCart, Eye, Download } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';

export const SavedCartsContent = () => {
  const { data: savedCarts, isLoading } = useSavedCarts();
  const deleteCart = useDeleteSavedCart();
  const loadCart = useLoadCart();
  const [selectedCart, setSelectedCart] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const handleDelete = async (cartId: string) => {
    await deleteCart.mutateAsync(cartId);
  };

  const handleView = async (cartId: string) => {
    const cart = await loadCart.mutateAsync(cartId);
    setSelectedCart(cart);
    setIsViewDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Chargement des paniers...
      </div>
    );
  }

  if (!savedCarts || savedCarts.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Aucun panier sauvegardé</p>
        <p className="text-sm text-muted-foreground mt-2">
          Les paniers sauvegardés depuis la caisse apparaîtront ici
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom du panier</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Articles</TableHead>
            <TableHead className="text-right">Montant</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {savedCarts.map((cart) => (
            <TableRow key={cart.id}>
              <TableCell className="font-medium">
                {cart.cart_name || 'Sans nom'}
              </TableCell>
              <TableCell>{cart.customer_name || '-'}</TableCell>
              <TableCell>
                {format(new Date(cart.updated_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {cart.cart_data?.length || 0} article(s)
                </Badge>
              </TableCell>
              <TableCell className="text-right font-semibold">
                {cart.total_amount?.toFixed(2) || '0.00'} €
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleView(cart.id)}
                    title="Voir le détail"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir supprimer ce panier sauvegardé ?
                          Cette action est irréversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(cart.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Dialog pour voir les détails du panier */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Détails du panier</DialogTitle>
          </DialogHeader>
          {selectedCart && (
            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Nom:</span>
                  <p className="font-medium">{selectedCart.cart_name || 'Sans nom'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Client:</span>
                  <p className="font-medium">{selectedCart.customer_name || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <p className="font-medium">
                    {format(new Date(selectedCart.updated_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </p>
                </div>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead className="text-right">Qté</TableHead>
                      <TableHead className="text-right">Prix U.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCart.cart_data?.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{item.product?.name || item.name}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {(item.product?.price || item.price)?.toFixed(2)} €
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.total?.toFixed(2)} €
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">
                    {selectedCart.total_amount?.toFixed(2) || '0.00'} €
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
