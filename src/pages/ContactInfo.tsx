import { Card } from '@/components/ui/card';
import { Mail, Globe, Phone, MapPin, Info, Award, ShieldAlert } from 'lucide-react';
import logoJlprod from '@/assets/logo-jlprod-signature.png';
import logoGulReyhan from '@/assets/logo-gul-reyhan-market.png';

export default function ContactInfo() {
  return (
    <Card className="p-6">
      <div className="space-y-8">
        {/* Header avec les deux logos */}
        <div className="text-center space-y-6">
          <div className="flex justify-center items-center gap-8">
            <img 
              src={logoJlprod} 
              alt="JLprod Logo" 
              className="h-16 w-auto"
            />
            <div className="text-4xl text-muted-foreground">→</div>
            <img 
              src={logoGulReyhan} 
              alt="Gül Reyhan Logo" 
              className="h-20 w-auto"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Logiciel de Caisse Professionnel</h2>
            <p className="text-lg text-muted-foreground mt-2">
              Développé en 2025 par <span className="font-semibold text-primary">JLprod</span>
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
                La société <strong>JLprod (TVA BE0784435238)</strong> certifie par la présente 
                que le logiciel de caisse professionnel actuellement utilisé a été <strong>vendu 
                définitivement</strong> à <strong> Gül Reyhan</strong>.
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

              <div className="bg-blue-50 p-3 rounded border border-blue-200 my-3">
                <p className="font-semibold text-blue-900 mb-2">🌐 Hébergement et Accès Serveur</p>
                <p className="text-justify text-blue-900">
                  L&apos;application web est actuellement <strong>hébergée chez JLprod</strong>. 
                  Cependant, <strong>Gül Reyhan dispose d&apos;un accès complet au serveur</strong> 
                  et possède tous les droits d&apos;administration.
                </p>
                <p className="text-justify text-blue-900 mt-2">
                  <strong>Gül Reyhan est totalement libre</strong> de :
                </p>
                <ul className="mt-2 space-y-1 ml-4 text-blue-900">
                  <li>• Accéder au code source complet de l&apos;application</li>
                  <li>• Modifier le code source selon ses besoins</li>
                  <li>• Changer d&apos;hébergeur à tout moment</li>
                  <li>• Migrer l&apos;application vers un autre serveur</li>
                  <li>• Gérer l&apos;infrastructure comme il le souhaite</li>
                  <li>• Faire appel à d&apos;autres développeurs</li>
                </ul>
                <p className="text-justify text-blue-900 mt-2 font-semibold">
                  Aucune restriction n&apos;est imposée par JLprod concernant l&apos;hébergement, 
                  la modification ou le transfert de l&apos;application.
                </p>
              </div>
              
              <div className="pt-3 border-t mt-4">
                <p className="text-xs text-muted-foreground text-center">
                  Date du transfert : 05/10/2025 • Vendeur : JLprod • Acquéreur : Gül Reyhan
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Décharge de responsabilité renforcée */}
        <Card className="p-6 bg-menu-50 border-menu-200 border-2">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-7 w-7 text-menu-600" />
              <h3 className="text-xl font-bold text-menu-900">Décharge Complète de Responsabilité</h3>
            </div>
            
            <div className="space-y-4 text-sm text-menu-900 leading-relaxed">
              <div className="bg-white/60 p-4 rounded-lg border border-menu-300">
                <p className="font-bold text-base mb-2">📋 Développement sur mesure</p>
                <p className="text-justify">
                  Ce logiciel a été développé <strong>sur mesure</strong> par <strong>JLprod 
                  (TVA BE0784435238)</strong> selon les <strong>spécifications, exigences et 
                  besoins spécifiques</strong> fournis par <strong>Gül Reyhan</strong>. Le 
                  développement a été réalisé conformément aux demandes du client.
                </p>
              </div>

              <div className="bg-white/60 p-4 rounded-lg border border-menu-300">
                <p className="font-bold text-base mb-2">⚠️ Limitation de responsabilité générale</p>
                <p className="text-justify">
                  <strong>JLprod (TVA BE0784435238)</strong> retire <strong>TOUTE 
                  responsabilité</strong> quant à l&apos;utilisation de ce logiciel. Le logiciel 
                  est fourni <strong>&quot;tel quel&quot;</strong> et <strong>&quot;tel que 
                  demandé&quot;</strong> par le client, sans garantie d&apos;aucune sorte, 
                  explicite ou implicite, notamment concernant :
                </p>
                <ul className="mt-2 space-y-1 ml-4">
                  <li>• La conformité aux législations actuelles ou futures</li>
                  <li>• L&apos;adéquation à un usage commercial particulier</li>
                  <li>• La fiabilité ou la disponibilité continue du logiciel</li>
                  <li>• L&apos;absence d&apos;erreurs ou de bugs</li>
                  <li>• La sécurité des données</li>
                </ul>
              </div>

              <div className="bg-white/60 p-4 rounded-lg border border-menu-300">
                <p className="font-bold text-base mb-2">📜 Évolution des lois et réglementations</p>
                <p className="text-justify">
                  <strong>JLprod</strong> ne peut être tenu responsable des <strong>évolutions 
                  législatives, réglementaires ou normatives</strong> futures qui pourraient 
                  affecter l&apos;utilisation du logiciel. Il appartient à <strong>Gül Reyhan</strong> 
                  de s&apos;assurer que l&apos;utilisation du logiciel reste conforme aux lois 
                  belges, européennes et internationales en vigueur, présentes et futures.
                </p>
                <p className="text-justify mt-2">
                  Toute modification nécessaire pour assurer la conformité légale future 
                  constituerait un <strong>nouveau développement</strong> distinct de la vente 
                  initiale et ferait l&apos;objet d&apos;une nouvelle facturation.
                </p>
              </div>

              <div className="bg-white/60 p-4 rounded-lg border border-menu-300">
                <p className="font-bold text-base mb-2">💼 Responsabilité de l&apos;utilisateur</p>
                <p className="text-justify">
                  <strong>Gül Reyhan</strong>, en tant que propriétaire et utilisateur final 
                  du logiciel, assume <strong>l&apos;entière responsabilité</strong> de :
                </p>
                <ul className="mt-2 space-y-1 ml-4">
                  <li>• L&apos;utilisation conforme aux lois et réglementations</li>
                  <li>• La vérification de la conformité légale de ses pratiques</li>
                  <li>• Les déclarations fiscales et comptables (TVA, impôts, etc.)</li>
                  <li>• La protection des données personnelles (RGPD)</li>
                  <li>• La sécurité et les sauvegardes des données</li>
                  <li>• L&apos;utilisation appropriée des fonctionnalités</li>
                  <li>• Les conséquences de toute utilisation inappropriée</li>
                </ul>
              </div>

              <div className="bg-white/60 p-4 rounded-lg border border-menu-300">
                <p className="font-bold text-base mb-2">🚫 Exclusion de dommages</p>
                <p className="text-justify">
                  <strong>JLprod (TVA BE0784435238)</strong> ne pourra en aucun cas être tenu 
                  responsable de tout dommage direct, indirect, accessoire, spécial ou consécutif 
                  résultant de l&apos;utilisation ou de l&apos;impossibilité d&apos;utiliser ce 
                  logiciel, y compris mais sans s&apos;y limiter :
                </p>
                <ul className="mt-2 space-y-1 ml-4">
                  <li>• Pertes de données ou corruption de données</li>
                  <li>• Pertes financières ou manque à gagner</li>
                  <li>• Interruptions d&apos;activité commerciale</li>
                  <li>• Amendes ou sanctions administratives</li>
                  <li>• Litiges avec des tiers (clients, fournisseurs, autorités)</li>
                  <li>• Non-conformité aux obligations légales futures</li>
                  <li>• Tout autre préjudice commercial ou personnel</li>
                </ul>
              </div>

              <div className="bg-white/60 p-4 rounded-lg border border-menu-300">
                <p className="font-bold text-base mb-2">⚖️ Obligation de l&apos;acquéreur</p>
                <p className="text-justify">
                  En acceptant ce logiciel, <strong>Gül Reyhan</strong> reconnaît et accepte 
                  que :
                </p>
                <ul className="mt-2 space-y-1 ml-4">
                  <li>• Le logiciel a été développé selon ses propres spécifications</li>
                  <li>• Il lui appartient de vérifier la conformité légale de son utilisation</li>
                  <li>• Il doit consulter des experts comptables et juridiques si nécessaire</li>
                  <li>• Il assume tous les risques liés à l&apos;exploitation du logiciel</li>
                  <li>• JLprod ne fournit aucune garantie de conformité légale continue</li>
                  <li>• Aucune maintenance ou mise à jour n&apos;est incluse dans la vente</li>
                </ul>
              </div>

              <div className="bg-red-100 p-4 rounded-lg border-2 border-red-400 mt-4">
                <p className="font-bold text-base text-red-900 mb-2">⚠️ AVERTISSEMENT IMPORTANT</p>
                <p className="text-justify text-red-900">
                  L&apos;utilisation de ce logiciel se fait aux <strong>risques et périls</strong> de 
                  l&apos;utilisateur. <strong>JLprod</strong> décline toute responsabilité 
                  concernant les conséquences de son utilisation, que ce soit dans le présent ou 
                  dans le futur, quelle que soit l&apos;évolution des lois et réglementations.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <div className="grid gap-6">
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Informations de contact JLprod
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
                    href="https://jlprod.be" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    jlprod.be
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Téléphone</p>
                  <a 
                    href="tel:0471872860"
                    className="text-sm text-primary hover:underline"
                  >
                    0471 87 28 60
                  </a>
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

              <div className="flex items-start gap-3 pt-2 border-t">
                <Info className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Numéro de TVA</p>
                  <p className="text-sm font-mono font-bold">
                    BE0784435238
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Représentant légal</p>
                  <p className="text-sm text-muted-foreground">
                    Jordan Lallemand
                  </p>
                </div>
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
              href="https://jlprod.be"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/10 transition-colors text-sm font-medium"
            >
              <Globe className="h-4 w-4" />
              Visiter le site
            </a>
            <a 
              href="tel:0471872860"
              className="inline-flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/10 transition-colors text-sm font-medium"
            >
              <Phone className="h-4 w-4" />
              0471 87 28 60
            </a>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4 border-t space-y-1">
          <p className="font-semibold text-foreground">Logiciel propriété de Gül Reyhan</p>
          <p>Développé par JLprod © 2025</p>
          <p>Version 1.0 • Tous droits transférés à Gül Reyhan le 05/10/2025</p>
        </div>
      </div>
    </Card>
  );
}
