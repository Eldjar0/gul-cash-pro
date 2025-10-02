import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Building, Palette, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CompanySettings {
  name: string;
  address: string;
  city: string;
  postal_code: string;
  vat_number: string;
  phone: string;
  email: string;
}

interface DisplaySettings {
  welcome_text: string;
  thank_you_text: string;
  primary_color: string;
  secondary_color: string;
  text_color: string;
}

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: '',
    address: '',
    city: '',
    postal_code: '',
    vat_number: '',
    phone: '',
    email: '',
  });

  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
    welcome_text: 'Bienvenue',
    thank_you_text: 'Merci de votre visite !',
    primary_color: '#3B82F6',
    secondary_color: '#10B981',
    text_color: '#1F2937',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Charger les paramètres entreprise
      const { data: companyData } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'company_info')
        .single();

      if (companyData) {
        setCompanySettings(companyData.value as unknown as CompanySettings);
      }

      // Charger les paramètres d'affichage
      const { data: displayData } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'display_settings')
        .single();

      if (displayData) {
        setDisplaySettings(displayData.value as unknown as DisplaySettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCompanySettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'company_info',
          value: companySettings as any,
        });

      if (error) throw error;
      toast.success('Paramètres entreprise enregistrés');
    } catch (error) {
      console.error('Error saving company settings:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const saveDisplaySettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'display_settings',
          value: displaySettings as any,
        });

      if (error) throw error;
      toast.success('Paramètres d\'affichage enregistrés');
    } catch (error) {
      console.error('Error saving display settings:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-glow border-b border-primary/20 px-4 md:px-6 py-3">
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/20 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-white">Paramètres</h1>
            <p className="text-xs md:text-sm text-white/80">Configuration du système</p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <Tabs defaultValue="company" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="company">
              <Building className="h-4 w-4 mr-2" />
              Entreprise
            </TabsTrigger>
            <TabsTrigger value="display">
              <Palette className="h-4 w-4 mr-2" />
              Affichage Client
            </TabsTrigger>
          </TabsList>

          {/* Company Settings */}
          <TabsContent value="company">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Informations Entreprise</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="company_name">Nom de l'entreprise *</Label>
                  <Input
                    id="company_name"
                    value={companySettings.name}
                    onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                    placeholder="Mon Commerce"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Adresse *</Label>
                  <Input
                    id="address"
                    value={companySettings.address}
                    onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                    placeholder="123 Rue Example"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postal_code">Code postal *</Label>
                    <Input
                      id="postal_code"
                      value={companySettings.postal_code}
                      onChange={(e) => setCompanySettings({ ...companySettings, postal_code: e.target.value })}
                      placeholder="75001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Ville *</Label>
                    <Input
                      id="city"
                      value={companySettings.city}
                      onChange={(e) => setCompanySettings({ ...companySettings, city: e.target.value })}
                      placeholder="Paris"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="vat_number">Numéro de TVA</Label>
                  <Input
                    id="vat_number"
                    value={companySettings.vat_number}
                    onChange={(e) => setCompanySettings({ ...companySettings, vat_number: e.target.value })}
                    placeholder="FR12345678901"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={companySettings.phone}
                    onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={companySettings.email}
                    onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                    placeholder="contact@moncommerce.fr"
                  />
                </div>
              </div>
              <div className="mt-6">
                <Button onClick={saveCompanySettings} disabled={saving} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Display Settings */}
          <TabsContent value="display">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Paramètres d'Affichage Client</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="welcome_text">Texte de bienvenue</Label>
                  <Input
                    id="welcome_text"
                    value={displaySettings.welcome_text}
                    onChange={(e) => setDisplaySettings({ ...displaySettings, welcome_text: e.target.value })}
                    placeholder="Bienvenue"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Affiché sur l'écran client au démarrage
                  </p>
                </div>
                <div>
                  <Label htmlFor="thank_you_text">Texte de remerciement</Label>
                  <Input
                    id="thank_you_text"
                    value={displaySettings.thank_you_text}
                    onChange={(e) => setDisplaySettings({ ...displaySettings, thank_you_text: e.target.value })}
                    placeholder="Merci de votre visite !"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Affiché après validation du paiement
                  </p>
                </div>
                <div>
                  <Label htmlFor="primary_color">Couleur principale</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={displaySettings.primary_color}
                      onChange={(e) => setDisplaySettings({ ...displaySettings, primary_color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={displaySettings.primary_color}
                      onChange={(e) => setDisplaySettings({ ...displaySettings, primary_color: e.target.value })}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondary_color">Couleur secondaire</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={displaySettings.secondary_color}
                      onChange={(e) => setDisplaySettings({ ...displaySettings, secondary_color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={displaySettings.secondary_color}
                      onChange={(e) => setDisplaySettings({ ...displaySettings, secondary_color: e.target.value })}
                      placeholder="#10B981"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="text_color">Couleur du texte</Label>
                  <div className="flex gap-2">
                    <Input
                      id="text_color"
                      type="color"
                      value={displaySettings.text_color}
                      onChange={(e) => setDisplaySettings({ ...displaySettings, text_color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={displaySettings.text_color}
                      onChange={(e) => setDisplaySettings({ ...displaySettings, text_color: e.target.value })}
                      placeholder="#1F2937"
                      className="flex-1"
                    />
                  </div>
                </div>
                
                {/* Preview */}
                <div className="mt-6 p-6 rounded-lg border" style={{
                  backgroundColor: displaySettings.primary_color + '20',
                  borderColor: displaySettings.primary_color,
                }}>
                  <p className="text-center text-2xl font-bold mb-4" style={{ color: displaySettings.text_color }}>
                    {displaySettings.welcome_text}
                  </p>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center">
                      <span style={{ color: displaySettings.text_color }}>Produit exemple</span>
                      <span className="font-bold" style={{ color: displaySettings.secondary_color }}>
                        10.00€
                      </span>
                    </div>
                  </div>
                  <p className="text-center text-sm mt-4" style={{ color: displaySettings.text_color }}>
                    {displaySettings.thank_you_text}
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <Button onClick={saveDisplaySettings} disabled={saving} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
