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
  showFiscalNumber: boolean;
  footerText: string;
  ticketWidth: '58mm' | '80mm' | 'A4';
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  linesAfterFooter: number;
  logoPosition: 'left' | 'center' | 'right';
  logoSize: 'small' | 'medium' | 'large';
  showBarcode: boolean;
  barcodeFormat: 'EAN13' | 'Code128' | 'QR';
  autoPrint: boolean;
  numberOfCopies: number;
  showLineNumbers: boolean;
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
    showFiscalNumber: true,
    footerText: 'Merci de votre visite',
    ticketWidth: '80mm',
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 5,
    marginRight: 5,
    linesAfterFooter: 3,
    logoPosition: 'center',
    logoSize: 'medium',
    showBarcode: true,
    barcodeFormat: 'Code128',
    autoPrint: true,
    numberOfCopies: 1,
    showLineNumbers: false,
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

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Afficher le numéro fiscal</Label>
              <p className="text-xs text-muted-foreground">
                ⚠️ Requis pour la conformité fiscale belge
              </p>
            </div>
            <Switch
              checked={config.showFiscalNumber}
              onCheckedChange={(checked) => setConfig({ ...config, showFiscalNumber: checked })}
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

        {/* Options avancées */}
        <div className="pt-6 border-t space-y-4">
          <h3 className="font-semibold text-lg">Options avancées</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Largeur du ticket</Label>
              <Select value={config.ticketWidth} onValueChange={(value: any) => setConfig({ ...config, ticketWidth: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="58mm">58mm (petit)</SelectItem>
                  <SelectItem value="80mm">80mm (standard)</SelectItem>
                  <SelectItem value="A4">A4 (facture)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Position du logo</Label>
              <Select value={config.logoPosition} onValueChange={(value: any) => setConfig({ ...config, logoPosition: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Gauche</SelectItem>
                  <SelectItem value="center">Centre</SelectItem>
                  <SelectItem value="right">Droite</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Taille du logo</Label>
              <Select value={config.logoSize} onValueChange={(value: any) => setConfig({ ...config, logoSize: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Petit</SelectItem>
                  <SelectItem value="medium">Moyen</SelectItem>
                  <SelectItem value="large">Grand</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nombre de copies</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={config.numberOfCopies}
                onChange={(e) => setConfig({ ...config, numberOfCopies: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Marge haut (mm)</Label>
              <Input
                type="number"
                value={config.marginTop}
                onChange={(e) => setConfig({ ...config, marginTop: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Marge bas (mm)</Label>
              <Input
                type="number"
                value={config.marginBottom}
                onChange={(e) => setConfig({ ...config, marginBottom: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Marge gauche (mm)</Label>
              <Input
                type="number"
                value={config.marginLeft}
                onChange={(e) => setConfig({ ...config, marginLeft: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Marge droite (mm)</Label>
              <Input
                type="number"
                value={config.marginRight}
                onChange={(e) => setConfig({ ...config, marginRight: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label>Afficher code-barres sur ticket</Label>
            <Switch
              checked={config.showBarcode}
              onCheckedChange={(checked) => setConfig({ ...config, showBarcode: checked })}
            />
          </div>

          {config.showBarcode && (
            <div className="space-y-2">
              <Label>Format code-barres</Label>
              <Select value={config.barcodeFormat} onValueChange={(value: any) => setConfig({ ...config, barcodeFormat: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EAN13">EAN13</SelectItem>
                  <SelectItem value="Code128">Code128</SelectItem>
                  <SelectItem value="QR">QR Code</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label>Impression automatique après paiement</Label>
            <Switch
              checked={config.autoPrint}
              onCheckedChange={(checked) => setConfig({ ...config, autoPrint: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Numérotation des lignes</Label>
            <Switch
              checked={config.showLineNumbers}
              onCheckedChange={(checked) => setConfig({ ...config, showLineNumbers: checked })}
            />
          </div>
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
