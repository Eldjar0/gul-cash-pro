import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Scale, FileText, Archive, Shield, ExternalLink, CheckCircle2, XCircle, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

export default function LegalInfo() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Informations Légales</h1>
            <p className="text-muted-foreground">Conformité fiscale belge et usage du logiciel</p>
          </div>
          <Button onClick={() => navigate('/')} variant="outline">
            Retour
          </Button>
        </div>

        {/* Critical Warning */}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-bold">⚠️ AVERTISSEMENT IMPORTANT</AlertTitle>
          <AlertDescription className="text-sm">
            Ce logiciel est un <strong>outil d'aide à la gestion interne</strong>. Il n'est <strong>PAS certifié fiscalement</strong> par le SPF Finances de Belgique et ne peut <strong>PAS remplacer</strong> un carnet de caisse officiel ou un système de caisse enregistreuse certifié.
          </AlertDescription>
        </Alert>

        {/* Status Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Statut du Logiciel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-semibold">NON certifié par le SPF Finances</p>
                  <p className="text-sm text-muted-foreground">Le logiciel ne possède pas la certification SCE (Système de Caisse Enregistreuse)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-semibold">Pas de Module FDM (Black Box)</p>
                  <p className="text-sm text-muted-foreground">Obligatoire pour le secteur HORECA depuis juillet 2016</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Outil de gestion interne</p>
                  <p className="text-sm text-muted-foreground">Parfait pour accélérer les encaissements et suivre votre activité</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage recommandé */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Usage Recommandé
            </CardTitle>
            <CardDescription>Comment utiliser ce logiciel en toute légalité</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold mb-2">1. Encaissement rapide pendant la journée</h3>
                <p className="text-sm text-muted-foreground">
                  Utilisez le POS pour scanner les produits, calculer les totaux, imprimer des tickets clients et gérer votre stock en temps réel.
                </p>
              </div>
              
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold mb-2">2. Transfert vers le carnet officiel le soir</h3>
                <p className="text-sm text-muted-foreground">
                  À la fin de la journée, générez le Rapport Z et reportez manuellement les données dans votre <strong>carnet de caisse papier officiel</strong> ou système certifié.
                </p>
              </div>
              
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold mb-2">3. Archivage régulier</h3>
                <p className="text-sm text-muted-foreground">
                  Archivez vos ventes mensuellement via la fonction d'export ZIP et conservez ces archives pendant <strong>7 ans minimum</strong>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Obligations légales belges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Obligations Légales Belges
            </CardTitle>
            <CardDescription>Ce que vous devez respecter en tant que commerçant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Archive className="h-4 w-4" />
                  Conservation des documents (7-10 ans)
                </h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-6">
                  <li>Documents comptables : 7 ans minimum</li>
                  <li>Comptabilité officielle : 10 ans</li>
                  <li>Factures et tickets : 7 ans</li>
                </ul>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Carnet de caisse papier obligatoire
                </h4>
                <p className="text-sm text-muted-foreground ml-6">
                  Vous devez tenir un carnet de caisse papier avec les entrées/sorties journalières, même si vous utilisez un système informatique.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Déclaration TVA trimestrielle
                </h4>
                <p className="text-sm text-muted-foreground ml-6">
                  Déclaration obligatoire tous les 3 mois auprès du SPF Finances avec les détails TVA par taux.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  Module FDM pour HORECA
                </h4>
                <p className="text-sm text-muted-foreground ml-6">
                  Si vous êtes dans le secteur HORECA (restauration, café), un module FDM certifié est <strong>obligatoire depuis juillet 2016</strong>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workflow recommandé */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Workflow Quotidien Recommandé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 list-decimal list-inside">
              <li className="text-sm">
                <strong>Matin :</strong> Ouvrir la journée dans le POS avec le fond de caisse
              </li>
              <li className="text-sm">
                <strong>Journée :</strong> Utiliser le POS pour tous les encaissements rapides
              </li>
              <li className="text-sm">
                <strong>Soir :</strong> Générer le Rapport Z et compter la caisse
              </li>
              <li className="text-sm">
                <strong>Soir :</strong> Reporter les données du Rapport Z dans le carnet de caisse officiel
              </li>
              <li className="text-sm">
                <strong>Mensuel :</strong> Archiver les ventes en ZIP et sauvegarder sur disque externe
              </li>
              <li className="text-sm">
                <strong>Trimestriel :</strong> Préparer et soumettre la déclaration TVA au SPF Finances
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Responsabilités */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Responsabilités
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Clause de non-responsabilité</AlertTitle>
              <AlertDescription className="text-sm space-y-2">
                <p>
                  <strong>JLprod</strong> ne peut être tenu responsable de l'utilisation que vous faites de ce logiciel.
                </p>
                <p>
                  Vous êtes seul(e) responsable de votre conformité fiscale vis-à-vis du SPF Finances de Belgique.
                </p>
                <p>
                  Ce logiciel est fourni "tel quel" comme outil d'aide à la gestion, sans garantie de conformité fiscale.
                </p>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Liens utiles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Liens Utiles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <a 
              href="https://finances.belgium.be" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              SPF Finances Belgique
            </a>
            <a 
              href="https://finances.belgium.be/fr/entreprises/tva" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Guide TVA pour commerçants
            </a>
            <a 
              href="https://finances.belgium.be/fr/entreprises/tva/caisses-enregistreuses" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Réglementation caisses enregistreuses
            </a>
            <a 
              href="https://www.jlprod.be" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Site officiel JLprod
            </a>
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <div className="flex gap-3">
          <Button onClick={() => navigate('/getting-started')} variant="default">
            Guide de démarrage
          </Button>
          <Button onClick={() => navigate('/settings')} variant="outline">
            Paramètres de conformité
          </Button>
          <Button onClick={() => navigate('/')} variant="ghost">
            Retour au POS
          </Button>
        </div>
      </div>
    </div>
  );
}
