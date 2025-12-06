import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, Clock } from "lucide-react";

interface CompanyLegalSettingsProps {
  settings: {
    legal_form?: string;
    bce_number?: string;
    head_office_address?: string;
    payment_terms_days?: number;
    late_interest_rate?: number;
  };
  onChange: (key: string, value: any) => void;
}

export function CompanyLegalSettings({ settings, onChange }: CompanyLegalSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Informations légales */}
      <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-0">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl text-white">
            <Scale className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold">Informations légales obligatoires</h3>
            <p className="text-sm text-muted-foreground">Conformité légale belge (Art. 315bis CIR92)</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="legal_form" className="text-base font-medium">Forme juridique</Label>
            <Input
              id="legal_form"
              value={settings.legal_form || ''}
              onChange={(e) => onChange('legal_form', e.target.value)}
              placeholder="Ex: SPRL, SRL, SA, SCRL..."
              className="h-12"
            />
            <p className="text-xs text-muted-foreground">Société Privée à Responsabilité Limitée, Société Anonyme, etc.</p>
          </div>
          <div className="space-y-3">
            <Label htmlFor="bce_number" className="text-base font-medium">Numéro BCE *</Label>
            <Input
              id="bce_number"
              value={settings.bce_number || ''}
              onChange={(e) => onChange('bce_number', e.target.value)}
              placeholder="Ex: BE 0123.456.789"
              className="h-12"
            />
            <p className="text-xs text-muted-foreground">Banque-Carrefour des Entreprises (obligatoire)</p>
          </div>
          <div className="space-y-3">
            <Label htmlFor="head_office_address" className="text-base font-medium">Siège social (si différent)</Label>
            <Input
              id="head_office_address"
              value={settings.head_office_address || ''}
              onChange={(e) => onChange('head_office_address', e.target.value)}
              placeholder="Adresse complète du siège social"
              className="h-12"
            />
            <p className="text-xs text-muted-foreground">Si différent de l'adresse du commerce</p>
          </div>
        </div>
      </Card>

      {/* Conditions de paiement */}
      <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-0">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl text-white">
            <Clock className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold">Conditions de paiement</h3>
            <p className="text-sm text-muted-foreground">Paramètres de facturation</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="payment_terms_days" className="text-base font-medium">Délai de paiement (jours)</Label>
            <Input
              id="payment_terms_days"
              type="number"
              value={settings.payment_terms_days || 30}
              onChange={(e) => onChange('payment_terms_days', parseInt(e.target.value))}
              placeholder="30"
              className="h-12"
            />
            <p className="text-xs text-muted-foreground">Délai légal maximum : 30 jours (sauf accord particulier)</p>
          </div>
          <div className="space-y-3">
            <Label htmlFor="late_interest_rate" className="text-base font-medium">Taux d'intérêt de retard (%)</Label>
            <Input
              id="late_interest_rate"
              type="number"
              step="0.1"
              value={settings.late_interest_rate || 12}
              onChange={(e) => onChange('late_interest_rate', parseFloat(e.target.value))}
              placeholder="12"
              className="h-12"
            />
            <p className="text-xs text-muted-foreground">Taux légal en Belgique : 12% par an + 40€ de frais fixes</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
