import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Download, 
  Monitor, 
  Apple, 
  Printer, 
  CheckCircle, 
  ExternalLink,
  Github,
  Info
} from "lucide-react";

// Remplacez par votre username/repo GitHub
const GITHUB_REPO = "Eldjar0/gul-cash-pro";
const LATEST_VERSION = "1.0.0";

export default function DownloadDesktopApp() {
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = (platform: string) => {
    setDownloading(platform);
    
    // Construire l'URL de téléchargement GitHub Releases
    let fileName = "";
    if (platform === "windows") {
      fileName = `GulCashPro-${LATEST_VERSION}-Windows.exe`;
    } else if (platform === "mac") {
      fileName = `GulCashPro-${LATEST_VERSION}-Mac.dmg`;
    }
    
    const downloadUrl = `https://github.com/${GITHUB_REPO}/releases/latest/download/${fileName}`;
    
    // Ouvrir le téléchargement dans un nouvel onglet
    window.open(downloadUrl, '_blank');
    
    setTimeout(() => setDownloading(null), 2000);
  };

  const features = [
    {
      icon: Printer,
      title: "Impression silencieuse",
      description: "Imprimez vos tickets sans popup de confirmation"
    },
    {
      icon: Monitor,
      title: "Application native",
      description: "Performances optimales sur votre ordinateur"
    },
    {
      icon: CheckCircle,
      title: "Mode hors-ligne",
      description: "Fonctionne même sans connexion internet"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Application Desktop
              </h1>
              <p className="text-sm text-muted-foreground">
                Téléchargez Gul Cash Pro pour Windows ou Mac
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            Version {LATEST_VERSION}
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            Gul Cash Pro Desktop
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Profitez de l'impression silencieuse et d'une expérience native sur votre ordinateur
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl text-white">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Download Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {/* Windows */}
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-2 border-blue-200 dark:border-blue-800 shadow-xl hover:shadow-2xl transition-all">
            <CardHeader className="text-center">
              <div className="mx-auto p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl text-white mb-4 w-fit">
                <Monitor className="h-12 w-12" />
              </div>
              <CardTitle className="text-2xl">Windows</CardTitle>
              <CardDescription>Windows 10/11 (64-bit)</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                size="lg" 
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                onClick={() => handleDownload('windows')}
                disabled={downloading === 'windows'}
              >
                {downloading === 'windows' ? (
                  <>Téléchargement en cours...</>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Télécharger (.exe)
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                ~80 MB • Installateur NSIS
              </p>
            </CardContent>
          </Card>

          {/* Mac */}
          <Card className="bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-800/50 dark:to-slate-900/50 border-2 border-gray-200 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all">
            <CardHeader className="text-center">
              <div className="mx-auto p-4 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl text-white mb-4 w-fit">
                <Apple className="h-12 w-12" />
              </div>
              <CardTitle className="text-2xl">macOS</CardTitle>
              <CardDescription>macOS 10.15+ (Intel & Apple Silicon)</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                size="lg" 
                className="w-full bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black"
                onClick={() => handleDownload('mac')}
                disabled={downloading === 'mac'}
              >
                {downloading === 'mac' ? (
                  <>Téléchargement en cours...</>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Télécharger (.dmg)
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                ~90 MB • Image disque
              </p>
            </CardContent>
          </Card>
        </div>

        {/* GitHub Release Link */}
        <div className="text-center mb-12">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.open(`https://github.com/${GITHUB_REPO}/releases`, '_blank')}
          >
            <Github className="mr-2 h-5 w-5" />
            Voir toutes les versions sur GitHub
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Instructions */}
        <Card className="max-w-3xl mx-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Instructions d'installation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-semibold">Windows :</h4>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                <li>Téléchargez le fichier .exe</li>
                <li>Double-cliquez sur l'installateur</li>
                <li>Suivez les instructions d'installation</li>
                <li>Lancez Gul Cash Pro depuis le bureau ou le menu Démarrer</li>
              </ol>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">macOS :</h4>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                <li>Téléchargez le fichier .dmg</li>
                <li>Ouvrez l'image disque</li>
                <li>Glissez l'application dans le dossier Applications</li>
                <li>Lancez Gul Cash Pro depuis le Launchpad</li>
              </ol>
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Configuration de l'imprimante :</strong> Une fois l'application installée, 
                allez dans Paramètres → Impression pour configurer votre imprimante thermique 
                et activer l'impression silencieuse.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
