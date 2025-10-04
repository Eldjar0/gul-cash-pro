import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, PlayCircle, Settings, FileText, HelpCircle, Loader2, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { UserManagement } from "@/components/admin/UserManagement";

export default function GettingStarted() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const setupAdmin = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup-admin');
      
      if (error) throw error;
      
      toast.success("Compte admin configuré avec succès!", {
        description: "Identifiant: admin | Mot de passe: 3679"
      });
      
      console.log('Setup result:', data);
    } catch (error) {
      console.error('Setup error:', error);
      toast.error("Erreur lors de la configuration", {
        description: error instanceof Error ? error.message : "Une erreur est survenue"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Guide de Démarrage</h1>
            <p className="text-muted-foreground">Configuration et utilisation du logiciel POS</p>
          </div>
          <Button onClick={() => navigate('/')} variant="outline">
            Retour
          </Button>
        </div>

        {/* Configuration Admin */}
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Configuration du compte administrateur
            </CardTitle>
            <CardDescription>
              Créez le compte admin pour accéder au système
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-2">
              <p className="font-medium">Cette action va :</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>Supprimer tous les comptes existants</li>
                <li>Créer le compte admin unique</li>
                <li>Identifiant : <strong>admin</strong></li>
                <li>Mot de passe : <strong>3679</strong></li>
              </ul>
            </div>
            <Button 
              onClick={setupAdmin} 
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Configuration en cours...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Configurer le compte admin
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Gestion des utilisateurs */}
        <UserManagement />

        {/* Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5" />
              Configuration Initiale
            </CardTitle>
            <CardDescription>Suivez ces étapes pour démarrer en toute sécurité</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Configurer les informations de votre entreprise</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Allez dans <strong>Paramètres → Société</strong> et renseignez vos coordonnées complètes, numéro de TVA et informations légales.
                  </p>
                  <Button size="sm" onClick={() => navigate('/settings')} variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Ouvrir les paramètres
                  </Button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Ajouter vos produits et catégories</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Allez dans <strong>Produits</strong> pour créer votre catalogue avec codes-barres, prix et taux de TVA.
                  </p>
                  <Button size="sm" onClick={() => navigate('/products')} variant="outline">
                    Gérer les produits
                  </Button>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Préparer votre carnet de caisse officiel</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Avant d'utiliser le logiciel, assurez-vous d'avoir un <strong>carnet de caisse papier</strong> pour vos obligations légales belges.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Ouvrir votre première journée</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Sur la page d'accueil du POS, cliquez sur <strong>"Ouvrir la journée"</strong> et indiquez le montant du fond de caisse.
                  </p>
                  <Button size="sm" onClick={() => navigate('/')} variant="outline">
                    Aller au POS
                  </Button>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  5
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Commencer les encaissements</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Scannez les produits, ajoutez-les au panier et finalisez les paiements rapidement.
                  </p>
                </div>
              </div>

              {/* Step 6 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  6
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Clôturer la journée et reporter les données</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Le soir, générez le Rapport Z, comptez votre caisse et <strong>reportez manuellement</strong> les totaux dans votre carnet officiel.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workflow quotidien */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Routine Quotidienne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Ouverture (Matin)</p>
                  <p className="text-sm text-muted-foreground">Ouvrir la journée + fond de caisse</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Ventes (Journée)</p>
                  <p className="text-sm text-muted-foreground">Scanner produits, encaisser clients, imprimer tickets</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Clôture (Soir)</p>
                  <p className="text-sm text-muted-foreground">Rapport Z → Compter caisse → Reporter dans carnet officiel</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Questions Fréquentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="q1">
                <AccordionTrigger>Le logiciel est-il conforme à la loi belge ?</AccordionTrigger>
                <AccordionContent>
                  Non, ce logiciel n'est PAS certifié fiscalement. Il s'agit d'un outil de gestion interne. Vous devez obligatoirement tenir un carnet de caisse papier ou utiliser un système certifié en parallèle. Le Rapport Z doit être reporté manuellement dans votre comptabilité officielle.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q2">
                <AccordionTrigger>Puis-je utiliser le logiciel pour mon restaurant (HORECA) ?</AccordionTrigger>
                <AccordionContent>
                  Oui, mais avec précaution. Depuis juillet 2016, le secteur HORECA doit utiliser un module FDM certifié (Black Box). Ce logiciel n'en possède pas. Vous pouvez l'utiliser comme outil de gestion interne, mais vous devez avoir un système certifié pour vos obligations fiscales.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q3">
                <AccordionTrigger>Comment archiver mes ventes ?</AccordionTrigger>
                <AccordionContent>
                  Lors de la clôture journalière (Rapport Z), vous pouvez cocher l'option "Archiver et supprimer les ventes anciennes". Le système générera un fichier ZIP avec toutes vos données (JSON, CSV, tickets HTML) que vous devez conserver pendant 7 ans minimum.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q4">
                <AccordionTrigger>Que faire si j'ai un écart de caisse ?</AccordionTrigger>
                <AccordionContent>
                  Un écart de caisse (positif ou négatif) sera affiché dans le Rapport Z. Notez cet écart dans votre carnet officiel avec une justification si possible. Des écarts réguliers peuvent nécessiter une révision de vos procédures.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q5">
                <AccordionTrigger>Comment gérer la TVA avec ce logiciel ?</AccordionTrigger>
                <AccordionContent>
                  Le logiciel calcule automatiquement la TVA pour chaque vente selon les taux configurés. Le Rapport Z affiche le détail TVA par taux (6%, 12%, 21%). Utilisez ces données pour votre déclaration TVA trimestrielle auprès du SPF Finances.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q6">
                <AccordionTrigger>Puis-je supprimer des ventes ?</AccordionTrigger>
                <AccordionContent>
                  Non, vous ne devez JAMAIS supprimer des ventes manuellement. Si une vente est erronée, vous pouvez l'annuler (elle sera marquée comme "annulée" mais restera dans la base). La conservation de toutes les transactions est obligatoire pour la traçabilité fiscale.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={() => navigate('/legal-info')} variant="default">
            <FileText className="h-4 w-4 mr-2" />
            Informations légales
          </Button>
          <Button onClick={() => navigate('/settings')} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>
          <Button onClick={() => navigate('/')} variant="ghost">
            Aller au POS
          </Button>
        </div>
      </div>
    </div>
  );
}
