import { useState } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useSales } from '@/hooks/useSales';
import { Search, Receipt, CreditCard, Smartphone, Banknote } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

export default function MobileSales() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: sales, isLoading } = useSales();

  const filteredSales = sales?.filter(sale =>
    sale.sale_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.total.toString().includes(searchTerm)
  ) || [];

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Banknote className="h-3 w-3 sm:h-4 sm:w-4" />;
      case 'card':
        return <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />;
      case 'mobile':
        return <Smartphone className="h-3 w-3 sm:h-4 sm:w-4" />;
      default:
        return <Receipt className="h-3 w-3 sm:h-4 sm:w-4" />;
    }
  };

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Espèces';
      case 'card':
        return 'Carte';
      case 'mobile':
        return 'Mobile';
      default:
        return method;
    }
  };

  if (isLoading) {
    return (
      <MobileLayout title="Historique des ventes">
        <div className="p-3 sm:p-4 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Historique des ventes">
      <div className="p-3 sm:p-4">
        <div className="relative mb-3 sm:mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher par numéro ou montant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-sm sm:text-base"
          />
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-10rem)]">
        <div className="px-3 sm:px-4 space-y-2 sm:space-y-3 pb-20">
          {filteredSales.length === 0 ? (
            <Card className="p-8 text-center">
              <Receipt className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Aucune vente trouvée
              </p>
            </Card>
          ) : (
            filteredSales.map((sale) => (
              <Card key={sale.id} className="p-3 sm:p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-foreground">
                      Vente #{sale.sale_number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(sale.date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {sale.is_cancelled ? (
                    <Badge variant="destructive" className="text-xs">
                      Annulée
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      {getPaymentLabel(sale.payment_method)}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    {getPaymentIcon(sale.payment_method)}
                    <span>{sale.sale_items?.length || 0} article{(sale.sale_items?.length || 0) > 1 ? 's' : ''}</span>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-foreground">
                    {sale.total.toFixed(2)}€
                  </p>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </MobileLayout>
  );
}
