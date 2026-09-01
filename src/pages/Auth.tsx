import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import logoJLProd from '@/assets/logo-jlprod.png';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (user) {
      if (Capacitor.isNativePlatform()) {
        navigate('/mobile');
      } else {
        navigate('/');
      }
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Convertir l'identifiant en email pour Supabase
    const loginEmail = email.toLowerCase() === 'admin' 
      ? 'admin@system.local' 
      : email;
    await signIn(loginEmail, password);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary p-4">
      <Card className="w-full max-w-md shadow-2xl border-2 border-white/20">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <img src={logoJLProd} alt="JLProd" className="h-24 w-auto" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">
            Gül Reyhan
          </CardTitle>
          <CardDescription className="text-base">
            Système de caisse professionnel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {showForgotPassword ? (
            <Alert className="border-primary/50 bg-primary/5">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertDescription className="space-y-2 text-sm">
                <p className="font-semibold">Mot de passe oublié ?</p>
                <p className="text-muted-foreground">Contactez le support:</p>
                <div className="space-y-1 font-medium">
                  <p>📞 Tel: 0471872860</p>
                  <p>📧 Email: Contact@jlprod.be</p>
                  <p>🌐 Site: Jlprod.be</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full mt-3"
                >
                  Retour à la connexion
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Identifiant</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="admin"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-2"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-bold bg-primary hover:opacity-90 transition-opacity" 
                disabled={isLoading}
              >
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowForgotPassword(true)}
                className="w-full text-sm text-muted-foreground hover:text-primary"
              >
                Mot de passe ou identifiant oublié ?
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
