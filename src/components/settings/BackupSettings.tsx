import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useBackupConfig, useSaveBackupConfig, useCreateBackup, useExportCSV } from '@/hooks/useBackup';
import { Download, Database, FileText, Users, Package, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function BackupSettings() {
  const { data: config, isLoading } = useBackupConfig();
  const saveConfig = useSaveBackupConfig();
  const createBackup = useCreateBackup();
  const exportCSV = useExportCSV();

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
    await createBackup.mutateAsync();
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

      {/* Sauvegarde manuelle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Sauvegarde Manuelle
          </CardTitle>
          <CardDescription>
            Créez une sauvegarde complète maintenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleCreateBackup}
            disabled={createBackup.isPending}
            className="w-full"
            size="lg"
          >
            <Database className="h-5 w-5 mr-2" />
            {createBackup.isPending ? 'Création en cours...' : 'Créer une sauvegarde complète'}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Télécharge un fichier JSON avec toutes vos données (ventes, produits, clients, etc.)
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