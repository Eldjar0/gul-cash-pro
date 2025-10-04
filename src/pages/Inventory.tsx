import { useState } from 'react';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Package, Truck, ClipboardList, AlertTriangle } from 'lucide-react';
import { BatchesTab } from '@/components/inventory/BatchesTab';
import { PurchaseOrdersTab } from '@/components/inventory/PurchaseOrdersTab';
import { InventoryCountsTab } from '@/components/inventory/InventoryCountsTab';
import { ExpiringBatchesAlert } from '@/components/inventory/ExpiringBatchesAlert';

const Inventory = () => {
  const [activeTab, setActiveTab] = useState('batches');

  return (
    <ProtectedLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gestion d'Inventaire</h1>
            <p className="text-muted-foreground">Lots, commandes fournisseurs et inventaires</p>
          </div>
        </div>

        <ExpiringBatchesAlert />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="batches" className="gap-2">
              <Package className="h-4 w-4" />
              Lots & Péremption
            </TabsTrigger>
            <TabsTrigger value="purchase-orders" className="gap-2">
              <Truck className="h-4 w-4" />
              Commandes Fournisseurs
            </TabsTrigger>
            <TabsTrigger value="counts" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Inventaires Physiques
            </TabsTrigger>
          </TabsList>

          <TabsContent value="batches" className="space-y-4">
            <BatchesTab />
          </TabsContent>

          <TabsContent value="purchase-orders" className="space-y-4">
            <PurchaseOrdersTab />
          </TabsContent>

          <TabsContent value="counts" className="space-y-4">
            <InventoryCountsTab />
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedLayout>
  );
};

export default Inventory;
