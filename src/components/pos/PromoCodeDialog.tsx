import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Ticket, Gift } from 'lucide-react';
import { toast } from 'sonner';

interface PromoCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (code: string, type: 'percentage' | 'amount', value: number) => void;
}

// Codes promo fictifs pour la démo (à remplacer par une vraie base de données)
const PROMO_CODES: Record<string, { type: 'percentage' | 'amount'; value: number; description: string }> = {
  'BIENVENUE10': { type: 'percentage', value: 10, description: '10% de réduction' },
  'PROMO5': { type: 'amount', value: 5, description: '5€ de réduction' },
  'CADEAU20': { type: 'percentage', value: 20, description: '20% de réduction' },
};

export const PromoCodeDialog = ({ open, onOpenChange, onApply }: PromoCodeDialogProps) => {
  const [code, setCode] = useState('');

  const handleApply = () => {
    const upperCode = code.trim().toUpperCase();
    
    if (!upperCode) {
      toast.error('Veuillez entrer un code');
      return;
    }

    const promoCode = PROMO_CODES[upperCode];
    
    if (promoCode) {
      onApply(upperCode, promoCode.type, promoCode.value);
      toast.success(`Code appliqué: ${promoCode.description}`);
      setCode('');
      onOpenChange(false);
    } else {
      toast.error('Code invalide ou expiré');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Code promo ou carte cadeau
          </DialogTitle>
          <DialogDescription>
            Entrez un code promotionnel ou un numéro de carte cadeau
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Code</label>
            <Input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ex: BIENVENUE10"
              className="h-12 text-lg uppercase"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleApply();
                }
              }}
            />
          </div>

          <div className="bg-muted/50 p-3 rounded-lg space-y-2">
            <div className="text-xs font-semibold text-muted-foreground mb-2">Codes disponibles (démo):</div>
            {Object.entries(PROMO_CODES).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <code className="bg-background px-2 py-1 rounded">{key}</code>
                <span className="text-muted-foreground">{value.description}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setCode('');
                onOpenChange(false);
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleApply}>
              <Gift className="mr-2 h-4 w-4" />
              Appliquer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
