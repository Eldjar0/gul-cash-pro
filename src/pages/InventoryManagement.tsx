import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Package, Truck, ShoppingBag, BarChart3 } from 'lucide-react';
import { ProductsManagement } from '@/components/inventory/ProductsManagement';
import { SuppliersManagement } from '@/components/inventory/SuppliersManagement';
import { BatchesTab } from '@/components/inventory/BatchesTab';
import { PurchaseOrdersTab } from '@/components/inventory/PurchaseOrdersTab';
import { InventoryCountsTab } from '@/components/inventory/InventoryCountsTab';
import { ExpiringBatchesAlert } from '@/components/inventory/ExpiringBatchesAlert';
import { useProducts } from '@/hooks/useProducts';
import { useSuppliers } from '@/hooks/useSuppliers';

export default function InventoryManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');
  const { data: products = [] } = useProducts();
  const { data: suppliers = [] } = useSuppliers();

  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= (p.min_stock || 0)).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-teal-900/20 dark:to-gray-900">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Gestion Inventaire
                </h1>
                <p className="text-sm text-muted-foreground">Produits, Stock & Fournisseurs</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card 
            className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 cursor-pointer hover:shadow-lg transition-all" 
            onClick={() => setActiveTab('products')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Produits</p>
                <p className="text-3xl font-bold mt-1">{products.length}</p>
                <p className="text-xs text-emerald-200 mt-2">articles actifs</p>
              </div>
              <ShoppingBag className="w-10 h-10 text-emerald-200" />
            </div>
          </Card>

          <Card 
            className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setActiveTab('products')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Alertes Stock</p>
                <p className="text-3xl font-bold mt-1">{lowStockCount + outOfStockCount}</p>
                <p className="text-xs text-orange-200 mt-2">{outOfStockCount} ruptures</p>
              </div>
              <BarChart3 className="w-10 h-10 text-orange-200" />
            </div>
          </Card>

          <Card 
            className="p-6 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white border-0 cursor-pointer hover:shadow-lg transition-all" 
            onClick={() => setActiveTab('stock')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-100 text-sm font-medium">Gestion Stock</p>
                <p className="text-3xl font-bold mt-1">---</p>
                <p className="text-xs text-cyan-200 mt-2">lots & commandes</p>
              </div>
              <Package className="w-10 h-10 text-cyan-200" />
            </div>
          </Card>

          <Card 
            className="p-6 bg-gradient-to-br from-teal-500 to-teal-600 text-white border-0 cursor-pointer hover:shadow-lg transition-all" 
            onClick={() => setActiveTab('suppliers')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm font-medium">Fournisseurs</p>
                <p className="text-3xl font-bold mt-1">{suppliers.filter(s => s.is_active).length}</p>
                <p className="text-xs text-teal-200 mt-2">actifs</p>
              </div>
              <Truck className="w-10 h-10 text-teal-200" />
            </div>
          </Card>
        </div>

        {/* Expiring Batches Alert */}
        <ExpiringBatchesAlert />

        {/* Tabs */}
        <Card className="overflow-hidden shadow-xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700">
              <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
                <TabsTrigger 
                  value="products" 
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 px-8 py-4 font-semibold"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Produits
                </TabsTrigger>
                <TabsTrigger 
                  value="stock" 
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 px-8 py-4 font-semibold"
                >
                  <Package className="w-5 h-5 mr-2" />
                  Stock & Inventaire
                </TabsTrigger>
                <TabsTrigger 
                  value="suppliers" 
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-teal-500 px-8 py-4 font-semibold"
                >
                  <Truck className="w-5 h-5 mr-2" />
                  Fournisseurs
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="products" className="mt-0">
                <ProductsManagement />
              </TabsContent>

              <TabsContent value="stock" className="mt-0 space-y-6">
                <Tabs defaultValue="batches">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="batches">Lots & Péremption</TabsTrigger>
                    <TabsTrigger value="purchase-orders">Commandes Fournisseurs</TabsTrigger>
                    <TabsTrigger value="counts">Inventaires Physiques</TabsTrigger>
                  </TabsList>

                  <TabsContent value="batches">
                    <BatchesTab />
                  </TabsContent>

                  <TabsContent value="purchase-orders">
                    <PurchaseOrdersTab />
                  </TabsContent>

                  <TabsContent value="counts">
                    <InventoryCountsTab />
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="suppliers" className="mt-0">
                <SuppliersManagement />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
