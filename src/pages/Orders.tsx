import { useState } from 'react';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, ShoppingCart } from 'lucide-react';
import { QuotesTab } from '@/components/orders/QuotesTab';
import { CustomerOrdersTab } from '@/components/orders/CustomerOrdersTab';

const Orders = () => {
  const [activeTab, setActiveTab] = useState('quotes');

  return (
    <ProtectedLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Devis & Commandes</h1>
            <p className="text-muted-foreground">Gestion des devis et commandes clients</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quotes" className="gap-2">
              <FileText className="h-4 w-4" />
              Devis
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Commandes Clients
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quotes" className="space-y-4">
            <QuotesTab />
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <CustomerOrdersTab />
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedLayout>
  );
};

export default Orders;
