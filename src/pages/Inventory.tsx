import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Package, Truck, ClipboardList, AlertTriangle } from 'lucide-react';
import { PurchaseOrdersTab } from '@/components/inventory/PurchaseOrdersTab';
import { InventoryCountsTab } from '@/components/inventory/InventoryCountsTab';

const Inventory = () => {
  const [activeTab, setActiveTab] = useState('purchase-orders');

  return (
    <div className="container mx-auto py-4 md:py-6 space-y-4 md:space-y-6 px-3 md:px-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gestion d'Inventaire</h1>
            <p className="text-muted-foreground">Commandes fournisseurs et inventaires</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="purchase-orders" className="gap-2">
              <Truck className="h-4 w-4" />
              Commandes Fournisseurs
            </TabsTrigger>
            <TabsTrigger value="counts" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Inventaires Physiques
            </TabsTrigger>
          </TabsList>

          <TabsContent value="purchase-orders" className="space-y-4">
            <PurchaseOrdersTab />
          </TabsContent>

          <TabsContent value="counts" className="space-y-4">
            <InventoryCountsTab />
          </TabsContent>
      </Tabs>
    </div>
  );
};

export default Inventory;
