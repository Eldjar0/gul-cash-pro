import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PinLockDialogProps {
  open: boolean;
  onUnlock: () => void;
}

export function PinLockDialog({ open, onUnlock }: PinLockDialogProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [storedPin, setStoredPin] = useState('3679'); // PIN par défaut

  useEffect(() => {
    // Charger le PIN depuis les settings
    const loadPin = async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'security_pin')
        .maybeSingle();
      
      if (data?.value) {
        setStoredPin(data.value as string);
      }
    };
    loadPin();
  }, []);

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      if (newPin.length === 4) {
        // Vérifier le PIN
        if (newPin === storedPin) {
          setError(false);
          setPin('');
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 1000);
        }
      }
    }
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  return (
    <Dialog open={open}>
      <DialogContent 
        className="sm:max-w-md [&>button]:hidden" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center gap-6 p-4">
          <div className="flex flex-col items-center gap-2">
            <Lock className="h-16 w-16 text-primary" />
            <h2 className="text-2xl font-bold">Caisse Verrouillée</h2>
            <p className="text-sm text-muted-foreground">Entrez votre code de sécurité</p>
          </div>

          {/* Affichage du PIN */}
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl font-bold
                  ${error ? 'border-destructive bg-destructive/10' : 'border-primary'}
                  ${pin.length > i ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
              >
                {pin.length > i ? '●' : ''}
              </div>
            ))}
          </div>

          {error && (
            <p className="text-sm text-destructive font-semibold">Code incorrect</p>
          )}

          {/* Pavé numérique */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                variant="outline"
                className="h-16 text-2xl font-bold hover:bg-primary hover:text-primary-foreground"
              >
                {num}
              </Button>
            ))}
            <Button
              onClick={handleClear}
              variant="outline"
              className="h-16 text-lg font-semibold hover:bg-destructive hover:text-destructive-foreground"
            >
              Effacer
            </Button>
            <Button
              onClick={() => handleNumberClick('0')}
              variant="outline"
              className="h-16 text-2xl font-bold hover:bg-primary hover:text-primary-foreground"
            >
              0
            </Button>
            <div></div>
          </div>

          {/* Info de contact pour mot de passe oublié */}
          <div className="text-center text-xs text-muted-foreground border-t pt-4 w-full">
            <p className="font-semibold mb-1">Code oublié ?</p>
            <p>Tel: 0471872860</p>
            <p>Email: Contact@jlprod.be</p>
            <p>Site: Jlprod.be</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
