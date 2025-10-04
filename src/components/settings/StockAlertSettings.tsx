import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertTriangle, Bell, Mail } from 'lucide-react';

interface StockAlertConfig {
  enabled: boolean;
  globalThreshold: number;
  soundEnabled: boolean;
  emailEnabled: boolean;
  emailAddress?: string;
  checkFrequency: number; // en minutes
}

export function StockAlertSettings() {
  const [config, setConfig] = useState<StockAlertConfig>({
    enabled: true,
    globalThreshold: 10,
    soundEnabled: true,
    emailEnabled: false,
    checkFrequency: 60,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'stock_alert_config')
        .maybeSingle();

      if (data?.value) {
        setConfig(data.value as unknown as StockAlertConfig);
      }
    } catch (err) {
      console.error('Error loading stock alert config:', err);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'stock_alert_config',
          value: config as any,
        });

      if (error) throw error;

      toast.success('Configuration des alertes sauvegardée');
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Alertes de Stock
        </CardTitle>
        <CardDescription>
          Configurez les alertes automatiques pour les produits en rupture
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label>Activer les alertes de stock</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Recevoir des notifications pour les produits en stock faible
            </p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
          />
        </div>

        {config.enabled && (
          <>
            <div className="space-y-2">
              <Label>Seuil global par défaut</Label>
              <Input
                type="number"
                min="0"
                value={config.globalThreshold}
                onChange={(e) =>
                  setConfig({ ...config, globalThreshold: parseInt(e.target.value) || 0 })
                }
              />
              <p className="text-xs text-muted-foreground">
                Produits dont le stock est inférieur ou égal à cette valeur déclencheront une alerte
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label>Alerte sonore</Label>
                  <p className="text-xs text-muted-foreground">
                    Jouer un son lors d'une alerte
                  </p>
                </div>
              </div>
              <Switch
                checked={config.soundEnabled}
                onCheckedChange={(checked) => setConfig({ ...config, soundEnabled: checked })}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label>Notification par email</Label>
                    <p className="text-xs text-muted-foreground">
                      Envoyer un email quotidien récapitulatif
                    </p>
                  </div>
                </div>
                <Switch
                  checked={config.emailEnabled}
                  onCheckedChange={(checked) => setConfig({ ...config, emailEnabled: checked })}
                />
              </div>

              {config.emailEnabled && (
                <Input
                  type="email"
                  placeholder="email@exemple.com"
                  value={config.emailAddress || ''}
                  onChange={(e) => setConfig({ ...config, emailAddress: e.target.value })}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Fréquence de vérification (minutes)</Label>
              <Input
                type="number"
                min="5"
                max="1440"
                value={config.checkFrequency}
                onChange={(e) =>
                  setConfig({ ...config, checkFrequency: parseInt(e.target.value) || 60 })
                }
              />
              <p className="text-xs text-muted-foreground">
                À quelle fréquence vérifier les niveaux de stock (entre 5 et 1440 minutes)
              </p>
            </div>
          </>
        )}

        <Button onClick={handleSave} disabled={isLoading} className="w-full">
          {isLoading ? 'Enregistrement...' : 'Enregistrer la configuration'}
        </Button>
      </CardContent>
    </Card>
  );
}