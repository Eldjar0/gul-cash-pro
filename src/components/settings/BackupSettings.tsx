import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFullExport } from '@/hooks/useFullExport';
import { Download, Database, Upload, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function BackupSettings() {
  const { exportFullData } = useFullExport();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleCreateBackup = async () => {
    setIsExporting(true);
    try {
      await exportFullData();
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('Aucun fichier sélectionné');
      return;
    }

    console.log('Fichier sélectionné:', file.name, file.size, 'bytes');
    
    // Reset input
    event.target.value = '';

    // Confirmation avant import
    const confirmed = window.confirm(
      '⚠️ ATTENTION: Cette action va ÉCRASER toutes les données existantes.\n\n' +
      'Voulez-vous vraiment continuer?'
    );

    if (!confirmed) {
      console.log('Import annulé par l\'utilisateur');
      return;
    }

    setIsImporting(true);
    
    try {
      console.log('Lecture du fichier...');
      const text = await file.text();
      console.log('Fichier lu, taille:', text.length, 'caractères');
      
      console.log('Parsing JSON...');
      const json = JSON.parse(text);
      console.log('JSON parsé, clés trouvées:', Object.keys(json));
      
      // Les données sont dans json.data
      const data = json.data || json;
      console.log('Données extraites, clés:', Object.keys(data));

      toast.info('🔄 Import en cours... Veuillez patienter', { duration: 10000 });

      let totalImported = 0;

      // Import catégories
      if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
        console.log(`Import de ${data.categories.length} catégories...`);
        const categories = data.categories.map((c: any) => ({
          id: c.id,
          name: c.name,
          color: c.color ?? '#3B82F6',
          icon: c.icon ?? null,
          display_order: c.display_order ?? 0,
          created_at: c.created_at,
          updated_at: c.updated_at,
        }));
        const { error } = await supabase.from('categories').upsert(categories, { onConflict: 'id' });
        if (error) {
          console.error('Erreur catégories:', error);
          throw new Error(`Catégories: ${error.message}`);
        }
        totalImported += categories.length;
        console.log(`✓ ${categories.length} catégories importées`);
      }

      // Import clients
      if (data.customers && Array.isArray(data.customers) && data.customers.length > 0) {
        console.log(`Import de ${data.customers.length} clients...`);
        const customers = data.customers.map((c: any) => ({
          id: c.id,
          loyalty_points: c.loyalty_points ?? 0,
          is_active: c.is_active ?? true,
          created_at: c.created_at,
          updated_at: c.updated_at,
          credit_blocked: c.credit_blocked ?? false,
          name: c.name,
          email: c.email ?? null,
          phone: c.phone ?? null,
          address: c.address ?? null,
          city: c.city ?? null,
          postal_code: c.postal_code ?? null,
          vat_number: c.vat_number ?? null,
          notes: c.notes ?? null,
        }));
        const { error } = await supabase.from('customers').upsert(customers, { onConflict: 'id' });
        if (error) {
          console.error('Erreur clients:', error);
          throw new Error(`Clients: ${error.message}`);
        }
        totalImported += customers.length;
        console.log(`✓ ${customers.length} clients importés`);
      }

      // Import produits
      if (data.products && Array.isArray(data.products) && data.products.length > 0) {
        console.log(`Import de ${data.products.length} produits...`);
        const products = data.products.map((p: any) => ({
          id: p.id,
          price: p.price,
          cost_price: p.cost_price ?? null,
          type: p.type ?? 'unit',
          category_id: p.category_id ?? p.category?.id ?? null,
          vat_rate: p.vat_rate ?? p.vatRate ?? 21,
          stock: p.stock ?? 0,
          min_stock: p.min_stock ?? 0,
          is_active: p.is_active ?? true,
          created_at: p.created_at,
          updated_at: p.updated_at,
          barcode: p.barcode ?? p.primary_barcode ?? null,
          name: p.name,
          description: p.description ?? null,
          supplier: p.supplier ?? null,
          image: p.image ?? null,
          unit: p.unit ?? 'unité',
        }));
        const { error } = await supabase.from('products').upsert(products, { onConflict: 'id' });
        if (error) {
          console.error('Erreur produits:', error);
          throw new Error(`Produits: ${error.message}`);
        }
        totalImported += products.length;
        console.log(`✓ ${products.length} produits importés`);
      }

      // Import ventes
      if (data.sales && Array.isArray(data.sales) && data.sales.length > 0) {
        console.log(`Import de ${data.sales.length} ventes...`);
        const sales = data.sales.map((s: any) => ({
          id: s.id,
          date: s.date ?? s.created_at,
          customer_id: s.customer_id ?? s.customer?.id ?? null,
          cashier_id: s.cashier_id ?? null,
          subtotal: s.subtotal,
          total_vat: s.total_vat ?? s.totalVat,
          total_discount: s.total_discount ?? 0,
          total: s.total,
          payment_method: s.payment_method ?? 'cash',
          amount_paid: s.amount_paid ?? null,
          change_amount: s.change_amount ?? 0,
          is_invoice: !!s.is_invoice,
          is_cancelled: !!s.is_cancelled,
          created_at: s.created_at,
          updated_at: s.updated_at,
          payment_methods: s.payment_methods ?? null,
          payment_split: s.payment_split ?? null,
          due_date: s.due_date ?? null,
          source: s.source ?? 'pos',
          sale_number: s.sale_number ?? s.number ?? null,
          notes: s.notes ?? null,
          invoice_status: s.invoice_status ?? (s.is_invoice ? 'brouillon' : 'brouillon'),
        }));
        const { error } = await supabase.from('sales').upsert(sales, { onConflict: 'id' });
        if (error) {
          console.error('Erreur ventes:', error);
          throw new Error(`Ventes: ${error.message}`);
        }
        totalImported += sales.length;
        console.log(`✓ ${sales.length} ventes importées`);
      }

      // Import articles de vente
      if (data.sale_items && Array.isArray(data.sale_items) && data.sale_items.length > 0) {
        console.log(`Import de ${data.sale_items.length} articles...`);
        const items = data.sale_items.map((i: any) => ({
          id: i.id,
          sale_id: i.sale_id ?? i.saleId,
          product_id: i.product_id ?? i.product?.id ?? null,
          product_name: i.product_name ?? i.product?.name,
          product_barcode: i.product_barcode ?? i.product?.barcode ?? null,
          quantity: i.quantity,
          unit_price: i.unit_price ?? i.unitPrice,
          original_price: i.original_price ?? i.originalPrice ?? i.unit_price ?? null,
          vat_rate: i.vat_rate ?? i.vatRate,
          discount_type: i.discount_type ?? i.discountType ?? null,
          discount_value: i.discount_value ?? i.discountValue ?? 0,
          subtotal: i.subtotal,
          vat_amount: i.vat_amount ?? i.vatAmount,
          total: i.total,
          created_at: i.created_at,
        }));
        const { error } = await supabase.from('sale_items').upsert(items, { onConflict: 'id' });
        if (error) {
          console.error('Erreur articles:', error);
          throw new Error(`Articles: ${error.message}`);
        }
        totalImported += items.length;
        console.log(`✓ ${items.length} articles importés`);
      }

      console.log(`Import terminé: ${totalImported} enregistrements au total`);
      
      if (totalImported === 0) {
        toast.warning('⚠️ Aucune donnée trouvée dans le fichier');
      } else {
        toast.success(`✅ ${totalImported} enregistrements importés avec succès`);
        setTimeout(() => window.location.reload(), 2000);
      }

    } catch (error: any) {
      console.error('Erreur complète:', error);
      toast.error(`❌ Erreur: ${error.message || 'Fichier invalide'}`, { duration: 5000 });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sauvegarde complète */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl text-white">
              <Database className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">Sauvegarde complète</CardTitle>
              <CardDescription>Téléchargez et réimportez toutes vos données</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 mb-6">
            <div className="p-4 bg-white/80 dark:bg-gray-800/80 rounded-lg border-2 border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-gradient-to-r from-purple-500 to-blue-500">Inclus</Badge>
                <span className="font-semibold">Données de vente</span>
              </div>
              <p className="text-sm text-muted-foreground ml-16">Tickets, factures, remboursements, historique complet</p>
            </div>
            
            <div className="p-4 bg-white/80 dark:bg-gray-800/80 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500">Inclus</Badge>
                <span className="font-semibold">Inventaire & Stock</span>
              </div>
              <p className="text-sm text-muted-foreground ml-16">Produits, catégories, mouvements de stock, lots</p>
            </div>
            
            <div className="p-4 bg-white/80 dark:bg-gray-800/80 rounded-lg border-2 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500">Inclus</Badge>
                <span className="font-semibold">Clients & Commandes</span>
              </div>
              <p className="text-sm text-muted-foreground ml-16">Base clients, commandes, devis, crédits</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleCreateBackup}
              disabled={isExporting}
              className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              size="lg"
            >
              <Download className="h-5 w-5 mr-2" />
              {isExporting ? 'Création en cours...' : 'Télécharger la sauvegarde (.JSON)'}
            </Button>

            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                disabled={isImporting}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="backup-import"
              />
              <Button
                variant="outline"
                disabled={isImporting}
                className="w-full h-14 text-lg border-2 border-purple-300 hover:bg-purple-50"
                size="lg"
                asChild
              >
                <label htmlFor="backup-import" className="cursor-pointer">
                  <Upload className="h-5 w-5 mr-2" />
                  {isImporting ? 'Importation en cours...' : 'Réimporter une sauvegarde'}
                </label>
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            💾 Format JSON avec horodatage pour une restauration complète
          </p>
        </CardContent>
      </Card>

      {/* Avertissement */}
      <Card className="border-orange-500/50 bg-orange-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-orange-500 mb-1">Important</p>
              <p className="text-muted-foreground">
                Les sauvegardes sont essentielles pour protéger vos données. Conservez toujours
                une copie en lieu sûr (disque externe, cloud). L'import d'une sauvegarde remplace
                TOUTES les données existantes de manière IRRÉVERSIBLE.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}