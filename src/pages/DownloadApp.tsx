import { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, CheckCircle2, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';
import logo from '@/assets/logo-gul-reyhan-new.png';

export default function DownloadApp() {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // URL de l'APK - Pointe vers la release GitHub
  const apkUrl = 'https://github.com/Eldjar0/gul-cash-pro/releases/download/v1.0.28/app-debug.apk';
  
  useEffect(() => {
    if (qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, apkUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1e40af',
          light: '#ffffff',
        }
      });
    }
  }, [apkUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <img src={logo} alt="Logo" className="h-24 w-auto mx-auto drop-shadow-2xl" />
          <h1 className="text-4xl font-black text-white drop-shadow-lg">
            Télécharger l'Application
          </h1>
          <p className="text-xl text-white/90 drop-shadow">
            Scanner le QR code ou télécharger directement
          </p>
        </div>

        {/* QR Code Card */}
        <Card className="border-4 border-white/30 shadow-2xl bg-white">
          <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl font-black flex items-center justify-center gap-2">
              <Smartphone className="h-8 w-8" />
              Scanner avec votre téléphone
            </CardTitle>
            <CardDescription className="text-white/90 font-semibold">
              Pointez votre caméra sur le QR code pour télécharger l'APK
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 py-8">
            <div className="bg-white p-4 rounded-xl shadow-lg">
              <canvas ref={qrCanvasRef} />
            </div>
            
            <Button
              onClick={() => window.open(apkUrl, '_blank')}
              size="lg"
              className="h-16 px-8 text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <Download className="h-6 w-6 mr-2" />
              Télécharger l'APK directement
            </Button>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="border-4 border-white/30 shadow-2xl bg-white/95 backdrop-blur">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
            <CardTitle className="text-xl font-black">
              📱 Instructions d'installation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg">1. Télécharger l'APK</h3>
                <p className="text-muted-foreground">Scannez le QR code ou cliquez sur le bouton de téléchargement</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg">2. Autoriser l'installation</h3>
                <p className="text-muted-foreground">
                  Allez dans <strong>Paramètres → Sécurité → Sources inconnues</strong> et activez l'option
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg">3. Installer l'application</h3>
                <p className="text-muted-foreground">Ouvrez le fichier APK téléchargé et suivez les instructions</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg">4. Lancez l'application</h3>
                <p className="text-muted-foreground">L'icône apparaîtra sur votre écran d'accueil</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning */}
        <Card className="border-4 border-yellow-400 bg-yellow-50">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-lg text-yellow-900">Note importante</h3>
              <p className="text-yellow-800">
                Cette application n'est pas disponible sur Google Play Store. Vous devez autoriser l'installation 
                depuis des sources inconnues pour l'installer.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions for Developer */}
        <Card className="border-4 border-green-300 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900">✅ Compilation Automatique Configurée !</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="bg-green-900 text-white p-4 rounded-lg">
              <p className="font-bold mb-2">🚀 GitHub Actions va compiler l'APK automatiquement !</p>
              <p className="text-green-200">Un workflow a été créé dans .github/workflows/build-android.yml</p>
            </div>
            
            <div className="text-green-900 space-y-3">
              <div>
                <p className="font-bold mb-2">📋 Étapes simples :</p>
                <ol className="list-decimal list-inside space-y-2 ml-2 bg-white p-3 rounded border-2 border-green-200">
                  <li className="font-semibold">Exportez vers GitHub (bouton en haut à droite)</li>
                  <li>GitHub Actions compile automatiquement l'APK à chaque push</li>
                  <li>Allez sur votre repo GitHub → onglet "Releases"</li>
                  <li>Téléchargez l'APK depuis la dernière release</li>
                  <li>Mettez à jour la ligne 13 de ce fichier avec votre URL GitHub :
                    <div className="mt-2 p-2 bg-gray-800 text-green-400 rounded font-mono text-xs overflow-x-auto">
                      https://github.com/VOTRE-USERNAME/VOTRE-REPO/releases/latest/download/gul-cash-pro.apk
                    </div>
                  </li>
                </ol>
              </div>
              
              <div className="bg-yellow-100 border-2 border-yellow-400 p-3 rounded">
                <p className="font-bold text-yellow-900">⚠️ Important :</p>
                <p className="text-yellow-800 text-xs">
                  Après le premier export GitHub, attendez quelques minutes que GitHub Actions compile l'APK. 
                  Vous verrez un badge vert ✅ dans l'onglet "Actions" quand c'est terminé.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
