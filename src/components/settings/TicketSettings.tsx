import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TicketConfig {
  fontFamily: string;
  fontSize: number;
  showLogo: boolean;
  showCompanyInfo: boolean;
  showVATDetails: boolean;
  showQRCode: boolean;
  footerText: string;
}

const FONTS = [
  { value: 'system-ui', label: 'Système' },
  { value: 'monospace', label: 'Monospace' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Courier New', label: 'Courier' },
  { value: 'Times New Roman', label: 'Times' }
];

export function TicketSettings() {
  const [config, setConfig] = useState<TicketConfig>({
    fontFamily: 'monospace',
    fontSize: 12,
    showLogo: true,
    showCompanyInfo: true,
    showVATDetails: true,
    showQRCode: false,
    footerText: 'Merci de votre visite'
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
        .eq('key', 'ticket_style')
        .maybeSingle();
      
      if (data?.value) {
        setConfig(data.value as unknown as TicketConfig);
      }
    } catch (err) {
      console.error('Erreur chargement:', err);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert([{
          key: 'ticket_style',
          value: config as any
        }]);

      if (error) throw error;
      
      toast.success('Style de ticket sauvegardé', {
        description: 'Les modifications seront appliquées aux prochains tickets'
      });
    } catch (err) {
      toast.error('Erreur', {
        description: err instanceof Error ? err.message : 'Impossible de sauvegarder'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Style des tickets</CardTitle>
        <CardDescription>
          Personnalisez l'apparence des tickets de caisse
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Police de caractères</Label>
            <Select value={config.fontFamily} onValueChange={(value) => setConfig({ ...config, fontFamily: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONTS.map(font => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Taille de police (px)</Label>
            <Input
              type="number"
              min="8"
              max="20"
              value={config.fontSize}
              onChange={(e) => setConfig({ ...config, fontSize: parseInt(e.target.value) || 12 })}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Afficher le logo</Label>
            <Switch
              checked={config.showLogo}
              onCheckedChange={(checked) => setConfig({ ...config, showLogo: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Afficher les infos société</Label>
            <Switch
              checked={config.showCompanyInfo}
              onCheckedChange={(checked) => setConfig({ ...config, showCompanyInfo: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Afficher le détail TVA</Label>
            <Switch
              checked={config.showVATDetails}
              onCheckedChange={(checked) => setConfig({ ...config, showVATDetails: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Afficher QR Code</Label>
            <Switch
              checked={config.showQRCode}
              onCheckedChange={(checked) => setConfig({ ...config, showQRCode: checked })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Texte de pied de page</Label>
          <Input
            value={config.footerText}
            onChange={(e) => setConfig({ ...config, footerText: e.target.value })}
            placeholder="Message de fin de ticket"
          />
        </div>

        <Button onClick={handleSave} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            'Sauvegarder le style'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
