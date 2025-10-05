import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Building, Save, Plus, Trash2, Users, Info, MapPin, Phone, Mail, CreditCard, Image, Building2, User, FileText, Calculator, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FiscalSettings } from '@/components/settings/FiscalSettings';
import { BackupSettings } from '@/components/settings/BackupSettings';
import UserManagement from './UserManagement';
import ContactInfo from './ContactInfo';

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
}

interface InvoiceSettings {
  is_company: boolean;
  company_name?: string;
  first_name?: string;
  last_name?: string;
  headquarters_address: string;
  headquarters_city: string;
  headquarters_postal_code: string;
  store_address: string;
  store_city: string;
  store_postal_code: string;
  vat_number: string;
  phone: string;
  email: string;
  bank_accounts: BankAccount[];
  invoice_logo?: string;
}


export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState<InvoiceSettings>({
    is_company: true,
    company_name: '',
    first_name: '',
    last_name: '',
    headquarters_address: '',
    headquarters_city: '',
    headquarters_postal_code: '',
    store_address: '',
    store_city: '',
    store_postal_code: '',
    vat_number: '',
    phone: '',
    email: '',
    bank_accounts: [],
    invoice_logo: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Charger à la fois company_info et invoice_settings
      const [companyData, invoiceData] = await Promise.all([
        supabase.from('settings').select('*').eq('key', 'company_info').maybeSingle(),
        supabase.from('settings').select('*').eq('key', 'invoice_settings').maybeSingle(),
      ]);

      let loadedSettings = {
        is_company: true,
        company_name: '',
        first_name: '',
        last_name: '',
        headquarters_address: '',
        headquarters_city: '',
        headquarters_postal_code: '',
        store_address: '',
        store_city: '',
        store_postal_code: '',
        vat_number: '',
        phone: '',
        email: '',
        bank_accounts: [] as BankAccount[],
        invoice_logo: '',
      };

      // Charger les données de company_info en premier
      if (companyData.data?.value) {
        const companyInfo = companyData.data.value as any;
        loadedSettings.company_name = companyInfo.name || '';
        loadedSettings.headquarters_address = companyInfo.address || '';
        loadedSettings.headquarters_city = companyInfo.city || '';
        loadedSettings.headquarters_postal_code = companyInfo.postal_code || '';
        loadedSettings.store_address = companyInfo.address || '';
        loadedSettings.store_city = companyInfo.city || '';
        loadedSettings.store_postal_code = companyInfo.postal_code || '';
        loadedSettings.vat_number = companyInfo.vat_number || '';
        loadedSettings.phone = companyInfo.phone || '';
        loadedSettings.email = companyInfo.email || '';
      }

      // Puis écraser avec invoice_settings si existe
      if (invoiceData.data?.value) {
        const invoiceSettings = invoiceData.data.value as any;
        loadedSettings = { ...loadedSettings, ...invoiceSettings };
      }

      setSettings(loadedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .eq('key', 'invoice_settings')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('settings')
          .update({ value: settings as any })
          .eq('key', 'invoice_settings');
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('settings')
          .insert({
            key: 'invoice_settings',
            value: settings as any,
          });
        
        if (error) throw error;
      }

      toast.success('Paramètres enregistrés avec succès');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const addBankAccount = () => {
    setSettings({
      ...settings,
      bank_accounts: [
        ...settings.bank_accounts,
        { id: crypto.randomUUID(), bank_name: '', account_number: '' }
      ]
    });
  };

  const removeBankAccount = (id: string) => {
    setSettings({
      ...settings,
      bank_accounts: settings.bank_accounts.filter(acc => acc.id !== id)
    });
  };

  const updateBankAccount = (id: string, field: 'bank_name' | 'account_number', value: string) => {
    setSettings({
      ...settings,
      bank_accounts: settings.bank_accounts.map(acc =>
        acc.id === id ? { ...acc, [field]: value } : acc
      )
    });
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Paramètres
                </h1>
                <p className="text-sm text-muted-foreground">Configuration et gestion des utilisateurs</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="billing" className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-5 mb-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <TabsTrigger value="billing" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">
              <Building className="h-4 w-4" />
              Facturation
            </TabsTrigger>
            <TabsTrigger value="fiscal" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">
              <Calculator className="h-4 w-4" />
              Fiscalité
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">
              <Database className="h-4 w-4" />
              Sauvegarde
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">
              <Users className="h-4 w-4" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">
              <Info className="h-4 w-4" />
              Contact
            </TabsTrigger>
          </TabsList>

          <TabsContent value="billing" className="space-y-6">
            {/* Type d'entité Card */}
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 border-0 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl text-white">
                  <Building2 className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2">Type d'entité</h2>
                  <p className="text-sm text-muted-foreground mb-4">Définissez si vous êtes une société ou une personne physique</p>
                  <div className="flex items-center space-x-3 bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <Checkbox
                      id="is_company"
                      checked={settings.is_company}
                      onCheckedChange={(checked) => setSettings({ ...settings, is_company: checked as boolean })}
                    />
                    <Label htmlFor="is_company" className="cursor-pointer font-medium">
                      Société (sinon personne physique)
                    </Label>
                  </div>
                </div>
              </div>
            </Card>

            {/* Identité Card */}
            <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-0">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl text-white">
                  <User className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">Identité</h3>
                  <p className="text-sm text-muted-foreground">Informations sur votre entreprise ou votre identité</p>
                </div>
              </div>
              {settings.is_company ? (
                <div className="space-y-3">
                  <Label htmlFor="company_name" className="text-base font-medium">Nom de la société *</Label>
                  <Input
                    id="company_name"
                    value={settings.company_name || ''}
                    onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                    placeholder="Ex: SARL Mon Commerce"
                    className="h-12"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="first_name" className="text-base font-medium">Prénom *</Label>
                    <Input
                      id="first_name"
                      value={settings.first_name || ''}
                      onChange={(e) => setSettings({ ...settings, first_name: e.target.value })}
                      placeholder="Jean"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="last_name" className="text-base font-medium">Nom *</Label>
                    <Input
                      id="last_name"
                      value={settings.last_name || ''}
                      onChange={(e) => setSettings({ ...settings, last_name: e.target.value })}
                      placeholder="Dupont"
                      className="h-12"
                    />
                  </div>
                </div>
              )}
            </Card>

            {/* Adresse siège social Card */}
            <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-0">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl text-white">
                  <MapPin className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">Adresse du siège social</h3>
                  <p className="text-sm text-muted-foreground">Adresse officielle de votre entreprise</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="hq_address" className="text-base font-medium">Adresse *</Label>
                  <Input
                    id="hq_address"
                    value={settings.headquarters_address}
                    onChange={(e) => setSettings({ ...settings, headquarters_address: e.target.value })}
                    placeholder="123 Rue Example"
                    className="h-12"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="hq_postal" className="text-base font-medium">Code postal *</Label>
                    <Input
                      id="hq_postal"
                      value={settings.headquarters_postal_code}
                      onChange={(e) => setSettings({ ...settings, headquarters_postal_code: e.target.value })}
                      placeholder="6000"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="hq_city" className="text-base font-medium">Ville *</Label>
                    <Input
                      id="hq_city"
                      value={settings.headquarters_city}
                      onChange={(e) => setSettings({ ...settings, headquarters_city: e.target.value })}
                      placeholder="Charleroi"
                      className="h-12"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Adresse du commerce Card */}
            <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-0">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl text-white">
                  <Building className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">Adresse du commerce</h3>
                  <p className="text-sm text-muted-foreground">Adresse du point de vente</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="store_address" className="text-base font-medium">Adresse *</Label>
                  <Input
                    id="store_address"
                    value={settings.store_address}
                    onChange={(e) => setSettings({ ...settings, store_address: e.target.value })}
                    placeholder="456 Avenue du Commerce"
                    className="h-12"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="store_postal" className="text-base font-medium">Code postal *</Label>
                    <Input
                      id="store_postal"
                      value={settings.store_postal_code}
                      onChange={(e) => setSettings({ ...settings, store_postal_code: e.target.value })}
                      placeholder="6000"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="store_city" className="text-base font-medium">Ville *</Label>
                    <Input
                      id="store_city"
                      value={settings.store_city}
                      onChange={(e) => setSettings({ ...settings, store_city: e.target.value })}
                      placeholder="Charleroi"
                      className="h-12"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Informations légales et contact Card */}
            <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-0">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl text-white">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">Informations légales & Contact</h3>
                  <p className="text-sm text-muted-foreground">Informations fiscales et de contact</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="vat_number" className="text-base font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Numéro de TVA *
                  </Label>
                  <Input
                    id="vat_number"
                    value={settings.vat_number}
                    onChange={(e) => setSettings({ ...settings, vat_number: e.target.value })}
                    placeholder="BE0123456789"
                    className="h-12"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-base font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Téléphone *
                  </Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    placeholder="+32 71 12 34 56"
                    className="h-12"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-base font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    placeholder="contact@moncommerce.be"
                    className="h-12"
                  />
                </div>
              </div>
            </Card>

            {/* Logo de facturation Card */}
            <Card className="p-6 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 border-0 shadow-lg">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl text-white">
                  <Image className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">Logo pour les factures</h3>
                  <p className="text-sm text-muted-foreground">Ajoutez votre logo sur vos factures</p>
                </div>
              </div>
              <div className="space-y-3">
                <Label htmlFor="invoice_logo" className="text-base font-medium">URL du logo</Label>
                <Input
                  id="invoice_logo"
                  value={settings.invoice_logo || ''}
                  onChange={(e) => setSettings({ ...settings, invoice_logo: e.target.value })}
                  placeholder="https://exemple.com/logo.png ou /chemin/vers/logo.png"
                  className="h-12"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Le logo sera affiché en haut à gauche des factures
                </p>
              </div>
            </Card>

            {/* Comptes bancaires Card */}
            <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-0">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl text-white">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold">Comptes bancaires</h3>
                      <p className="text-sm text-muted-foreground">Gérez vos comptes bancaires pour les factures</p>
                    </div>
                    <Button
                      type="button"
                      onClick={addBankAccount}
                      size="sm"
                      className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter
                    </Button>
                  </div>
                </div>
              </div>
              
              {settings.bank_accounts.length === 0 ? (
                <div className="bg-muted/30 rounded-lg p-8 text-center">
                  <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Aucun compte bancaire configuré. Cliquez sur "Ajouter" pour en ajouter un.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {settings.bank_accounts.map((account, index) => (
                    <Card key={account.id} className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 border-2 border-teal-200 dark:border-teal-800">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="bg-teal-100 text-teal-700">
                            Compte #{index + 1}
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBankAccount(account.id)}
                            className="hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor={`bank_name_${account.id}`} className="text-base font-medium">
                              Nom de la banque
                            </Label>
                            <Input
                              id={`bank_name_${account.id}`}
                              value={account.bank_name}
                              onChange={(e) => updateBankAccount(account.id, 'bank_name', e.target.value)}
                              placeholder="Ex: BNP Paribas Fortis"
                              className="h-11 bg-white dark:bg-gray-800"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`account_number_${account.id}`} className="text-base font-medium">
                              Numéro de compte (IBAN)
                            </Label>
                            <Input
                              id={`account_number_${account.id}`}
                              value={account.account_number}
                              onChange={(e) => updateBankAccount(account.id, 'account_number', e.target.value)}
                              placeholder="BE00 0000 0000 0000"
                              className="h-11 bg-white dark:bg-gray-800 font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>

            {/* Bouton sauvegarder */}
            <Card className="p-6 bg-gradient-to-r from-purple-500 to-blue-500 border-0 shadow-lg">
              <Button 
                onClick={saveSettings} 
                disabled={saving} 
                className="w-full h-14 text-lg bg-white text-purple-600 hover:bg-white/90" 
                size="lg"
              >
                <Save className="h-5 w-5 mr-2" />
                {saving ? 'Enregistrement en cours...' : 'Enregistrer tous les paramètres'}
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="fiscal">
            <FiscalSettings />
          </TabsContent>

          <TabsContent value="backup">
            <BackupSettings />
          </TabsContent>

          <TabsContent value="users">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-0 rounded-lg">
              <UserManagement />
            </div>
          </TabsContent>

          <TabsContent value="contact">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-0 rounded-lg">
              <ContactInfo />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
