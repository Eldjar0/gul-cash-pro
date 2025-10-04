import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuotesTab } from '@/components/orders/QuotesTab';
import { CustomerOrdersTab } from '@/components/orders/CustomerOrdersTab';
import { OrdersStatsCards } from '@/components/orders/OrdersStatsCards';
import { FileText, ShoppingCart } from 'lucide-react';

const Orders = () => {
  return (
    <ProtectedLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Devis & Commandes Clients</h1>
          <p className="text-muted-foreground">
            Gestion des devis et suivi des commandes
          </p>
        </div>

        <OrdersStatsCards />

        <Tabs defaultValue="quotes" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quotes" className="gap-2">
              <FileText className="h-4 w-4" />
              Devis
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Commandes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quotes">
            <QuotesTab />
          </TabsContent>

          <TabsContent value="orders">
            <CustomerOrdersTab />
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedLayout>
  );
};

export default Orders;
