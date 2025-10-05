import { Card } from '@/components/ui/card';
import { Mail, Globe, Phone, MapPin, Info, Award, ShieldAlert } from 'lucide-react';
import logoJlprod from '@/assets/logo-jlprod-new.png';
import logoGulReyhan from '@/assets/logo-gul-reyhan-new.png';

export default function ContactInfo() {
  return (
    <Card className="p-6">
      <div className="space-y-8">
        {/* Header avec les deux logos */}
        <div className="text-center space-y-6">
          <div className="flex justify-center items-center gap-8">
            <img 
              src={logoGulReyhan} 
              alt="Gül Reyhan Logo" 
              className="h-20 w-auto"
            />
            <div className="text-4xl text-muted-foreground">→</div>
            <img 
              src={logoJlprod} 
              alt="JLprod Logo" 
              className="h-20 w-auto"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Logiciel de Caisse Professionnel</h2>
            <p className="text-lg text-muted-foreground mt-2">
              Développé par <span className="font-semibold text-primary">JLprod</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Propriété exclusive de <span className="font-semibold">Gül Reyhan</span>
            </p>
          </div>
        </div>

        {/* Certificat de propriété */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30">
          <div className="space-y-4">
            <div className="flex items-center gap-3 justify-center">
              <Award className="h-8 w-8 text-primary" />
              <h3 className="text-xl font-bold text-center">Certificat de Propriété</h3>
            </div>
            
            <div className="space-y-3 text-sm leading-relaxed bg-white/50 p-4 rounded-lg">
              <p className="font-semibold text-center text-lg">
                Attestation de Propriété et de Transfert de Droits
              </p>
              
              <p className="text-justify">
                La société <strong>JLprod</strong> certifie par la présente que le logiciel de caisse 
                professionnel actuellement utilisé a été <strong>vendu définitivement</strong> à 
                <strong> Gül Reyhan</strong>.
              </p>
              
              <p className="text-justify">
                Ce logiciel constitue un <strong>achat ferme et définitif</strong>, et non une location 
                ou une licence d&apos;utilisation temporaire. <strong>Gül Reyhan</strong> dispose de 
                <strong> 100% des droits de propriété</strong> sur ce logiciel.
              </p>
              
              <p className="text-justify">
                <strong>Gül Reyhan</strong> peut utiliser, modifier, adapter et exploiter ce logiciel 
                sans restriction, pour une durée illimitée. Tous les droits d&apos;utilisation, 
                de modification et d&apos;exploitation sont transférés intégralement à 
                <strong> Gül Reyhan</strong>.
              </p>
              
              <div className="pt-3 border-t mt-4">
                <p className="text-xs text-muted-foreground text-center">
                  Date du transfert : 2024 • Vendeur : JLprod • Acquéreur : Gül Reyhan
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Décharge de responsabilité */}
        <Card className="p-6 bg-amber-50 border-amber-200">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-amber-600" />
              <h3 className="text-lg font-bold text-amber-900">Décharge de Responsabilité</h3>
            </div>
            
            <div className="space-y-3 text-sm text-amber-900 leading-relaxed">
              <p className="text-justify">
                <strong>JLprod</strong> retire toute responsabilité quant à l&apos;utilisation 
                de ce logiciel. Le logiciel est fourni <strong>&quot;tel quel&quot;</strong>, sans garantie 
                d&apos;aucune sorte, explicite ou implicite.
              </p>
              
              <p className="text-justify">
                <strong>JLprod</strong> ne pourra être tenu responsable de tout dommage direct ou 
                indirect résultant de l&apos;utilisation de ce logiciel, y compris mais sans s&apos;y limiter : 
                pertes de données, pertes financières, interruptions d&apos;activité, ou tout autre 
                préjudice commercial.
              </p>
              
              <p className="text-justify">
                L&apos;utilisateur assume l&apos;entière responsabilité de l&apos;utilisation du logiciel et 
                s&apos;engage à vérifier la conformité de son utilisation avec les lois et réglementations 
                en vigueur.
              </p>
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Informations de contact
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <a 
                    href="mailto:contact@jlprod.be" 
                    className="text-sm text-primary hover:underline"
                  >
                    contact@jlprod.be
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Site web</p>
                  <a 
                    href="https://www.jlprod.be" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    www.jlprod.be
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Téléphone</p>
                  <p className="text-sm text-muted-foreground">
                    Disponible via email
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Localisation</p>
                  <p className="text-sm text-muted-foreground">
                    Belgique
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4 space-y-4">
            <h3 className="font-semibold text-lg">À propos du logiciel</h3>
            
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Ce logiciel de caisse professionnel a été développé par <strong>JLprod</strong> 
                et <strong>vendu à Gül Reyhan</strong> en toute propriété.
              </p>
              
              <p>
                <strong>Gül Reyhan</strong> est le propriétaire exclusif de ce logiciel qui intègre 
                toutes les fonctionnalités nécessaires à la gestion complète d&apos;un point de vente.
              </p>

              <div className="pt-4 border-t">
                <p className="font-medium text-foreground mb-2">Fonctionnalités principales :</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Gestion complète des ventes et caisse</li>
                  <li>Suivi de l&apos;inventaire et des stocks</li>
                  <li>Gestion des clients et fidélité</li>
                  <li>Facturation et devis</li>
                  <li>Rapports et analyses</li>
                  <li>Multi-utilisateurs avec gestion des rôles</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        {/* Support Section */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <h3 className="font-semibold text-lg mb-3">Besoin d&apos;aide ?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Pour toute question concernant le développement ou des informations techniques 
            sur le logiciel, vous pouvez contacter <strong>JLprod</strong> par email.
          </p>
          <div className="flex flex-wrap gap-3">
            <a 
              href="mailto:contact@jlprod.be"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <Mail className="h-4 w-4" />
              Nous contacter
            </a>
            <a 
              href="https://www.jlprod.be"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/10 transition-colors text-sm font-medium"
            >
              <Globe className="h-4 w-4" />
              Visiter le site
            </a>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4 border-t space-y-1">
          <p className="font-semibold text-foreground">Logiciel propriété de Gül Reyhan</p>
          <p>Développé par JLprod © 2024</p>
          <p>Version 1.0 • Tous droits transférés à Gül Reyhan</p>
        </div>
      </div>
    </Card>
  );
}
