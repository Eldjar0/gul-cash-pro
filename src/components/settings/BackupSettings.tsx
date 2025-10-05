import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useBackupConfig, useSaveBackupConfig, useExportCSV } from '@/hooks/useBackup';
import { useFullExport } from '@/hooks/useFullExport';
import { Download, Database, FileText, Users, Package, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function BackupSettings() {
  const { data: config, isLoading } = useBackupConfig();
  const saveConfig = useSaveBackupConfig();
  const { exportFullData } = useFullExport();
  const exportCSV = useExportCSV();
  const [isExporting, setIsExporting] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [retentionDays, setRetentionDays] = useState(30);

  useEffect(() => {
    if (config) {
      setEnabled(config.enabled);
      setFrequency(config.frequency);
      setRetentionDays(config.retentionDays);
    }
  }, [config]);

  const handleSave = async () => {
    await saveConfig.mutateAsync({
      enabled,
      frequency,
      retentionDays,
      lastBackup: config?.lastBackup,
    });
  };

  const handleCreateBackup = async () => {
    setIsExporting(true);
    try {
      await exportFullData();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration automatique */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Sauvegarde Automatique
          </CardTitle>
          <CardDescription>
            Configurez les sauvegardes automatiques de vos données
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Activer les sauvegardes automatiques</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Créer des sauvegardes régulières de la base de données
              </p>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          {enabled && (
            <>
              <div className="space-y-2">
                <Label>Fréquence</Label>
                <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Quotidienne</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Durée de conservation (jours)</Label>
                <Input
                  type="number"
                  min="7"
                  max="365"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(parseInt(e.target.value) || 30)}
                />
                <p className="text-xs text-muted-foreground">
                  Les sauvegardes plus anciennes seront automatiquement supprimées
                </p>
              </div>
            </>
          )}

          {config?.lastBackup && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Dernière sauvegarde:</span>
                <span className="font-medium">
                  {format(new Date(config.lastBackup), 'dd MMM yyyy à HH:mm', { locale: fr })}
                </span>
              </div>
            </div>
          )}

          <Button onClick={handleSave} disabled={saveConfig.isPending} className="w-full">
            {saveConfig.isPending ? 'Enregistrement...' : 'Enregistrer la configuration'}
          </Button>
        </CardContent>
      </Card>

      {/* Sauvegarde manuelle complète */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl text-white">
              <Database className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">Sauvegarde complète de la caisse</CardTitle>
              <CardDescription>Exportez TOUTES vos données: ventes, produits, clients, factures, tickets, historiques...</CardDescription>
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
            
            <div className="p-4 bg-white/80 dark:bg-gray-800/80 rounded-lg border-2 border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500">Inclus</Badge>
                <span className="font-semibold">Rapports & Comptabilité</span>
              </div>
              <p className="text-sm text-muted-foreground ml-16">Rapports journaliers, bons de commande, mouvements de caisse</p>
            </div>
          </div>

          <Button
            onClick={handleCreateBackup}
            disabled={isExporting}
            className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            size="lg"
          >
            <Download className="h-5 w-5 mr-2" />
            {isExporting ? 'Création en cours...' : 'Télécharger la sauvegarde complète (.JSON)'}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-4">
            💾 La sauvegarde sera téléchargée en format JSON avec horodatage
          </p>
        </CardContent>
      </Card>

      {/* Export CSV */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export CSV
          </CardTitle>
          <CardDescription>
            Exportez vos données au format CSV pour Excel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <Button
              variant="outline"
              onClick={() => exportCSV.mutate('sales')}
              disabled={exportCSV.isPending}
              className="w-full justify-start"
            >
              <FileText className="h-4 w-4 mr-2" />
              Exporter les ventes
            </Button>
            <Button
              variant="outline"
              onClick={() => exportCSV.mutate('products')}
              disabled={exportCSV.isPending}
              className="w-full justify-start"
            >
              <Package className="h-4 w-4 mr-2" />
              Exporter les produits
            </Button>
            <Button
              variant="outline"
              onClick={() => exportCSV.mutate('customers')}
              disabled={exportCSV.isPending}
              className="w-full justify-start"
            >
              <Users className="h-4 w-4 mr-2" />
              Exporter les clients
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Avertissement */}
      <Card className="border-orange-500/50 bg-orange-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Database className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-orange-500 mb-1">Important</p>
              <p className="text-muted-foreground">
                Les sauvegardes sont essentielles pour protéger vos données. Conservez toujours
                une copie de vos sauvegardes en lieu sûr (disque externe, cloud, etc.). En cas de
                problème technique, ces sauvegardes vous permettront de restaurer vos données.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}