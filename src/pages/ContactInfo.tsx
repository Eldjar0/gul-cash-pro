import { Card } from '@/components/ui/card';
import { Mail, Globe, Phone, MapPin, Info } from 'lucide-react';
import logoJlprod from '@/assets/logo-jlprod-new.png';

export default function ContactInfo() {
  return (
    <Card className="p-6">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <img 
            src={logoJlprod} 
            alt="JLprod Logo" 
            className="h-24 w-auto mx-auto"
          />
          <div>
            <h2 className="text-2xl font-bold">JLprod</h2>
            <p className="text-muted-foreground">
              Logiciel de caisse professionnel
            </p>
          </div>
        </div>

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
                Ce logiciel de caisse a été développé par <strong>JLprod</strong> pour simplifier 
                la gestion quotidienne des commerces.
              </p>
              
              <p>
                Il intègre toutes les fonctionnalités nécessaires à la gestion d'un point de vente : 
                gestion des ventes, inventaire, clients, rapports, et bien plus encore.
              </p>

              <div className="pt-4 border-t">
                <p className="font-medium text-foreground mb-2">Fonctionnalités principales :</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Gestion complète des ventes et caisse</li>
                  <li>Suivi de l'inventaire et des stocks</li>
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
          <h3 className="font-semibold text-lg mb-3">Besoin d'aide ?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Pour toute question, suggestion ou problème technique, n'hésitez pas à nous contacter 
            par email. Notre équipe se fera un plaisir de vous aider.
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
        <div className="text-center text-xs text-muted-foreground pt-4 border-t">
          <p>© 2024 JLprod - Tous droits réservés</p>
          <p className="mt-1">Version 1.0</p>
        </div>
      </div>
    </Card>
  );
}
