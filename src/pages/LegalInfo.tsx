import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Scale, FileText, Archive, Shield, ExternalLink, CheckCircle2, XCircle, Info, Building2, User, Package, ShieldAlert, Lock, Phone, Mail, Globe, CreditCard, BarChart3, Users, ShoppingCart, Printer, Calculator, Scan, PiggyBank, FileSpreadsheet, Settings, TrendingUp, Percent, Star, Image, Bell, Download, Upload, ScrollText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LegalInfo() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Informations Légales et Mentions Obligatoires</h1>
            <p className="text-muted-foreground">Éditeur, Conditions d'utilisation et Protection juridique</p>
          </div>
          <Button onClick={() => navigate('/')} variant="outline">
            Retour
          </Button>
        </div>

        {/* Critical Warning */}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-bold">⚠️ AVERTISSEMENT CRITIQUE</AlertTitle>
          <AlertDescription className="text-sm">
            Ce logiciel est un <strong>outil de gestion interne NON CERTIFIÉ</strong> par le SPF Finances de Belgique. Il ne peut <strong>EN AUCUN CAS remplacer</strong> un carnet de caisse officiel ou un système de caisse enregistreuse certifié. L'utilisateur est seul responsable de sa conformité fiscale et légale.
          </AlertDescription>
        </Alert>

        {/* Tabs Navigation */}
        <Tabs defaultValue="editor" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
            <TabsTrigger value="editor">Éditeur</TabsTrigger>
            <TabsTrigger value="features">Fonctionnalités</TabsTrigger>
            <TabsTrigger value="ownership">Propriété</TabsTrigger>
            <TabsTrigger value="liability">Responsabilité</TabsTrigger>
            <TabsTrigger value="terms">Conditions</TabsTrigger>
            <TabsTrigger value="gdpr">RGPD</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          {/* Tab: Éditeur */}
          <TabsContent value="editor" className="space-y-6">
            {/* Developer Info */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Éditeur du Logiciel
            </CardTitle>
            <CardDescription>Mentions légales obligatoires de l'éditeur</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Raison sociale</p>
                  <p className="text-lg font-bold">JL Prod</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Représentant légal</p>
                  <p className="font-semibold">Jordan Lallemand</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Numéro TVA</p>
                  <p className="font-mono font-bold">BE0784435238</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Téléphone</p>
                    <a href="tel:+32471872860" className="font-semibold hover:underline">+32 471 87 28 60</a>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Email</p>
                    <a href="mailto:contact@jlprod.be" className="font-semibold hover:underline">contact@jlprod.be</a>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Site web</p>
                    <a href="https://www.jlprod.be" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">www.jlprod.be</a>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

            {/* Client Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Propriétaire du Logiciel
                </CardTitle>
                <CardDescription>Logiciel acheté et détenu par</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-primary/10 rounded-lg p-4 space-y-2 border-2 border-primary">
                  <p className="text-2xl font-bold">GUL REYHAN</p>
                  <p className="text-sm font-semibold">Propriétaire légal du logiciel suite à achat complet</p>
                  <p className="text-xs text-muted-foreground">Tous les droits d'utilisation et de modification appartiennent au propriétaire</p>
                  <div className="flex gap-2 mt-3">
                    <Badge variant="outline">Version 1.0.0</Badge>
                    <Badge variant="outline">Année 2025</Badge>
                    <Badge className="bg-primary">Achat Définitif</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Statut Fiscal du Logiciel
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
          </TabsContent>

          {/* Tab: Fonctionnalités */}
          <TabsContent value="features" className="space-y-6">
            {/* Complete Functionality List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Fonctionnalités Complètes du Logiciel
            </CardTitle>
            <CardDescription>Liste exhaustive de toutes les fonctionnalités disponibles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* POS Module */}
            <div className="space-y-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Module Point de Vente (POS)
              </h3>
              <div className="grid md:grid-cols-2 gap-2 ml-7">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Encaissement rapide multi-produits</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Scanner de codes-barres</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Calcul automatique TVA (6%, 12%, 21%)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Impression tickets thermiques 80mm</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Gestion panier avec modifications</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Application remises et codes promo</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Paiements espèces/carte/mixtes</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Calculatrice et rendu monnaie</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Affichage client (second écran)</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Products Module */}
            <div className="space-y-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Gestion des Produits
              </h3>
              <div className="grid md:grid-cols-2 gap-2 ml-7">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Catalogue avec catégories</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Import/Export CSV</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Gestion stocks temps réel</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Alertes stock bas</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Codes-barres personnalisés</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Images produits</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Prix et TVA par produit</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Customers Module */}
            <div className="space-y-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Gestion des Clients
              </h3>
              <div className="grid md:grid-cols-2 gap-2 ml-7">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Fiche client complète</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Historique d'achats</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Programme de fidélité (points)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Notes et remarques</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Reports Module */}
            <div className="space-y-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Rapports et Comptabilité
              </h3>
              <div className="grid md:grid-cols-2 gap-2 ml-7">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Rapport X (consultation journalière)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Rapport Z (clôture de caisse)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Détail TVA par taux</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Répartition paiements (espèces/carte)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Historique rapports quotidiens</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Export ZIP mensuel (archivage 7 ans)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Statistiques de vente</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Cash Management */}
            <div className="space-y-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-primary" />
                Gestion de la Caisse
              </h3>
              <div className="grid md:grid-cols-2 gap-2 ml-7">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Ouverture/fermeture journée</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Fond de caisse paramétrable</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Entrées/sorties de caisse</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Historique des mouvements</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Détection écarts de caisse</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Invoices */}
            <div className="space-y-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Factures
              </h3>
              <div className="grid md:grid-cols-2 gap-2 ml-7">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Génération de factures</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Numérotation séquentielle</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Export PDF</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Historique factures</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Settings */}
            <div className="space-y-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Paramètres et Configuration
              </h3>
              <div className="grid md:grid-cols-2 gap-2 ml-7">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Configuration entreprise</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Configuration imprimante thermique</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Gestion des taux de TVA</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Thème sombre/clair</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Checklist de conformité</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

          </TabsContent>

          {/* Tab: Propriété et Licence */}
          <TabsContent value="ownership" className="space-y-6">
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Propriété du Logiciel - Achat Définitif
                </CardTitle>
                <CardDescription>Droits complets transférés au propriétaire</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle className="font-bold">✅ ACHAT COMPLET - Propriété Transférée</AlertTitle>
                  <AlertDescription className="text-sm space-y-3 mt-2">
                    <p>
                      Ce logiciel a été <strong>ACHETÉ</strong> (pas loué) par <strong>GUL REYHAN</strong> en 2025.
                    </p>
                    <p className="font-semibold">
                      Tous les droits d'utilisation et de propriété ont été transférés au propriétaire.
                    </p>
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary">
                    <h4 className="font-bold mb-3 text-lg">🏆 Droits du Propriétaire (GUL REYHAN)</h4>
                    <ul className="list-disc list-inside space-y-2 text-sm ml-4">
                      <li><strong>Propriété complète</strong> du logiciel et de tous ses composants</li>
                      <li><strong>Utilisation illimitée</strong> sans restriction de durée</li>
                      <li><strong>Droit de modification</strong> du code source pour usage personnel</li>
                      <li><strong>Droit de personnalisation</strong> selon les besoins de l'entreprise</li>
                      <li><strong>Aucun frais de licence</strong> ou d'abonnement récurrent</li>
                      <li><strong>Accès complet</strong> au code source et à la base de données</li>
                      <li><strong>Droit de sauvegarder</strong> et archiver toutes les données</li>
                    </ul>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-bold mb-3">📋 Restrictions Légales Standards</h4>
                    <ul className="list-disc list-inside space-y-2 text-sm ml-4">
                      <li>Interdiction de <strong>revente commerciale</strong> du logiciel à des tiers</li>
                      <li>Interdiction de <strong>redistribution publique</strong> du code source</li>
                      <li>Interdiction de <strong>revendiquer la paternité</strong> du développement original</li>
                      <li>Le propriétaire peut faire des modifications mais ne peut pas vendre le logiciel comme produit commercial</li>
                    </ul>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-bold mb-3">👨‍💻 Rôle du Développeur (JL Prod)</h4>
                    <p className="text-sm mb-2">
                      <strong>JL Prod - Jordan Lallemand</strong> reste le développeur original du logiciel mais :
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm ml-4 text-muted-foreground">
                      <li>N'a <strong>AUCUN droit de propriété</strong> sur cette instance vendue</li>
                      <li>N'a <strong>AUCUN accès</strong> aux données de GUL REYHAN</li>
                      <li>Ne peut <strong>PAS révoquer</strong> la licence ou l'accès au logiciel</li>
                      <li>Peut fournir du <strong>support technique</strong> sur demande (payant ou gratuit selon accord)</li>
                      <li>Conserve le droit de créer des versions similaires pour d'autres clients</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-600">
                    <h4 className="font-bold mb-2 text-green-700 dark:text-green-400">✅ Résumé : Propriété Complète</h4>
                    <p className="text-sm">
                      <strong>GUL REYHAN</strong> est le propriétaire légal et définitif de ce logiciel suite à un achat complet en 2025. 
                      Le propriétaire a tous les droits d'utilisation, de modification et de personnalisation pour son usage professionnel.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Limitation de Responsabilité */}
          <TabsContent value="liability" className="space-y-6">
            {/* CRITICAL LIABILITY DISCLAIMER */}
        <Alert variant="destructive" className="border-2 border-destructive">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle className="text-lg font-bold">🔴 LIMITATION DE RESPONSABILITÉ JURIDIQUE - IMPORTANT</AlertTitle>
          <AlertDescription className="space-y-4 text-sm mt-3">
            <div className="font-bold text-base">
              JL Prod - Jordan Lallemand (TVA BE0784435238) décline TOUTE responsabilité concernant :
            </div>

            <div className="space-y-3 pl-4 border-l-4 border-destructive">
              <div>
                <p className="font-bold">1. Utilisation illégale ou non conforme :</p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground">
                  <li>Toute utilisation en violation des lois belges, européennes ou internationales</li>
                  <li>Non-respect des obligations fiscales et comptables légales</li>
                  <li>Fraude fiscale, blanchiment d'argent, ou toute activité criminelle</li>
                  <li>Usage dans le secteur HORECA sans Module FDM certifié</li>
                </ul>
              </div>

              <div>
                <p className="font-bold">2. Modification du code source :</p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground">
                  <li>Toute modification, altération, décompilation ou reverse-engineering</li>
                  <li>Injection de code malveillant ou exploitation de vulnérabilités</li>
                  <li>Redistribution ou revente du logiciel modifié</li>
                </ul>
              </div>

              <div>
                <p className="font-bold">3. Intégrité et sécurité des données :</p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground">
                  <li>Perte de données, corruption de base de données, pannes système</li>
                  <li>Piratage, intrusion, vol de données ou cyberattaques</li>
                  <li>Absence de sauvegardes régulières par l'utilisateur</li>
                </ul>
              </div>

              <div>
                <p className="font-bold">4. Exactitude des calculs et rapports :</p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground">
                  <li>Erreurs de calcul TVA, totaux, ou statistiques</li>
                  <li>Incohérences dans les rapports générés</li>
                  <li>Erreurs de report dans la comptabilité officielle</li>
                </ul>
              </div>

              <div>
                <p className="font-bold">5. Conformité fiscale :</p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground">
                  <li>Non-conformité avec le SPF Finances de Belgique</li>
                  <li>Amendes, redressements fiscaux, ou sanctions administratives</li>
                  <li>Absence de certification fiscale (SCE) du logiciel</li>
                </ul>
              </div>

              <div>
                <p className="font-bold">6. Dommages indirects :</p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground">
                  <li>Perte de chiffre d'affaires, d'opportunités commerciales</li>
                  <li>Atteinte à la réputation</li>
                  <li>Frais juridiques ou d'audit</li>
                </ul>
              </div>
            </div>

            <div className="bg-destructive/10 p-4 rounded-lg space-y-2 border border-destructive/20">
              <p className="font-bold text-base">L'utilisateur (GUL REYHAN) reconnaît et accepte :</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Être le <strong>SEUL RESPONSABLE</strong> de sa conformité fiscale et légale</li>
                <li>Utiliser ce logiciel <strong>"EN L'ÉTAT"</strong> sans garantie d'aucune sorte</li>
                <li>Avoir été informé des limitations du logiciel (non certifié fiscal)</li>
                <li>Devoir maintenir un carnet de caisse officiel en parallèle</li>
                <li>Devoir effectuer des sauvegardes régulières</li>
                <li>Assumer TOUS les risques liés à l'utilisation du logiciel</li>
              </ul>
            </div>

            <div className="bg-background p-4 rounded-lg border-2 border-destructive">
              <p className="font-bold text-base mb-2">⚖️ CLAUSE DE SAUVEGARDE JURIDIQUE :</p>
              <p>
                En cas d'utilisation frauduleuse, illégale ou de modification non autorisée de ce logiciel par l'utilisateur ou un tiers, 
                <strong> JL Prod - Jordan Lallemand</strong> ne pourra en <strong>AUCUN CAS</strong> être tenu pour responsable et se réserve le droit 
                d'engager <strong>toutes poursuites judiciaires appropriées</strong>.
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="font-bold text-base mb-2">📋 Limitation de garantie :</p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                <li>Ce logiciel est fourni <strong>"TEL QUEL"</strong>, sans garantie expresse ou implicite</li>
                <li>Aucune garantie de disponibilité, fiabilité, ou d'adéquation à un usage particulier</li>
                <li>Aucune garantie de conformité légale ou réglementaire</li>
                <li>JL Prod ne garantit pas que le logiciel fonctionnera sans interruption ou erreur</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

          </TabsContent>

          {/* Tab: Conditions d'Utilisation */}
          <TabsContent value="terms" className="space-y-6">
            {/* Terms of Use */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5" />
              Conditions d'Utilisation
            </CardTitle>
            <CardDescription>Logiciel sur mesure - Licence d'utilisation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary">
                <h4 className="font-bold mb-2">📜 Achat Définitif - Propriété Complète</h4>
                <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                  <li>Logiciel <strong>ACHETÉ</strong> par <strong>GUL REYHAN</strong> en 2025</li>
                  <li>Propriété <strong>COMPLÈTE et DÉFINITIVE</strong> transférée au propriétaire</li>
                  <li>Utilisation <strong>ILLIMITÉE</strong> sans frais récurrents</li>
                  <li>Droit de <strong>MODIFICATION</strong> pour usage personnel</li>
                  <li>Interdiction de revente commerciale à des tiers</li>
                </ul>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-bold mb-2">© Droits d'Auteur</h4>
                <p className="text-sm">
                  Le développement original de ce logiciel a été réalisé par <strong>JL Prod - Jordan Lallemand</strong> en 2025.
                  Suite à l'achat complet, <strong>GUL REYHAN</strong> détient tous les droits d'utilisation et de modification.
                  JL Prod conserve uniquement la paternité du développement original.
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-bold mb-2">⏱️ Durée</h4>
                <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                  <li>Propriété acquise de manière <strong>PERMANENTE et DÉFINITIVE</strong></li>
                  <li><strong>Aucune expiration</strong> de licence</li>
                  <li><strong>Aucun paiement récurrent</strong> requis</li>
                  <li>Le propriétaire peut utiliser le logiciel sans limitation de durée</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

          </TabsContent>

          {/* Tab: RGPD */}
          <TabsContent value="gdpr" className="space-y-6">
            {/* GDPR */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Protection des Données (RGPD)
            </CardTitle>
            <CardDescription>Conformité avec le Règlement Général sur la Protection des Données</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm space-y-2">
                <p>
                  <strong>Responsable du traitement :</strong> L'utilisateur (GUL REYHAN) est le responsable du traitement 
                  des données personnelles de ses clients.
                </p>
                <p>
                  <strong>Stockage local :</strong> Les données clients sont stockées localement dans la base de données 
                  de l'utilisateur (Supabase).
                </p>
                <p>
                  <strong>Accès éditeur :</strong> JL Prod n'a <strong>AUCUN ACCÈS</strong> aux données clients de GUL REYHAN.
                </p>
                <p>
                  <strong>Obligations :</strong> L'utilisateur doit respecter le RGPD pour la collecte, le traitement et 
                  la conservation des données personnelles de ses clients.
                </p>
                <p>
                  <strong>Conservation :</strong> Les données doivent être conservées selon les obligations légales belges 
                  (7 ans minimum pour les documents comptables).
                </p>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

          </TabsContent>

          {/* Tab: Contact */}
          <TabsContent value="contact" className="space-y-6">
            {/* Contact and Support */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact et Support Technique
            </CardTitle>
            <CardDescription>Pour toute question juridique, technique ou commerciale</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold">Email</p>
                    <a href="mailto:contact@jlprod.be" className="text-sm text-primary hover:underline">
                      contact@jlprod.be
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Phone className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold">Téléphone</p>
                    <a href="tel:+32471872860" className="text-sm text-primary hover:underline">
                      +32 471 87 28 60
                    </a>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Globe className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold">Site web</p>
                    <a href="https://www.jlprod.be" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      www.jlprod.be
                    </a>
                  </div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-semibold mb-1">Heures de support</p>
                  <p className="text-sm text-muted-foreground">Lun-Ven : 9h00 - 18h00 (heure belge)</p>
                </div>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>En cas de problème technique :</strong> Veuillez fournir le numéro de version, une capture d'écran, 
                et une description détaillée du problème rencontré.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

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

          </TabsContent>
        </Tabs>

        {/* Actions rapides */}
        <div className="flex flex-wrap gap-3">
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

        {/* Footer with Copyright */}
        <div className="border-t pt-6 mt-8">
          <div className="text-center space-y-2">
            <p className="text-sm font-semibold">
              © 2025 JL Prod - Jordan Lallemand | TVA BE0784435238
            </p>
            <p className="text-xs text-muted-foreground">
              Tous droits réservés | Logiciel sur mesure développé pour GUL REYHAN
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <Badge variant="outline">Version 1.0.0</Badge>
              <Badge variant="outline">Dernière mise à jour : 2025</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
