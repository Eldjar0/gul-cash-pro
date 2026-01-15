import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, FileText, Shield, Scale, AlertTriangle, User, Database, Headphones, Gavel } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsOfService() {
  const navigate = useNavigate();

  const sections = [
    {
      id: 1,
      title: "Objet",
      icon: FileText,
      content: (
        <div className="space-y-3">
          <p>
            Les présentes Conditions Générales d'Utilisation (ci-après "CGU") régissent l'utilisation du logiciel 
            de caisse et de gestion commerciale (ci-après "le Logiciel") développé par JL Prod et vendu 
            définitivement à GUL REYHAN.
          </p>
          <p>
            Le Logiciel est un outil de gestion interne destiné à faciliter les opérations commerciales 
            quotidiennes. Il ne constitue en aucun cas un système de caisse enregistreuse certifié ou 
            un dispositif fiscal officiel.
          </p>
        </div>
      )
    },
    {
      id: 2,
      title: "Définitions",
      icon: FileText,
      content: (
        <ul className="space-y-2 list-disc list-inside">
          <li><strong>Éditeur</strong> : JL Prod, représenté par Jonathan Langlois, développeur du Logiciel.</li>
          <li><strong>Propriétaire</strong> : GUL REYHAN, acquéreur définitif et unique du Logiciel.</li>
          <li><strong>Utilisateur</strong> : Toute personne physique ou morale utilisant le Logiciel sous l'autorité du Propriétaire.</li>
          <li><strong>Logiciel</strong> : L'ensemble des programmes, interfaces, fonctionnalités et documentation associée.</li>
        </ul>
      )
    },
    {
      id: 3,
      title: "Acceptation des CGU",
      icon: Scale,
      content: (
        <div className="space-y-3">
          <p>
            L'utilisation du Logiciel implique l'acceptation pleine et entière des présentes CGU. 
            Tout Utilisateur qui n'accepte pas ces conditions doit s'abstenir d'utiliser le Logiciel.
          </p>
          <p>
            Le Propriétaire s'engage à informer ses Utilisateurs de l'existence des présentes CGU 
            et à s'assurer de leur respect.
          </p>
        </div>
      )
    },
    {
      id: 4,
      title: "Licence et Propriété",
      icon: Shield,
      content: (
        <div className="space-y-3">
          <p>
            Le Logiciel a fait l'objet d'un <strong>achat définitif</strong> par GUL REYHAN. 
            Cette acquisition confère au Propriétaire :
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Le droit d'utilisation illimité dans le temps</li>
            <li>Le droit de modification pour ses besoins propres</li>
            <li>Le droit d'utilisation sur tous ses appareils et points de vente</li>
          </ul>
          <p className="mt-3">
            Les droits d'auteur et la propriété intellectuelle du code source restent la propriété 
            de JL Prod conformément au droit belge.
          </p>
        </div>
      )
    },
    {
      id: 5,
      title: "Clause de Non-Responsabilité",
      icon: AlertTriangle,
      content: (
        <div className="space-y-4">
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
            <h4 className="font-bold text-destructive mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              CLAUSE IMPORTANTE - LIMITATION DE RESPONSABILITÉ
            </h4>
            <p className="text-sm">
              L'Éditeur (JL Prod) décline expressément toute responsabilité dans les cas suivants :
            </p>
          </div>

          <div className="space-y-3">
            <div className="border-l-4 border-destructive pl-4">
              <h5 className="font-semibold">5.1 Usage frauduleux ou illégal</h5>
              <p className="text-sm text-muted-foreground">
                L'Éditeur n'est pas responsable de toute utilisation du Logiciel à des fins frauduleuses, 
                illégales ou contraires à la réglementation fiscale belge ou étrangère. L'Utilisateur 
                est seul responsable de l'usage qu'il fait du Logiciel.
              </p>
            </div>

            <div className="border-l-4 border-destructive pl-4">
              <h5 className="font-semibold">5.2 Erreurs de calcul ou de déclaration fiscale</h5>
              <p className="text-sm text-muted-foreground">
                L'Éditeur n'est pas responsable des erreurs de calcul de TVA, des déclarations fiscales 
                incorrectes ou de tout manquement aux obligations comptables. L'Utilisateur doit vérifier 
                toutes les données avant déclaration aux autorités.
              </p>
            </div>

            <div className="border-l-4 border-destructive pl-4">
              <h5 className="font-semibold">5.3 Perte de données</h5>
              <p className="text-sm text-muted-foreground">
                L'Éditeur n'est pas responsable de la perte, corruption ou vol de données. L'Utilisateur 
                est responsable de la mise en place de sauvegardes régulières et de la sécurité de ses données.
              </p>
            </div>

            <div className="border-l-4 border-destructive pl-4">
              <h5 className="font-semibold">5.4 Dommages indirects</h5>
              <p className="text-sm text-muted-foreground">
                L'Éditeur n'est pas responsable des dommages indirects, incluant mais non limités à : 
                perte de chiffre d'affaires, perte de clientèle, amendes fiscales, préjudice d'image, 
                ou tout autre dommage consécutif à l'utilisation du Logiciel.
              </p>
            </div>

            <div className="border-l-4 border-destructive pl-4">
              <h5 className="font-semibold">5.5 Modifications du code</h5>
              <p className="text-sm text-muted-foreground">
                L'Éditeur n'est pas responsable des dysfonctionnements résultant de modifications 
                apportées au code source par le Propriétaire ou des tiers.
              </p>
            </div>
          </div>

          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mt-4">
            <p className="font-semibold text-warning-foreground">
              ⚠️ L'Utilisateur est SEUL responsable de ses obligations légales et fiscales, 
              notamment la tenue d'un carnet de caisse conforme si requis par la loi belge.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: "Obligations de l'Utilisateur",
      icon: User,
      content: (
        <div className="space-y-3">
          <p>L'Utilisateur s'engage à :</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Utiliser le Logiciel conformément à la législation en vigueur</li>
            <li>Maintenir un carnet de caisse papier si requis par la réglementation belge</li>
            <li>Vérifier l'exactitude des calculs et données avant toute déclaration officielle</li>
            <li>Effectuer des sauvegardes régulières de ses données</li>
            <li>Ne pas utiliser le Logiciel pour des activités frauduleuses ou illégales</li>
            <li>Consulter un expert-comptable pour toute question fiscale ou comptable</li>
          </ul>
        </div>
      )
    },
    {
      id: 7,
      title: "Protection des Données (RGPD)",
      icon: Database,
      content: (
        <div className="space-y-3">
          <p>
            Conformément au Règlement Général sur la Protection des Données (RGPD) :
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong>Responsable du traitement</strong> : Le Propriétaire (GUL REYHAN) est responsable 
              du traitement des données personnelles de ses clients collectées via le Logiciel.
            </li>
            <li>
              <strong>Stockage des données</strong> : Les données sont stockées localement ou sur 
              l'infrastructure choisie par le Propriétaire.
            </li>
            <li>
              <strong>Accès de l'Éditeur</strong> : L'Éditeur (JL Prod) n'a aucun accès aux données 
              clients du Propriétaire. Aucune donnée n'est transmise à l'Éditeur.
            </li>
            <li>
              <strong>Droits des personnes</strong> : Le Propriétaire doit garantir les droits des 
              personnes concernées (accès, rectification, effacement, portabilité).
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 8,
      title: "Support et Maintenance",
      icon: Headphones,
      content: (
        <div className="space-y-3">
          <p>
            Sauf accord contractuel séparé, l'achat du Logiciel n'inclut pas :
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Le support technique</li>
            <li>Les mises à jour futures</li>
            <li>La maintenance corrective ou évolutive</li>
            <li>La formation des utilisateurs</li>
          </ul>
          <p className="mt-3">
            Tout service supplémentaire fait l'objet d'un devis et d'un accord séparé entre 
            l'Éditeur et le Propriétaire.
          </p>
        </div>
      )
    },
    {
      id: 9,
      title: "Droit Applicable et Juridiction",
      icon: Gavel,
      content: (
        <div className="space-y-3">
          <p>
            Les présentes CGU sont régies par le <strong>droit belge</strong>.
          </p>
          <p>
            En cas de litige relatif à l'interprétation ou à l'exécution des présentes CGU, 
            les parties s'efforceront de trouver une solution amiable. À défaut, les tribunaux 
            de Belgique seront seuls compétents.
          </p>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Conditions Générales d'Utilisation</h1>
            <p className="text-muted-foreground">Version 1.0 - Janvier 2025</p>
          </div>
        </div>

        {/* Introduction Card */}
        <Card className="mb-6 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-start">
              <div className="p-3 rounded-lg bg-primary/10">
                <Scale className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold mb-2">Document Juridique</h2>
                <p className="text-sm text-muted-foreground">
                  Ce document définit les conditions d'utilisation du logiciel de caisse. 
                  En utilisant ce logiciel, vous acceptez ces conditions. Veuillez les lire attentivement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sections */}
        <ScrollArea className="h-auto">
          <div className="space-y-4">
            {sections.map((section) => (
              <Card key={section.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 rounded-lg bg-muted">
                      <section.icon className="h-4 w-4" />
                    </div>
                    Article {section.id} - {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  {section.content}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        <Separator className="my-8" />

        {/* Footer */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">
                Logiciel développé par <strong>JL Prod</strong> - Jonathan Langlois
              </p>
              <p className="text-xs text-muted-foreground">
                Propriété exclusive de GUL REYHAN suite à achat définitif
              </p>
              <p className="text-xs text-muted-foreground">
                CGU Version 1.0 - Dernière mise à jour : Janvier 2025
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center gap-4 mt-6">
          <Button variant="outline" onClick={() => navigate('/legal')}>
            Mentions légales
          </Button>
          <Button onClick={() => navigate('/')}>
            Retour à la caisse
          </Button>
        </div>
      </div>
    </div>
  );
}
