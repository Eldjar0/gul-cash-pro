import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ComplianceItem {
  id: string;
  label: string;
  description: string;
  critical: boolean;
}

const complianceItems: ComplianceItem[] = [
  {
    id: "carnet_caisse",
    label: "Carnet de caisse papier en place",
    description: "Obligatoire pour toutes les entreprises belges",
    critical: true
  },
  {
    id: "tva_number",
    label: "Numéro TVA enregistré dans les paramètres",
    description: "Doit figurer sur tous les documents",
    critical: true
  },
  {
    id: "archivage_auto",
    label: "Archivage automatique activé",
    description: "Pour sauvegarder vos données régulièrement",
    critical: false
  },
  {
    id: "conservation_7ans",
    label: "Système de conservation 7 ans organisé",
    description: "Disque dur externe ou cloud sécurisé",
    critical: true
  },
  {
    id: "rapport_z_quotidien",
    label: "Rapport Z quotidien imprimé/sauvegardé",
    description: "À reporter dans le carnet officiel",
    critical: true
  },
  {
    id: "declaration_tva",
    label: "Déclaration TVA trimestrielle à jour",
    description: "Auprès du SPF Finances",
    critical: true
  }
];

export function ComplianceChecklist() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState(0);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('compliance_checklist');
    if (saved) {
      setCheckedItems(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('compliance_checklist', JSON.stringify(checkedItems));
    
    // Calculate score
    const checked = Object.values(checkedItems).filter(Boolean).length;
    setScore(Math.round((checked / complianceItems.length) * 100));
  }, [checkedItems]);

  const handleCheck = (id: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const criticalUnchecked = complianceItems
    .filter(item => item.critical && !checkedItems[item.id])
    .length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {score === 100 ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : criticalUnchecked > 0 ? (
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          Checklist de Conformité
        </CardTitle>
        <CardDescription>
          Score de conformité : <strong>{score}%</strong>
          {criticalUnchecked > 0 && (
            <span className="text-orange-600 font-semibold ml-2">
              ({criticalUnchecked} élément{criticalUnchecked > 1 ? 's' : ''} critique{criticalUnchecked > 1 ? 's' : ''})
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {criticalUnchecked > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Attention</AlertTitle>
            <AlertDescription>
              Vous avez {criticalUnchecked} élément{criticalUnchecked > 1 ? 's' : ''} critique{criticalUnchecked > 1 ? 's' : ''} non coché{criticalUnchecked > 1 ? 's' : ''}. 
              Ces éléments sont <strong>recommandés</strong> pour une gestion complète.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {complianceItems.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
              <Checkbox
                id={item.id}
                checked={checkedItems[item.id] || false}
                onCheckedChange={() => handleCheck(item.id)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label 
                  htmlFor={item.id} 
                  className="cursor-pointer font-medium flex items-center gap-2"
                >
                  {item.label}
                  {item.critical && (
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-semibold">
                      CRITIQUE
                    </span>
                  )}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {score === 100 && (
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">Excellent !</AlertTitle>
            <AlertDescription>
              Vous avez coché tous les éléments de conformité. N'oubliez pas de vérifier régulièrement que ces pratiques sont bien respectées au quotidien.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
